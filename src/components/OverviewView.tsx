import React from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  FileText,
  Target,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { UserProfile, SkillAnalysis, Roadmap, PROFICIENCY_LABELS } from '../types/canonical';
import { NavTab } from './Navbar';

interface OverviewViewProps {
  currentUser: UserProfile;
  analysis: SkillAnalysis;
  roadmap: Roadmap;
  onNavigate: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  currentUser,
  analysis,
  roadmap,
  onNavigate,
}) => {
  const results = analysis.results;

  const totalRequirements = results.length;
  const verifiedCount = results.filter((r) => r.effective_source === 'assessment_verified').length;
  const metTargetCount = results.filter((r) => r.gap === 0).length;
  const unverifiedCount = results.filter((r) => r.needs_verification).length;
  const activeGapsCount = results.filter((r) => r.gap !== null && r.gap > 0).length;

  const topGaps = results
    .filter((r) => r.priority !== null && r.priority > 0)
    .slice(0, 3);

  // Compute next recommended action derived strictly from user state
  let nextAction = {
    title: 'Verify SQL Multi-Table Competency',
    description: 'Take the 10-minute SQL assessment to substantiate multi-table join and grouping skills with objective proof.',
    cta: 'Take Assessment',
    tab: 'assessments' as NavTab,
  };

  if (unverifiedCount > 3) {
    nextAction = {
      title: 'Upload or Review Resume Evidence',
      description: 'Upload your academic/project resume to extract evidence snippets and verify your foundational skill baseline.',
      cta: 'Review Resume',
      tab: 'resume' as NavTab,
    };
  } else if (topGaps.length > 0) {
    const firstGap = topGaps[0];
    nextAction = {
      title: `Close Priority Gap: ${firstGap.skill_name}`,
      description: `Target level is ${PROFICIENCY_LABELS[firstGap.target_proficiency]}. Work on the assigned roadmap resource to close this ${firstGap.gap}-level gap.`,
      cta: 'Open Roadmap',
      tab: 'roadmap' as NavTab,
    };
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Role Profile Target */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Career Target</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-900 font-semibold">{currentUser.role_target_name}</span>
              <span aria-hidden="true">·</span>
              <span>Curated Industry Benchmark 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {currentUser.full_name}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              SkillGraph AI tracks your evidence-supported readiness against reproducible Data Analyst benchmarks. Every gap is computed deterministically—no black-box AI scores or fabricated placement metrics.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:min-w-[240px] shrink-0">
            <div className="text-xs text-slate-500 font-medium">Study Pace Budget</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {currentUser.weekly_study_hours}
              </span>
              <span className="text-xs text-slate-600">hrs / week</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Roadmap estimated completion: <span className="font-semibold text-slate-700">{roadmap.estimated_weeks} weeks</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip (Anti-slop, clean tabular typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Target Role Requirements</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalRequirements}
          </div>
          <div className="mt-1 text-xs text-slate-500">Curated core competencies</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Targets Satisfied</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {metTargetCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {((metTargetCount / totalRequirements) * 100).toFixed(0)}% benchmark coverage
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Active Priority Gaps</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {activeGapsCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Requiring skill enhancement</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="text-xs font-medium text-slate-500">Needs Verification</div>
          <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-indigo-700">
            {unverifiedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Not treated as zero; diagnostic check</div>
        </div>
      </div>

      {/* Next Action & Roadmap Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Derived Action */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold tracking-wide uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Recommended Next Action</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{nextAction.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{nextAction.description}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Based on latest deterministic analysis</span>
            <button
              onClick={() => onNavigate(nextAction.tab)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>{nextAction.cta}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Roadmap Pacing Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Clock className="w-4 h-4" />
              <span>Learning Roadmap Progress</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {roadmap.items.filter((i) => i.status === 'completed').length} of {roadmap.items.length} Milestones
            </h3>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all"
                style={{
                  width: `${
                    roadmap.items.length > 0
                      ? (roadmap.items.filter((i) => i.status === 'completed').length / roadmap.items.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            <div className="text-xs text-slate-500 space-y-1 pt-2">
              <div className="flex justify-between">
                <span>Total learning effort:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700">{roadmap.total_estimated_hours} hrs</span>
              </div>
              <div className="flex justify-between">
                <span>Weekly budget:</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700">{currentUser.weekly_study_hours} hrs/week</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('roadmap')}
            className="mt-6 w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors text-center"
          >
            View Complete Roadmap
          </button>
        </div>
      </div>

      {/* Top Priority Gaps Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Prioritized Role Gaps</h2>
            <p className="text-xs text-slate-500">
              Formula: <code className="font-mono text-slate-700">Priority = Importance Weight × max(0, Target - Current)</code>
            </p>
          </div>
          <button
            onClick={() => onNavigate('gap-analysis')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <span>Full Gap Matrix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topGaps.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">No active priority gaps found. All benchmark targets are satisfied or awaiting initial verification.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topGaps.map((gap) => (
              <div key={gap.skill_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{gap.skill_name}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{gap.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl">{gap.rationale}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Target / Current</div>
                    <div className="text-sm font-mono tabular-nums font-semibold text-slate-800">
                      L{gap.target_proficiency} / L{gap.current_proficiency ?? '?'}
                    </div>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-xs text-slate-500">Priority</div>
                    <div className="text-sm font-mono tabular-nums font-bold text-amber-700">
                      {gap.priority?.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('roadmap')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-800 rounded hover:bg-slate-200 transition-colors"
                  >
                    View Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('resume')}
          className="p-5 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-300 transition-all group"
        >
          <FileText className="w-5 h-5 text-slate-700 mb-2 group-hover:text-indigo-600 transition-colors" />
          <h3 className="text-sm font-bold text-slate-900">Upload & Review Resume</h3>
          <p className="text-xs text-slate-500 mt-1">
            Extract skills with snippet citations and human confirmation before committing.
          </p>
        </button>

        <button
          onClick={() => onNavigate('assessments')}
          className="p-5 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-300 transition-all group"
        >
          <ShieldCheck className="w-5 h-5 text-slate-700 mb-2 group-hover:text-indigo-600 transition-colors" />
          <h3 className="text-sm font-bold text-slate-900">Take Skill Assessments</h3>
          <p className="text-xs text-slate-500 mt-1">
            Low-stakes objective quizzes in SQL, Statistics, and Data Interpretation.
          </p>
        </button>

        <button
          onClick={() => onNavigate('graph')}
          className="p-5 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-300 transition-all group"
        >
          <TrendingUp className="w-5 h-5 text-slate-700 mb-2 group-hover:text-indigo-600 transition-colors" />
          <h3 className="text-sm font-bold text-slate-900">Explore Prerequisite Graph</h3>
          <p className="text-xs text-slate-500 mt-1">
            Inspect relational dependencies and foundational chains in our DAG visualizer.
          </p>
        </button>
      </div>
    </div>
  );
};
