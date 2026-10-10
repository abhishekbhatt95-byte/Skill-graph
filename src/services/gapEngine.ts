import {
  RoleSkillRequirement,
  StudentSkill,
  SkillAnalysisResult,
  Skill,
  ProficiencyLevel,
  EvidenceSource,
  PROFICIENCY_LABELS,
} from '../types/canonical';

export interface EffectiveSkillState {
  proficiency: ProficiencyLevel | null;
  source: EvidenceSource | null;
  hasConflict?: boolean;
  conflictDetails?: string;
  isVerified?: boolean;
}

/**
 * Resolves effective proficiency across multiple evidence sources
 * Rule of Precedence:
 * 1. Assessment Attempt (Verified)
 * 2. Resume Extracted (Derived)
 * 3. Self-Reported (Estimated)
 */
export function resolveEffectiveProficiency(
  studentSkill: StudentSkill | undefined,
  assessmentPassingProficiency: ProficiencyLevel | null = null
): EffectiveSkillState {
  if (!studentSkill && !assessmentPassingProficiency) {
    return {
      proficiency: null,
      source: null,
      hasConflict: false,
    };
  }

  // If objective assessment was taken and passed
  if (assessmentPassingProficiency !== null) {
    const selfProf = studentSkill?.proficiency;
    const hasConflict = selfProf !== null && selfProf !== undefined && selfProf > assessmentPassingProficiency;
    const conflictDetails = hasConflict
      ? `Objective assessment validated level ${assessmentPassingProficiency} (${PROFICIENCY_LABELS[assessmentPassingProficiency]}), whereas self-claim was level ${selfProf} (${PROFICIENCY_LABELS[selfProf as ProficiencyLevel]}).`
      : undefined;

    return {
      proficiency: assessmentPassingProficiency,
      source: 'assessment_verified',
      isVerified: true,
      hasConflict,
      conflictDetails,
    };
  }

  if (studentSkill?.effective_source === 'resume_extracted' && studentSkill.effective_proficiency) {
    return {
      proficiency: studentSkill.effective_proficiency,
      source: 'resume_extracted',
      isVerified: false,
    };
  }

  if (studentSkill?.proficiency) {
    return {
      proficiency: studentSkill.proficiency,
      source: 'self_reported',
      isVerified: false,
    };
  }

  return {
    proficiency: null,
    source: null,
  };
}

/**
 * Deterministic Gap Analysis Engine
 *
 * Scoring Formulas:
 * For known proficiency P_k and target T_k:
 *   Gap_k = max(0, T_k - P_k)
 *   Priority_k = importance_weight * Gap_k
 *
 * For unknown proficiency:
 *   Gap_k = null
 *   Priority_k = null
 *   needs_verification = true
 *
 * NOTE: Unknown proficiency is NEVER treated as zero.
 */
export function runDeterministicGapAnalysis(
  requirements: RoleSkillRequirement[],
  skillsCatalog: Skill[],
  studentSkills: StudentSkill[],
  assessmentVerifiedMap: Record<string, ProficiencyLevel> = {}
): SkillAnalysisResult[] {
  const skillMap = new Map<string, Skill>(skillsCatalog.map((s) => [s.id, s]));
  const studentSkillMap = new Map<string, StudentSkill>(studentSkills.map((s) => [s.skill_id, s]));

  const results: SkillAnalysisResult[] = [];

  for (const req of requirements) {
    const skill = skillMap.get(req.skill_id);
    const studentSkill = studentSkillMap.get(req.skill_id);
    const verifiedLevel = assessmentVerifiedMap[req.skill_id] ?? null;

    const resolved = resolveEffectiveProficiency(studentSkill, verifiedLevel);
    const target = req.target_proficiency;
    const weight = req.importance_weight;

    if (resolved.proficiency === null || resolved.proficiency === undefined) {
      // Unknown proficiency -> Needs verification
      results.push({
        skill_id: req.skill_id,
        skill_name: skill ? skill.name : req.skill_id,
        category: skill ? skill.category : 'General',
        target_proficiency: target,
        current_proficiency: null,
        gap: null,
        priority: null,
        needs_verification: true,
        importance_weight: weight,
        effective_source: null,
        rationale: `This role targets level ${target} (${PROFICIENCY_LABELS[target]}). No current self-report, resume snippet, or assessment is on file. Diagnostic check required.`,
      });
    } else {
      const current = resolved.proficiency;
      const gapVal = Math.max(0, target - current);
      // Priority = weight * gapVal rounded to 3 decimal places for stability
      const priorityVal = Math.round(weight * gapVal * 1000) / 1000;

      let rationale = '';
      if (gapVal === 0) {
        rationale = `Target satisfied (${PROFICIENCY_LABELS[current]} meets or exceeds ${PROFICIENCY_LABELS[target]}). Source: ${formatSourceName(resolved.source)}.`;
      } else {
        rationale = `Skill gap of ${gapVal} levels (Target: ${PROFICIENCY_LABELS[target]}, Current: ${PROFICIENCY_LABELS[current]}). Role importance weight: ${(weight * 100).toFixed(0)}%. ${req.rationale}`;
      }

      if (resolved.hasConflict && resolved.conflictDetails) {
        rationale += ` Note: ${resolved.conflictDetails}`;
      }

      results.push({
        skill_id: req.skill_id,
        skill_name: skill ? skill.name : req.skill_id,
        category: skill ? skill.category : 'General',
        target_proficiency: target,
        current_proficiency: current,
        gap: gapVal,
        priority: priorityVal,
        needs_verification: false,
        importance_weight: weight,
        effective_source: resolved.source,
        rationale,
      });
    }
  }

  // Sort deterministically:
  // 1. Items with known positive gaps sorted by priority descending
  // 2. Items needing verification (untested critical prerequisites)
  // 3. Items with 0 gap (already met target)
  return results.sort((a, b) => {
    // Both have priority
    if (a.priority !== null && b.priority !== null) {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return b.importance_weight - a.importance_weight;
    }
    // a needs verification, b has priority
    if (a.priority === null && b.priority !== null) {
      // Put positive gap priorities above unverified, but unverified above 0 gap
      return b.priority > 0 ? 1 : -1;
    }
    if (a.priority !== null && b.priority === null) {
      return a.priority > 0 ? -1 : 1;
    }
    // Both need verification: sort by role importance weight descending
    return b.importance_weight - a.importance_weight;
  });
}

function formatSourceName(source: EvidenceSource | null): string {
  switch (source) {
    case 'assessment_verified':
      return 'Objective Assessment';
    case 'resume_extracted':
      return 'Resume Review';
    case 'self_reported':
      return 'Self-Reported';
    default:
      return 'Unverified';
  }
}
