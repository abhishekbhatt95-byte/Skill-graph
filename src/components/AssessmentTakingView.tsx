import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Award,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  AssessmentVersion,
  AssessmentQuestion,
  AssessmentAttempt,
  AssessmentResponse,
} from '../types/canonical';
import { SEED_ASSESSMENT_VERSIONS } from '../data/seedData';
import {
  getSanitizedQuestionsForTaking,
  gradeAssessmentAttempt,
  AssessmentGradingResult,
} from '../services/assessmentEngine';
import { storage } from '../services/storageService';
import { NavTab } from './Navbar';

interface AssessmentTakingViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const AssessmentTakingView: React.FC<AssessmentTakingViewProps> = ({ onNavigate }) => {
  const [selectedVersion, setSelectedVersion] = useState<AssessmentVersion | null>(null);
  const [sanitizedQuestions, setSanitizedQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingResult, setGradingResult] = useState<AssessmentGradingResult | null>(null);

  const currentUser = storage.getCurrentUser();
  const myAttempts = storage.getMyAttempts();

  const handleStartAssessment = (version: AssessmentVersion) => {
    const questions = getSanitizedQuestionsForTaking(version.id);
    setSelectedVersion(version);
    setSanitizedQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setGradingResult(null);
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmitAssessment = () => {
    if (!selectedVersion) return;
    setIsSubmitting(true);

    const answersList = sanitizedQuestions.map((q) => ({
      question_id: q.id,
      selected_index: selectedAnswers[q.id] ?? -1,
    }));

    try {
      // Deterministic server-side grading
      const result = gradeAssessmentAttempt(
        currentUser.user_id,
        selectedVersion.id,
        answersList
      );

      // Record attempt and verified proficiency into storage
      storage.recordAssessmentAttempt(
        result.attempt,
        result.responses,
        result.awarded_proficiency,
        selectedVersion.skill_id
      );

      setGradingResult(result);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetOrExit = () => {
    setSelectedVersion(null);
    setSanitizedQuestions([]);
    setGradingResult(null);
    setSelectedAnswers({});
  };

  // 1. In-Progress Test Taking Screen
  if (selectedVersion && !gradingResult) {
    const currentQ = sanitizedQuestions[currentQuestionIndex];
    const isAnswered = currentQ ? selectedAnswers[currentQ.id] !== undefined : false;
    const isLastQuestion = currentQuestionIndex === sanitizedQuestions.length - 1;
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">
                {selectedVersion.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Target Proficiency Award: Level {selectedVersion.target_proficiency_award} · Passing Threshold: {selectedVersion.passing_threshold_percent}%
              </div>
            </div>

            <button
              onClick={handleResetOrExit}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Exit Check
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>
              Question <strong className="text-slate-900">{currentQuestionIndex + 1}</strong> of{' '}
              {sanitizedQuestions.length}
            </span>
            <span className="font-mono tabular-nums">{answeredCount} answered</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-slate-900 h-1.5 transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / sanitizedQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Current Question Body */}
          {currentQ && (
            <div className="mt-6 space-y-6">
              <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-md border border-slate-200">
                {currentQ.prompt}
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`w-full text-left p-3.5 rounded-lg border text-xs transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white font-medium'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 border ${
                          isSelected
                            ? 'border-white text-white'
                            : 'border-slate-300 text-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{optionText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Bar */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className={`px-3 py-1.5 text-xs font-medium rounded ${
                    currentQuestionIndex === 0
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Previous
                </button>

                {isLastQuestion ? (
                  <button
                    type="button"
                    disabled={answeredCount < sanitizedQuestions.length || isSubmitting}
                    onClick={handleSubmitAssessment}
                    className={`px-5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                      answeredCount === sanitizedQuestions.length
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>{isSubmitting ? 'Grading...' : 'Submit Assessment for Grading'}</span>
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Graded Results Screen (Detailed feedback and explanations revealed)
  if (selectedVersion && gradingResult) {
    const { attempt, responses } = gradingResult;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-500 font-medium">Assessment Results</div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {selectedVersion.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetOrExit}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                Back to Catalog
              </button>
              <button
                onClick={() => onNavigate('gap-analysis')}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
              >
                View Updated Gap Analysis
              </button>
            </div>
          </div>

          {/* Outcome Banner */}
          <div
            className={`p-6 rounded-lg border ${
              attempt.passed
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-white shrink-0">
                {attempt.passed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold">
                  {attempt.passed
                    ? `Assessment Passed (${attempt.percentage}%) — Verified Proficiency Awarded!`
                    : `Completed (${attempt.percentage}%) — Threshold: ${selectedVersion.passing_threshold_percent}%`}
                </div>
                <p className="text-xs leading-relaxed opacity-90">{gradingResult.message}</p>
                {attempt.passed && (
                  <div className="text-xs font-bold pt-2 flex items-center gap-1.5 text-emerald-800">
                    <Award className="w-4 h-4" />
                    <span>Your profile now holds objective verification for Level {selectedVersion.target_proficiency_award}.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Question Breakdown with Explanations */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900">
              Detailed Question-by-Question Grading & Explanations
            </h2>

            <div className="space-y-4">
              {responses.map((resp, idx) => {
                const questionObj = sanitizedQuestions.find((q) => q.id === resp.question_id);
                return (
                  <div
                    key={resp.id}
                    className={`p-4 rounded-lg border text-xs space-y-2 ${
                      resp.is_correct
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : 'bg-red-50/30 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900">
                        Question {idx + 1}: {resp.is_correct ? 'Correct (+10 pts)' : 'Incorrect (0 pts)'}
                      </span>
                      {resp.is_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <p className="text-slate-700 whitespace-pre-line font-medium">
                      {questionObj?.prompt}
                    </p>

                    <div className="text-slate-600 text-[11px] pt-1">
                      Your answer:{' '}
                      <strong className="text-slate-900">
                        {resp.selected_index >= 0 && questionObj
                          ? questionObj.options[resp.selected_index]
                          : 'None'}
                      </strong>
                    </div>

                    {/* Server Rationale Explanation */}
                    <div className="mt-2 p-3 bg-white border border-slate-200 rounded text-slate-700 space-y-1">
                      <div className="font-bold text-[11px] text-slate-900">Grading Explanation:</div>
                      <p className="text-[11px] leading-relaxed">{resp.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Assessment Catalog View
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Objective Skill Assessments
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Low-stakes single-choice evaluations mapped to core Data Analyst requirements. Answer keys are strictly protected on the server. Passing an assessment upgrades your self-reported baseline to objective verified status with full audit provenance.
        </p>
      </div>

      {/* Catalog Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SEED_ASSESSMENT_VERSIONS.map((v) => {
          const previousAttempts = myAttempts.filter((a) => a.version_id === v.id);
          const highestScore = previousAttempts.length > 0
            ? Math.max(...previousAttempts.map((a) => a.percentage))
            : null;
          const isPassed = previousAttempts.some((a) => a.passed);

          return (
            <div
              key={v.id}
              className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Version {v.version_tag}
                  </span>
                  {isPassed ? (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Not Verified</span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 leading-snug">{v.title}</h2>
                <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Award on Pass:</span>
                    <strong className="text-slate-800">Level {v.target_proficiency_award}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Passing Threshold:</span>
                    <strong className="text-slate-800">{v.passing_threshold_percent}%</strong>
                  </div>
                  {highestScore !== null && (
                    <div className="flex justify-between pt-1">
                      <span>Best Previous Score:</span>
                      <strong className="font-mono text-slate-900">{highestScore}%</strong>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleStartAssessment(v)}
                className="w-full py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{isPassed ? 'Retake Check' : 'Start Assessment'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Historical Attempts Table */}
      {myAttempts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Your Assessment Attempt History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-3">Assessment</th>
                  <th className="py-2.5 px-3">Date Completed</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Percentage</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {myAttempts.map((att) => {
                  const version = SEED_ASSESSMENT_VERSIONS.find((v) => v.id === att.version_id);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                        {version?.title || att.version_id}
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-sans">
                        {new Date(att.completed_at || att.started_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-800">
                        {att.score} / {att.max_score}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {att.percentage}%
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {att.passed ? (
                          <span className="text-emerald-700 font-semibold">Passed (Verified)</span>
                        ) : (
                          <span className="text-slate-500">Completed (Did not pass)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
