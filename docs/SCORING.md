# Scoring Methodology & Evidence Precedence

## 1. Proficiency Scale

Proficiency is quantified on a discrete 1–4 integer scale:

| Level | Label | Functional Competency Definition |
| :---: | :--- | :--- |
| **1** | Beginner | Theoretical knowledge; requires guided documentation and templates. |
| **2** | Basic | Can write single-table queries, summarize data, and calculate basic means/medians independently. |
| **3** | Intermediate | Proficient with multi-table relational joins, subqueries, variance, EDA dashboards, and business KPIs. *(Junior Data Analyst Benchmark)* |
| **4** | Advanced | Writes analytical window functions, cohort retention scripts, inferential tests, and automated pipelines. |

---

## 2. Gap & Priority Formulas

For a known student proficiency $P_k$ and role target proficiency $T_k$:

$$\text{Gap}_k = \max(0, T_k - P_k)$$
$$\text{Priority}_k = \text{Importance Weight}_k \times \text{Gap}_k$$

### Unknown Proficiency Rule
When a competency has no self-report, resume snippet, or assessment:
- $\text{Current Proficiency} = \text{NULL}$
- $\text{Numeric Gap} = \text{NULL}$
- $\text{Priority} = \text{NULL}$
- $\text{Needs Verification} = \text{TRUE}$

**Integrity Requirement:** Missing skills are NEVER assigned zero proficiency. Assigning zero would artificially inflate gap magnitude and penalize unexamined skills.

---

## 3. Evidence Precedence Hierarchy

When multiple evidence sources exist for a single skill:

1. **Objective Assessment (Verified):** Highest weight. Direct demonstration on timed questions. Scores $\ge 70\%$ award verified Level 3.
2. **Resume Extracted (Derived):** Supporting evidence. Confirmed by the student with citation snippet from resume body.
3. **Self-Reported (Estimated):** Initial user estimate. Remains marked as unverified for critical prerequisites.

### Conflict Resolution
If a student self-reports Level 4, but scores below the passing threshold on an objective assessment, the effective proficiency reflects the assessment, while the conflict is preserved in the audit trail:
> *"Objective assessment validated level 2, whereas self-claim was level 4. Adjusting effective proficiency to assessed baseline."*
