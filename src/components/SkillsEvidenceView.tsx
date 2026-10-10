import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  FolderGit2,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  StudentSkill,
  StudentProject,
  EvidenceItem,
  ProficiencyLevel,
  PROFICIENCY_LABELS,
} from '../types/canonical';
import { SEED_SKILLS } from '../data/seedData';
import { storage } from '../services/storageService';

interface SkillsEvidenceViewProps {
  skills: StudentSkill[];
  projects: StudentProject[];
  evidenceItems: EvidenceItem[];
}

export const SkillsEvidenceView: React.FC<SkillsEvidenceViewProps> = ({
  skills,
  projects,
  evidenceItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [sliderProficiency, setSliderProficiency] = useState<ProficiencyLevel>(2);
  const [skillNotes, setSkillNotes] = useState('');

  // Project Modal State
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [selectedSkillIdsForProject, setSelectedSkillIdsForProject] = useState<string[]>([]);

  // Selected skill evidence drawer
  const [inspectedSkillId, setInspectedSkillId] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(SEED_SKILLS.map((s) => s.category)))];

  const filteredSkills = SEED_SKILLS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const studentSkillMap = new Map<string, StudentSkill>(skills.map((s) => [s.skill_id, s]));

  const handleSaveSkill = (skillId: string) => {
    storage.upsertManualSkill(skillId, sliderProficiency, skillNotes);
    setEditingSkillId(null);
    setSkillNotes('');
  };

  const handleDeleteSkill = (skillId: string) => {
    storage.deleteSkill(skillId);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    storage.addProject(
      newProjectTitle.trim(),
      newProjectDescription.trim(),
      newProjectUrl.trim(),
      selectedSkillIdsForProject
    );

    setIsAddingProject(false);
    setNewProjectTitle('');
    setNewProjectDescription('');
    setNewProjectUrl('');
    setSelectedSkillIdsForProject([]);
  };

  const toggleSkillForProject = (skillId: string) => {
    if (selectedSkillIdsForProject.includes(skillId)) {
      setSelectedSkillIdsForProject(selectedSkillIdsForProject.filter((id) => id !== skillId));
    } else {
      setSelectedSkillIdsForProject([...selectedSkillIdsForProject, skillId]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Explanation */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Skills & Supporting Evidence
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Manage your student skill profile with transparent provenance. A resume mention or self-report is supporting evidence—not automatic proof of mastery. Objective assessments award verified proficiency.
        </p>

        {/* Search & Category Filter Controls */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search canonical skills (SQL, Statistics, EDA, Tableau...)"
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Skills Catalog / Projects & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Canonical Skills List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Canonical Skill Catalog ({filteredSkills.length})
            </h2>
            <span className="text-xs text-slate-500">
              {skills.length} skills recorded in your profile
            </span>
          </div>

          <div className="divide-y divide-slate-200 bg-white border border-slate-200 rounded-lg overflow-hidden">
            {filteredSkills.map((canonical) => {
              const studentRecord = studentSkillMap.get(canonical.id);
              const isEditing = editingSkillId === canonical.id;
              const evidence = storage.getEvidenceForSkill(canonical.id);

              return (
                <div key={canonical.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{canonical.name}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{canonical.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{canonical.description}</p>

                      {studentRecord?.notes && (
                        <p className="text-xs text-slate-500 italic mt-1">"{studentRecord.notes}"</p>
                      )}

                      {/* Evidence Provenance Indicator */}
                      <div className="flex items-center gap-2 pt-2 text-xs">
                        {studentRecord ? (
                          <div className="flex items-center gap-1.5">
                            {studentRecord.effective_source === 'assessment_verified' ? (
                              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified by Assessment</span>
                              </span>
                            ) : studentRecord.effective_source === 'resume_extracted' ? (
                              <span className="flex items-center gap-1 text-indigo-700 font-medium">
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Resume Extracted</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-600 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Self-Reported</span>
                              </span>
                            )}
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              Level {studentRecord.effective_proficiency} ({PROFICIENCY_LABELS[studentRecord.effective_proficiency as ProficiencyLevel]})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Not added to profile yet</span>
                        )}

                        {evidence.length > 0 && (
                          <>
                            <span className="text-slate-400">·</span>
                            <button
                              onClick={() => setInspectedSkillId(canonical.id)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium underline"
                            >
                              {evidence.length} Evidence {evidence.length === 1 ? 'Item' : 'Items'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveSkill(canonical.id)}
                            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSkillId(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingSkillId(canonical.id);
                              setSliderProficiency(studentRecord?.proficiency || 2);
                              setSkillNotes(studentRecord?.notes || '');
                            }}
                            className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            {studentRecord ? 'Edit Level' : '+ Add Skill'}
                          </button>

                          {studentRecord && (
                            <button
                              onClick={() => handleDeleteSkill(canonical.id)}
                              aria-label={`Remove ${canonical.name} from profile`}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline Edit Slider Container */}
                  {isEditing && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span className="text-slate-700">Self-Reported Proficiency</span>
                          <span className="font-mono text-slate-900 font-bold">
                            Level {sliderProficiency}: {PROFICIENCY_LABELS[sliderProficiency]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="4"
                          step="1"
                          value={sliderProficiency}
                          onChange={(e) => setSliderProficiency(Number(e.target.value) as ProficiencyLevel)}
                          className="w-full accent-slate-900 cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                          <span>1: Beginner</span>
                          <span>2: Basic</span>
                          <span>3: Intermediate</span>
                          <span>4: Advanced</span>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={skillNotes}
                          onChange={(e) => setSkillNotes(e.target.value)}
                          placeholder="Optional context (e.g. Coursework ECON 412, Kaggle project, personal study)"
                          className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Projects & Evidence Management */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Student Projects</h2>
                <p className="text-xs text-slate-500">Attach artifacts supporting your skills</p>
              </div>
              <button
                onClick={() => setIsAddingProject(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded border border-dashed border-slate-200">
                <FolderGit2 className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">No projects attached yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add a GitHub repo or capstone assignment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{proj.title}</span>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{proj.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.associated_skill_ids.map((sid) => {
                        const skillName = SEED_SKILLS.find((s) => s.id === sid)?.name || sid;
                        return (
                          <span
                            key={sid}
                            className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-medium"
                          >
                            {skillName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Provenance Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>Evidence Weight Hierarchy</span>
            </div>
            <ul className="space-y-1.5 pt-1 text-[11px] text-slate-600">
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-emerald-800 shrink-0">1. Objective Assessment:</span>
                <span>Directly scores practical questions; overrides unverified self-claims.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-indigo-800 shrink-0">2. Resume Extraction:</span>
                <span>Requires human confirmation with cited textual snippet from your document.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-800 shrink-0">3. Self-Reported:</span>
                <span>Initial estimated baseline; flagged as needing verification for critical skills.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Student Project & Evidence</h3>
              <button
                onClick={() => setIsAddingProject(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g. Retail Sales Performance Dashboard"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description & Method</label>
                <textarea
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Describe your queries, models, or visualizations built..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Project or GitHub URL (Optional)</label>
                <input
                  type="url"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Associated Canonical Skills</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded p-2 space-y-1">
                  {SEED_SKILLS.map((s) => {
                    const isSelected = selectedSkillIdsForProject.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSkillForProject(s.id)}
                        className={`w-full text-left px-2 py-1 text-xs rounded flex items-center justify-between ${
                          isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Save Project & Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspected Skill Evidence Modal */}
      {inspectedSkillId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Supporting Evidence for: {SEED_SKILLS.find((s) => s.id === inspectedSkillId)?.name}
                </h3>
                <p className="text-xs text-slate-500">Provenance and linked proof artifacts</p>
              </div>
              <button
                onClick={() => setInspectedSkillId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {storage.getEvidenceForSkill(inspectedSkillId).map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{ev.title}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{ev.type}</span>
                  </div>
                  <p className="text-slate-600">{ev.description}</p>
                  {ev.url && (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 text-[11px] pt-1"
                    >
                      <span>View Artifact</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedSkillId(null)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-800 rounded hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
