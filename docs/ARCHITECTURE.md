# System Architecture & Technical Specifications

SkillGraph AI separates presentation, business logic, storage, and AI processing into modular, isolated layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Client Interface                       │
│  (Navbar, Overview, Skills, Resume Review, DAG Visualizer, etc.)│
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Deterministic Core Engines                    │
│  ├── GapEngine (Formulas, Null preservation, Weighting)         │
│  ├── GraphEngine (DFS Cycle Detection, Topological Sort)        │
│  ├── RoadmapEngine (Pacing, Dependency-ordered tasks)           │
│  └── AssessmentEngine (Secret Answer Key, Atomic Grading)       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Tenant Scoped Data Storage                      │
│  ├── User Isolation (Strict filter by authenticated user_id)    │
│  ├── Provenance Tracking (Assessment > Resume > Self-Report)    │
│  ├── Export Sanitizer (GET /api/me/export)                      │
│  └── Durable Deletion Orchestrator (DELETE /api/me/account)     │
└─────────────────────────────────────────────────────────────────┘
```

## Architectural Boundaries

1. **Client Isolation:**
   - Client code never receives assessment answer keys or correct option indices before submission.
   - Client requests are scoped exclusively to the authenticated user ID.
2. **Deterministic Mathematics:**
   - Scoring and gap calculations are 100% deterministic, running identical code across client and server environments.
   - No stochastic LLM scoring or fabricated placement probabilities.
3. **Evidence Provenance:**
   - Every skill record tracks its source (`assessment_verified`, `resume_extracted`, or `self_reported`).
   - Conflicting evidence is preserved and surfaced with human-readable rationales.
