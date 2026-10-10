import { supabase, isSupabaseConfigured } from '../lib/supabase';
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
  Roadmap,
  RoadmapItem,
  AccountDeletionRequest,
} from '../types/canonical';

export interface SupabaseSyncResult<T> {
  data: T | null;
  error: string | null;
  fromCloud: boolean;
}

export class SupabasePersistenceService {
  /**
   * Fetch all user data from Supabase PostgreSQL tables
   */
  public async fetchUserData(userId: string): Promise<{
    profile: UserProfile | null;
    skills: StudentSkill[];
    projects: StudentProject[];
    evidence: EvidenceItem[];
    skillEvidence: SkillEvidence[];
    documents: DocumentRecord[];
    extractionItems: ExtractionItem[];
    attempts: AssessmentAttempt[];
    responses: AssessmentResponse[];
    roadmaps: Roadmap[];
    hasCloudData: boolean;
  }> {
    if (!isSupabaseConfigured || !userId) {
      return {
        profile: null,
        skills: [],
        projects: [],
        evidence: [],
        skillEvidence: [],
        documents: [],
        extractionItems: [],
        attempts: [],
        responses: [],
        roadmaps: [],
        hasCloudData: false,
      };
    }

    try {
      // Execute queries in parallel
      const [
        profileRes,
        skillsRes,
        projectsRes,
        evidenceRes,
        skillEvidenceRes,
        docsRes,
        extractionsRes,
        attemptsRes,
        roadmapsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('student_skills').select('*').eq('user_id', userId),
        supabase.from('student_projects').select('*').eq('user_id', userId),
        supabase.from('evidence_items').select('*').eq('user_id', userId),
        supabase.from('skill_evidence').select('*').eq('user_id', userId),
        supabase.from('documents').select('*').eq('user_id', userId),
        supabase.from('extraction_items').select('*').eq('user_id', userId),
        supabase.from('assessment_attempts').select('*, assessment_responses(*)').eq('user_id', userId),
        supabase.from('roadmaps').select('*, roadmap_items(*)').eq('user_id', userId),
      ]);

      // Check if any error indicates missing tables or permission
      if (skillsRes.error || profileRes.error) {
        console.warn('Notice from Supabase query (tables may need SQL migration):', skillsRes.error || profileRes.error);
        return {
          profile: null,
          skills: [],
          projects: [],
          evidence: [],
          skillEvidence: [],
          documents: [],
          extractionItems: [],
          attempts: [],
          responses: [],
          roadmaps: [],
          hasCloudData: false,
        };
      }

      const p = profileRes.data;
      const profile: UserProfile | null = p
        ? {
            id: p.id || p.user_id,
            user_id: p.user_id,
            email: p.email,
            full_name: p.full_name,
            role_target_id: p.role_target_id || 'role-da-jr-v1',
            role_target_name: 'Junior Data Analyst v1.0',
            weekly_study_hours: p.weekly_study_hours || 10,
            onboarding_completed: p.onboarding_completed ?? false,
            created_at: p.created_at,
            updated_at: p.updated_at,
          }
        : null;

      const skills: StudentSkill[] = (skillsRes.data || []).map((s: any) => ({
        id: s.id,
        user_id: s.user_id,
        skill_id: s.skill_id,
        proficiency: s.proficiency ?? null,
        effective_proficiency: s.effective_proficiency ?? null,
        effective_source: s.effective_source ?? null,
        is_verified: s.is_verified ?? false,
        notes: s.notes,
        updated_at: s.updated_at,
      }));

      const projects: StudentProject[] = (projectsRes.data || []).map((proj: any) => ({
        id: proj.id,
        user_id: proj.user_id,
        title: proj.title,
        description: proj.description,
        url: proj.url,
        associated_skill_ids: proj.associated_skill_ids || [],
        created_at: proj.created_at,
      }));

      const evidence: EvidenceItem[] = (evidenceRes.data || []).map((e: any) => ({
        id: e.id,
        user_id: e.user_id,
        title: e.title,
        type: e.type,
        url: e.url,
        description: e.description,
        created_at: e.created_at,
      }));

      const skillEvidence: SkillEvidence[] = (skillEvidenceRes.data || []).map((se: any) => ({
        id: se.id,
        user_id: se.user_id,
        skill_id: se.skill_id,
        evidence_id: se.evidence_id,
        strength: se.strength,
        created_at: se.created_at,
      }));

      const documents: DocumentRecord[] = (docsRes.data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        filename: d.filename,
        file_size: d.file_size,
        mime_type: d.mime_type,
        parse_status: d.parse_status,
        created_at: d.created_at,
      }));

      const extractionItems: ExtractionItem[] = (extractionsRes.data || []).map((ex: any) => ({
        id: ex.id,
        run_id: ex.run_id || ex.document_id || `run-${ex.id}`,
        user_id: ex.user_id,
        skill_name: ex.skill_name,
        suggested_skill_id: ex.suggested_skill_id,
        evidence_snippet: ex.evidence_snippet,
        source_location: ex.source_location,
        proposed_proficiency: ex.proposed_proficiency ?? null,
        review_status: ex.review_status,
        confirmed_proficiency: ex.confirmed_proficiency ?? null,
        reviewer_notes: ex.reviewer_notes,
        confirmed_at: ex.confirmed_at,
      }));

      const attempts: AssessmentAttempt[] = [];
      const responses: AssessmentResponse[] = [];

      for (const att of attemptsRes.data || []) {
        attempts.push({
          id: att.id,
          user_id: att.user_id,
          version_id: att.version_id,
          score: att.score,
          max_score: att.max_score,
          percentage: att.percentage,
          passed: att.passed,
          status: att.status,
          started_at: att.started_at,
          completed_at: att.completed_at,
        });

        if (Array.isArray(att.assessment_responses)) {
          for (const resp of att.assessment_responses) {
            responses.push({
              id: resp.id,
              attempt_id: resp.attempt_id,
              question_id: resp.question_id,
              selected_index: resp.selected_index,
              is_correct: resp.is_correct,
              points_awarded: resp.points_awarded,
              explanation: resp.explanation || '',
            });
          }
        }
      }

      const roadmaps: Roadmap[] = (roadmapsRes.data || []).map((rm: any) => ({
        id: rm.id,
        user_id: rm.user_id,
        role_id: rm.role_id,
        weekly_study_hours: rm.weekly_study_hours,
        total_estimated_hours: rm.total_estimated_hours,
        estimated_weeks: rm.estimated_weeks,
        is_stale: rm.is_stale ?? false,
        created_at: rm.created_at,
        items: (rm.roadmap_items || []).map((item: any) => ({
          id: item.id,
          roadmap_id: item.roadmap_id,
          skill_id: item.skill_id,
          skill_name: item.skill_name || item.skill_id,
          category: item.category || 'Competency',
          order_index: item.order_index,
          status: item.status,
          recommendation_type: item.recommendation_type,
          reason: item.reason,
          priority_score: item.priority_score,
          estimated_hours: item.estimated_hours,
        })),
      }));

      const hasCloudData = !!profile || skills.length > 0 || projects.length > 0;

      return {
        profile,
        skills,
        projects,
        evidence,
        skillEvidence,
        documents,
        extractionItems,
        attempts,
        responses,
        roadmaps,
        hasCloudData,
      };
    } catch (err) {
      console.warn('Error fetching Supabase user data:', err);
      return {
        profile: null,
        skills: [],
        projects: [],
        evidence: [],
        skillEvidence: [],
        documents: [],
        extractionItems: [],
        attempts: [],
        responses: [],
        roadmaps: [],
        hasCloudData: false,
      };
    }
  }

  /**
   * Upsert Student Skill to Supabase
   * Keeps unknown proficiency NULL and preserves verification distinction
   */
  public async upsertStudentSkill(skill: StudentSkill): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const payload = {
        user_id: skill.user_id,
        skill_id: skill.skill_id,
        // Phase 3 requirement: Keep unknown proficiency NULL
        proficiency: skill.proficiency === null ? null : skill.proficiency,
        effective_proficiency: skill.effective_proficiency === null ? null : skill.effective_proficiency,
        effective_source: skill.effective_source || null,
        is_verified: skill.is_verified,
        notes: skill.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('student_skills')
        .upsert(payload, { onConflict: 'user_id,skill_id' });

      if (error) {
        console.warn('Upsert student_skill error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Exception upserting student skill:', e);
      return false;
    }
  }

  /**
   * Delete student skill from Supabase
   */
  public async deleteStudentSkill(userId: string, skillId: string): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase
        .from('student_skills')
        .delete()
        .eq('user_id', userId)
        .eq('skill_id', skillId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Save student project and related evidence to Supabase
   */
  public async insertStudentProject(
    project: StudentProject,
    evidence: EvidenceItem,
    skillEvidenceLinks: SkillEvidence[]
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      // 1. Project
      const { error: projErr } = await supabase.from('student_projects').insert({
        user_id: project.user_id,
        title: project.title,
        description: project.description,
        url: project.url || null,
        associated_skill_ids: project.associated_skill_ids,
        created_at: project.created_at,
      });

      // 2. Evidence item
      const { error: evErr } = await supabase.from('evidence_items').insert({
        id: evidence.id,
        user_id: evidence.user_id,
        title: evidence.title,
        type: evidence.type,
        url: evidence.url || null,
        description: evidence.description,
        created_at: evidence.created_at,
      });

      // 3. Links
      if (skillEvidenceLinks.length > 0) {
        const linkPayloads = skillEvidenceLinks.map((l) => ({
          user_id: l.user_id,
          skill_id: l.skill_id,
          evidence_id: l.evidence_id,
          strength: l.strength,
          created_at: l.created_at,
        }));
        await supabase.from('skill_evidence').insert(linkPayloads);
      }

      return !projErr && !evErr;
    } catch (e) {
      console.warn('Error saving project to Supabase:', e);
      return false;
    }
  }

  /**
   * Save uploaded document metadata
   */
  public async insertDocument(doc: DocumentRecord): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase.from('documents').insert({
        user_id: doc.user_id,
        filename: doc.filename,
        file_size: doc.file_size,
        mime_type: doc.mime_type,
        parse_status: doc.parse_status,
        created_at: doc.created_at,
      });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Insert extraction items staged for review
   */
  public async insertExtractionItems(items: ExtractionItem[]): Promise<boolean> {
    if (!isSupabaseConfigured || items.length === 0) return false;

    try {
      const payloads = items.map((i) => ({
        user_id: i.user_id,
        skill_name: i.skill_name,
        suggested_skill_id: i.suggested_skill_id,
        evidence_snippet: i.evidence_snippet,
        source_location: i.source_location || null,
        proposed_proficiency: i.proposed_proficiency,
        review_status: i.review_status,
        confirmed_proficiency: i.confirmed_proficiency || null,
        reviewer_notes: i.reviewer_notes || null,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('extraction_items').insert(payloads);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Update review status of an extraction item
   */
  public async updateExtractionItem(
    itemId: string,
    status: 'accepted' | 'rejected' | 'edited',
    confirmedProficiency?: number | null,
    reviewerNotes?: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase
        .from('extraction_items')
        .update({
          review_status: status,
          confirmed_proficiency: confirmedProficiency ?? null,
          reviewer_notes: reviewerNotes ?? null,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Submit assessment attempt through trusted server-side grading procedure
   */
  public async submitAssessmentAttempt(
    versionId: string,
    answers: { question_id: string; selected_index: number }[]
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await supabase.rpc('submit_assessment', {
        p_version_id: versionId,
        p_answers: answers,
      });

      if (error) {
        console.warn('RPC submit_assessment error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error submitting assessment' };
    }
  }

  /**
   * Record completed assessment attempt and question responses
   * (Fallback method when RPC is unavailable or in offline sync)
   */
  public async recordAssessmentAttempt(
    attempt: AssessmentAttempt,
    responses: AssessmentResponse[]
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      // First try trusted grading RPC if answers are available
      const answers = responses.map((r) => ({
        question_id: r.question_id,
        selected_index: r.selected_index,
      }));
      const rpcResult = await this.submitAssessmentAttempt(attempt.version_id, answers);
      if (rpcResult.success) {
        return true;
      }

      // If RPC is unavailable (e.g. migration pending), record attempt row
      const { data: attemptRow, error: attemptErr } = await supabase
        .from('assessment_attempts')
        .insert({
          user_id: attempt.user_id,
          version_id: attempt.version_id,
          score: attempt.score,
          max_score: attempt.max_score,
          percentage: attempt.percentage,
          passed: attempt.passed,
          status: attempt.status,
          started_at: attempt.started_at,
          completed_at: attempt.completed_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (attemptErr || !attemptRow) {
        console.warn('Assessment attempt notice:', attemptErr?.message);
        return false;
      }

      if (responses.length > 0) {
        const respPayloads = responses.map((r) => ({
          attempt_id: attemptRow.id,
          question_id: r.question_id,
          selected_index: r.selected_index,
          is_correct: r.is_correct,
          points_awarded: r.points_awarded,
        }));
        await supabase.from('assessment_responses').insert(respPayloads);
      }

      return true;
    } catch (e) {
      console.warn('Exception recording assessment:', e);
      return false;
    }
  }

  /**
   * Save Roadmap and Items
   */
  public async saveRoadmap(roadmap: Roadmap): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      // Clean up previous roadmaps for this user
      await supabase.from('roadmaps').delete().eq('user_id', roadmap.user_id);

      const { data: rmRow, error: rmErr } = await supabase
        .from('roadmaps')
        .insert({
          user_id: roadmap.user_id,
          role_id: roadmap.role_id,
          weekly_study_hours: roadmap.weekly_study_hours,
          total_estimated_hours: roadmap.total_estimated_hours,
          estimated_weeks: roadmap.estimated_weeks,
          is_stale: roadmap.is_stale,
          created_at: roadmap.created_at,
        })
        .select()
        .single();

      if (rmErr || !rmRow) return false;

      if (roadmap.items.length > 0) {
        const itemPayloads = roadmap.items.map((item, idx) => ({
          roadmap_id: rmRow.id,
          skill_id: item.skill_id,
          order_index: idx + 1,
          status: item.status,
          recommendation_type: item.recommendation_type,
          reason: item.reason,
          priority_score: item.priority_score,
          estimated_hours: item.estimated_hours,
        }));
        await supabase.from('roadmap_items').insert(itemPayloads);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update roadmap item status (pending -> in_progress -> completed -> skipped)
   */
  public async updateRoadmapItemStatus(
    itemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ): Promise<boolean> {
    if (!isSupabaseConfigured) return false;

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .update({ status })
        .eq('id', itemId);

      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Full Account Deletion (GDPR stage purge) exclusively via trusted backend endpoint.
   * Unsafe client-side fallbacks have been removed to guarantee server-side Auth user deletion.
   */
  public async executeAccountDeletion(userId: string): Promise<AccountDeletionRequest> {
    const now = new Date().toISOString();
    let dbRecordsCleared = false;
    let storagePurged = false;
    let authUserDeleted = false;
    let details = 'Account deletion request failed to reach trusted server endpoint.';
    let status: 'completed' | 'failed' = 'failed';

    if (isSupabaseConfigured && userId) {
      try {
        const sessionData = await supabase.auth.getSession();
        const token = sessionData.data.session?.access_token;

        if (!token) {
          throw new Error('No active user session or access token available for deletion authorization.');
        }

        const res = await fetch('/api/me/account', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          return json.data as AccountDeletionRequest;
        } else {
          throw new Error(json.error || `Server responded with status ${res.status}`);
        }
      } catch (err: any) {
        console.error('Trusted server account deletion failed:', err);
        details = `Account deletion could not be completed: ${err.message}. Please retry.`;
        status = 'failed';
      }
    } else {
      details = 'Supabase is not configured or user ID is missing.';
      status = 'failed';
    }

    return {
      id: `del-req-${userId}-${Date.now()}`,
      user_id: userId,
      status,
      stages: {
        db_records_cleared: dbRecordsCleared,
        storage_purged: storagePurged,
        auth_user_deleted: authUserDeleted,
      },
      details,
      created_at: now,
      completed_at: now,
    };
  }

  /**
   * Storage: Upload Resume File to Private 'resumes' Bucket
   */
  public async uploadResumeFile(
    userId: string,
    file: File
  ): Promise<{ storagePath: string | null; downloadUrl: string | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      return { storagePath: null, downloadUrl: null, error: 'Supabase storage is not configured' };
    }

    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${userId}/${Date.now()}_${sanitizedName}`;

      const { data, error } = await supabase.storage.from('resumes').upload(storagePath, file, {
        upsert: true,
        contentType: file.type,
      });

      if (error) {
        return { storagePath: null, downloadUrl: null, error: error.message };
      }

      // Generate a signed URL valid for 1 hour (3600 seconds)
      const { data: signedData } = await supabase.storage
        .from('resumes')
        .createSignedUrl(data.path, 3600);

      return {
        storagePath: data.path,
        downloadUrl: signedData?.signedUrl || null,
        error: null,
      };
    } catch (err: any) {
      return { storagePath: null, downloadUrl: null, error: err.message || 'Storage upload error' };
    }
  }

  /**
   * Storage: Generate a fresh Signed URL for private resume
   */
  public async getResumeSignedUrl(storagePath: string): Promise<string | null> {
    if (!isSupabaseConfigured || !storagePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .createSignedUrl(storagePath, 3600);

      if (error || !data) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }
}

export const supabasePersistence = new SupabasePersistenceService();
