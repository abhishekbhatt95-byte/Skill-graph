import {
  Skill,
  SkillPrerequisite,
  RoleProfile,
  RoleSkillRequirement,
  LearningResource,
  AssessmentVersion,
  AssessmentQuestionSecure,
  UserProfile,
  StudentSkill,
  EvidenceItem,
  SkillEvidence,
  StudentProject,
} from '../types/canonical';

// 1. Canonical Skills (14 core skills for Data Analysts)
export const SEED_SKILLS: Skill[] = [
  {
    id: 'skill-sql-basics',
    name: 'SQL Fundamentals & Filtering',
    category: 'Querying & Data Manipulation',
    description: 'Writing SELECT, WHERE, ORDER BY, LIMIT, and arithmetic expressions on relational tables.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-sql-agg',
    name: 'SQL Aggregations & Grouping',
    category: 'Querying & Data Manipulation',
    description: 'Using COUNT, SUM, AVG, MIN, MAX with GROUP BY and HAVING clauses for summarization.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-sql-joins',
    name: 'SQL Multi-Table Joins & Subqueries',
    category: 'Querying & Data Manipulation',
    description: 'INNER JOIN, LEFT JOIN, FULL OUTER JOIN, handling NULLs, and subquery CTE composition.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-sql-window',
    name: 'Advanced SQL & Window Functions',
    category: 'Querying & Data Manipulation',
    description: 'ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD, and OVER(PARTITION BY ...) analytical window queries.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-stats-desc',
    name: 'Descriptive Statistics & Distributions',
    category: 'Statistical Foundations',
    description: 'Measures of central tendency (mean, median, mode), variance, standard deviation, and skewness.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-stats-infer',
    name: 'Inferential Statistics & Hypothesis Testing',
    category: 'Statistical Foundations',
    description: 'Sampling distributions, Central Limit Theorem, confidence intervals, p-values, and t-tests.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-stats-bias',
    name: 'Correlation vs. Causation & Bias Analysis',
    category: 'Statistical Foundations',
    description: 'Identifying confounding variables, selection bias, survivorship bias, and spurious correlations.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-data-cleaning',
    name: 'Data Cleaning & Missing Value Handling',
    category: 'Data Preparation',
    description: 'Detecting duplicates, imputing or dropping missing values, type casting, and schema normalization.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-eda',
    name: 'Exploratory Data Analysis (EDA)',
    category: 'Data Preparation',
    description: 'Investigating datasets to discover patterns, spot anomalies, and test initial hypotheses.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-metrics-kpi',
    name: 'Metric Definition & KPI Tracking',
    category: 'Business Acumen',
    description: 'Formulating actionable business metrics (CAC, LTV, Retention, Churn, Conversion Rate).',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-dataviz',
    name: 'Data Visualization & Dashboard Design',
    category: 'Communication & BI',
    description: 'Building interpretable charts, executive dashboards in BI tools, and avoiding misleading axes.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-python-data',
    name: 'Python for Data Analysis (pandas/numpy)',
    category: 'Programming & Scripting',
    description: 'DataFrames manipulation, vectorized transformations, groupby operations, and matplotlib/seaborn.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-excel-modeling',
    name: 'Spreadsheet Modeling & Pivot Tables',
    category: 'Business Acumen',
    description: 'VLOOKUP/XLOOKUP, INDEX/MATCH, dynamic pivot tables, and tabular data structuring.',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'skill-ab-testing',
    name: 'A/B Testing & Experiment Interpretation',
    category: 'Business Acumen',
    description: 'Sample size sizing, statistical significance, minimum detectable effect, and guardrail metrics.',
    created_at: '2026-01-15T00:00:00Z',
  },
];

