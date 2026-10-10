# Student Data Privacy & GDPR Standards

## 1. Minimal Data Collection Principle
SkillGraph AI collects only data strictly required for skill intelligence:
- Academic background & career goals
- Self-reported skill levels (1-4)
- Resume text extracts (held exclusively for citation verification)
- Objective assessment attempts and timestamps

## 2. Machine-Readable Data Export
Students can execute `GET /api/me/export` at any time to receive their full profile in JSON format:
- All recorded skills & proficiency levels
- Project metadata & evidence citations
- Complete assessment attempt logs with scores
- Latest gap analysis calculation & active roadmap items
- Zero internal passwords, authentication keys, or server configuration are exposed.

## 3. Account Deletion Workflow
Account deletion (`DELETE /api/me/account`) executes a two-stage transaction:
1. **Relational Database Purge:** Deletes all rows belonging to `user_id` across `student_skills`, `student_projects`, `evidence_items`, `skill_evidence`, `assessment_attempts`, and `roadmaps`.
2. **Storage Object Unlink:** Purges stored resume files and extraction caches.
3. **Audit Confirmation:** Returns an immutable audit receipt to the user.
