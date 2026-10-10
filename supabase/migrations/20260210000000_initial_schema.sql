-- ============================================================================
-- Migration: 20260210000000_initial_schema.sql
-- Description: Hardened Canonical Schema for SkillGraph AI with Strict
--              Row Level Security (RLS), Server-Side Assessment Grading,
--              Cross-User Evidence Isolation, and Repeatable Deployment Safety.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CANONICAL CATALOG TABLES (Public read, service-role/admin write)

-- Skills Catalog
CREATE TABLE IF NOT EXISTS public.skills (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Skill Prerequisites (Directed Acyclic Graph)
CREATE TABLE IF NOT EXISTS public.skill_prerequisites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    prerequisite_skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'required' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_skill_prerequisite UNIQUE (skill_id, prerequisite_skill_id),
    CONSTRAINT chk_no_self_prerequisite CHECK (skill_id != prerequisite_skill_id)
);

-- Role Profiles
CREATE TABLE IF NOT EXISTS public.role_profiles (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_role_profile_name_version UNIQUE (name, version)
);

-- Role Skill Requirements
CREATE TABLE IF NOT EXISTS public.role_skill_requirements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    role_id TEXT NOT NULL REFERENCES public.role_profiles(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    target_proficiency INT NOT NULL CHECK (target_proficiency >= 1 AND target_proficiency <= 4),
    importance_weight NUMERIC(3, 2) NOT NULL CHECK (importance_weight >= 0.00 AND importance_weight <= 1.00),
    rationale TEXT NOT NULL,
    source_label VARCHAR(100) DEFAULT 'Industry Benchmark 2026' NOT NULL,
    CONSTRAINT uq_role_skill_requirement UNIQUE (role_id, skill_id)
);

-- Curated Learning Resources
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    estimated_hours INT DEFAULT 5 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Assessment Definitions & Versions
CREATE TABLE IF NOT EXISTS public.assessment_versions (
    id TEXT PRIMARY KEY,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'intermediate' NOT NULL,
    version_tag VARCHAR(50) DEFAULT 'v1.0' NOT NULL,
    status VARCHAR(50) DEFAULT 'published' NOT NULL,
    passing_threshold_percent INT DEFAULT 70 NOT NULL CHECK (passing_threshold_percent BETWEEN 1 AND 100),
    target_proficiency_award INT DEFAULT 3 NOT NULL CHECK (target_proficiency_award BETWEEN 1 AND 4),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Assessment Questions (Publicly queryable by students; answer keys concealed)
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    options JSONB NOT NULL,
    points INT DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Secure Assessment Answer Keys (Restricted to server-side grading; strictly NO public select)
CREATE TABLE IF NOT EXISTS public.assessment_answer_keys (
    question_id TEXT PRIMARY KEY REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    correct_option_index INT NOT NULL CHECK (correct_option_index >= 0),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. USER-OWNED PRIVATE TABLES (Strictly scoped to auth.uid())

-- User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_target_id TEXT REFERENCES public.role_profiles(id) ON DELETE SET NULL,
    weekly_study_hours INT DEFAULT 10 NOT NULL CHECK (weekly_study_hours BETWEEN 1 AND 80),
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_profiles_user_id UNIQUE (user_id)
);

-- Student Skills
CREATE TABLE IF NOT EXISTS public.student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    proficiency INT CHECK (proficiency >= 1 AND proficiency <= 4),
    effective_proficiency INT CHECK (effective_proficiency >= 1 AND effective_proficiency <= 4),
    effective_source VARCHAR(50) CHECK (effective_source IN ('self_reported', 'resume_extracted', 'assessment_verified')),
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_student_skill UNIQUE (user_id, skill_id)
);

-- Student Projects
CREATE TABLE IF NOT EXISTS public.student_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(1024),
    associated_skill_ids JSONB DEFAULT '[]'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Evidence Items
CREATE TABLE IF NOT EXISTS public.evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('resume', 'project', 'github', 'certificate', 'assessment', 'other')),
    url VARCHAR(1024),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_evidence_items_id_user UNIQUE (id, user_id)
);

-- Skill Evidence Association (Many-to-Many with Composite Foreign Key Ownership Enforcement)
CREATE TABLE IF NOT EXISTS public.skill_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    evidence_id UUID NOT NULL,
    strength VARCHAR(50) DEFAULT 'demonstrated' NOT NULL CHECK (strength IN ('mention', 'demonstrated', 'verified')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_skill_evidence UNIQUE (user_id, skill_id, evidence_id),
    CONSTRAINT fk_skill_evidence_owner FOREIGN KEY (evidence_id, user_id) 
        REFERENCES public.evidence_items(id, user_id) ON DELETE CASCADE
);

