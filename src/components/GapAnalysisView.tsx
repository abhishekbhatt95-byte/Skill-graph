import React, { useState } from 'react';
import {
  GitBranch,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldCheck,
  FileText,
  User,
  ExternalLink,
} from 'lucide-react';
import { SkillAnalysis, PROFICIENCY_LABELS } from '../types/canonical';
import { storage } from '../services/storageService';
import { NavTab } from './Navbar';

interface GapAnalysisViewProps {
  analysis: SkillAnalysis;
  onNavigate: (tab: NavTab) => void;
}

export const GapAnalysisView: React.FC<GapAnalysisViewProps> = ({ analysis, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'gaps' | 'unverified' | 'satisfied'>('all');
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      // triggers storage subscription update
      storage.getMySkills();
      setIsRecalculating(false);
    }, 200);
  };

  const results = analysis.results;

  const filteredResults = results.filter((r) => {
    if (filter === 'gaps') return r.gap !== null && r.gap > 0;
    if (filter === 'unverified') return r.needs_verification;
    if (filter === 'satisfied') return r.gap === 0;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header & Formula Explanation */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Role Benchmark</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800">Junior Data Analyst (v1.0)</span>
              <span aria-hidden="true">·</span>
              <span>Scoring Engine: 1.0-deterministic</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Deterministic Skill Gap Analysis
            </h1>
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Engine</span>
          </button>
        </div>

        {/* Scoring Principles Callout */}
        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="font-bold text-slate-900">Deterministic Gap</div>
            <code className="text-slate-700 font-mono text-[11px] block mt-1">
              Gap_k = max(0, Target_k - Current_k)
            </code>
            <p className="text-slate-500 mt-1 text-[11px]">
              Calculates exact level difference between required baseline and verified evidence.
            </p>
          </div>

          <div>
            <div className="font-bold text-slate-900">Weighted Priority</div>
            <code className="text-slate-700 font-mono text-[11px] block mt-1">
              Priority_k = Weight_k × Gap_k
            </code>
            <p className="text-slate-500 mt-1 text-[11px]">
              Multiplies gap by the industry importance weight (0.0 to 1.0) to rank focus areas.
            </p>
          </div>

          <div>
            <div className="font-bold text-slate-900">Unknown ≠ Zero</div>
            <code className="text-slate-700 font-mono text-[11px] block mt-1">
              If unknown → Gap = NULL, Needs Verification
            </code>
            <p className="text-slate-500 mt-1 text-[11px]">
              Missing skills are held in a diagnostic state and never penalized as zero proficiency.
            </p>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Competencies ({results.length})
          </button>
          <button
            onClick={() => setFilter('gaps')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'gaps'
                ? 'bg-amber-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Priority Gaps ({results.filter((r) => r.gap !== null && r.gap > 0).length})
          </button>
          <button
            onClick={() => setFilter('unverified')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'unverified'
                ? 'bg-indigo-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Needs Verification ({results.filter((r) => r.needs_verification).length})
          </button>
          <button
            onClick={() => setFilter('satisfied')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'satisfied'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Target Satisfied ({results.filter((r) => r.gap === 0).length})
          </button>
        </div>
      </div>

      {/* Gap Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-3 px-4">Role Competency</th>
                <th className="py-3 px-3 text-center">Target Level</th>
                <th className="py-3 px-3 text-center">Your Level</th>
                <th className="py-3 px-3 text-center">Numeric Gap</th>
                <th className="py-3 px-3 text-center">Importance</th>
                <th className="py-3 px-3 text-center">Priority</th>
                <th className="py-3 px-4">Evidence Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredResults.map((item) => (
                <tr key={item.skill_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 min-w-[180px]">
                    <div>{item.skill_name}</div>
                    <div className="text-[10px] text-slate-400 font-normal font-sans">
                      {item.category}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums font-semibold text-slate-800">
                    L{item.target_proficiency}
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums">
                    {item.current_proficiency !== null ? (
                      <span className="font-semibold text-slate-900">L{item.current_proficiency}</span>
                    ) : (
                      <span className="text-indigo-600 font-sans text-[11px] font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                        Unverified
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums">
                    {item.gap !== null ? (
                      item.gap === 0 ? (
                        <span className="text-emerald-700 font-semibold">0</span>
                      ) : (
                        <span className="text-amber-700 font-bold">+{item.gap}</span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs font-sans">NULL</span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums text-slate-600">
                    {(item.importance_weight * 100).toFixed(0)}%
                  </td>

                  <td className="py-3.5 px-3 text-center tabular-nums font-bold">
                    {item.priority !== null ? (
                      item.priority > 0 ? (
                        <span className="text-amber-700">{item.priority.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700 font-normal">0.00</span>
                      )
                    ) : (
                      <span className="text-slate-400 text-xs font-sans">NULL</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-sans text-xs text-slate-600 max-w-md leading-relaxed">
                    <div className="flex items-start gap-1.5">
                      {item.effective_source === 'assessment_verified' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : item.effective_source === 'resume_extracted' ? (
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      ) : item.needs_verification ? (
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span>{item.rationale}</span>
                    </div>

                    {item.needs_verification && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => onNavigate('assessments')}
                          className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold underline flex items-center gap-1"
                        >
                          <span>Take diagnostic check to establish baseline</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
