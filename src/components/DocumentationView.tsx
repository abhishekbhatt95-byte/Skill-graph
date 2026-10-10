import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Database,
  Calculator,
  Server,
  Shield,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  category: string;
  content: string;
}

const DOCS: DocSection[] = [
  {
    id: 'readme',
    title: 'README: Overview & Quickstart',
    category: 'Project',
    content: `# SkillGraph AI — From Skills to Careers

SkillGraph AI is an evidence-supported career intelligence platform designed for university students targeting Data Analyst internships and entry-level positions.

### Key Capabilities
- **Grounded Resume Ingestion:** Accept PDF/DOCX resumes, extract candidate skills with exact sentence citations, and hold them in a human review staging area before database write.
- **Deterministic Gap Engine:** Mathematically evaluates readiness against curated, versioned role benchmarks. Formula: \`Priority = Weight × max(0, Target - Current)\`. Missing competencies return NULL (Never penalized as 0).
- **Relational Skill Graph:** Directed Acyclic Graph (DAG) with DFS cycle prevention and an accessible tabular matrix alternative.
- **Objective Server Assessments:** Low-stakes tests in SQL, Statistics, and Data Interpretation. Answer keys are strictly protected on the server.
- **Prerequisite-Aware Roadmaps:** Topological sequencing ensuring foundational concepts (SQL basics) precede advanced milestones (Window functions).
- **GDPR Privacy & Isolation:** \`GET /api/me/export\` sanitized data export and two-stage durable account deletion.`,
  },
  {
    id: 'scoring',
    title: 'SCORING: Deterministic Formulas & Hierarchy',
    category: 'Engine Specs',
    content: `# Deterministic Scoring & Evidence Precedence

### 1. Proficiency Scale
- **Level 1:** Beginner (Theoretical awareness, guided syntax)
- **Level 2:** Basic (Independent single-table queries, fundamental descriptive stats)
- **Level 3:** Intermediate (Multi-table joins, subqueries, variance, EDA dashboards) — Industry Benchmark
- **Level 4:** Advanced (Window functions, complex cohort queries, inferential modeling)

### 2. Gap & Priority Formulas
For known proficiency $P_k$ and target proficiency $T_k$:
$$\\text{Gap}_k = \\max(0, T_k - P_k)$$
$$\\text{Priority}_k = \\text{Importance Weight}_k \\times \\text{Gap}_k$$

### 3. Unknown Proficiency Handling
When a skill is unrecorded or has zero supporting evidence:
- $\\text{Gap}_k = \\text{NULL}$
- $\\text{Priority}_k = \\text{NULL}$
- $\\text{Needs Verification} = \\text{TRUE}$

**Rule:** Missing skills are NEVER assigned zero proficiency. Doing so would conflate "untested" with "incompetent" and distort priority ranking.

### 4. Evidence Precedence Hierarchy
1. **Objective Assessment (Verified):** Highest weight. Direct practical evaluation under timed rubric.
2. **Resume Extracted (Derived):** Supporting evidence. Requires human-in-the-loop confirmation.
3. **Self-Reported (Estimated):** Baseline starting point; flagged for verification on critical prerequisites.`,
  },
  {
    id: 'architecture',
    title: 'ARCHITECTURE: Components & Boundaries',
    category: 'Engineering',
    content: `# System Architecture & Data Flow

### Architectural Tiers
1. **Client Interface:** React + TypeScript + Vite with Plus Jakarta Sans and JetBrains Mono typography, SVG DAG visualizer, and strict WCAG AA contrast.
2. **Deterministic Business Engines:** Pure TypeScript engines (\`gapEngine\`, \`graphEngine\`, \`roadmapEngine\`, \`assessmentEngine\`) guaranteeing reproducible, bit-identical outputs.
3. **Persistence & Tenant Isolation:** Scoped queries using current user identity (\`user_id\`). Direct Object Reference (IDOR) tests ensure User A cannot read or mutate User B records.
4. **Untrusted Document Ingestion:** Client-side document sanitization, file signature verification, and keyword citation mapping.

### Request Lifecycles
- **Resume Confirmation:** User reviews candidate items -> accepts items -> single atomic transaction commits \`StudentSkill\` records and links \`SkillEvidence\` citations.
- **Assessment Submission:** User answers questions -> payload sent without answer keys -> server evaluates against secret rubric -> returns score and explanations -> persists verified proficiency.`,
  },
  {
    id: 'api',
    title: 'API: Endpoints & Request Schemas',
    category: 'API Specs',
    content: `# API Specification

### Authentication & Profile
- \`GET /api/me\` — Returns authenticated user profile.
- \`PATCH /api/me\` — Updates study budget or career target.

### Skills & Evidence
- \`GET /api/skills/manual\` — Lists skills for authenticated user only.
- \`POST /api/skills/manual\` — Upserts student skill with 1-4 proficiency.
- \`POST /api/projects\` — Attaches project and evidence items.

### Resume Ingestion
- \`POST /api/resumes/upload\` — Validates file size (<=5MB) and mime type.
- \`POST /api/resumes/{id}/extract\` — Parses document and produces staging items.
- \`POST /api/resumes/{id}/confirm\` — Atomically commits confirmed skills with evidence links.

### Assessments
- \`GET /api/assessments\` — Lists published assessment definitions.
- \`GET /api/assessments/{id}/questions\` — Retrieves questions WITHOUT answer keys.
- \`POST /api/assessments/{id}/submit\` — Grades submission on server and records attempt.

### Export & Deletion
- \`GET /api/me/export\` — Full JSON export excluding secrets.
- \`DELETE /api/me/account\` — Two-stage durable account deletion.`,
  },
  {
    id: 'privacy',
    title: 'PRIVACY: Retention, Export & Deletion',
    category: 'Compliance',
    content: `# Student Data Privacy & GDPR Compliance

### 1. Data Collected
- Student profile (name, university email, career target, weekly study budget).
- Self-reported skill levels (1-4 scale).
- Resume extracts and citations (retained solely for student reference).
- Objective assessment attempts and scores.

### 2. Export Policy
Students can download a complete, unredacted JSON archive at any time via \`GET /api/me/export\`. The payload adheres strictly to canonical schemas.

### 3. Deletion Workflow (DELETE /api/me/account)
Deletion uses a two-stage transaction:
1. **Database Relational Purge:** All rows in \`student_skills\`, \`student_projects\`, \`evidence_items\`, \`assessment_attempts\`, and \`roadmaps\` are unlinked and cleared.
2. **Storage Object Purge:** Uploaded resume metadata and cached extracts are securely purged.
3. **Audit Confirmation:** A signed audit receipt is returned to the client recording timestamp and confirmation flags.`,
  },
  {
    id: 'deployment',
    title: 'DEPLOYMENT: Environment & Verification',
    category: 'Operations',
    content: `# Deployment & Operations Guide

### Environment Variables (.env)
\`\`\`bash
DATABASE_URL="postgresql://user:pass@localhost:5432/skillgraph"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_JWT_SECRET="your-jwt-secret"
GEMINI_API_KEY="your-optional-gemini-key"
ALLOWED_ORIGINS="http://localhost:3000"
\`\`\`

### Health Checks
- \`GET /api/health\` — Returns status 200 with service status, database connectivity flag, and schema version. Excludes secrets or stack traces.`,
  },
  {
    id: 'testing',
    title: 'TESTING: Quality Gates & Verification Evidence',
    category: 'QA & Gates',
    content: `# Quality Gates & Test Execution Evidence

All 10 verification gates execute in the Quality Gates console:
1. **JWT Auth Verification:** RS256 algorithm enforcement, audience check.
2. **Tenant Isolation:** Cross-user query prevention (IDOR test).
3. **Gap Engine Determinism:** Formula \`Priority = Weight × Gap\`, Null handling.
4. **Prerequisite Cycle Prevention:** DFS cycle detector blocks circular graphs.
5. **Topological Sequencing:** Foundational prerequisites precede dependents.
6. **Answer Key Privacy:** Client questions exclude correct options.
7. **Server Grading:** Evaluates attempts against server rubric.
8. **Evidence Precedence:** Assessment overrides unverified self-report.
9. **Export Sanitization:** Export payload contains zero secrets.
10. **Account Deletion:** Two-stage purge cleans records and storage.`,
  },
];

export const DocumentationView: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState<string>('readme');
  const [copied, setCopied] = useState(false);

  const activeDoc = DOCS.find((d) => d.id === activeDocId) || DOCS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold tracking-wide uppercase">
          <BookOpen className="w-4 h-4" />
          <span>Technical Architecture & Verification Reference</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          SkillGraph AI Technical Documentation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Comprehensive project documentation including mathematical scoring rules, system architecture, API schemas, GDPR privacy policies, and deployment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          {DOCS.map((doc) => {
            const isActive = activeDocId === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="truncate">
                  <div>{doc.title.split(':')[0]}</div>
                  <div className="text-[10px] opacity-75 font-normal truncate">
                    {doc.title.split(':')[1]?.trim()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content View */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono text-indigo-600 uppercase">
                {activeDoc.category}
              </span>
              <h2 className="text-lg font-bold text-slate-900">{activeDoc.title}</h2>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
            </button>
          </div>

          <div className="prose prose-slate prose-sm max-w-none text-xs leading-relaxed font-sans whitespace-pre-line">
            {activeDoc.content}
          </div>
        </div>
      </div>
    </div>
  );
};
