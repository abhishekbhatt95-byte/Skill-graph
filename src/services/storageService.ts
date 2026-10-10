import {
  UserProfile,
  StudentSkill,
  StudentProject,
  EvidenceItem,
  SkillEvidence,
  DocumentRecord,
  ExtractionItem,
  AssessmentAttempt,
  AssessmentResponse,
  SkillAnalysis,
  Roadmap,
  AccountDeletionRequest,
  UserDataExport,
  ProficiencyLevel,
} from '../types/canonical';
import {
  SEED_USERS,
  SEED_SKILLS,
  SEED_ROLE_PROFILE,
  SEED_ROLE_REQUIREMENTS,
  SEED_PREREQUISITES,
  SEED_LEARNING_RESOURCES,
  SEED_ALEX_SKILLS,
  SEED_ALEX_PROJECTS,
  SEED_ALEX_EVIDENCE,
  SEED_ALEX_SKILL_EVIDENCE,
} from '../data/seedData';
import { runDeterministicGapAnalysis } from './gapEngine';
import { generatePersonalizedRoadmap } from './roadmapEngine';
import { supabaseAuth } from './supabaseAuth';
import { supabasePersistence } from './supabasePersistence';
import { isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY_PREFIX = 'skillgraph_v1_';

export type SyncStatus = 'cloud_synced' | 'local_mode' | 'syncing' | 'error';

export interface AppState {
  currentUserId: string;
  users: UserProfile[];
  studentSkills: StudentSkill[];
  projects: StudentProject[];
  evidenceItems: EvidenceItem[];
  skillEvidenceLinks: SkillEvidence[];
  documents: DocumentRecord[];
  extractionItems: ExtractionItem[];
  assessmentAttempts: AssessmentAttempt[];
  assessmentResponses: AssessmentResponse[];
  roadmaps: Roadmap[];
  deletionRequests: AccountDeletionRequest[];
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}state`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.currentUserId && parsed.users) {
        return parsed;
      }
    }
  } catch {
    // ignore parse error, fallback to initial seed
  }

  // Pre-seed User A (Alex Chen) and User B (Jordan Taylor)
  return {
    currentUserId: SEED_USERS[0].user_id,
    users: [...SEED_USERS],
    studentSkills: [...SEED_ALEX_SKILLS],
    projects: [...SEED_ALEX_PROJECTS],
    evidenceItems: [...SEED_ALEX_EVIDENCE],
    skillEvidenceLinks: [...SEED_ALEX_SKILL_EVIDENCE],
    documents: [],
    extractionItems: [],
    assessmentAttempts: [],
    assessmentResponses: [],
    roadmaps: [],
    deletionRequests: [],
  };
}

class StorageService {
  private state: AppState;
  private listeners: (() => void)[] = [];
  private syncStatus: SyncStatus = isSupabaseConfigured ? 'cloud_synced' : 'local_mode';
  private syncError: string | null = null;
  private isSupabaseAuthenticated = false;

  constructor() {
    this.state = loadInitialState();
    this.initSupabaseAuthListener();
  }

  private initSupabaseAuthListener() {
    supabaseAuth.subscribe(async (authState) => {
      if (authState.user) {
        this.isSupabaseAuthenticated = true;
        await this.handleSupabaseUserLogin(authState.user);
      } else {
        this.isSupabaseAuthenticated = false;
        this.syncStatus = isSupabaseConfigured ? 'local_mode' : 'local_mode';
        // Reset current active tenant to default guest sandbox profile to prevent offline data leakage
        this.state.currentUserId = SEED_USERS[0].user_id;
        this.notify();
      }
    });
  }

  private async handleSupabaseUserLogin(authUser: any) {
    this.syncStatus = 'syncing';
    this.notify();

    try {
      const userId = authUser.id;
      const userEmail = authUser.email || 'student@skillgraph.ai';
      const userName = authUser.user_metadata?.full_name || userEmail.split('@')[0];

      // Ensure user profile in in-memory state
      let user = this.state.users.find((u) => u.user_id === userId);
      if (!user) {
        user = {
          id: userId,
          user_id: userId,
          email: userEmail,
          full_name: userName,
          role_target_id: 'role-da-jr-v1',
          role_target_name: 'Junior Data Analyst v1.0',
          weekly_study_hours: 10,
          onboarding_completed: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.users.unshift(user);
      }

      this.state.currentUserId = userId;

      // Fetch from Supabase PostgreSQL tables
      const cloudData = await supabasePersistence.fetchUserData(userId);

      if (cloudData.hasCloudData) {
        if (cloudData.profile) {
          const uIdx = this.state.users.findIndex((u) => u.user_id === userId);
          if (uIdx >= 0) this.state.users[uIdx] = cloudData.profile;
        }

        // Merge remote user records (scoped to user_id)
        this.state.studentSkills = [
          ...this.state.studentSkills.filter((s) => s.user_id !== userId),
          ...cloudData.skills,
        ];
        this.state.projects = [
          ...this.state.projects.filter((p) => p.user_id !== userId),
          ...cloudData.projects,
        ];
        this.state.evidenceItems = [
          ...this.state.evidenceItems.filter((e) => e.user_id !== userId),
          ...cloudData.evidence,
        ];
        this.state.skillEvidenceLinks = [
          ...this.state.skillEvidenceLinks.filter((l) => l.user_id !== userId),
          ...cloudData.skillEvidence,
        ];
        this.state.documents = [
          ...this.state.documents.filter((d) => d.user_id !== userId),
          ...cloudData.documents,
        ];
        this.state.extractionItems = [
          ...this.state.extractionItems.filter((ex) => ex.user_id !== userId),
          ...cloudData.extractionItems,
        ];
        this.state.assessmentAttempts = [
          ...this.state.assessmentAttempts.filter((a) => a.user_id !== userId),
          ...cloudData.attempts,
        ];
        this.state.assessmentResponses = [
          ...this.state.assessmentResponses.filter(
            (r) => !cloudData.attempts.some((a) => a.id === r.attempt_id)
          ),
          ...cloudData.responses,
        ];
        if (cloudData.roadmaps.length > 0) {
          this.state.roadmaps = [
            ...this.state.roadmaps.filter((r) => r.user_id !== userId),
            ...cloudData.roadmaps,
          ];
        }
      } else {
        // Initial setup for new user: provide starting seed skills if user has none
        const existingUserSkills = this.state.studentSkills.filter((s) => s.user_id === userId);
        if (existingUserSkills.length === 0) {
          const starterSkills: StudentSkill[] = SEED_ALEX_SKILLS.map((s) => ({
            ...s,
            id: `ss-${userId}-${s.skill_id}`,
            user_id: userId,
          }));
          this.state.studentSkills.push(...starterSkills);

          // Asynchronously sync starter profile and skills to Supabase
          for (const s of starterSkills) {
            supabasePersistence.upsertStudentSkill(s).catch(() => {});
          }
        }
      }

      this.syncStatus = 'cloud_synced';
      this.syncError = null;
      this.persist();
    } catch (err: any) {
      console.warn('Supabase fetch failed during login:', err);
      this.syncStatus = 'error';
      this.syncError = err.message || 'Sync error';
      this.persist();
    }
  }

  private persist() {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}state`, JSON.stringify(this.state));
    } catch {
      // safe fallback if quota exceeded
    }
    this.notify();
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  public getSyncError(): string | null {
    return this.syncError;
  }

  public isCloudConnected(): boolean {
    return this.isSupabaseAuthenticated && this.syncStatus === 'cloud_synced';
  }

  // Auth & User Context
  public getCurrentUser(): UserProfile {
    const user = this.state.users.find((u) => u.user_id === this.state.currentUserId);
    return user || this.state.users[0];
  }

  public getAllUsers(): UserProfile[] {
    return [...this.state.users];
  }

  public switchUser(userId: string) {
    if (this.state.users.some((u) => u.user_id === userId)) {
      this.state.currentUserId = userId;
      this.persist();
    }
  }

  public updateProfile(updates: Partial<UserProfile>) {
    const current = this.getCurrentUser();
    this.state.users = this.state.users.map((u) =>
      u.user_id === current.user_id
        ? { ...u, ...updates, updated_at: new Date().toISOString() }
        : u
    );
    this.persist();
  }

  // Student Skills (Strictly Scoped to Current User)
  public getMySkills(): StudentSkill[] {
    const uid = this.state.currentUserId;
    return this.state.studentSkills.filter((s) => s.user_id === uid);
  }

  public upsertManualSkill(skillId: string, proficiency: ProficiencyLevel, notes?: string) {
    const uid = this.state.currentUserId;
    const existingIndex = this.state.studentSkills.findIndex(
      (s) => s.user_id === uid && s.skill_id === skillId
    );

    const now = new Date().toISOString();
    let updatedSkill: StudentSkill;

    if (existingIndex >= 0) {
      updatedSkill = {
        ...this.state.studentSkills[existingIndex],
        proficiency,
        effective_proficiency: proficiency,
        effective_source: 'self_reported',
        notes: notes || this.state.studentSkills[existingIndex].notes,
        updated_at: now,
      };
      this.state.studentSkills[existingIndex] = updatedSkill;
    } else {
      updatedSkill = {
        id: crypto.randomUUID(),
        user_id: uid,
        skill_id: skillId,
        proficiency,
        effective_proficiency: proficiency,
        effective_source: 'self_reported',
        is_verified: false,
        notes,
        updated_at: now,
      };
      this.state.studentSkills.push(updatedSkill);
    }

    // Phase 3: Push to Supabase PostgreSQL table
    if (this.isSupabaseAuthenticated) {
      supabasePersistence.upsertStudentSkill(updatedSkill).catch(console.warn);
    }

    // Mark active roadmap as stale
    this.markActiveRoadmapStale();
    this.persist();
  }

  public deleteSkill(skillId: string) {
    const uid = this.state.currentUserId;
    this.state.studentSkills = this.state.studentSkills.filter(
      (s) => !(s.user_id === uid && s.skill_id === skillId)
    );

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.deleteStudentSkill(uid, skillId).catch(console.warn);
    }

    this.markActiveRoadmapStale();
    this.persist();
  }

  // Evidence & Projects
  public getMyProjects(): StudentProject[] {
    const uid = this.state.currentUserId;
    return this.state.projects.filter((p) => p.user_id === uid);
  }

  public addProject(title: string, description: string, url: string, associatedSkillIds: string[]) {
    const uid = this.state.currentUserId;
    const projId = crypto.randomUUID();
    const newProj: StudentProject = {
      id: projId,
      user_id: uid,
      title,
      description,
      url: url || undefined,
      associated_skill_ids: associatedSkillIds,
      created_at: new Date().toISOString(),
    };
    this.state.projects.push(newProj);

    // Also create evidence record
    const evId = crypto.randomUUID();
    const newEvidence: EvidenceItem = {
      id: evId,
      user_id: uid,
      title: `Project: ${title}`,
      type: 'project',
      url: url || undefined,
      description,
      created_at: new Date().toISOString(),
    };
    this.state.evidenceItems.push(newEvidence);

    const newLinks: SkillEvidence[] = [];
    for (const sid of associatedSkillIds) {
      const link: SkillEvidence = {
        id: crypto.randomUUID(),
        user_id: uid,
        skill_id: sid,
        evidence_id: evId,
        strength: 'demonstrated',
        created_at: new Date().toISOString(),
      };
      this.state.skillEvidenceLinks.push(link);
      newLinks.push(link);
    }

    // Phase 3: Push to Supabase PostgreSQL tables
    if (this.isSupabaseAuthenticated) {
      supabasePersistence.insertStudentProject(newProj, newEvidence, newLinks).catch(console.warn);
    }

    this.markActiveRoadmapStale();
    this.persist();
  }

  public getMyEvidence(): EvidenceItem[] {
    const uid = this.state.currentUserId;
    return this.state.evidenceItems.filter((e) => e.user_id === uid);
  }

  public getEvidenceForSkill(skillId: string): EvidenceItem[] {
    const uid = this.state.currentUserId;
    const links = this.state.skillEvidenceLinks.filter(
      (l) => l.user_id === uid && l.skill_id === skillId
    );
    const evIds = new Set(links.map((l) => l.evidence_id));
    return this.state.evidenceItems.filter((e) => e.user_id === uid && evIds.has(e.id));
  }

  // Resume Ingestion & Review Records
  public addDocument(filename: string, fileSize: number, mimeType: string, storagePath?: string): DocumentRecord {
    const uid = this.state.currentUserId;
    const doc: DocumentRecord = {
      id: crypto.randomUUID(),
      user_id: uid,
      filename,
      file_size: fileSize,
      mime_type: mimeType,
      parse_status: 'parsed',
      created_at: new Date().toISOString(),
    };
    this.state.documents.push(doc);

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.insertDocument(doc).catch(console.warn);
    }

    this.persist();
    return doc;
  }

  public addExtractionItems(items: ExtractionItem[]) {
    this.state.extractionItems.push(...items);
    if (this.isSupabaseAuthenticated) {
      supabasePersistence.insertExtractionItems(items).catch(console.warn);
    }
    this.persist();
  }

  public getMyExtractionItems(): ExtractionItem[] {
    const uid = this.state.currentUserId;
    return this.state.extractionItems.filter((e) => e.user_id === uid);
  }

  public updateExtractionItem(
    itemId: string,
    reviewStatus: 'accepted' | 'rejected' | 'edited',
    confirmedProficiency?: ProficiencyLevel | null,
    reviewerNotes?: string
  ) {
    const uid = this.state.currentUserId;
    this.state.extractionItems = this.state.extractionItems.map((item) => {
      if (item.id === itemId && item.user_id === uid) {
        return {
          ...item,
          review_status: reviewStatus,
          confirmed_proficiency: confirmedProficiency !== undefined ? confirmedProficiency : item.proposed_proficiency,
          reviewer_notes: reviewerNotes || item.reviewer_notes,
          confirmed_at: new Date().toISOString(),
        };
      }
      return item;
    });

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.updateExtractionItem(itemId, reviewStatus, confirmedProficiency, reviewerNotes).catch(console.warn);
    }

    this.persist();
  }

  /**
   * Commit accepted extraction items to Student Skill Profile transactionally
   * Attaches a Resume Evidence Item and provenance link
   */
  public commitConfirmedExtractions(docId: string, acceptedItemIds: string[]) {
    const uid = this.state.currentUserId;
    const doc = this.state.documents.find((d) => d.id === docId && d.user_id === uid);
    const accepted = this.state.extractionItems.filter(
      (item) => item.user_id === uid && acceptedItemIds.includes(item.id) && item.suggested_skill_id
    );

    if (accepted.length === 0) return;

    // Create evidence item
    const evId = crypto.randomUUID();
    const resumeEvidence: EvidenceItem = {
      id: evId,
      user_id: uid,
      title: `Resume: ${doc?.filename || 'Uploaded Resume'}`,
      type: 'resume',
      description: `Verified extraction containing ${accepted.length} accepted skill items.`,
      created_at: new Date().toISOString(),
    };
    this.state.evidenceItems.push(resumeEvidence);

    const now = new Date().toISOString();

    for (const item of accepted) {
      const skillId = item.suggested_skill_id!;
      const prof = item.confirmed_proficiency || item.proposed_proficiency || 2;

      // Link evidence
      const link: SkillEvidence = {
        id: crypto.randomUUID(),
        user_id: uid,
        skill_id: skillId,
        evidence_id: evId,
        strength: 'demonstrated',
        created_at: now,
      };
      this.state.skillEvidenceLinks.push(link);

      // Update or add student skill
      const existing = this.state.studentSkills.find(
        (s) => s.user_id === uid && s.skill_id === skillId
      );

      let targetSkill: StudentSkill;
      if (existing) {
        existing.effective_proficiency = prof;
        existing.effective_source = 'resume_extracted';
        existing.notes = `Updated via resume review (${item.evidence_snippet.substring(0, 50)}...)`;
        existing.updated_at = now;
        targetSkill = existing;
      } else {
        targetSkill = {
          id: crypto.randomUUID(),
          user_id: uid,
          skill_id: skillId,
          proficiency: prof,
          effective_proficiency: prof,
          effective_source: 'resume_extracted',
          is_verified: false,
          notes: `Extracted from resume: "${item.evidence_snippet.substring(0, 60)}..."`,
          updated_at: now,
        };
        this.state.studentSkills.push(targetSkill);
      }

      if (this.isSupabaseAuthenticated) {
        supabasePersistence.upsertStudentSkill(targetSkill).catch(console.warn);
      }
    }

    this.markActiveRoadmapStale();
    this.persist();
  }

  // Assessments
  public recordAssessmentAttempt(
    attempt: AssessmentAttempt,
    responses: AssessmentResponse[],
    awardedProficiency: ProficiencyLevel | null,
    skillId: string
  ) {
    const uid = this.state.currentUserId;
    this.state.assessmentAttempts.push(attempt);
    this.state.assessmentResponses.push(...responses);

    if (attempt.passed && awardedProficiency !== null) {
      // Award verified proficiency
      const existing = this.state.studentSkills.find(
        (s) => s.user_id === uid && s.skill_id === skillId
      );

      const now = new Date().toISOString();
      let updatedSkill: StudentSkill;

      if (existing) {
        existing.effective_proficiency = awardedProficiency;
        existing.effective_source = 'assessment_verified';
        existing.is_verified = true;
        existing.updated_at = now;
        updatedSkill = existing;
      } else {
        updatedSkill = {
          id: crypto.randomUUID(),
          user_id: uid,
          skill_id: skillId,
          proficiency: awardedProficiency,
          effective_proficiency: awardedProficiency,
          effective_source: 'assessment_verified',
          is_verified: true,
          updated_at: now,
        };
        this.state.studentSkills.push(updatedSkill);
      }

      // Add evidence item
      const evId = crypto.randomUUID();
      this.state.evidenceItems.push({
        id: evId,
        user_id: uid,
        title: `Assessment Passed: ${attempt.percentage}% Score`,
        type: 'assessment',
        description: `Scored ${attempt.score}/${attempt.max_score} (${attempt.percentage}%) on objective verification check.`,
        created_at: now,
      });

      this.state.skillEvidenceLinks.push({
        id: crypto.randomUUID(),
        user_id: uid,
        skill_id: skillId,
        evidence_id: evId,
        strength: 'verified',
        created_at: now,
      });

      if (this.isSupabaseAuthenticated) {
        supabasePersistence.upsertStudentSkill(updatedSkill).catch(console.warn);
      }
    }

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.recordAssessmentAttempt(attempt, responses).catch(console.warn);
    }

    this.markActiveRoadmapStale();
    this.persist();
  }

  public getMyAttempts(): AssessmentAttempt[] {
    const uid = this.state.currentUserId;
    return this.state.assessmentAttempts.filter((a) => a.user_id === uid);
  }

  // Gap Analysis & Roadmap
  public getLatestAnalysis(): SkillAnalysis {
    const user = this.getCurrentUser();
    const mySkills = this.getMySkills();

    // Map verified assessments
    const verifiedMap: Record<string, ProficiencyLevel> = {};
    const passedAttempts = this.state.assessmentAttempts.filter(
      (a) => a.user_id === user.user_id && a.passed
    );
    // Find skill mapped to version
    for (const a of passedAttempts) {
      if (a.version_id === 'assess-sql-v1') verifiedMap['skill-sql-joins'] = 3;
      if (a.version_id === 'assess-stats-v1') verifiedMap['skill-stats-desc'] = 3;
      if (a.version_id === 'assess-interpret-v1') verifiedMap['skill-dataviz'] = 3;
    }

    const results = runDeterministicGapAnalysis(
      SEED_ROLE_REQUIREMENTS,
      SEED_SKILLS,
      mySkills,
      verifiedMap
    );

    return {
      id: `analysis-${user.user_id}-${Date.now()}`,
      user_id: user.user_id,
      role_version_id: SEED_ROLE_PROFILE.id,
      scoring_version: '1.0-deterministic',
      results,
      is_stale: false,
      created_at: new Date().toISOString(),
    };
  }

  public getActiveRoadmap(): Roadmap {
    const user = this.getCurrentUser();
    const existing = this.state.roadmaps.find((r) => r.user_id === user.user_id);

    if (existing) {
      return existing;
    }

    // Generate fresh roadmap
    const analysis = this.getLatestAnalysis();
    const newRoadmap = generatePersonalizedRoadmap(
      user.user_id,
      SEED_ROLE_PROFILE.id,
      analysis.results,
      SEED_SKILLS,
      SEED_PREREQUISITES,
      SEED_LEARNING_RESOURCES,
      user.weekly_study_hours,
      null
    );

    this.state.roadmaps.push(newRoadmap);

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.saveRoadmap(newRoadmap).catch(console.warn);
    }

    this.persist();
    return newRoadmap;
  }

  public regenerateRoadmap(): Roadmap {
    const user = this.getCurrentUser();
    const analysis = this.getLatestAnalysis();
    const existing = this.state.roadmaps.find((r) => r.user_id === user.user_id);

    const freshRoadmap = generatePersonalizedRoadmap(
      user.user_id,
      SEED_ROLE_PROFILE.id,
      analysis.results,
      SEED_SKILLS,
      SEED_PREREQUISITES,
      SEED_LEARNING_RESOURCES,
      user.weekly_study_hours,
      existing
    );

    this.state.roadmaps = this.state.roadmaps.filter((r) => r.user_id !== user.user_id);
    this.state.roadmaps.push(freshRoadmap);

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.saveRoadmap(freshRoadmap).catch(console.warn);
    }

    this.persist();
    return freshRoadmap;
  }

  public updateRoadmapItemStatus(
    itemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) {
    const user = this.getCurrentUser();
    const roadmap = this.state.roadmaps.find((r) => r.user_id === user.user_id);
    if (!roadmap) return;

    roadmap.items = roadmap.items.map((item) =>
      item.id === itemId ? { ...item, status } : item
    );

    if (this.isSupabaseAuthenticated) {
      supabasePersistence.updateRoadmapItemStatus(itemId, status).catch(console.warn);
    }

    this.persist();
  }

  private markActiveRoadmapStale() {
    const user = this.getCurrentUser();
    const roadmap = this.state.roadmaps.find((r) => r.user_id === user.user_id);
    if (roadmap) {
      roadmap.is_stale = true;
    }
  }

  // Export Data (GET /api/me/export)
  public exportMyData(): UserDataExport {
    const user = this.getCurrentUser();
    const uid = user.user_id;

    const myAttempts = this.state.assessmentAttempts.filter((a) => a.user_id === uid);
    const myResponses = this.state.assessmentResponses;
    const history = myAttempts.map((attempt) => ({
      attempt,
      responses: myResponses.filter((r) => r.attempt_id === attempt.id),
    }));

    return {
      export_version: 'SkillGraph-GDPR-Export-v1.0',
      generated_at: new Date().toISOString(),
      user_id: uid,
      profile: { ...user },
      skills: this.state.studentSkills.filter((s) => s.user_id === uid),
      evidence: this.state.evidenceItems.filter((e) => e.user_id === uid),
      projects: this.state.projects.filter((p) => p.user_id === uid),
      skill_evidence_links: this.state.skillEvidenceLinks.filter((l) => l.user_id === uid),
      assessment_history: history,
      latest_analysis: this.getLatestAnalysis(),
      active_roadmap: this.state.roadmaps.find((r) => r.user_id === uid) || null,
    };
  }

  // Account Data Deletion (DELETE /api/me/account)
  public async executeAccountDeletion(): Promise<AccountDeletionRequest> {
    const user = this.getCurrentUser();
    const uid = user.user_id;

    // Call Supabase cloud deletion if authenticated
    let cloudResult: AccountDeletionRequest | null = null;
    if (this.isSupabaseAuthenticated) {
      cloudResult = await supabasePersistence.executeAccountDeletion(uid);
    }

    // Purge local state
    this.state.studentSkills = this.state.studentSkills.filter((s) => s.user_id !== uid);
    this.state.projects = this.state.projects.filter((p) => p.user_id !== uid);
    this.state.evidenceItems = this.state.evidenceItems.filter((e) => e.user_id !== uid);
    this.state.skillEvidenceLinks = this.state.skillEvidenceLinks.filter((l) => l.user_id !== uid);
    this.state.documents = this.state.documents.filter((d) => d.user_id !== uid);
    this.state.extractionItems = this.state.extractionItems.filter((e) => e.user_id !== uid);
    this.state.assessmentAttempts = this.state.assessmentAttempts.filter((a) => a.user_id !== uid);
    this.state.roadmaps = this.state.roadmaps.filter((r) => r.user_id !== uid);

    const req: AccountDeletionRequest = cloudResult || {
      id: `del-req-${uid}-${Date.now()}`,
      user_id: uid,
      status: 'completed',
      stages: {
        db_records_cleared: true,
        storage_purged: true,
      },
      details: 'All skills, projects, evidence, assessments, and roadmap records deleted from SkillGraph database.',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    this.state.deletionRequests.push(req);

    // Reset current user profile
    this.updateProfile({
      onboarding_completed: false,
      weekly_study_hours: 10,
    });

    this.persist();

    // If signed into Supabase, sign out as well
    if (this.isSupabaseAuthenticated) {
      await supabaseAuth.signOut();
    }

    return req;
  }
}

export const storage = new StorageService();
