# Canonical Database Schema & Relational Integrity

The canonical schema uses consistent entities across frontend, API, and PostgreSQL storage:

## Core Tables

1. **`profiles`**
   - `id` (UUID PK), `user_id` (UUID index), `email` (string), `full_name` (string), `role_target_id` (FK), `weekly_study_hours` (integer), `onboarding_completed` (boolean), `created_at`, `updated_at`.
2. **`skills`**
   - `id` (string PK), `name` (string unique), `category` (string), `description` (text), `created_at`.
3. **`skill_prerequisites`**
   - `id` (string PK), `skill_id` (FK), `prerequisite_skill_id` (FK), `relationship_type` (enum: required, recommended), `created_at`.
   - *Constraints:* Unique `(skill_id, prerequisite_skill_id)`, no self-loops `skill_id != prerequisite_skill_id`.
4. **`student_skills`**
   - `id` (string PK), `user_id` (UUID index), `skill_id` (FK), `proficiency` (1-4 integer), `effective_proficiency` (1-4 integer, nullable), `effective_source` (enum), `is_verified` (boolean), `updated_at`.
   - *Constraints:* Unique `(user_id, skill_id)`, check `proficiency >= 1 AND proficiency <= 4`.
5. **`role_profiles`** & **`role_skill_requirements`**
   - Versioned benchmarks with target proficiency levels (1-4), normalized importance weights (0.0 - 1.0), and plain-language rationales.
6. **`evidence_items`** & **`skill_evidence`**
   - Many-to-many relationship supporting projects, resume citations, and assessment links.
7. **`documents`**, **`extraction_runs`**, **`extraction_items`**
   - Staging records tracking parsed files and candidate skills prior to student review.
8. **`assessment_versions`**, **`assessment_questions`**, **`assessment_attempts`**, **`assessment_responses`**
   - Objective test banks, secure answer keys, and attempt grading logs.
9. **`roadmaps`** & **`roadmap_items`**
   - Sequenced milestones with topological sort order and study budget calculations.
10. **`account_deletion_requests`**
    - Audit log recording two-stage database and storage purges.

## SQL Migrations

The PostgreSQL schema and seed data are maintained in version-controlled migration files under `supabase/migrations/`:

1. **`20260210000000_initial_schema.sql`**:
   - Defines all catalog and private user tables, foreign keys, unique constraints, check constraints, and performance indexes.
   - Enables Row Level Security (RLS) across all tables with least-privilege `auth.uid() = user_id` policies for user data and public read for canonical catalogs.
   - Sets up the private `resumes` storage bucket with folder-level isolation (`(storage.foldername(name))[1] = auth.uid()::text`).

2. **`20260210000001_seed_catalog.sql`**:
   - Seeds the 14 canonical Data Analyst skills, strict prerequisite DAG relationships, Junior Data Analyst v1.0 benchmark profile with importance weights and rationales, curated learning resources, and assessment question banks.

### Applying Migrations in Supabase

1. In your Supabase Dashboard, navigate to the **SQL Editor**.
2. Run `supabase/migrations/20260210000000_initial_schema.sql` to construct the schema, RLS policies, and storage bucket.
3. Run `supabase/migrations/20260210000001_seed_catalog.sql` to populate canonical catalogs.
4. Ensure `Email Auth` is enabled under **Authentication > Providers**.

