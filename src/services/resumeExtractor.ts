import { ExtractionItem, ProficiencyLevel, Skill } from '../types/canonical';
import { SEED_SKILLS } from '../data/seedData';

export interface ParseResult {
  text: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Validates file constraints (size <= 5MB, accepted types)
 */
export function validateResumeFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit.' };
  }

  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const validExts = ['.pdf', '.docx', '.txt'];
  const hasValidExt = validExts.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!validTypes.includes(file.type) && !hasValidExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload PDF, DOCX, or plain text.',
    };
  }

  return { valid: true };
}

/**
 * Extracts candidate skills from parsed resume text against canonical catalog
 * Returns structured items in 'pending' review state
 */
export function extractSkillsFromResumeText(
  text: string,
  runId: string,
  userId: string,
  catalog: Skill[] = SEED_SKILLS
): ExtractionItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const items: ExtractionItem[] = [];
  const lowerText = text.toLowerCase();

  // Keyword rules grounded in canonical skills
  const extractionRules: {
    skillId: string;
    keywords: string[];
    defaultProficiency: ProficiencyLevel;
  }[] = [
    {
      skillId: 'skill-sql-basics',
      keywords: ['sql', 'select', 'where', 'sqlite', 'postgresql', 'mysql'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-sql-joins',
      keywords: ['join', 'joins', 'left join', 'inner join', 'multi-table', 'subquery', 'subqueries', 'relational database'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-sql-window',
      keywords: ['window function', 'row_number', 'partition by', 'dense_rank', 'lead', 'lag'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-stats-desc',
      keywords: ['statistics', 'statistical', 'mean', 'median', 'variance', 'standard deviation', 'distributions', 'central tendency'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-stats-infer',
      keywords: ['hypothesis test', 't-test', 'p-value', 'confidence interval', 'regression', 'econometrics'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-eda',
      keywords: ['exploratory data analysis', 'eda', 'analyzed survey', 'investigated dataset', 'pattern recognition'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-dataviz',
      keywords: ['tableau', 'power bi', 'dashboard', 'visualization', 'charts', 'matplotlib', 'seaborn', 'plots'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-metrics-kpi',
      keywords: ['kpi', 'metrics', 'retention', 'churn', 'conversion rate', 'revenue', 'mrr'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-python-data',
      keywords: ['python', 'pandas', 'numpy', 'dataframes'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-excel-modeling',
      keywords: ['excel', 'pivot table', 'vlookup', 'xlookup', 'spreadsheets'],
      defaultProficiency: 2,
    },
    {
      skillId: 'skill-data-cleaning',
      keywords: ['data cleaning', 'missing values', 'duplicates', 'data hygiene', 'imputation'],
      defaultProficiency: 2,
    },
  ];

  for (const rule of extractionRules) {
    const matchedKeyword = rule.keywords.find((k) => lowerText.includes(k));
    if (matchedKeyword) {
      const canonicalSkill = catalog.find((s) => s.id === rule.skillId);
      if (!canonicalSkill) continue;

      // Find best matching line for evidence snippet
      const matchingLine = lines.find((l) => l.toLowerCase().includes(matchedKeyword)) ||
        `Mention of ${matchedKeyword} identified in resume body.`;

      items.push({
        id: `ext-${runId}-${rule.skillId}`,
        run_id: runId,
        user_id: userId,
        skill_name: canonicalSkill.name,
        suggested_skill_id: canonicalSkill.id,
        evidence_snippet: matchingLine.length > 200 ? matchingLine.substring(0, 197) + '...' : matchingLine,
        source_location: 'Resume Document Body',
        proposed_proficiency: rule.defaultProficiency,
        review_status: 'pending',
      });
    }
  }

  return items;
}
