/**
 * Canonical Data Model Definitions for SkillGraph AI
 * Follows the canonical naming conventions:
 * profiles, skills, skill_aliases, skill_prerequisites, student_skills,
 * student_projects, evidence_items, skill_evidence, role_profiles,
 * role_skill_requirements, documents, extraction_runs, extraction_items,
 * assessment_versions, assessment_questions, assessment_attempts,
 * assessment_responses, learning_resources, skill_analyses, roadmaps,
 * roadmap_items, account_deletion_requests.
 */

export type ProficiencyLevel = 1 | 2 | 3 | 4; // 1: Beginner, 2: Basic, 3: Intermediate, 4: Advanced

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
};

export type EvidenceSource = 'self_reported' | 'resume_extracted' | 'assessment_verified';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role_target_id: string;
  role_target_name: string;
  weekly_study_hours: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface SkillAlias {
  id: string;
  skill_id: string;
  alias_name: string;
}

export interface SkillPrerequisite {
  id: string;
  skill_id: string;
  prerequisite_skill_id: string;
  relationship_type: 'required' | 'recommended';
  created_at: string;
}

export interface StudentSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: ProficiencyLevel | null;
  effective_proficiency: ProficiencyLevel | null;
  effective_source: EvidenceSource | null;
  is_verified: boolean;
  notes?: string;
  updated_at: string;
}

export interface StudentProject {
  id: string;
  user_id: string;
  title: string;
  description: string;
  url?: string;
  associated_skill_ids: string[];
  created_at: string;
}

export interface EvidenceItem {
  id: string;
  user_id: string;
  title: string;
  type: 'resume' | 'project' | 'github' | 'certificate' | 'assessment' | 'other';
  url?: string;
  description: string;
  created_at: string;
}

export interface SkillEvidence {
  id: string;
  user_id: string;
  skill_id: string;
  evidence_id: string;
  strength: 'mention' | 'demonstrated' | 'verified';
  created_at: string;
}

export interface RoleProfile {
  id: string;
  name: string;
  version: string;
  description: string;
  is_active: boolean;
}

export interface RoleSkillRequirement {
  id: string;
  role_id: string;
  skill_id: string;
  target_proficiency: ProficiencyLevel;
  importance_weight: number; // 0.0 - 1.0
  rationale: string;
  source_label: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  parse_status: 'pending' | 'parsed' | 'failed';
  created_at: string;
}

export interface ExtractionRun {
  id: string;
  document_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface ExtractionItem {
  id: string;
  run_id: string;
  user_id: string;
  skill_name: string;
  suggested_skill_id: string | null;
  evidence_snippet: string;
  source_location?: string;
  proposed_proficiency: ProficiencyLevel | null;
  review_status: 'pending' | 'accepted' | 'rejected' | 'edited';
  confirmed_proficiency?: ProficiencyLevel | null;
  reviewer_notes?: string;
  confirmed_at?: string;
}

export interface AssessmentVersion {
  id: string;
  skill_id: string;
  skill_name: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  version_tag: string;
  status: 'published' | 'archived';
  passing_threshold_percent: number; // e.g. 70%
  target_proficiency_award: ProficiencyLevel; // e.g. 3
}

export interface AssessmentQuestion {
  id: string;
  version_id: string;
  prompt: string;
  options: string[];
  points: number;
  explanation: string;
  // NOTE: correct_option_index is protected and never returned in client question view
}

export interface AssessmentQuestionSecure extends AssessmentQuestion {
  correct_option_index: number;
}

export interface AssessmentAttempt {
  id: string;
  user_id: string;
  version_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
}

export interface AssessmentResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  points_awarded: number;
  explanation: string;
}

export interface LearningResource {
  id: string;
  skill_id: string;
  title: string;
  provider: string;
  url: string;
  difficulty: string;
  estimated_hours: number;
}

export interface SkillAnalysisResult {
  skill_id: string;
  skill_name: string;
  category: string;
  target_proficiency: ProficiencyLevel;
  current_proficiency: ProficiencyLevel | null;
  gap: number | null; // NULL if current is unknown
  priority: number | null; // NULL if gap is null
  needs_verification: boolean;
  rationale: string;
  importance_weight: number;
  effective_source: EvidenceSource | null;
}

export interface SkillAnalysis {
  id: string;
  user_id: string;
  role_version_id: string;
  scoring_version: string;
  results: SkillAnalysisResult[];
  is_stale: boolean;
  created_at: string;
}

export interface RoadmapItem {
  id: string;
  roadmap_id: string;
  skill_id: string;
  skill_name: string;
  category: string;
  order_index: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  recommendation_type: 'diagnostic' | 'learning';
  reason: string;
  priority_score: number | null;
  estimated_hours: number;
  resource?: LearningResource;
}

export interface Roadmap {
  id: string;
  user_id: string;
  role_id: string;
  weekly_study_hours: number;
  total_estimated_hours: number;
  estimated_weeks: number;
  is_stale: boolean;
  items: RoadmapItem[];
  created_at: string;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'failed';
  stages: {
    storage_purged: boolean;
    db_records_cleared: boolean;
    auth_user_deleted?: boolean;
  };
  details: string;
  created_at: string;
  completed_at?: string;
}

export interface UserDataExport {
  export_version: string;
  generated_at: string;
  user_id: string;
  profile: UserProfile;
  skills: StudentSkill[];
  evidence: EvidenceItem[];
  projects: StudentProject[];
  skill_evidence_links: SkillEvidence[];
  assessment_history: {
    attempt: AssessmentAttempt;
    responses: AssessmentResponse[];
  }[];
  latest_analysis: SkillAnalysis | null;
  active_roadmap: Roadmap | null;
}
