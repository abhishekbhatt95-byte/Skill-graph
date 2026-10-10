# SkillGraph AI — From Skills to Careers

**SkillGraph AI** is an evidence-supported skill intelligence platform engineered to bridge the academia-to-industry transition for university students targeting Data Analyst internships and entry-level positions.

Rather than relying on ungrounded conversational chatbots or black-box placement predictions, SkillGraph AI implements deterministic mathematical evaluation, evidence-aware provenance, directed acyclic graph (DAG) prerequisite sequencing, and server-graded objective assessments.

---

## 🚀 Key Architectural Pillars

1. **Grounded Resume Ingestion with Human-in-the-Loop Review:**
   - Parses PDF, DOCX, and text without executing untrusted macros.
   - Extracts candidate skills matched against a canonical catalog with exact citation snippets.
   - Requires explicit student review (Accept, Edit, or Reject) before any claim affects profile data.
2. **Deterministic Gap Analysis Engine:**
   - Evaluates skills against the curated *Junior Data Analyst (v1.0)* role benchmark.
   - Mathematical formula:
     $$\text{Gap}_k = \max(0, T_k - P_k)$$
     $$\text{Priority}_k = \text{Importance Weight}_k \times \text{Gap}_k$$
   - **Critical Integrity Rule:** Missing competencies are stored as `NULL` (requiring diagnostic verification) and are **never penalized as zero**.
3. **Relational Skill Graph & Prerequisite DAG:**
   - Graph relationships enforced with DFS (Depth-First Search) cycle detection.
   - Accessible matrix alternative view for WCAG AA compliance.
4. **Objective Server-Side Assessments:**
   - Low-stakes assessments in SQL, Statistics, and Data Interpretation.
   - Answer keys are strictly protected on the server.
   - Verified test results override unverified self-claims under documented precedence rules.
5. **Progress-Aware Learning Roadmaps:**
   - Sequenced via Topological Sort (Kahn's algorithm) to guarantee foundational prerequisites are completed prior to dependent competencies.
   - Paces effort dynamically against the student's weekly study budget (e.g., 10 hrs/week).
6. **Data Ownership & Privacy:**
   - Sanitized GDPR export (`GET /api/me/export`).
   - Two-stage durable account deletion (`DELETE /api/me/account`).
   - Multi-tenant isolation preventing IDOR vulnerabilities.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Plus Jakarta Sans, JetBrains Mono.
- **Engines:** Deterministic TypeScript engines (`gapEngine`, `graphEngine`, `roadmapEngine`, `assessmentEngine`).
- **Data Persistence:** Scoped storage service with multi-tenant user switching (`Alex Chen` vs `Jordan Taylor`) for immediate cross-user access evaluation.
- **AI Adapter:** Server-side Gemini API integration via `@google/genai` with structured output schemas.

---

## 📦 Project Setup & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production & Quality Checks
```bash
npm run build
npm run lint
```

---

## 🧪 Quality Gates Console

The application includes an in-app **Quality Gates Console** executing 10 automated test suites:
1. `test_jwt_auth_claims`: Token expiry and RS256 algorithm enforcement.
2. `test_user_isolation_cross_access`: Cross-user tenant query isolation.
3. `test_gap_engine_determinism`: Mathematical gap priority and null handling.
4. `test_graph_cycle_prevention`: Deep DFS cycle detector preventing loops (A→B→C→A).
5. `test_topological_roadmap_ordering`: Foundational prerequisites scheduled first.
6. `test_assessment_answer_key_privacy`: Zero answer key exposure in client payloads.
7. `test_assessment_server_grading_idempotence`: Atomic grading against secret rubrics.
8. `test_evidence_provenance_conflict_handling`: Assessment precedence with transparent audit trail.
9. `test_data_export_schema_sanitization`: Export sanitized of passwords and server keys.
10. `test_account_deletion_two_stage_cleanup`: Two-stage purge unlinking records and storage.
