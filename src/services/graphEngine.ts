import { Skill, SkillPrerequisite, SkillAnalysisResult } from '../types/canonical';

export interface GraphCycleCheckResult {
  hasCycle: boolean;
  cyclePath?: string[];
  message: string;
}

/**
 * Validates whether adding an edge (skillId -> prerequisiteSkillId) would introduce a cycle
 * Edge direction: skillId depends on prerequisiteSkillId (prerequisiteSkillId must come BEFORE skillId)
 */
export function validatePrerequisiteEdge(
  existingPrerequisites: SkillPrerequisite[],
  skillId: string,
  prerequisiteSkillId: string
): GraphCycleCheckResult {
  // 1. Self-reference check
  if (skillId === prerequisiteSkillId) {
    return {
      hasCycle: true,
      cyclePath: [skillId, prerequisiteSkillId],
      message: 'Self-referencing prerequisite is strictly prohibited.',
    };
  }

  // 2. Duplicate check
  const duplicate = existingPrerequisites.some(
    (p) => p.skill_id === skillId && p.prerequisite_skill_id === prerequisiteSkillId
  );
  if (duplicate) {
    return {
      hasCycle: false,
      message: 'Prerequisite relationship already exists.',
    };
  }

  // Build adjacency list: node -> dependencies it requires
  const adj = new Map<string, string[]>();
  for (const p of existingPrerequisites) {
    if (!adj.has(p.skill_id)) adj.set(p.skill_id, []);
    adj.get(p.skill_id)!.push(p.prerequisite_skill_id);
  }

  // Add candidate edge
  if (!adj.has(skillId)) adj.set(skillId, []);
  adj.get(skillId)!.push(prerequisiteSkillId);

  // Run DFS from prerequisiteSkillId to see if we can reach skillId
  // If prerequisiteSkillId can reach skillId, then adding skillId -> prerequisiteSkillId creates a cycle!
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(current: string): boolean {
    visited.add(current);
    recursionStack.add(current);
    path.push(current);

    const neighbors = adj.get(current) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    recursionStack.delete(current);
    path.pop();
    return false;
  }

  if (dfs(prerequisiteSkillId)) {
    return {
      hasCycle: true,
      cyclePath: [skillId, ...path],
      message: `Cycle detected: adding edge creates circular dependency (${skillId} <-> ${prerequisiteSkillId}).`,
    };
  }

  return {
    hasCycle: false,
    message: 'Valid directed acyclic prerequisite relationship.',
  };
}

/**
 * Topological Sort for Skill DAG
 * Ensures that all prerequisites appear before the skills that depend on them
 */
export function topologicalSortSkills(
  skills: Skill[],
  prerequisites: SkillPrerequisite[]
): string[] {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>(); // u -> list of skills that depend on u

  for (const s of skills) {
    inDegree.set(s.id, 0);
    adj.set(s.id, []);
  }

  for (const p of prerequisites) {
    // p.skill_id depends on p.prerequisite_skill_id
    // So p.prerequisite_skill_id -> p.skill_id in execution flow
    if (inDegree.has(p.skill_id) && adj.has(p.prerequisite_skill_id)) {
      inDegree.set(p.skill_id, (inDegree.get(p.skill_id) || 0) + 1);
      adj.get(p.prerequisite_skill_id)!.push(p.skill_id);
    }
  }

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sortedOrder: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedOrder.push(current);

    const dependents = adj.get(current) || [];
    for (const dep of dependents) {
      const newDeg = (inDegree.get(dep) || 1) - 1;
      inDegree.set(dep, newDeg);
      if (newDeg === 0) {
        queue.push(dep);
      }
    }
  }

  // If some skills were in a cycle or disconnected, include remaining
  if (sortedOrder.length < skills.length) {
    for (const s of skills) {
      if (!sortedOrder.includes(s.id)) {
        sortedOrder.push(s.id);
      }
    }
  }

  return sortedOrder;
}

/**
 * Get full transitive prerequisite chain for a given skill
 */
export function getPrerequisiteChain(
  skillId: string,
  prerequisites: SkillPrerequisite[],
  visited = new Set<string>()
): string[] {
  const directPrereqs = prerequisites
    .filter((p) => p.skill_id === skillId)
    .map((p) => p.prerequisite_skill_id);

  const chain: string[] = [];

  for (const prereqId of directPrereqs) {
    if (!visited.has(prereqId)) {
      visited.add(prereqId);
      const deeper = getPrerequisiteChain(prereqId, prerequisites, visited);
      chain.push(...deeper);
      chain.push(prereqId);
    }
  }

  return Array.from(new Set(chain));
}

export type SkillNodeState = 'target_met' | 'known_gap' | 'needs_verification' | 'unrequired';

export function determineNodeState(
  analysisResult: SkillAnalysisResult | undefined
): SkillNodeState {
  if (!analysisResult) return 'unrequired';
  if (analysisResult.needs_verification) return 'needs_verification';
  if (analysisResult.gap === 0) return 'target_met';
  if (analysisResult.gap && analysisResult.gap > 0) return 'known_gap';
  return 'unrequired';
}