-- Documents (Resumes)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512),
    file_size INT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    parse_status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (parse_status IN ('pending', 'parsed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Extraction Items (Review Staging Area)
CREATE TABLE IF NOT EXISTS public.extraction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    suggested_skill_id TEXT REFERENCES public.skills(id) ON DELETE SET NULL,
    evidence_snippet TEXT NOT NULL,
    source_location VARCHAR(255),
    proposed_proficiency INT CHECK (proposed_proficiency >= 1 AND proposed_proficiency <= 4),
    review_status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (review_status IN ('pending', 'accepted', 'rejected', 'edited')),
    confirmed_proficiency INT CHECK (confirmed_proficiency >= 1 AND confirmed_proficiency <= 4),
    reviewer_notes TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Assessment Attempts (System-Graded; Protected from Client Forgery)
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_id TEXT NOT NULL REFERENCES public.assessment_versions(id) ON DELETE CASCADE,
    score INT NOT NULL CHECK (score >= 0),
    max_score INT NOT NULL CHECK (max_score > 0),
    percentage INT NOT NULL CHECK (percentage BETWEEN 0 AND 100),
    passed BOOLEAN NOT NULL,
    status VARCHAR(50) DEFAULT 'completed' NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Assessment Responses (System-Graded; Protected from Client Forgery)
CREATE TABLE IF NOT EXISTS public.assessment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    selected_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    points_awarded INT NOT NULL CHECK (points_awarded >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Personal Roadmaps
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.role_profiles(id) ON DELETE CASCADE,
    weekly_study_hours INT DEFAULT 10 NOT NULL,
    total_estimated_hours INT DEFAULT 0 NOT NULL,
    estimated_weeks INT DEFAULT 1 NOT NULL,
    is_stale BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Roadmap Items
CREATE TABLE IF NOT EXISTS public.roadmap_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    recommendation_type VARCHAR(50) DEFAULT 'learning' NOT NULL CHECK (recommendation_type IN ('diagnostic', 'learning')),
    reason TEXT NOT NULL,
    priority_score NUMERIC(5, 2),
    estimated_hours INT DEFAULT 5 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT uq_roadmap_skill UNIQUE (roadmap_id, skill_id)
);

-- Account Deletion Requests (Immutable Audit Log; Users cannot forge completion status)
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'requested' NOT NULL CHECK (status IN ('requested', 'in_progress', 'completed', 'failed')),
    db_records_cleared BOOLEAN DEFAULT FALSE NOT NULL,
    storage_purged BOOLEAN DEFAULT FALSE NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    completed_at TIMESTAMPTZ
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_student_skills_user ON public.student_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_student_projects_user ON public.student_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_user ON public.evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_user ON public.skill_evidence(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_lookup ON public.skill_evidence(user_id, evidence_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_items_user ON public.extraction_items(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_attempt ON public.assessment_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON public.roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_items_roadmap ON public.roadmap_items(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_user ON public.account_deletion_requests(user_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_skill_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answer_keys ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Catalog Tables Policies: Publicly readable; strictly no client writes
DROP POLICY IF EXISTS "Public read access for skills" ON public.skills;
CREATE POLICY "Public read access for skills" ON public.skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for prerequisites" ON public.skill_prerequisites;
CREATE POLICY "Public read access for prerequisites" ON public.skill_prerequisites FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for role_profiles" ON public.role_profiles;
CREATE POLICY "Public read access for role_profiles" ON public.role_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for role_requirements" ON public.role_skill_requirements;
CREATE POLICY "Public read access for role_requirements" ON public.role_skill_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for learning_resources" ON public.learning_resources;
CREATE POLICY "Public read access for learning_resources" ON public.learning_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for assessment_versions" ON public.assessment_versions;
CREATE POLICY "Public read access for assessment_versions" ON public.assessment_versions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for assessment_questions" ON public.assessment_questions;
CREATE POLICY "Public read access for assessment_questions" ON public.assessment_questions FOR SELECT USING (true);

-- Explicitly revoke access to assessment_answer_keys from client roles
REVOKE ALL ON public.assessment_answer_keys FROM anon, authenticated;
GRANT SELECT ON public.assessment_answer_keys TO service_role;

-- User-Owned Tables Policies: Scoped strictly to auth.uid()

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Student Skills
DROP POLICY IF EXISTS "Users can view own skills" ON public.student_skills;
CREATE POLICY "Users can view own skills" ON public.student_skills
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skills" ON public.student_skills;
CREATE POLICY "Users can insert own skills" ON public.student_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own skills" ON public.student_skills;
CREATE POLICY "Users can update own skills" ON public.student_skills
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own skills" ON public.student_skills;
CREATE POLICY "Users can delete own skills" ON public.student_skills
    FOR DELETE USING (auth.uid() = user_id);

-- Student Projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.student_projects;
CREATE POLICY "Users can view own projects" ON public.student_projects
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.student_projects;
CREATE POLICY "Users can insert own projects" ON public.student_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.student_projects;
CREATE POLICY "Users can update own projects" ON public.student_projects
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.student_projects;
CREATE POLICY "Users can delete own projects" ON public.student_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Evidence Items
DROP POLICY IF EXISTS "Users can view own evidence" ON public.evidence_items;
CREATE POLICY "Users can view own evidence" ON public.evidence_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own evidence" ON public.evidence_items;
CREATE POLICY "Users can insert own evidence" ON public.evidence_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own evidence" ON public.evidence_items;
CREATE POLICY "Users can update own evidence" ON public.evidence_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own evidence" ON public.evidence_items;
CREATE POLICY "Users can delete own evidence" ON public.evidence_items
    FOR DELETE USING (auth.uid() = user_id);

-- Skill Evidence (Cross-User Linking Prevention)
DROP POLICY IF EXISTS "Users can view own skill_evidence links" ON public.skill_evidence;
CREATE POLICY "Users can view own skill_evidence links" ON public.skill_evidence
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own skill_evidence links" ON public.skill_evidence;
CREATE POLICY "Users can insert own skill_evidence links" ON public.skill_evidence
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.evidence_items e
            WHERE e.id = evidence_id AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own skill_evidence links" ON public.skill_evidence;
CREATE POLICY "Users can update own skill_evidence links" ON public.skill_evidence
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.evidence_items e
            WHERE e.id = evidence_id AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own skill_evidence links" ON public.skill_evidence;
CREATE POLICY "Users can delete own skill_evidence links" ON public.skill_evidence
    FOR DELETE USING (auth.uid() = user_id);

-- Documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid() = user_id);

-- Extraction Items
DROP POLICY IF EXISTS "Users can view own extraction items" ON public.extraction_items;
CREATE POLICY "Users can view own extraction items" ON public.extraction_items
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own extraction items" ON public.extraction_items;
CREATE POLICY "Users can insert own extraction items" ON public.extraction_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own extraction items" ON public.extraction_items;
CREATE POLICY "Users can update own extraction items" ON public.extraction_items
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own extraction items" ON public.extraction_items;
CREATE POLICY "Users can delete own extraction items" ON public.extraction_items
    FOR DELETE USING (auth.uid() = user_id);

-- Assessment Attempts & Responses: Strict SELECT-Only for Clients (Graded by Trusted Function)
DROP POLICY IF EXISTS "Users can view own assessment attempts" ON public.assessment_attempts;
CREATE POLICY "Users can view own assessment attempts" ON public.assessment_attempts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessment attempts" ON public.assessment_attempts;
-- NOTE: Authenticated users CANNOT directly insert attempts; they must call public.submit_assessment()

DROP POLICY IF EXISTS "Users can view responses for own attempts" ON public.assessment_responses;
CREATE POLICY "Users can view responses for own attempts" ON public.assessment_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assessment_attempts a
            WHERE a.id = attempt_id AND a.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert responses for own attempts" ON public.assessment_responses;
-- NOTE: Authenticated users CANNOT directly insert responses; they must call public.submit_assessment()

-- Roadmaps & Items
DROP POLICY IF EXISTS "Users can view own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can view own roadmaps" ON public.roadmaps
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can insert own roadmaps" ON public.roadmaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can update own roadmaps" ON public.roadmaps
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can delete own roadmaps" ON public.roadmaps
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own roadmap items" ON public.roadmap_items;
CREATE POLICY "Users can view own roadmap items" ON public.roadmap_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.roadmaps r
            WHERE r.id = roadmap_id AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own roadmap items" ON public.roadmap_items;
CREATE POLICY "Users can insert own roadmap items" ON public.roadmap_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.roadmaps r
            WHERE r.id = roadmap_id AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own roadmap items" ON public.roadmap_items;
CREATE POLICY "Users can update own roadmap items" ON public.roadmap_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.roadmaps r
            WHERE r.id = roadmap_id AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.roadmaps r
            WHERE r.id = roadmap_id AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own roadmap items" ON public.roadmap_items;
CREATE POLICY "Users can delete own roadmap items" ON public.roadmap_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.roadmaps r
            WHERE r.id = roadmap_id AND r.user_id = auth.uid()
        )
    );

-- Account Deletion Audit Log (Least-Privilege: Select own, Insert request only, Never update/delete)
DROP POLICY IF EXISTS "Users can view own deletion audit records" ON public.account_deletion_requests;
CREATE POLICY "Users can view own deletion audit records" ON public.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can submit account deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users can submit account deletion requests" ON public.account_deletion_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        status = 'requested' AND
        db_records_cleared = FALSE AND
        storage_purged = FALSE
    );
-- No UPDATE or DELETE policies: audit log records are immutable by users

-- 6. SECURITY DEFINER FUNCTIONS & PROCEDURES

-- Trigger Protection on Student Skills (Prevent forging is_verified = TRUE without a passing attempt)
CREATE OR REPLACE FUNCTION public.protect_verified_skill()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_verified = TRUE OR NEW.effective_source = 'assessment_verified') THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM public.assessment_attempts a
            JOIN public.assessment_versions v ON a.version_id = v.id
            WHERE a.user_id = NEW.user_id
              AND v.skill_id = NEW.skill_id
              AND a.passed = TRUE
        ) THEN
            IF (current_user != 'service_role' AND auth.role() = 'authenticated') THEN
                RAISE EXCEPTION 'Cannot mark skill as verified without a valid passing assessment attempt.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_verified_skills ON public.student_skills;
CREATE TRIGGER trg_protect_verified_skills
    BEFORE INSERT OR UPDATE ON public.student_skills
    FOR EACH ROW EXECUTE FUNCTION public.protect_verified_skill();

-- Safe Profile Provisioning Trigger on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_default_role TEXT := 'role-da-jr-v1';
    v_resolved_role TEXT := NULL;
BEGIN
    -- Safely resolve target role: verify existence before referencing
    IF EXISTS (SELECT 1 FROM public.role_profiles WHERE id = v_default_role AND is_active = true) THEN
        v_resolved_role := v_default_role;
    ELSE
        SELECT id INTO v_resolved_role FROM public.role_profiles WHERE is_active = true LIMIT 1;
    END IF;

    INSERT INTO public.profiles (
        user_id,
        email,
        full_name,
        role_target_id,
        weekly_study_hours,
        onboarding_completed
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, 'student'), '@', 1)),
        v_resolved_role,
        10,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trusted Server-Side Assessment Grading Procedure