// 2. Prerequisite Relationships (Strict DAG - No Cycles)
export const SEED_PREREQUISITES: SkillPrerequisite[] = [
  {
    id: 'pre-1',
    skill_id: 'skill-sql-agg',
    prerequisite_skill_id: 'skill-sql-basics',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-2',
    skill_id: 'skill-sql-joins',
    prerequisite_skill_id: 'skill-sql-agg',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-3',
    skill_id: 'skill-sql-window',
    prerequisite_skill_id: 'skill-sql-joins',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-4',
    skill_id: 'skill-stats-infer',
    prerequisite_skill_id: 'skill-stats-desc',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-5',
    skill_id: 'skill-stats-bias',
    prerequisite_skill_id: 'skill-stats-desc',
    relationship_type: 'recommended',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-6',
    skill_id: 'skill-ab-testing',
    prerequisite_skill_id: 'skill-stats-infer',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-7',
    skill_id: 'skill-eda',
    prerequisite_skill_id: 'skill-data-cleaning',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-8',
    skill_id: 'skill-metrics-kpi',
    prerequisite_skill_id: 'skill-eda',
    relationship_type: 'recommended',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'pre-9',
    skill_id: 'skill-dataviz',
    prerequisite_skill_id: 'skill-metrics-kpi',
    relationship_type: 'required',
    created_at: '2026-01-15T00:00:00Z',
  },
];

// 3. Curated Role Profile: Junior Data Analyst (v1.0)
export const SEED_ROLE_PROFILE: RoleProfile = {
  id: 'role-da-jr-v1',
  name: 'Junior Data Analyst',
  version: '1.0',
  description: 'Curated benchmark profile for internship and entry-level Data Analyst positions across technology, finance, and commerce.',
  is_active: true,
};

export const SEED_ROLE_REQUIREMENTS: RoleSkillRequirement[] = [
  {
    id: 'req-1',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-sql-joins',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.95,
    rationale: 'Core daily competency: extracting multi-table transactional data, handling relational integrity, and aggregations.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-2',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-stats-desc',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.90,
    rationale: 'Essential for understanding distributions, identifying skewed data, and communicating metric spreads accurately.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-3',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-eda',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.85,
    rationale: 'Ability to independently audit and inspect unfamiliar business tables to form initial analytical insights.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-4',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-dataviz',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.85,
    rationale: 'Synthesizing quantitative findings into clear, non-deceptive charts and stakeholder dashboard reporting.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-5',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-metrics-kpi',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.80,
    rationale: 'Translating technical queries into business concepts (churn, conversion rates, customer lifetime value).',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-6',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-excel-modeling',
    target_proficiency: 3, // Intermediate
    importance_weight: 0.75,
    rationale: 'High operational prevalence for ad-hoc stakeholder reviews, pivot validation, and financial reconciliation.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-7',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-sql-window',
    target_proficiency: 2, // Basic
    importance_weight: 0.70,
    rationale: 'Understanding partitioned ranking and cohort offset calculations for time-series and user engagement.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-8',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-stats-infer',
    target_proficiency: 2, // Basic
    importance_weight: 0.65,
    rationale: 'Interpreting sample variability, confidence intervals, and avoiding drawing premature conclusions from small samples.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
  {
    id: 'req-9',
    role_id: 'role-da-jr-v1',
    skill_id: 'skill-python-data',
    target_proficiency: 2, // Basic
    importance_weight: 0.60,
    rationale: 'Automation of data transformations, handling larger CSVs, and programmatic data munging with pandas.',
    source_label: 'Industry Hiring Benchmark 2026',
  },
];

// 4. Curated Learning Resources (Quality-checked URLs)
export const SEED_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'res-sql-1',
    skill_id: 'skill-sql-basics',
    title: 'SQL Tutorial: Structure and Filtering',
    provider: 'Mode Analytics',
    url: 'https://mode.com/sql-tutorial/introduction-to-sql/',
    difficulty: 'Beginner',
    estimated_hours: 4,
  },
  {
    id: 'res-sql-2',
    skill_id: 'skill-sql-joins',
    title: 'PostgreSQL Relational Joins & Subqueries Guide',
    provider: 'PostgreSQL Documentation',
    url: 'https://www.postgresql.org/docs/current/tutorial-join.html',
    difficulty: 'Intermediate',
    estimated_hours: 6,
  },
  {
    id: 'res-sql-3',
    skill_id: 'skill-sql-window',
    title: 'Window Functions Masterclass',
    provider: 'Mode Analytics',
    url: 'https://mode.com/sql-tutorial/sql-window-functions/',
    difficulty: 'Intermediate',
    estimated_hours: 5,
  },
  {
    id: 'res-stats-1',
    skill_id: 'skill-stats-desc',
    title: 'Descriptive Statistics & Normal Distributions',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/statistics-probability/displaying-describing-data',
    difficulty: 'Beginner',
    estimated_hours: 6,
  },
  {
    id: 'res-stats-2',
    skill_id: 'skill-stats-infer',
    title: 'Hypothesis Testing & Significance',
    provider: 'Khan Academy',
    url: 'https://www.khanacademy.org/math/statistics-probability/significance-tests-one-sample',
    difficulty: 'Intermediate',
    estimated_hours: 8,
  },
  {
    id: 'res-eda-1',
    skill_id: 'skill-eda',
    title: 'Hands-on Exploratory Data Analysis with Real Datasets',
    provider: 'Kaggle Learn',
    url: 'https://www.kaggle.com/learn/data-visualization',
    difficulty: 'Intermediate',
    estimated_hours: 5,
  },
  {
    id: 'res-viz-1',
    skill_id: 'skill-dataviz',
    title: 'Data Visualization Principles & Dashboard Usability',
    provider: 'Observable / DataViz Catalogue',
    url: 'https://datavizcatalogue.com/',
    difficulty: 'Beginner',
    estimated_hours: 4,
  },
  {
    id: 'res-kpi-1',
    skill_id: 'skill-metrics-kpi',
    title: 'Product & Growth Metrics for Business Analysts',
    provider: 'Reforge / Corporate Finance Institute',
    url: 'https://corporatefinanceinstitute.com/resources/management/kpi-key-performance-indicators/',
    difficulty: 'Intermediate',
    estimated_hours: 4,
  },
];

