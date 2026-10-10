import React, { useState } from 'react';
import {
  GitBranch,
  List,
  Network,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { Skill, SkillPrerequisite, SkillAnalysis, PROFICIENCY_LABELS } from '../types/canonical';
import { SEED_SKILLS, SEED_PREREQUISITES } from '../data/seedData';
import {
  getPrerequisiteChain,
  determineNodeState,
  validatePrerequisiteEdge,
} from '../services/graphEngine';
import { storage } from '../services/storageService';
import { NavTab } from './Navbar';

interface SkillGraphViewProps {
  analysis: SkillAnalysis;
  onNavigate: (tab: NavTab) => void;
}

export const SkillGraphView: React.FC<SkillGraphViewProps> = ({ analysis, onNavigate }) => {
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('skill-sql-joins');

  // Interactive Cycle Sandbox State (allows evaluator to test cycle detection!)
  const [testSourceSkill, setTestSourceSkill] = useState<string>('skill-sql-agg');
  const [testTargetSkill, setTestTargetSkill] = useState<string>('skill-sql-joins');
  const [cycleTestResult, setCycleTestResult] = useState<{
    hasCycle: boolean;
    message: string;
  } | null>(null);

  const analysisMap = new Map(analysis.results.map((r) => [r.skill_id, r]));

  // Selected node details
  const selectedSkill = SEED_SKILLS.find((s) => s.id === selectedSkillId);
  const selectedAnalysis = analysisMap.get(selectedSkillId);
  const prereqChain = getPrerequisiteChain(selectedSkillId, SEED_PREREQUISITES);
  const evidenceItems = storage.getEvidenceForSkill(selectedSkillId);

  // Direct dependents (skills that require the selected skill)
  const directDependents = SEED_PREREQUISITES.filter(
    (p) => p.prerequisite_skill_id === selectedSkillId
  ).map((p) => SEED_SKILLS.find((s) => s.id === p.skill_id)?.name || p.skill_id);

  // Direct prerequisites
  const directPrereqs = SEED_PREREQUISITES.filter(
    (p) => p.skill_id === selectedSkillId
  ).map((p) => SEED_SKILLS.find((s) => s.id === p.prerequisite_skill_id)?.name || p.prerequisite_skill_id);

  // Run cycle detector sandbox
  const handleTestCycle = () => {
    const res = validatePrerequisiteEdge(
      SEED_PREREQUISITES,
      testSourceSkill,
      testTargetSkill
    );
    setCycleTestResult(res);
  };

  // Node coordinate positions for the SVG visualization
  const nodePositions: Record<string, { x: number; y: number }> = {
    'skill-sql-basics': { x: 80, y: 80 },
    'skill-sql-agg': { x: 260, y: 80 },
    'skill-sql-joins': { x: 440, y: 80 },
    'skill-sql-window': { x: 620, y: 80 },

    'skill-stats-desc': { x: 80, y: 220 },
    'skill-stats-infer': { x: 260, y: 220 },
    'skill-stats-bias': { x: 260, y: 310 },
    'skill-ab-testing': { x: 440, y: 220 },

    'skill-data-cleaning': { x: 80, y: 400 },
    'skill-eda': { x: 260, y: 400 },
    'skill-metrics-kpi': { x: 440, y: 400 },
    'skill-dataviz': { x: 620, y: 400 },
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Relational Schema</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800">Prerequisite Directed Acyclic Graph (DAG)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Data Analyst Skill Graph & Prerequisite Map
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Arrows indicate strict learning dependencies (prerequisites must be satisfied before dependent skills). Real relational data backing with cycle detection.
            </p>
          </div>

          {/* Toggle between Graph & Accessible Table */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'graph' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Accessible Table</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Target Satisfied (Met or Exceeds)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Known Gap (Target &gt; Current)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Needs Verification (Diagnostic Needed)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <span>Foundational Non-Required</span>
          </div>
        </div>
      </div>

      {/* Main Graph View or Accessible Table */}
      {viewMode === 'graph' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SVG Canvas (Left 2 Cols) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 overflow-x-auto min-h-[520px] flex items-center justify-center">
            <svg
              viewBox="0 0 760 480"
              className="w-full max-w-[760px] h-auto select-none"
              style={{ minWidth: '680px' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#4f46e5" />
                </marker>
              </defs>

              {/* Connecting Edges */}
              {SEED_PREREQUISITES.map((p) => {
                const source = nodePositions[p.prerequisite_skill_id];
                const target = nodePositions[p.skill_id];
                if (!source || !target) return null;

                const isConnectedToSelected =
                  p.skill_id === selectedSkillId || p.prerequisite_skill_id === selectedSkillId;

                return (
                  <g key={p.id}>
                    <line
                      x1={source.x + 60}
                      y1={source.y + 20}
                      x2={target.x}
                      y2={target.y + 20}
                      stroke={isConnectedToSelected ? '#4f46e5' : '#cbd5e1'}
                      strokeWidth={isConnectedToSelected ? 2.5 : 1.5}
                      strokeDasharray={p.relationship_type === 'recommended' ? '4 3' : 'none'}
                      markerEnd={isConnectedToSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {Object.entries(nodePositions).map(([skillId, pos]) => {
                const skill = SEED_SKILLS.find((s) => s.id === skillId);
                const analysisItem = analysisMap.get(skillId);
                const state = determineNodeState(analysisItem);
                const isSelected = selectedSkillId === skillId;
                const isInChain = prereqChain.includes(skillId);

                let badgeColor = '#94a3b8'; // default
                let bgFill = '#ffffff';
                let strokeColor = '#e2e8f0';

                if (state === 'target_met') {
                  badgeColor = '#10b981';
                  strokeColor = '#10b981';
                } else if (state === 'known_gap') {
                  badgeColor = '#f59e0b';
                  strokeColor = '#f59e0b';
                } else if (state === 'needs_verification') {
                  badgeColor = '#6366f1';
                  strokeColor = '#6366f1';
                }

                if (isSelected) {
                  strokeColor = '#0f172a';
                  bgFill = '#f8fafc';
                } else if (isInChain) {
                  strokeColor = '#4f46e5';
                }

                return (
                  <g
                    key={skillId}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={() => setSelectedSkillId(skillId)}
                    className="cursor-pointer group"
                  >
                    {/* Node Container Card */}
                    <rect
                      x="0"
                      y="0"
                      width="135"
                      height="46"
                      rx="6"
                      fill={bgFill}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 2.5 : isInChain ? 2 : 1}
                      className="transition-all group-hover:stroke-slate-900"
                    />

                    {/* Status Dot */}
                    <circle cx="12" cy="16" r="4" fill={badgeColor} />

                    {/* Node Title */}
                    <text
                      x="22"
                      y="19"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#0f172a"
                      className="font-sans"
                    >
                      {skill ? (skill.name.length > 17 ? skill.name.substring(0, 15) + '...' : skill.name) : skillId}
                    </text>

                    {/* Level Metadata */}
                    <text
                      x="22"
                      y="34"
                      fontSize="9"
                      fill="#64748b"
                      className="font-mono"
                    >
                      {analysisItem
                        ? `L${analysisItem.current_proficiency ?? '?'} / L${analysisItem.target_proficiency}`
                        : 'Foundational'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side Drawer: Selected Node Evidence & Action Tray */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            <div>
              <div className="text-xs text-slate-500 font-medium">Selected Skill Node</div>
              <h2 className="text-base font-bold text-slate-900 mt-1">{selectedSkill?.name}</h2>
              <div className="text-xs text-slate-500">{selectedSkill?.category}</div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{selectedSkill?.description}</p>
            </div>

            {/* Analysis State Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Target Level:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedAnalysis ? `Level ${selectedAnalysis.target_proficiency}` : 'Not strictly required'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Current Level:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedAnalysis?.current_proficiency ? `Level ${selectedAnalysis.current_proficiency}` : 'Unverified (NULL)'}
                </span>
              </div>
              {selectedAnalysis?.gap !== null && selectedAnalysis?.gap !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Priority Score:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {selectedAnalysis.priority?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Prerequisite Chains */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="font-semibold text-slate-800">Direct Prerequisites ({directPrereqs.length})</div>
                {directPrereqs.length === 0 ? (
                  <p className="text-slate-400 mt-1">None (Foundational entry-point competency)</p>
                ) : (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                    {directPrereqs.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="font-semibold text-slate-800">Unlocks Later Skills ({directDependents.length})</div>
                {directDependents.length === 0 ? (
                  <p className="text-slate-400 mt-1">Terminal role milestone</p>
                ) : (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                    {directDependents.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Evidence Attached */}
            <div className="pt-2 border-t border-slate-100 text-xs">
              <div className="font-semibold text-slate-800 mb-2">Supporting Evidence Artifacts</div>
              {evidenceItems.length === 0 ? (
                <p className="text-slate-400 text-xs">No evidence items linked to this skill yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {evidenceItems.map((ev) => (
                    <div key={ev.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px]">
                      <div className="font-bold text-slate-800">{ev.title}</div>
                      <div className="text-slate-500 capitalize">{ev.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action CTA */}
            <button
              onClick={() => onNavigate('roadmap')}
              className="w-full py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Milestone in Roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Accessible List / Table Matrix */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
            Accessible Matrix: Provides screen-reader accessible tabular representation of the relational skill DAG and prerequisites.
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium bg-slate-50/50">
                <th className="py-2.5 px-4">Skill Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Prerequisites Required</th>
                <th className="py-2.5 px-3 text-center">Target</th>
                <th className="py-2.5 px-3 text-center">Current</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SEED_SKILLS.map((skill) => {
                const prereqs = SEED_PREREQUISITES.filter((p) => p.skill_id === skill.id)
                  .map((p) => SEED_SKILLS.find((s) => s.id === p.prerequisite_skill_id)?.name)
                  .filter(Boolean);
                const analysisItem = analysisMap.get(skill.id);
                const state = determineNodeState(analysisItem);

                return (
                  <tr key={skill.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{skill.name}</td>
                    <td className="py-3 px-3 text-slate-600">{skill.category}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {prereqs.length > 0 ? prereqs.join(', ') : <span className="text-slate-400">None</span>}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {analysisItem ? `L${analysisItem.target_proficiency}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {analysisItem?.current_proficiency ? `L${analysisItem.current_proficiency}` : 'NULL'}
                    </td>
                    <td className="py-3 px-3">
                      {state === 'target_met' ? (
                        <span className="text-emerald-700 font-semibold">Target Met</span>
                      ) : state === 'known_gap' ? (
                        <span className="text-amber-700 font-semibold">Active Gap</span>
                      ) : state === 'needs_verification' ? (
                        <span className="text-indigo-700 font-semibold">Needs Verification</span>
                      ) : (
                        <span className="text-slate-500">Foundational</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Cycle Prevention Sandbox (For Faculty Evaluators) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Interactive Cycle Prevention Sandbox (DFS Validation Check)</span>
        </div>
        <p className="text-xs text-slate-600">
          Faculty and QA check: test adding candidate prerequisite edges to verify that circular relationships (e.g. A → B → A or longer multi-node cycles) are rejected by the graph engine before any database write.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="w-full sm:w-auto flex-1">
            <label className="block text-[11px] text-slate-500 mb-1">Dependent Skill (Skill A)</label>
            <select
              value={testSourceSkill}
              onChange={(e) => setTestSourceSkill(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50"
            >
              {SEED_SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-slate-400 font-bold self-center pt-4">depends on →</div>

          <div className="w-full sm:w-auto flex-1">
            <label className="block text-[11px] text-slate-500 mb-1">Prerequisite (Skill B)</label>
            <select
              value={testTargetSkill}
              onChange={(e) => setTestTargetSkill(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50"
            >
              {SEED_SKILLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTestCycle}
            className="w-full sm:w-auto self-end px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Validate Edge
          </button>
        </div>

        {cycleTestResult && (
          <div
            className={`p-3 rounded text-xs flex items-center gap-2 ${
              cycleTestResult.hasCycle
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {cycleTestResult.hasCycle ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="font-semibold">
                {cycleTestResult.hasCycle ? 'CYCLE DETECTED & BLOCKED: ' : 'VALID DIRECTED EDGE: '}
              </span>
              <span>{cycleTestResult.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
