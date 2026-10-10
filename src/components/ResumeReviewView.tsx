import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
  FileCheck2,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ExtractionItem, ProficiencyLevel, PROFICIENCY_LABELS } from '../types/canonical';
import { SAMPLE_RESUMES, SEED_SKILLS } from '../data/seedData';
import { validateResumeFile, extractSkillsFromResumeText } from '../services/resumeExtractor';
import { storage } from '../services/storageService';
import { NavTab } from './Navbar';

interface ResumeReviewViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const ResumeReviewView: React.FC<ResumeReviewViewProps> = ({ onNavigate }) => {
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activeDocumentName, setActiveDocumentName] = useState<string | null>(null);
  const [extractionItems, setExtractionItems] = useState<ExtractionItem[]>([]);
  const [editingItem, setEditingItem] = useState<ExtractionItem | null>(null);
  const [commitSuccessMessage, setCommitSuccessMessage] = useState<string | null>(null);

  // Manual text paste fallback
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);

  const currentUser = storage.getCurrentUser();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setCommitSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateResumeFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid document.');
      return;
    }

    // Read text from file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processDocumentText(file.name, file.size, file.type, content);
    };
    reader.onerror = () => {
      setFileError('Failed to read file content.');
    };

    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      // For PDF/DOCX binary in browser client, read as text representation or simulate parser
      reader.readAsText(file);
    }
  };

  const loadSampleResume = (sampleIndex: number) => {
    setFileError(null);
    setCommitSuccessMessage(null);
    const sample = SAMPLE_RESUMES[sampleIndex];
    processDocumentText(sample.filename, 1024 * 45, 'application/pdf', sample.text);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    setFileError(null);
    setCommitSuccessMessage(null);
    processDocumentText('Pasted_Resume_Text.txt', pasteText.length, 'text/plain', pasteText);
    setPasteText('');
    setShowPasteArea(false);
  };

  const processDocumentText = (
    filename: string,
    fileSize: number,
    mimeType: string,
    text: string
  ) => {
    // 1. Record document
    const doc = storage.addDocument(filename, fileSize, mimeType);
    setActiveDocumentId(doc.id);
    setActiveDocumentName(filename);

    // 2. Extract skills grounded in canonical catalog
    const runId = `run-${doc.id}-${Date.now()}`;
    const items = extractSkillsFromResumeText(text, runId, currentUser.user_id, SEED_SKILLS);

    // Persist extraction run items
    storage.addExtractionItems(items);
    setExtractionItems(items);
  };

  const handleUpdateItemStatus = (itemId: string, status: 'accepted' | 'rejected') => {
    storage.updateExtractionItem(itemId, status);
    setExtractionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, review_status: status } : item))
    );
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    storage.updateExtractionItem(
      editingItem.id,
      'accepted',
      editingItem.proposed_proficiency,
      editingItem.reviewer_notes
    );

    setExtractionItems((prev) =>
      prev.map((item) => (item.id === editingItem.id ? editingItem : item))
    );
    setEditingItem(null);
  };

  const handleCommitConfirmed = () => {
    if (!activeDocumentId) return;

    const acceptedIds = extractionItems
      .filter((i) => i.review_status === 'accepted')
      .map((i) => i.id);

    if (acceptedIds.length === 0) {
      setFileError('Please accept at least one extracted skill before committing to your profile.');
      return;
    }

    storage.commitConfirmedExtractions(activeDocumentId, acceptedIds);
    setCommitSuccessMessage(
      `Successfully committed ${acceptedIds.length} skills with supporting resume evidence to your profile!`
    );
  };

  const acceptedCount = extractionItems.filter((i) => i.review_status === 'accepted').length;
  const pendingCount = extractionItems.filter((i) => i.review_status === 'pending').length;
  const rejectedCount = extractionItems.filter((i) => i.review_status === 'rejected').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Resume Ingestion & Human Review
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Upload an academic or internship resume (PDF, DOCX, TXT) to extract candidate skills. To protect data integrity, extracted claims are held in a review staging area—you must accept, edit, or reject each finding before it becomes part of your career intelligence profile.
        </p>

        {/* Upload Box & Preloaded Samples */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* File Upload Zone */}
          <div className="md:col-span-2 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-6 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-slate-800">
                Click to upload PDF, DOCX, or TXT
              </div>
              <div className="text-[11px] text-slate-500">
                Max file size: 5MB · Client-safe parse · Untrusted input sanitization
              </div>
            </label>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowPasteArea(!showPasteArea)}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                {showPasteArea ? 'Hide text paste' : 'Or paste resume plain text'}
              </button>
            </div>
          </div>

          {/* Sample Resumes Loader for Fast Pilot Evaluation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900">Preloaded Faculty Test Samples</div>
            <p className="text-[11px] text-slate-500">
              Immediately test the review workflow with realistic student resumes:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => loadSampleResume(0)}
                className="w-full text-left p-2.5 bg-white border border-slate-200 rounded text-xs hover:border-slate-400 transition-colors space-y-0.5"
              >
                <div className="font-semibold text-slate-800">Sample 1: Economics Junior</div>
                <div className="text-[11px] text-slate-500">SQL, stats, EDA, Tableau metrics</div>
              </button>

              <button
                onClick={() => loadSampleResume(1)}
                className="w-full text-left p-2.5 bg-white border border-slate-200 rounded text-xs hover:border-slate-400 transition-colors space-y-0.5"
              >
                <div className="font-semibold text-slate-800">Sample 2: CS Sophomore</div>
                <div className="text-[11px] text-slate-500">Python pandas, basic SQL</div>
              </button>
            </div>
          </div>
        </div>

        {/* Text Paste Fallback Area */}
        {showPasteArea && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <label className="block text-xs font-semibold text-slate-800">Paste Resume Text</label>
            <textarea
              rows={5}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste coursework, project bullet points, or skills list..."
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasteArea(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Parse Pasted Text
              </button>
            </div>
          </div>
        )}

        {/* Errors & Success Banners */}
        {fileError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {commitSuccessMessage && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{commitSuccessMessage}</span>
            </div>
            <button
              onClick={() => onNavigate('gap-analysis')}
              className="px-3 py-1 bg-emerald-700 text-white rounded font-medium hover:bg-emerald-800 flex items-center gap-1"
            >
              <span>View Gap Analysis</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Review Staging Section */}
      {extractionItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span>Document: {activeDocumentName}</span>
                <span aria-hidden="true">·</span>
                <span>{extractionItems.length} Candidate Skills Extracted</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                Candidate Skills Awaiting Human Confirmation
              </h2>
            </div>

            {/* Quick Status Pill Bar (unboxed text style) */}
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <span className="text-slate-600">
                Pending: <strong className="text-slate-900">{pendingCount}</strong>
              </span>
              <span className="text-emerald-700">
                Accepted: <strong>{acceptedCount}</strong>
              </span>
              <span className="text-slate-400">
                Rejected: <strong>{rejectedCount}</strong>
              </span>
            </div>
          </div>

          {/* Staging Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 px-3">Candidate Skill</th>
                  <th className="py-2.5 px-3">Evidence Snippet (Exact Citation)</th>
                  <th className="py-2.5 px-3">Proposed Level</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractionItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      item.review_status === 'accepted'
                        ? 'bg-emerald-50/30'
                        : item.review_status === 'rejected'
                        ? 'opacity-50'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 align-top font-semibold text-slate-900 min-w-[160px]">
                      <div>{item.skill_name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Canonical Match: {item.suggested_skill_id || 'Unmatched'}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top text-slate-600 max-w-md">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[11px] text-slate-700">
                        "{item.evidence_snippet}"
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top font-mono tabular-nums font-semibold text-slate-800 whitespace-nowrap">
                      {item.confirmed_proficiency
                        ? `L${item.confirmed_proficiency} (${PROFICIENCY_LABELS[item.confirmed_proficiency]})`
                        : item.proposed_proficiency
                        ? `L${item.proposed_proficiency} (${PROFICIENCY_LABELS[item.proposed_proficiency]})`
                        : 'Unverified'}
                    </td>

                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {item.review_status === 'accepted' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accepted</span>
                        </span>
                      ) : item.review_status === 'rejected' ? (
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-medium">Pending Review</span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => handleUpdateItemStatus(item.id, 'accepted')}
                        title="Accept this skill into profile"
                        className={`p-1.5 rounded transition-colors ${
                          item.review_status === 'accepted'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingItem({ ...item })}
                        title="Edit proposed proficiency"
                        className="p-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleUpdateItemStatus(item.id, 'rejected')}
                        title="Reject this skill suggestion"
                        className={`p-1.5 rounded transition-colors ${
                          item.review_status === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Commitment Action Strip */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {acceptedCount} of {extractionItems.length} skills marked for inclusion with resume provenance.
            </div>

            <button
              onClick={handleCommitConfirmed}
              disabled={acceptedCount === 0}
              className={`px-5 py-2 text-xs font-semibold rounded-md transition-colors flex items-center gap-2 ${
                acceptedCount > 0
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Commit {acceptedCount} Confirmed Skills to Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Staging Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900">
              Edit Proposed Skill: {editingItem.skill_name}
            </h3>

            <form onSubmit={handleSaveEditItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Adjust Proficiency Level
                </label>
                <select
                  value={editingItem.proposed_proficiency || 2}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      proposed_proficiency: Number(e.target.value) as ProficiencyLevel,
                    })
                  }
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                >
                  <option value={1}>Level 1: Beginner</option>
                  <option value={2}>Level 2: Basic</option>
                  <option value={3}>Level 3: Intermediate</option>
                  <option value={4}>Level 4: Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reviewer Notes / Evidence Rationale
                </label>
                <textarea
                  rows={3}
                  value={editingItem.reviewer_notes || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, reviewer_notes: e.target.value })
                  }
                  placeholder="Notes explaining why you accepted or modified this skill..."
                  className="w-full text-xs p-2 border border-slate-200 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Save & Accept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