// 5. Versioned Objective Assessment Question Banks
export const SEED_ASSESSMENT_VERSIONS: AssessmentVersion[] = [
  {
    id: 'assess-sql-v1',
    skill_id: 'skill-sql-joins',
    skill_name: 'SQL Multi-Table Joins & Subqueries',
    title: 'SQL Multi-Table & Relational Logic Assessment',
    description: 'Evaluates your practical understanding of INNER vs LEFT JOIN semantics, NULL aggregation edge cases, and CTE filtering.',
    difficulty: 'intermediate',
    version_tag: 'v1.0',
    status: 'published',
    passing_threshold_percent: 75,
    target_proficiency_award: 3,
  },
  {
    id: 'assess-stats-v1',
    skill_id: 'skill-stats-desc',
    skill_name: 'Descriptive Statistics & Distributions',
    title: 'Statistical Intuition & Distribution Check',
    description: 'Evaluates discernment between mean and median in skewed datasets, variance, and standard deviation bounds.',
    difficulty: 'intermediate',
    version_tag: 'v1.0',
    status: 'published',
    passing_threshold_percent: 70,
    target_proficiency_award: 3,
  },
  {
    id: 'assess-interpret-v1',
    skill_id: 'skill-dataviz',
    skill_name: 'Data Visualization & Dashboard Design',
    title: 'Data Interpretation & Metric Auditing Check',
    description: 'Evaluates chart interpretation, recognizing misleading visual scales, Simpson’s paradox, and correlation errors.',
    difficulty: 'intermediate',
    version_tag: 'v1.0',
    status: 'published',
    passing_threshold_percent: 70,
    target_proficiency_award: 3,
  },
];

