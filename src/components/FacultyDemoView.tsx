import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Calculator,
  Database,
  Lock,
} from 'lucide-react';
import { NavTab } from './Navbar';

interface FacultyDemoViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const FacultyDemoView: React.FC<FacultyDemoViewProps> = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState(1);

  const demoSteps = [
    {
      step: 1,
      title: '1. Problem Statement: Academia-to-Industry Skill Gap (1 min)',
      summary: 'University students learn statistical theory and introductory coding, but lack clarity on industry requirements for Data Analyst roles.',
      keyPoints: [
        'Generic chatbots produce hallucinated, non-reproducible advice and arbitrary placement scores.',
        'SkillGraph AI provides deterministic, explainable intelligence grounded in versioned benchmark profiles.',
        'Core differentiator: Evidence-aware provenance—resume citations, project artifacts, and objective test scores.',
      ],
      targetTab: 'overview' as NavTab,
      ctaText: 'View Career Benchmark Overview',
    },
    {
      step: 2,
      title: '2. Resume Extraction & Human-in-the-Loop Review (2 mins)',
      summary: 'Untrusted document ingestion with mandatory human confirmation before profile commitment.',
      keyPoints: [
        'Accepts PDF, DOCX, and text; parses without executing untrusted document macros.',
        'Matches candidate skills to the canonical catalog with exact sentence citations.',
        'Review staging area: students can accept, edit proficiency, or reject claims before database write.',
      ],
      targetTab: 'resume' as NavTab,
      ctaText: 'Inspect Resume Ingestion Stage',
    },
    {
      step: 3,
      title: '3. Deterministic Gap Mathematics & Null Handling (2 mins)',
      summary: 'Mathematical rigor replacing black-box LLM scoring.',
      keyPoints: [
        'Gap formula: Gap_k = max(0, Target_k - Current_k).',
        'Priority formula: Priority_k = Importance_Weight × Gap_k.',
        'CRITICAL: When proficiency is unknown, Gap is stored as NULL—NEVER penalized as zero.',
      ],
      targetTab: 'gap-analysis' as NavTab,
      ctaText: 'Inspect Deterministic Gap Matrix',
    },
    {
      step: 4,
      title: '4. Relational Skill Graph & Prerequisite DAG (2 mins)',
      summary: 'Directed Acyclic Graph with DFS cycle detection and topological sorting.',
      keyPoints: [
        'Backed by relational prerequisite schema (SQL Basics -> SQL Aggregations -> Multi-Table Joins -> Window Functions).',
        'DFS cycle detector prevents circular dependencies before database persistence.',
        'Includes an accessible matrix alternative view for WCAG AA compliance.',
      ],
      targetTab: 'graph' as NavTab,
      ctaText: 'Open Skill Graph DAG',
    },
    {
      step: 5,
      title: '5. Objective Server-Side Assessments (1 min)',
      summary: 'Low-stakes single-choice checks with answer key secrecy.',
      keyPoints: [
        'Answer keys are concealed on the server and stripped from client question payloads.',
        'Deterministic grading evaluates responses and awards verified proficiency level on pass.',
        'Verified test results take precedence over unverified resume claims.',
      ],
      targetTab: 'assessments' as NavTab,
      ctaText: 'Explore Assessments Catalog',
    },
    {
      step: 6,
      title: '6. Prerequisite-Aware Personalized Roadmap (1 min)',
      summary: 'Sequences tasks using topological sort paced against study budget.',
      keyPoints: [
        'Guarantees foundational skills are scheduled before dependent advanced milestones.',
        'Estimates weeks to completion based on weekly study budget (e.g. 10 hrs/week).',
        'Curated resources from PostgreSQL docs, Khan Academy, and Mode Analytics.',
      ],
      targetTab: 'roadmap' as NavTab,
      ctaText: 'View Sequenced Roadmap',
    },
    {
      step: 7,
      title: '7. Security, Tenant Isolation & GDPR Data Control (1 min)',
      summary: 'Industrial-grade student data ownership, export, and deletion.',
      keyPoints: [
        'Cryptographic JWT validation with RS256 algorithm enforcement.',
        'Strict tenant isolation: User A cannot read or modify User B data.',
        'GDPR-compliant export (GET /api/me/export) and two-stage durable account deletion.',
      ],
      targetTab: 'settings' as NavTab,
      ctaText: 'View Data Export & Deletion',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-xs text-indigo-600 font-semibold tracking-wide uppercase">
          <GraduationCap className="w-4 h-4" />
          <span>Faculty & Committee Review Package</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          7–10 Minute Faculty Evaluation Walkthrough Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Structured evaluation roadmap demonstrating the core technical innovations: deterministic gap algorithms, relational prerequisite DAGs, server-side assessment verification, and strict tenant isolation.
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Step List */}
        <div className="space-y-2">
          {demoSteps.map((s) => {
            const isActive = activeStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStep(s.step)}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{s.title.split(':')[0]}</span>
                  <span className="text-[10px] opacity-75 font-mono">{s.title.match(/\((.*?)\)/)?.[1]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right 2 Cols: Active Step Deep Dive Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-6">
          {(() => {
            const current = demoSteps.find((s) => s.step === activeStep)!;
            return (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <div className="text-xs text-slate-500 font-medium">Evaluation Milestone {current.step} of 7</div>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">{current.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{current.summary}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Key Architectural & Pedagogical Defenses
                  </h3>
                  <ul className="space-y-2 pt-1 text-xs text-slate-700">
                    {current.keyPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mathematical Formula Callout for Step 3 */}
                {current.step === 3 && (
                  <div className="p-4 bg-slate-900 text-white rounded-lg text-xs space-y-2 font-mono">
                    <div className="text-indigo-300 font-bold font-sans">Worked Numerical Example:</div>
                    <div>1. SQL Joins: Target = 3, Current = 2, Weight = 0.95</div>
                    <div className="text-emerald-400">→ Gap = max(0, 3 - 2) = 1. Priority = 0.95 × 1 = 0.95</div>
                    <div className="pt-1">2. Descriptive Stats: Target = 3, Current = NULL (Not in profile)</div>
                    <div className="text-amber-400">→ Gap = NULL, Priority = NULL, Needs Verification = true (NOT 0)</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom Action Strip */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Live functional application screen:</span>
            <button
              onClick={() => onNavigate(demoSteps.find((s) => s.step === activeStep)!.targetTab)}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <span>{demoSteps.find((s) => s.step === activeStep)!.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Architecture System Diagram */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">End-to-End System Architecture Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>1. Untrusted Ingestion</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              PDF/DOCX validation, text extraction, keyword alignment, human-in-the-loop confirmation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>2. Evidence Hierarchy</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Precedence: Assessment (verified) &gt; Resume (derived) &gt; Self-report (estimated).
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span>3. Deterministic Engine</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              Gap = max(0, T - P). Priority = Weight × Gap. Null propagation for unverified skills.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>4. Topological Roadmap</span>
            </div>
            <p className="text-slate-600 text-[11px]">
              DFS cycle detector DAG validator + Kahn's algorithm for sequenced prerequisite roadmap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
