import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Terminal,
  Cpu,
  Lock,
  GitBranch,
} from 'lucide-react';
import { runFullQualityGateSuite, TestCaseResult } from '../services/testingSuite';

export const QualityGatesView: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const executeSuite = async () => {
    setIsRunning(true);
    try {
      const results = await runFullQualityGateSuite();
      setTestResults(results);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    executeSuite();
  }, []);

  const passedCount = testResults.filter((t) => t.status === 'passed').length;
  const failedCount = testResults.filter((t) => t.status === 'failed').length;

  const categories = ['all', 'Security & Auth', 'Isolation', 'Gap Engine', 'Graph Integrity', 'Assessments', 'Privacy & Deletion'];

  const filteredTests = testResults.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  return (
    <div className="space-y-8">
      {/* Header and Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Automated Verification Suite</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800">10 Comprehensive Quality Gates</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Quality Gates & Verification Test Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Executes live client and engine assertions covering cryptographic JWT validation, tenant isolation (IDOR mitigation), DAG cycle prevention, answer key secrecy, and deterministic gap mathematics.
            </p>
          </div>

          <button
            onClick={executeSuite}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-2 self-start md:self-auto shrink-0"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running Gates...' : 'Re-run Quality Gates'}</span>
          </button>
        </div>

        {/* Live Scorecard */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-mono tabular-nums">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-sans">Total Gates:</span>
            <strong className="text-slate-900 font-bold">{testResults.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-sans">Passed:</span>
            <strong className="text-emerald-800 font-bold">{passedCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-sans">Failed:</span>
            <strong className="text-red-800 font-bold">{failedCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-sans">Pass Rate:</span>
            <strong className="text-slate-900 font-bold">
              {testResults.length > 0 ? ((passedCount / testResults.length) * 100).toFixed(0) : 0}%
            </strong>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat === 'all' ? 'All Test Suites' : cat}
          </button>
        ))}
      </div>

      {/* Test Cases Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredTests.map((test) => (
            <div key={test.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{test.name}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{test.category}</span>
                  </div>

                  <p className="text-xs text-slate-600 font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                    Assertion: {test.assertion}
                  </p>

                  {test.details && (
                    <p className="text-[11px] text-slate-500 pt-0.5">
                      Output: {test.details}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-start">
                  <span className="text-xs font-mono tabular-nums text-slate-400">
                    {test.durationMs}ms
                  </span>

                  {test.status === 'passed' ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>PASS</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-800 border border-red-200 rounded flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>FAIL</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