export const SEED_ASSESSMENT_QUESTIONS_SECURE: Record<string, AssessmentQuestionSecure[]> = {
  'assess-sql-v1': [
    {
      id: 'q-sql-1',
      version_id: 'assess-sql-v1',
      prompt: 'Table `orders` has 100 rows. Table `customers` has 20 rows. 5 orders have a `customer_id` that is NULL. What is guaranteed about the number of rows returned by: \n\n`SELECT * FROM orders o LEFT JOIN customers c ON o.customer_id = c.id` (assuming customer IDs are unique in `customers`)?',
      options: [
        'Exactly 95 rows',
        'Exactly 100 rows',
        'Between 20 and 100 rows',
        '105 rows',
      ],
      correct_option_index: 1, // Exactly 100 rows
      points: 10,
      explanation: 'A LEFT JOIN guarantees that every row in the left table (`orders`) is preserved exactly once when joined on a unique primary key in the right table. The 5 orders with NULL customer_id will produce NULL customer columns, but still contribute 5 rows, totaling 100.',
    },
    {
      id: 'q-sql-2',
      version_id: 'assess-sql-v1',
      prompt: 'A column `revenue` contains values [100, 200, NULL, 300]. What does `SELECT AVG(revenue), COUNT(*), COUNT(revenue) FROM transactions` return?',
      options: [
        'AVG = 150, COUNT(*) = 4, COUNT(revenue) = 4',
        'AVG = 200, COUNT(*) = 4, COUNT(revenue) = 3',
        'AVG = 200, COUNT(*) = 3, COUNT(revenue) = 3',
        'AVG = NULL, COUNT(*) = 4, COUNT(revenue) = 3',
      ],
      correct_option_index: 1, // AVG = 200, COUNT(*) = 4, COUNT(revenue) = 3
      points: 10,
      explanation: 'SQL standard aggregate functions (AVG, SUM) ignore NULLs. Sum is 600 across 3 non-null items, so AVG = 200. COUNT(*) counts all physical rows (4), whereas COUNT(column) counts non-null rows only (3).',
    },
    {
      id: 'q-sql-3',
      version_id: 'assess-sql-v1',
      prompt: 'Which clause correctly filters grouped groups where the total spending exceeds $1,000?',
      options: [
        'WHERE SUM(amount) > 1000',
        'GROUP BY user_id WHERE amount > 1000',
        'HAVING SUM(amount) > 1000',
        'QUALIFY SUM(amount) > 1000',
      ],
      correct_option_index: 2, // HAVING SUM(amount) > 1000
      points: 10,
      explanation: 'In SQL execution order, WHERE filters individual rows before aggregation. HAVING filters grouped rows after aggregate computations like SUM() have evaluated.',
    },
    {
      id: 'q-sql-4',
      version_id: 'assess-sql-v1',
      prompt: 'You need to assign row numbers within each region ordered by transaction date. What is the correct SQL window syntax?',
      options: [
        'ROW_NUMBER() OVER (ORDER BY date GROUP BY region)',
        'ROW_NUMBER() OVER (PARTITION BY region ORDER BY date)',
        'ROW_NUMBER() GROUP BY region ORDER BY date',
        'RANK(region) OVER (ORDER BY date)',
      ],
      correct_option_index: 1, // ROW_NUMBER() OVER (PARTITION BY region ORDER BY date)
      points: 10,
      explanation: 'Window functions partition records using PARTITION BY and sequence them within partitions using ORDER BY inside the OVER() clause.',
    },
  ],
  'assess-stats-v1': [
    {
      id: 'q-stats-1',
      version_id: 'assess-stats-v1',
      prompt: 'In a software company with 50 junior analysts earning $60k and 1 executive earning $3,000,000, which metric best summarizes the typical employee compensation?',
      options: [
        'Arithmetic Mean',
        'Median',
        'Standard Deviation',
        'Interquartile Range Maximum',
      ],
      correct_option_index: 1, // Median
      points: 10,
      explanation: 'The median is robust against extreme outliers and severe right-skewness. The arithmetic mean will be heavily inflated by the executive salary and misrepresent typical junior pay.',
    },
    {
      id: 'q-stats-2',
      version_id: 'assess-stats-v1',
      prompt: 'A p-value of 0.03 obtained from a two-tailed hypothesis test at an alpha level of 0.05 indicates:',
      options: [
        'There is a 97% probability that the alternative hypothesis is true.',
        'The effect size is large and practically important in production.',
        'Under the null hypothesis, the probability of observing an effect as extreme or more extreme than observed is 3%.',
        'The null hypothesis is proven false beyond all doubt.',
      ],
      correct_option_index: 2, // Under null, prob of as extreme is 3%
      points: 10,
      explanation: 'The p-value is strictly the conditional probability P(Data as or more extreme | Null is true). It is not the probability of the hypothesis itself, nor does statistical significance imply large practical effect size.',
    },
    {
      id: 'q-stats-3',
      version_id: 'assess-stats-v1',
      prompt: 'If Dataset A has standard deviation 5 and Dataset B has standard deviation 25 (with identical mean 50), what is true?',
      options: [
        'Dataset B has higher accuracy than Dataset A.',
        'Dataset B exhibits greater dispersion and variability around the mean than Dataset A.',
        'Dataset A has more rows than Dataset B.',
        'Dataset A is right-skewed while Dataset B is left-skewed.',
      ],
      correct_option_index: 1, // Greater dispersion
      points: 10,
      explanation: 'Standard deviation quantifies the average dispersion of observations from their mean. A larger standard deviation indicates higher spread/variability.',
    },
  ],
  'assess-interpret-v1': [
    {
      id: 'q-inter-1',
      version_id: 'assess-interpret-v1',
      prompt: 'A dashboard chart displays user growth with a y-axis truncated to start at 98,000 instead of 0, climbing to 100,000. Why is this misleading?',
      options: [
        'It understates the true percentage growth.',
        'It visually magnifies a modest 2% growth into what looks like a massive 5x spike.',
        'Y-axes must always be logarithmic by standard convention.',
        'Bar charts cannot use integer scales.',
      ],
      correct_option_index: 1, // visually magnifies modest 2% growth
      points: 10,
      explanation: 'Truncating the baseline on bar and magnitude charts exaggerates minor relative differences, creating visual deception for non-technical stakeholders.',
    },
    {
      id: 'q-inter-2',
      version_id: 'assess-interpret-v1',
      prompt: "A hospital department notices Treatment A has a higher overall recovery rate than Treatment B. However, within mild cases, B wins; and within severe cases, B also wins. What phenomenon describes this?",
      options: [
        'Berkson’s Fallacy',
        'Hawthorne Effect',
        "Simpson's Paradox",
        'Regression to the Mean',
      ],
      correct_option_index: 2, // Simpson's Paradox
      points: 10,
      explanation: "Simpson's Paradox occurs when a trend appears in several different groups of data but disappears or reverses when these groups are combined, caused by a confounding variable (e.g., case severity allocation).",
    },
  ],
};

