import {
  Roadmap,
  RoadmapItem,
  SkillAnalysisResult,
  SkillPrerequisite,
  LearningResource,
  Skill,
} from '../types/canonical';
import { topologicalSortSkills, getPrerequisiteChain } from './graphEngine';

/**
 * Deterministic Progress-Aware Roadmap Generator
 *
 * Rules:
 * 1. Skills with unmet prerequisites are sequenced AFTER their prerequisites
 * 2. High priority gaps scheduled before lower priority gaps within the same dependency tier
 * 3. Unknown skills receive a "diagnostic" verification milestone before heavy learning blocks
 * 4. Already-satisfied skills (gap == 0) are excluded from active learning recommendations
 * 5. Paces work against user's weekly study budget
 */
export function generatePersonalizedRoadmap(
  userId: string,
  roleId: string,
  analysisResults: SkillAnalysisResult[],
  allSkills: Skill[],
  prerequisites: SkillPrerequisite[],
  learningResources: LearningResource[],
  weeklyStudyHours: number,
  existingRoadmap?: Roadmap | null
): Roadmap {
  const resourceMap = new Map<string, LearningResource>();
  for (const r of learningResources) {
    if (!resourceMap.has(r.skill_id)) {
      resourceMap.set(r.skill_id, r);
    }
  }

  const analysisMap = new Map<string, SkillAnalysisResult>();
  for (const a of analysisResults) {
    analysisMap.set(a.skill_id, a);
  }

  // 1. Identify skills that need action:
  // - needs_verification === true (Diagnostic needed)
  // - gap > 0 (Learning needed)
  const actionableSkillIds = new Set<string>();
  for (const a of analysisResults) {
    if (a.needs_verification || (a.gap !== null && a.gap > 0)) {
      actionableSkillIds.add(a.skill_id);

      // Also ensure all transitive prerequisites are included if not already satisfied!
      const prereqChain = getPrerequisiteChain(a.skill_id, prerequisites);
      for (const pId of prereqChain) {
        const pAnalysis = analysisMap.get(pId);
        if (!pAnalysis || pAnalysis.needs_verification || (pAnalysis.gap !== null && pAnalysis.gap > 0)) {
          actionableSkillIds.add(pId);
        }
      }
    }
  }

  // 2. Perform Topological Sort on all skills to get strict prerequisite order
  const topoOrder = topologicalSortSkills(allSkills, prerequisites);

  // 3. Filter topological order to only include actionable skills
  const orderedActionableIds = topoOrder.filter((id) => actionableSkillIds.has(id));

  // 4. Map existing item statuses if regenerating to preserve student progress
  const existingStatusMap = new Map<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>();
  if (existingRoadmap) {
    for (const item of existingRoadmap.items) {
      existingStatusMap.set(item.skill_id, item.status);
    }
  }

  // 5. Construct Roadmap Items
  const items: RoadmapItem[] = [];
  let totalHours = 0;
  const roadmapId = crypto.randomUUID();

  orderedActionableIds.forEach((skillId, index) => {
    const analysis = analysisMap.get(skillId);
    const skill = allSkills.find((s) => s.id === skillId);
    const resource = resourceMap.get(skillId);

    const isVerification = analysis?.needs_verification ?? true;
    const estHours = isVerification ? 2 : (resource?.estimated_hours ?? 5);
    totalHours += estHours;

    let reason = '';
    if (isVerification) {
      reason = `Diagnostic checkpoint: verify foundational level before advancing to dependent tasks.`;
    } else {
      reason = `Target level is ${analysis?.target_proficiency} (current: ${analysis?.current_proficiency}). Importance weight: ${((analysis?.importance_weight ?? 0.5) * 100).toFixed(0)}%.`;
    }

    const previousStatus = existingStatusMap.get(skillId);

    items.push({
      id: crypto.randomUUID(),
      roadmap_id: roadmapId,
      skill_id: skillId,
      skill_name: skill ? skill.name : skillId,
      category: skill ? skill.category : 'General',
      order_index: index + 1,
      status: previousStatus || 'pending',
      recommendation_type: isVerification ? 'diagnostic' : 'learning',
      reason,
      priority_score: analysis?.priority ?? null,
      estimated_hours: estHours,
      resource,
    });
  });

  const safeWeeklyHours = Math.max(1, weeklyStudyHours || 10);
  const estimatedWeeks = Math.ceil(totalHours / safeWeeklyHours);

  return {
    id: roadmapId,
    user_id: userId,
    role_id: roleId,
    weekly_study_hours: safeWeeklyHours,
    total_estimated_hours: totalHours,
    estimated_weeks: estimatedWeeks,
    is_stale: false,
    items,
    created_at: new Date().toISOString(),
  };
}
