import React, { useState } from 'react';
import { 
  Bookmark, 
  History, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ExternalLink, 
  ArrowRight 
} from 'lucide-react';
import { Facility, UserVisitHistory, UserReportHistory } from '../types';
import { clearUserActivityHistory } from '../services/api';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { formatTimeAgo } from '../services/trustEngine';

interface ActivityViewProps {
  savedFacilities: Facility[];
  visitHistory: UserVisitHistory[];
  reportHistory: UserReportHistory[];
  onSelectFacility: (id: string) => void;
  onClearHistory: () => void;
  currentLanguage: Language;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  savedFacilities,
  visitHistory,
  reportHistory,
  onSelectFacility,
  onClearHistory,
  currentLanguage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'visits' | 'reports'>('saved');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  const handleClear = () => {
    clearUserActivityHistory();
    onClearHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title & Privacy Guarantee Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-charcoal">Activity & Saved Places</h2>
          <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
            Stored locally on your device. We do not track or expose your route history.
          </p>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-charcoal-muted hover:text-status-red flex items-center gap-1.5 p-2 rounded-xl border border-surface-border hover:bg-surface-hover transition-colors"
          title="Delete local activity and privacy history"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">{t.clearHistory}</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('saved')}
          className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            activeSubTab === 'saved'
              ? 'border-brand-500 text-brand-700 font-bold'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Places ({savedFacilities.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('visits')}
          className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            activeSubTab === 'visits'
              ? 'border-brand-500 text-brand-700 font-bold'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Visits ({visitHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reports')}
          className={`flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            activeSubTab === 'reports'
              ? 'border-brand-500 text-brand-700 font-bold'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>My Reports ({reportHistory.length})</span>
        </button>
      </div>

      {/* Tab 1: Saved Places */}
      {activeSubTab === 'saved' && (
        <div className="space-y-3">
          {savedFacilities.length === 0 ? (
            <div className="p-8 text-center bg-surface-card rounded-2xl border border-dashed border-surface-border">
              <Bookmark className="w-8 h-8 text-charcoal-muted/50 mx-auto mb-2" />
              <div className="font-bold text-sm text-charcoal">No saved places yet</div>
              <p className="text-xs text-charcoal-muted mt-1">
                Tap the bookmark icon on any facility card to keep it here for quick access.
              </p>
            </div>
          ) : (
            savedFacilities.map(f => (
              <div
                key={f.id}
                onClick={() => onSelectFacility(f.id)}
                className="p-3.5 rounded-2xl bg-surface-card border border-surface-border hover:border-brand-400 cursor-pointer flex items-center justify-between text-xs transition-colors shadow-2xs"
              >
                <div>
                  <div className="font-bold text-sm text-charcoal">{f.name}</div>
                  <div className="text-charcoal-muted mt-0.5">{f.area} • {f.fee}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-600" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Visited Facilities */}
      {activeSubTab === 'visits' && (
        <div className="space-y-3">
          {visitHistory.length === 0 ? (
            <div className="p-8 text-center bg-surface-card rounded-2xl border border-dashed border-surface-border">
              <History className="w-8 h-8 text-charcoal-muted/50 mx-auto mb-2" />
              <div className="font-bold text-sm text-charcoal">No recent visits recorded</div>
              <p className="text-xs text-charcoal-muted mt-1">
                When you navigate and complete an arrival check, your confirmation shows here.
              </p>
            </div>
          ) : (
            visitHistory.map((v, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-surface-card border border-surface-border text-xs flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-sm text-charcoal">{v.facilityName}</div>
                  <div className="text-charcoal-muted mt-0.5">
                    Visited {formatTimeAgo(v.visitedAt)} • Outcome:{' '}
                    <span className="font-semibold text-brand-700 capitalize">{v.outcome}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectFacility(v.facilityId)}
                  className="px-2.5 py-1 rounded-lg bg-surface-bg border border-surface-border text-charcoal font-medium hover:bg-surface-hover"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Reports History */}
      {activeSubTab === 'reports' && (
        <div className="space-y-3">
          {reportHistory.length === 0 ? (
            <div className="p-8 text-center bg-surface-card rounded-2xl border border-dashed border-surface-border">
              <CheckCircle2 className="w-8 h-8 text-charcoal-muted/50 mx-auto mb-2" />
              <div className="font-bold text-sm text-charcoal">No reports submitted</div>
              <p className="text-xs text-charcoal-muted mt-1">
                Help other outdoor workers by confirming open facilities or reporting issues.
              </p>
            </div>
          ) : (
            reportHistory.map(r => (
              <div
                key={r.id}
                className="p-3.5 rounded-2xl bg-surface-card border border-surface-border text-xs flex items-center justify-between shadow-2xs"
              >
                <div>
                  <div className="font-bold text-sm text-charcoal">{r.facilityName}</div>
                  <div className="text-charcoal-muted mt-0.5">
                    {r.summary} • {formatTimeAgo(r.timestamp)}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 text-[11px] font-semibold">
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Privacy Guarantee Box */}
      <div className="p-4 rounded-2xl bg-surface-card border border-surface-border text-xs text-charcoal-muted space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-charcoal">
          <Shield className="w-4 h-4 text-brand-600" />
          <span>Worker Privacy Protection</span>
        </div>
        <p className="leading-relaxed">
          Urban Pitstop is designed with strict worker privacy guarantees. We never share individual route logs, idle times, or resting locations with employers or platform companies.
        </p>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-sm w-full p-5 shadow-xl border border-surface-border space-y-3">
            <h3 className="font-bold text-base text-charcoal">Clear Local Data?</h3>
            <p className="text-xs text-charcoal-muted leading-relaxed">
              This will erase your saved places, visit history, and local report logs from this browser. This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-2 rounded-xl border border-surface-border text-charcoal text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl bg-status-red text-white text-xs font-bold hover:bg-rose-700"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
