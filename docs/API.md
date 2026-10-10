# REST API & Endpoint Contracts

All authenticated endpoints derive user identity exclusively from verified session tokens.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns service health, uptime, and database connectivity. |
| `GET` | `/api/me` | Retrieves the authenticated student's profile. |
| `PATCH` | `/api/me` | Updates career target or weekly study hours. |
| `GET` | `/api/skills/manual` | Lists current skills owned by authenticated student. |
| `POST` | `/api/skills/manual` | Upserts manual skill level (1–4) with optional context. |
| `POST` | `/api/projects` | Adds a student project and creates associated evidence links. |
| `POST` | `/api/resumes/upload` | Validates and stores resume document privately. |
| `POST` | `/api/resumes/{id}/extract` | Runs extraction and populates staging review table. |
| `POST` | `/api/resumes/{id}/confirm` | Atomically commits accepted extraction items to profile. |
| `GET` | `/api/assessments` | Lists published assessment versions. |
| `GET` | `/api/assessments/{id}/questions` | Retrieves questions WITHOUT answer keys. |
| `POST` | `/api/assessments/{id}/submit` | Submits answers; grades and records verified proficiency. |
| `GET` | `/api/analysis/latest` | Returns deterministic gap analysis for active role profile. |
| `GET` | `/api/roadmap` | Returns active progress-aware sequenced roadmap. |
| `POST` | `/api/roadmap/regenerate` | Regenerates roadmap milestones using topological sort. |
| `PATCH` | `/api/roadmap/items/{id}` | Updates status (pending, in_progress, completed, skipped). |
| `GET` | `/api/me/export` | Generates full GDPR-compliant JSON archive. |
| `DELETE` | `/api/me/account` | Triggers two-stage durable account deletion. |
