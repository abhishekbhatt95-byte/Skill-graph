-- ============================================================================
-- Migration: 20260210000001_seed_catalog.sql
-- Description: Canonical Seed Data for Skills, Prerequisites (Strict DAG),
--              Role Profiles, Requirements, Resources, Assessments, and
--              Secure Answer Keys for SkillGraph AI. Fully Idempotent.
-- ============================================================================

-- 1. CANONICAL SKILLS (14 Core Skills for Data Analyst Pathway)
INSERT INTO public.skills (id, name, category, description) VALUES
('skill-sql-basics', 'SQL Fundamentals & Filtering', 'Querying & Data Manipulation', 'Writing SELECT, WHERE, ORDER BY, LIMIT, and arithmetic expressions on relational tables.'),
('skill-sql-agg', 'SQL Aggregations & Grouping', 'Querying & Data Manipulation', 'Using COUNT, SUM, AVG, MIN, MAX with GROUP BY and HAVING clauses for summarization.'),
('skill-sql-joins', 'SQL Multi-Table Joins & Subqueries', 'Querying & Data Manipulation', 'INNER JOIN, LEFT JOIN, FULL OUTER JOIN, handling NULLs, and subquery CTE composition.'),
('skill-sql-window', 'Advanced SQL & Window Functions', 'Querying & Data Manipulation', 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, and OVER(PARTITION BY ...) analytical window queries.'),
('skill-stats-desc', 'Descriptive Statistics & Distributions', 'Statistical Foundations', 'Measures of central tendency (mean, median, mode), variance, standard deviation, and skewness.'),
('skill-stats-infer', 'Inferential Statistics & Hypothesis Testing', 'Statistical Foundations', 'Sampling distributions, Central Limit Theorem, confidence intervals, p-values, and t-tests.'),
('skill-stats-bias', 'Correlation vs. Causation & Bias Analysis', 'Statistical Foundations', 'Identifying confounding variables, selection bias, survivorship bias, and spurious correlations.'),
('skill-data-cleaning', 'Data Cleaning & Missing Value Handling', 'Data Preparation', 'Detecting duplicates, imputing or dropping missing values, type casting, and schema normalization.'),
('skill-eda', 'Exploratory Data Analysis (EDA)', 'Data Preparation', 'Investigating datasets to discover patterns, spot anomalies, and test initial hypotheses.'),
('skill-metrics-kpi', 'Metric Definition & KPI Tracking', 'Business Acumen', 'Formulating actionable business metrics (CAC, LTV, Retention, Churn, Conversion Rate).'),
('skill-dataviz', 'Data Visualization & Dashboard Design', 'Communication & BI', 'Building interpretable charts, executive dashboards in BI tools, and avoiding misleading axes.'),
('skill-python-data', 'Python for Data Analysis (pandas/numpy)', 'Programming & Scripting', 'DataFrames manipulation, vectorized transformations, groupby operations, and matplotlib/seaborn.'),
('skill-excel-modeling', 'Spreadsheet Modeling & Pivot Tables', 'Business Acumen', 'VLOOKUP/XLOOKUP, INDEX/MATCH, dynamic pivot tables, and tabular data structuring.'),
('skill-ab-testing', 'A/B Testing & Experiment Interpretation', 'Business Acumen', 'Sample size sizing, statistical significance, minimum detectable effect, and guardrail metrics.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- 2. SKILL PREREQUISITES (Strict DAG - Mathematically Acyclic)
INSERT INTO public.skill_prerequisites (id, skill_id, prerequisite_skill_id, relationship_type) VALUES
('pre-1', 'skill-sql-agg', 'skill-sql-basics', 'required'),
('pre-2', 'skill-sql-joins', 'skill-sql-agg', 'required'),
('pre-3', 'skill-sql-window', 'skill-sql-joins', 'required'),
('pre-4', 'skill-stats-infer', 'skill-stats-desc', 'required'),
('pre-5', 'skill-stats-bias', 'skill-stats-desc', 'recommended'),
('pre-6', 'skill-ab-testing', 'skill-stats-infer', 'required'),
('pre-7', 'skill-eda', 'skill-data-cleaning', 'required'),
('pre-8', 'skill-metrics-kpi', 'skill-eda', 'recommended'),
('pre-9', 'skill-dataviz', 'skill-metrics-kpi', 'required')
ON CONFLICT (id) DO UPDATE SET
  skill_id = EXCLUDED.skill_id,
  prerequisite_skill_id = EXCLUDED.prerequisite_skill_id,
  relationship_type = EXCLUDED.relationship_type;

-- 3. ROLE PROFILE: Junior Data Analyst v1.0
INSERT INTO public.role_profiles (id, name, version, description, is_active) VALUES
('role-da-jr-v1', 'Junior Data Analyst', '1.0', 'Curated benchmark profile for internship and entry-level Data Analyst positions across technology, finance, and commerce.', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  version = EXCLUDED.version,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 4. ROLE SKILL REQUIREMENTS
INSERT INTO public.role_skill_requirements (id, role_id, skill_id, target_proficiency, importance_weight, rationale, source_label) VALUES
('req-1', 'role-da-jr-v1', 'skill-sql-joins', 3, 0.95, 'Core daily competency: extracting multi-table transactional data, handling relational integrity, and aggregations.', 'Industry Hiring Benchmark 2026'),
('req-2', 'role-da-jr-v1', 'skill-stats-desc', 3, 0.90, 'Essential for understanding distributions, identifying skewed data, and communicating metric spreads accurately.', 'Industry Hiring Benchmark 2026'),
('req-3', 'role-da-jr-v1', 'skill-eda', 3, 0.85, 'Ability to independently audit and inspect unfamiliar business tables to form initial analytical insights.', 'Industry Hiring Benchmark 2026'),
('req-4', 'role-da-jr-v1', 'skill-dataviz', 3, 0.85, 'Synthesizing quantitative findings into clear, non-deceptive charts and stakeholder dashboard reporting.', 'Industry Hiring Benchmark 2026'),
('req-5', 'role-da-jr-v1', 'skill-metrics-kpi', 3, 0.80, 'Translating technical queries into business concepts (churn, conversion rates, customer lifetime value).', 'Industry Hiring Benchmark 2026'),
('req-6', 'role-da-jr-v1', 'skill-excel-modeling', 3, 0.75, 'High operational prevalence for ad-hoc stakeholder reviews, pivot validation, and financial reconciliation.', 'Industry Hiring Benchmark 2026'),
('req-7', 'role-da-jr-v1', 'skill-sql-window', 2, 0.70, 'Understanding partitioned ranking and cohort offset calculations for time-series and user engagement.', 'Industry Hiring Benchmark 2026'),
('req-8', 'role-da-jr-v1', 'skill-stats-infer', 2, 0.65, 'Interpreting sample variability, confidence intervals, and avoiding drawing premature conclusions from small samples.', 'Industry Hiring Benchmark 2026'),
('req-9', 'role-da-jr-v1', 'skill-python-data', 2, 0.60, 'Automation of data transformations, handling larger CSVs, and programmatic data munging with pandas.', 'Industry Hiring Benchmark 2026')
ON CONFLICT (id) DO UPDATE SET
  target_proficiency = EXCLUDED.target_proficiency,
  importance_weight = EXCLUDED.importance_weight,
  rationale = EXCLUDED.rationale,
  source_label = EXCLUDED.source_label;

-- 5. CURATED LEARNING RESOURCES
INSERT INTO public.learning_resources (id, skill_id, title, provider, url, difficulty, estimated_hours) VALUES
('res-sql-1', 'skill-sql-basics', 'SQL Tutorial: Structure and Filtering', 'Mode Analytics', 'https://mode.com/sql-tutorial/introduction-to-sql/', 'Beginner', 4),
('res-sql-2', 'skill-sql-joins', 'PostgreSQL Relational Joins & Subqueries Guide', 'PostgreSQL Documentation', 'https://www.postgresql.org/docs/current/tutorial-join.html', 'Intermediate', 6),
('res-sql-3', 'skill-sql-window', 'Window Functions Masterclass', 'Mode Analytics', 'https://mode.com/sql-tutorial/sql-window-functions/', 'Intermediate', 5),
('res-stats-1', 'skill-stats-desc', 'Descriptive Statistics & Normal Distributions', 'Khan Academy', 'https://www.khanacademy.org/math/statistics-probability/displaying-describing-data', 'Beginner', 6),
('res-stats-2', 'skill-stats-infer', 'Hypothesis Testing & Significance', 'Khan Academy', 'https://www.khanacademy.org/math/statistics-probability/significance-tests-one-sample', 'Intermediate', 8),
('res-eda-1', 'skill-eda', 'Hands-on Exploratory Data Analysis with Real Datasets', 'Kaggle Learn', 'https://www.kaggle.com/learn/data-visualization', 'Intermediate', 5),
('res-viz-1', 'skill-dataviz', 'Data Visualization Principles & Dashboard Usability', 'Observable / DataViz Catalogue', 'https://datavizcatalogue.com/', 'Beginner', 4),
('res-kpi-1', 'skill-metrics-kpi', 'Product & Growth Metrics for Business Analysts', 'Reforge / Corporate Finance Institute', 'https://corporatefinanceinstitute.com/resources/management/kpi-key-performance-indicators/', 'Intermediate', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  provider = EXCLUDED.provider,
  url = EXCLUDED.url,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours;

-- 6. ASSESSMENT VERSIONS
INSERT INTO public.assessment_versions (id, skill_id, title, description, difficulty, version_tag, status, passing_threshold_percent, target_proficiency_award) VALUES
('assess-sql-v1', 'skill-sql-joins', 'SQL Multi-Table & Relational Logic Assessment', 'Evaluates your practical understanding of INNER vs LEFT JOIN semantics, NULL aggregation edge cases, and CTE filtering.', 'intermediate', 'v1.0', 'published', 75, 3),
('assess-stats-v1', 'skill-stats-desc', 'Statistical Intuition & Distribution Check', 'Evaluates discernment between mean and median in skewed datasets, variance, and standard deviation bounds.', 'intermediate', 'v1.0', 'published', 70, 3),
('assess-interpret-v1', 'skill-dataviz', 'Data Interpretation & Metric Auditing Check', 'Evaluates chart interpretation, recognizing misleading visual scales, Simpson’s paradox, and correlation errors.', 'intermediate', 'v1.0', 'published', 70, 3)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  version_tag = EXCLUDED.version_tag,
  status = EXCLUDED.status,
  passing_threshold_percent = EXCLUDED.passing_threshold_percent,
  target_proficiency_award = EXCLUDED.target_proficiency_award;

-- 7. ASSESSMENT QUESTIONS (Conceals answer keys for public safe querying)
INSERT INTO public.assessment_questions (id, version_id, prompt, options, points) VALUES
('q-sql-1', 'assess-sql-v1', 'Table `orders` has 100 rows. Table `customers` has 20 rows. 5 orders have a `customer_id` that is NULL. What is guaranteed about the number of rows returned by: \n\n`SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.id` (assuming customer IDs are unique in `customers`)?', '["Exactly 95 rows", "Exactly 100 rows", "Between 20 and 100 rows", "105 rows"]'::jsonb, 10),
('q-sql-2', 'assess-sql-v1', 'A column `revenue` contains values [100, 200, NULL, 300]. What does `SELECT AVG(revenue), COUNT(*), COUNT(revenue) FROM transactions` return?', '["AVG = 150, COUNT(*) = 4, COUNT(revenue) = 4", "AVG = 200, COUNT(*) = 4, COUNT(revenue) = 3", "AVG = 200, COUNT(*) = 3, COUNT(revenue) = 3", "AVG = NULL, COUNT(*) = 4, COUNT(revenue) = 3"]'::jsonb, 10),
('q-sql-3', 'assess-sql-v1', 'Which clause correctly filters grouped groups where the total spending exceeds $1,000?', '["WHERE SUM(amount) > 1000", "GROUP BY user_id WHERE amount > 1000", "HAVING SUM(amount) > 1000", "QUALIFY SUM(amount) > 1000"]'::jsonb, 10),
('q-sql-4', 'assess-sql-v1', 'You need to assign row numbers within each region ordered by transaction date. What is the correct SQL window syntax?', '["ROW_NUMBER() OVER (ORDER BY date GROUP BY region)", "ROW_NUMBER() OVER (PARTITION BY region ORDER BY date)", "ROW_NUMBER() GROUP BY region ORDER BY date", "RANK(region) OVER (ORDER BY date)"]'::jsonb, 10),

('q-stats-1', 'assess-stats-v1', 'In a software company with 50 junior analysts earning $60k and 1 executive earning $3,000,000, which metric best summarizes the typical employee compensation?', '["Arithmetic Mean", "Median", "Standard Deviation", "Interquartile Range Maximum"]'::jsonb, 10),
('q-stats-2', 'assess-stats-v1', 'A p-value of 0.03 obtained from a two-tailed hypothesis test at an alpha level of 0.05 indicates:', '["There is a 97% probability that the alternative hypothesis is true.", "The effect size is large and practically important in production.", "Under the null hypothesis, the probability of observing an effect as extreme or more extreme than observed is 3%.", "The null hypothesis is proven false beyond all doubt."]'::jsonb, 10),
('q-stats-3', 'assess-stats-v1', 'If Dataset A has standard deviation 5 and Dataset B has standard deviation 25 (with identical mean 50), what is true?', '["Dataset B has higher accuracy than Dataset A.", "Dataset B exhibits greater dispersion and variability around the mean than Dataset A.", "Dataset A has more rows than Dataset B.", "Dataset A is right-skewed while Dataset B is left-skewed."]'::jsonb, 10),

('q-inter-1', 'assess-interpret-v1', 'A dashboard chart displays user growth with a y-axis truncated to start at 98,000 instead of 0, climbing to 100,000. Why is this misleading?', '["It understates the true percentage growth.", "It visually magnifies a modest 2% growth into what looks like a massive 5x spike.", "Y-axes must always be logarithmic by standard convention.", "Bar charts cannot use integer scales."]'::jsonb, 10),
('q-inter-2', 'assess-interpret-v1', 'A hospital department notices Treatment A has a higher overall recovery rate than Treatment B. However, within mild cases, B wins; and within severe cases, B also wins. What phenomenon describes this?', '["Berkson’s Fallacy", "Hawthorne Effect", "Simpson’s Paradox", "Regression to the Mean"]'::jsonb, 10)
ON CONFLICT (id) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  options = EXCLUDED.options,
  points = EXCLUDED.points;

-- 8. SECURE ASSESSMENT ANSWER KEYS (Concealed from students; for grading verification)
INSERT INTO public.assessment_answer_keys (question_id, correct_option_index, explanation) VALUES
('q-sql-1', 1, 'A LEFT JOIN guarantees that every row in the left table (`orders`) is preserved exactly once when joined on a unique primary key in the right table. The 5 orders with NULL customer_id will produce NULL customer columns, but still contribute 5 rows, totaling 100.'),
('q-sql-2', 1, 'SQL standard aggregate functions (AVG, SUM) ignore NULLs. Sum is 600 across 3 non-null items, so AVG = 200. COUNT(*) counts all physical rows (4), whereas COUNT(column) counts non-null rows only (3).'),
('q-sql-3', 2, 'In SQL execution order, WHERE filters individual rows before aggregation. HAVING filters grouped rows after aggregate computations like SUM() have evaluated.'),
('q-sql-4', 1, 'Window functions partition records using PARTITION BY and sequence them within partitions using ORDER BY inside the OVER() clause.'),
('q-stats-1', 1, 'The median is robust against extreme outliers and severe right-skewness. The arithmetic mean will be heavily inflated by the executive salary and misrepresent typical junior pay.'),
('q-stats-2', 2, 'The p-value is strictly the conditional probability P(Data as or more extreme | Null is true). It is not the probability of the hypothesis itself, nor does statistical significance imply large practical effect size.'),
('q-stats-3', 1, 'Standard deviation quantifies the average dispersion of observations from their mean. A larger standard deviation indicates higher spread/variability.'),
('q-inter-1', 1, 'Truncating the baseline on bar and magnitude charts exaggerates minor relative differences, creating visual deception for non-technical stakeholders.'),
('q-inter-2', 2, 'Simpson''s Paradox occurs when a trend appears in several different groups of data but disappears or reverses when these groups are combined, caused by a confounding variable (e.g., case severity allocation).')
ON CONFLICT (question_id) DO UPDATE SET
  correct_option_index = EXCLUDED.correct_option_index,
  explanation = EXCLUDED.explanation;