// 6. Pre-seeded Sample Resumes for student review workflow
export const SAMPLE_RESUMES = [
  {
    name: 'Sample 1: University Junior (Economics & Statistics)',
    filename: 'Alex_Chen_DataAnalyst_Resume.pdf',
    text: `ALEX CHEN
University of Michigan — B.S. in Economics & Statistics (Expected May 2027)
GPA: 3.75 / 4.00 | Email: alex.chen@umich.edu

EDUCATION & COURSEWORK
- Applied Econometrics, Relational Databases, Linear Regression, Exploratory Data Analysis.

PROJECTS & EVIDENCE
- Retail Sales Performance Dashboard (Fall 2025):
  Constructed relational PostgreSQL database with 250,000 transaction records.
  Wrote complex multi-table SQL queries utilizing INNER JOIN, LEFT JOIN, and GROUP BY to calculate customer monthly recurring revenue.
  Built an interactive dashboard displaying customer retention KPIs and seasonal sales variance.
- Campus Survey Statistical Analysis (Spring 2025):
  Conducted exploratory data analysis in Python (pandas) on 1,200 survey responses.
  Analyzed measures of central tendency, variance, and generated boxplots for distribution visualization.

SKILLS
- Databases: SQL (PostgreSQL, SQLite), relational querying, table joins.
- Statistics: Descriptive statistics, hypothesis testing concepts, regression modeling.
- Business Tools: Excel Pivot Tables, VLOOKUP, Tableau dashboard design.`,
    extracted_skills: [
      {
        skill_id: 'skill-sql-basics',
        skill_name: 'SQL Fundamentals & Filtering',
        snippet: 'Constructed relational PostgreSQL database with 250,000 transaction records. Wrote queries with filtering.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-sql-joins',
        skill_name: 'SQL Multi-Table Joins & Subqueries',
        snippet: 'Wrote complex multi-table SQL queries utilizing INNER JOIN, LEFT JOIN, and GROUP BY to calculate customer MRR.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-stats-desc',
        skill_name: 'Descriptive Statistics & Distributions',
        snippet: 'Analyzed measures of central tendency, variance, and generated boxplots for distribution visualization.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-eda',
        skill_name: 'Exploratory Data Analysis (EDA)',
        snippet: 'Conducted exploratory data analysis in Python (pandas) on 1,200 survey responses.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-dataviz',
        skill_name: 'Data Visualization & Dashboard Design',
        snippet: 'Built an interactive dashboard displaying customer retention KPIs and seasonal sales variance; Tableau.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-excel-modeling',
        skill_name: 'Spreadsheet Modeling & Pivot Tables',
        snippet: 'Excel Pivot Tables, VLOOKUP, tabular data structuring.',
        proposed_proficiency: 2,
      },
    ],
  },
  {
    name: 'Sample 2: Sophomore CS Student (Beginner in Business Analytics)',
    filename: 'Jordan_Taylor_CS_Resume.docx',
    text: `JORDAN TAYLOR
State University — B.S. in Computer Science
Email: jordan.taylor@state.edu | GitHub: github.com/jordantaylor-dev

TECHNICAL SKILLS
- Programming: Python, Java, C++
- Data: Basic SQL SELECT statements, pandas DataFrames
- Math: Discrete Mathematics, Calculus II

PROJECTS
- Personal Finance Tracker Script:
  Wrote Python script with pandas to parse bank statement CSVs and calculate total monthly expenditures.
  Plotted spending by category using matplotlib bar charts.`,
    extracted_skills: [
      {
        skill_id: 'skill-python-data',
        skill_name: 'Python for Data Analysis (pandas/numpy)',
        snippet: 'Wrote Python script with pandas to parse bank statement CSVs and calculate total monthly expenditures.',
        proposed_proficiency: 2,
      },
      {
        skill_id: 'skill-sql-basics',
        skill_name: 'SQL Fundamentals & Filtering',
        snippet: 'Basic SQL SELECT statements in coursework.',
        proposed_proficiency: 1,
      },
    ],
  },
];

