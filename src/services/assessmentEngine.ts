import {
  AssessmentVersion,
  AssessmentQuestion,
  AssessmentAttempt,
  AssessmentResponse,
  ProficiencyLevel,
} from '../types/canonical';
import {
  SEED_ASSESSMENT_VERSIONS,
  SEED_ASSESSMENT_QUESTIONS_SECURE,
} from '../data/seedData';

export interface UserSubmittedAnswer {
  question_id: string;
  selected_index: number;
}

export interface AssessmentGradingResult {
  attempt: AssessmentAttempt;
  responses: AssessmentResponse[];
  awarded_proficiency: ProficiencyLevel | null;
  message: string;
}

/**
 * Returns sanitized questions for taking the test
 * Strict Security: correct_option_index is stripped out so the browser NEVER receives it!
 */
export function getSanitizedQuestionsForTaking(versionId: string): AssessmentQuestion[] {
  const secureQuestions = SEED_ASSESSMENT_QUESTIONS_SECURE[versionId] || [];
  return secureQuestions.map((q) => ({
    id: q.id,
    version_id: q.version_id,
    prompt: q.prompt,
    options: q.options,
    points: q.points,
    explanation: '', // concealed until test submission
  }));
}

/**
 * Server-Side Objective Grading Engine
 * Evaluates responses against secure answer key in one atomic operation
 */
export function gradeAssessmentAttempt(
  userId: string,
  versionId: string,
  submittedAnswers: UserSubmittedAnswer[]
): AssessmentGradingResult {
  const version = SEED_ASSESSMENT_VERSIONS.find((v) => v.id === versionId);
  if (!version) {
    throw new Error(`Assessment version ${versionId} not found.`);
  }

  const secureQuestions = SEED_ASSESSMENT_QUESTIONS_SECURE[versionId] || [];
  const questionMap = new Map(secureQuestions.map((q) => [q.id, q]));

  let totalScore = 0;
  let maxPossibleScore = 0;
  const responses: AssessmentResponse[] = [];
  const attemptId = crypto.randomUUID();

  for (const q of secureQuestions) {
    maxPossibleScore += q.points;
  }

  for (const sub of submittedAnswers) {
    const q = questionMap.get(sub.question_id);
    if (!q) continue;

    const isCorrect = sub.selected_index === q.correct_option_index;
    const pointsAwarded = isCorrect ? q.points : 0;
    totalScore += pointsAwarded;

    responses.push({
      id: crypto.randomUUID(),
      attempt_id: attemptId,
      question_id: q.id,
      selected_index: sub.selected_index,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      explanation: q.explanation,
    });
  }

  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const passed = percentage >= version.passing_threshold_percent;

  const attempt: AssessmentAttempt = {
    id: attemptId,
    user_id: userId,
    version_id: versionId,
    score: totalScore,
    max_score: maxPossibleScore,
    percentage,
    passed,
    status: 'completed',
    started_at: new Date(Date.now() - 300000).toISOString(),
    completed_at: new Date().toISOString(),
  };

  const awarded_proficiency = passed ? version.target_proficiency_award : null;
  const message = passed
    ? `Passed! Scored ${percentage}% (threshold: ${version.passing_threshold_percent}%). Awarded verified proficiency: Level ${awarded_proficiency}.`
    : `Completed. Scored ${percentage}% (passing threshold: ${version.passing_threshold_percent}%). Self-reported or baseline proficiency preserved.`;

  return {
    attempt,
    responses,
    awarded_proficiency,
    message,
  };
}