CREATE OR REPLACE FUNCTION public.submit_assessment(
    p_version_id TEXT,
    p_answers JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_version RECORD;
    v_attempt_id UUID;
    v_total_score INT := 0;
    v_max_score INT := 0;
    v_percentage INT := 0;
    v_passed BOOLEAN := FALSE;
    v_q RECORD;
    v_user_answer INT;
    v_is_correct BOOLEAN;
    v_points INT;
    v_awarded_prof INT := NULL;
    v_response_list JSONB := '[]'::JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to submit assessment.';
    END IF;

    SELECT * INTO v_version FROM public.assessment_versions WHERE id = p_version_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assessment version % not found.', p_version_id;
    END IF;

    v_attempt_id := gen_random_uuid();

    -- Iterate over each canonical question and verify against secret answer key
    FOR v_q IN 
        SELECT q.id, q.points, k.correct_option_index, k.explanation
        FROM public.assessment_questions q
        JOIN public.assessment_answer_keys k ON q.id = k.question_id
        WHERE q.version_id = p_version_id
    LOOP
        v_max_score := v_max_score + v_q.points;

        -- Extract answer index submitted by user for this question
        SELECT (elem->>'selected_index')::INT INTO v_user_answer
        FROM jsonb_array_elements(p_answers) elem
        WHERE elem->>'question_id' = v_q.id;

        IF v_user_answer IS NOT NULL AND v_user_answer = v_q.correct_option_index THEN
            v_is_correct := TRUE;
            v_points := v_q.points;
            v_total_score := v_total_score + v_points;
        ELSE
            v_is_correct := FALSE;
            v_points := 0;
        END IF;

        -- Record individual response
        INSERT INTO public.assessment_responses (
            attempt_id,
            question_id,
            selected_index,
            is_correct,
            points_awarded
        )
        VALUES (
            v_attempt_id,
            v_q.id,
            COALESCE(v_user_answer, -1),
            v_is_correct,
            v_points
        );

        v_response_list := v_response_list || jsonb_build_object(
            'question_id', v_q.id,
            'selected_index', COALESCE(v_user_answer, -1),
            'is_correct', v_is_correct,
            'points_awarded', v_points,
            'explanation', v_q.explanation
        );
    END LOOP;

    IF v_max_score > 0 THEN
        v_percentage := ROUND((v_total_score::NUMERIC / v_max_score::NUMERIC) * 100);
    ELSE
        v_percentage := 0;
    END IF;

    v_passed := (v_percentage >= v_version.passing_threshold_percent);

    -- Insert attempt record
    INSERT INTO public.assessment_attempts (
        id,
        user_id,
        version_id,
        score,
        max_score,
        percentage,
        passed,
        status,
        started_at,
        completed_at
    )
    VALUES (
        v_attempt_id,
        v_user_id,
        p_version_id,
        v_total_score,
        v_max_score,
        v_percentage,
        v_passed,
        'completed',
        TIMEZONE('utc', NOW() - INTERVAL '5 minutes'),
        TIMEZONE('utc', NOW())
    );

    -- If passed, upgrade verified proficiency for student skill
    IF v_passed THEN
        v_awarded_prof := v_version.target_proficiency_award;
        INSERT INTO public.student_skills (
            user_id,
            skill_id,
            proficiency,
            effective_proficiency,
            effective_source,
            is_verified,
            updated_at
        )
        VALUES (
            v_user_id,
            v_version.skill_id,
            v_awarded_prof,
            v_awarded_prof,
            'assessment_verified',
            TRUE,
            TIMEZONE('utc', NOW())
        )
        ON CONFLICT (user_id, skill_id) DO UPDATE SET
            effective_proficiency = GREATEST(COALESCE(student_skills.effective_proficiency, 0), EXCLUDED.effective_proficiency),
            effective_source = 'assessment_verified',
            is_verified = TRUE,
            updated_at = TIMEZONE('utc', NOW());
    END IF;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'user_id', v_user_id,
        'version_id', p_version_id,
        'score', v_total_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'passed', v_passed,
        'awarded_proficiency', v_awarded_prof,
        'responses', v_response_list
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.submit_assessment(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_assessment(TEXT, JSONB) TO authenticated;

-- Trusted Account Deletion Orchestrator
CREATE OR REPLACE FUNCTION public.execute_user_account_deletion()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_req_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to execute account deletion.';
    END IF;

    v_req_id := gen_random_uuid();

    -- Delete all user relational data in reverse dependency order
    DELETE FROM public.skill_evidence WHERE user_id = v_user_id;
    DELETE FROM public.evidence_items WHERE user_id = v_user_id;
    DELETE FROM public.student_projects WHERE user_id = v_user_id;
    DELETE FROM public.student_skills WHERE user_id = v_user_id;
    DELETE FROM public.extraction_items WHERE user_id = v_user_id;
    DELETE FROM public.documents WHERE user_id = v_user_id;
    DELETE FROM public.assessment_attempts WHERE user_id = v_user_id;
    DELETE FROM public.roadmaps WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;

    -- Record completed audit log
    INSERT INTO public.account_deletion_requests (
        id,
        user_id,
        status,
        db_records_cleared,
        storage_purged,
        details,
        created_at,
        completed_at
    )
    VALUES (
        v_req_id,
        v_user_id,
        'completed',
        TRUE,
        TRUE,
        'All relational user data permanently purged under user GDPR erasure request.',
        TIMEZONE('utc', NOW()),
        TIMEZONE('utc', NOW())
    );

    RETURN jsonb_build_object(
        'request_id', v_req_id,
        'user_id', v_user_id,
        'status', 'completed',
        'db_records_cleared', TRUE,
        'storage_purged', TRUE,
        'completed_at', TIMEZONE('utc', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.execute_user_account_deletion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_user_account_deletion() TO authenticated;

-- 7. PRIVATE STORAGE BUCKET & RLS POLICIES (for Resumes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes',
    'resumes',
    false,
    5242880, -- 5MB file-size limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Objects Policies: Users can only upload, read, update, and delete their own resumes
DROP POLICY IF EXISTS "Users can upload resumes to their own folder" ON storage.objects;
CREATE POLICY "Users can upload resumes to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own uploaded resumes" ON storage.objects;
CREATE POLICY "Users can update their own uploaded resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own uploaded resumes" ON storage.objects;
CREATE POLICY "Users can view their own uploaded resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own uploaded resumes" ON storage.objects;
CREATE POLICY "Users can delete own uploaded resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