// 7. Seed Initial Student Users for Cross-User Isolation Testing
export const SEED_USERS: UserProfile[] = [
  {
    id: 'user-alex-chen',
    user_id: 'usr_alex_chen_01',
    email: 'alex.chen@student.university.edu',
    full_name: 'Alex Chen',
    role_target_id: 'role-da-jr-v1',
    role_target_name: 'Junior Data Analyst (v1.0)',
    weekly_study_hours: 10,
    onboarding_completed: true,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-10T14:30:00Z',
  },
  {
    id: 'user-jordan-taylor',
    user_id: 'usr_jordan_taylor_02',
    email: 'jordan.taylor@cs.college.edu',
    full_name: 'Jordan Taylor',
    role_target_id: 'role-da-jr-v1',
    role_target_name: 'Junior Data Analyst (v1.0)',
    weekly_study_hours: 8,
    onboarding_completed: true,
    created_at: '2026-02-05T09:00:00Z',
    updated_at: '2026-02-05T09:00:00Z',
  },
];

// Initial pre-loaded skills for Alex Chen
export const SEED_ALEX_SKILLS: StudentSkill[] = [
  {
    id: 'askill-1',
    user_id: 'usr_alex_chen_01',
    skill_id: 'skill-sql-joins',
    proficiency: 2, // Basic self-reported
    effective_proficiency: 2,
    effective_source: 'self_reported',
    is_verified: false,
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'askill-2',
    user_id: 'usr_alex_chen_01',
    skill_id: 'skill-stats-desc',
    proficiency: 2,
    effective_proficiency: 2,
    effective_source: 'self_reported',
    is_verified: false,
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'askill-3',
    user_id: 'usr_alex_chen_01',
    skill_id: 'skill-dataviz',
    proficiency: 2,
    effective_proficiency: 2,
    effective_source: 'self_reported',
    is_verified: false,
    updated_at: '2026-02-01T10:00:00Z',
  },
];

// Initial project & evidence for Alex Chen
export const SEED_ALEX_PROJECTS: StudentProject[] = [
  {
    id: 'proj-alex-1',
    user_id: 'usr_alex_chen_01',
    title: 'E-commerce Cohort Retention Analysis',
    description: 'Relational PostgreSQL analysis of customer repeat purchasing behaviors over 12 months with Tableau visualization.',
    url: 'https://github.com/alexchen/ecommerce-retention-sql',
    associated_skill_ids: ['skill-sql-joins', 'skill-dataviz'],
    created_at: '2026-02-02T11:00:00Z',
  },
];

export const SEED_ALEX_EVIDENCE: EvidenceItem[] = [
  {
    id: 'ev-alex-1',
    user_id: 'usr_alex_chen_01',
    title: 'GitHub: ecommerce-retention-sql repository',
    type: 'github',
    url: 'https://github.com/alexchen/ecommerce-retention-sql',
    description: 'Clean SQL scripts demonstrating multi-table joins, subqueries, and metric aggregations.',
    created_at: '2026-02-02T11:00:00Z',
  },
];

export const SEED_ALEX_SKILL_EVIDENCE: SkillEvidence[] = [
  {
    id: 'se-1',
    user_id: 'usr_alex_chen_01',
    skill_id: 'skill-sql-joins',
    evidence_id: 'ev-alex-1',
    strength: 'demonstrated',
    created_at: '2026-02-02T11:00:00Z',
  },
];
