import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  ExternalLink,
  CheckCircle2,
  Circle,
  Play,
  SkipForward,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Roadmap, RoadmapItem } from '../types/canonical';
import { storage } from '../services/storageService';
import { NavTab } from './Navbar';

interface RoadmapViewProps {
  roadmap: Roadmap;
  onNavigate: (tab: NavTab) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const currentUser = storage.getCurrentUser();

  const handleUpdateStatus = (
    itemId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  ) => {
    storage.updateRoadmapItemStatus(itemId, status);
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      storage.regenerateRoadmap();
      setIsRegenerating(false);
    }, 250);
  };

  const handleWeeklyHoursChange = (hours: number) => {
    storage.updateProfile({ weekly_study_hours: hours });
    storage.regenerateRoadmap();
  };

  const filteredItems = roadmap.items.filter((item) => {
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'in_progress') return item.status === 'in_progress';
    if (filter === 'completed') return item.status === 'completed';
    return true;
  });

  const completedCount = roadmap.items.filter((i) => i.status === 'completed').length;
  const inProgressCount = roadmap.items.filter((i) => i.status === 'in_progress').length;
  const remainingHours = roadmap.items
    .filter((i) => i.status !== 'completed' && i.status !== 'skipped')
    .reduce((sum, item) => sum + item.estimated_hours, 0);

  const remainingWeeks = Math.ceil(remainingHours / Math.max(1, currentUser.weekly_study_hours));

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Sequenced Learning Path</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-800">Topological Prerequisite Order</span>
              <span aria-hidden="true">·</span>
              <span>Paced for {currentUser.weekly_study_hours} hrs/week</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Personalized Career Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Sequenced deterministically so foundational prerequisites (e.g. SQL Fundamentals & Aggregations) are scheduled before dependent milestones (Multi-Table Joins & Window Functions).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate Roadmap</span>
            </button>
          </div>
        </div>

        {/* Stale State Notice */}
        {roadmap.is_stale && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Your profile skills, evidence, or assessment results changed since this roadmap was generated.
              </span>
            </div>
            <button
              onClick={handleRegenerate}
              className="font-semibold text-amber-900 hover:underline shrink-0 ml-2"
            >
              Refresh Now
            </button>
          </div>
        )}

        {/* Weekly Study Budget Adjuster */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Available Study Time:</span>
            {[5, 10, 15, 20].map((hours) => (
              <button
                key={hours}
                onClick={() => handleWeeklyHoursChange(hours)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  currentUser.weekly_study_hours === hours
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {hours} hrs/wk
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Remaining Effort: <strong className="text-slate-900">{remainingHours} hrs</strong> (~{remainingWeeks} weeks)
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          All Tasks ({roadmap.items.length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === 'in_progress'
              ? 'bg-indigo-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === 'pending'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending ({roadmap.items.filter((i) => i.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            filter === 'completed'
              ? 'bg-emerald-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Sequenced Milestones List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 bg-white border rounded-lg transition-all ${
              item.status === 'completed'
                ? 'border-slate-200 bg-slate-50/50 opacity-75'
                : item.status === 'in_progress'
                ? 'border-indigo-300 ring-1 ring-indigo-200'
                : 'border-slate-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Left Details */}
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-mono text-[11px] font-bold text-slate-700">
                    {item.order_index}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{item.skill_name}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500">{item.category}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.reason}</p>

                {/* Resource Attachment */}
                {item.resource && (
                  <div className="pt-2 flex items-center gap-2 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="text-slate-600 font-medium">Curated Resource:</span>
                    <a
                      href={item.resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center gap-1"
                    >
                      <span>{item.resource.title} ({item.resource.provider})</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Right Metas & Status Toggles */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Est. Effort</div>
                  <div className="text-sm font-mono font-bold text-slate-800">
                    {item.estimated_hours} hrs
                  </div>
                </div>

                {/* State selector */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'pending')}
                    title="Mark Pending"
                    className={`p-1.5 rounded text-xs transition-colors ${
                      item.status === 'pending'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pending
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                    title="Mark In Progress"
                    className={`p-1.5 rounded text-xs transition-colors ${
                      item.status === 'in_progress'
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(item.id, 'completed')}
                    title="Mark Completed"
                    className={`p-1.5 rounded text-xs transition-colors ${
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Completed
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(item.id, 'skipped')}
                    title="Skip Milestone"
                    className={`p-1.5 rounded text-xs transition-colors ${
                      item.status === 'skipped'
                        ? 'bg-slate-300 text-slate-700 font-bold'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
