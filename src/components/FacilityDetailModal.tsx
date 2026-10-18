import React, { useState } from 'react';
import { 
  X, 
  Navigation, 
  Footprints, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Accessibility, 
  Zap, 
  Droplet, 
  Armchair, 
  Flag, 
  ThumbsUp, 
  Store, 
  Bookmark, 
  Share2, 
  Building2,
  ExternalLink,
  ClipboardCheck
} from 'lucide-react';
import { Facility, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';
import { formatTimeAgo } from '../services/trustEngine';

interface FacilityDetailModalProps {
  facility: Facility | null;
  onClose: () => void;
  onGetDirections: (facility: Facility) => void;
  onConfirmUsable: (facilityId: string) => void;
  onReportProblem: (facility: Facility) => void;
  isSaved?: boolean;
  onToggleSave?: (facilityId: string) => void;
  onOpenFieldInspection?: (facility: Facility) => void;
  currentUser?: UserProfile;
  currentLanguage: Language;
}

export const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  facility,
  onClose,
  onGetDirections,
  onConfirmUsable,
  onReportProblem,
  isSaved,
  onToggleSave,
  onOpenFieldInspection,
  currentUser,
  currentLanguage,
}) => {
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  if (!facility) return null;

  const handleQuickConfirm = () => {
    onConfirmUsable(facility.id);
    setConfirmedSuccess(true);
    setTimeout(() => setConfirmedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-card sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
              {facility.category}
            </span>
            {facility.operatorClaimed && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                <Store className="w-3 h-3" />
                Verified Partner
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(facility.id)}
                className={`p-2 rounded-xl border transition-colors ${
                  isSaved
                    ? 'bg-brand-50 border-brand-300 text-brand-600'
                    : 'text-charcoal-muted hover:text-charcoal border-surface-border'
                }`}
                title={isSaved ? 'Saved' : 'Save'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-charcoal-muted hover:text-charcoal hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title & Location */}
          <div>
            <h3 className="text-xl font-bold text-charcoal leading-snug">
              {facility.name}
            </h3>
            <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
              {facility.address}
            </p>
          </div>

          {/* Availability Status Banner */}
          <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-charcoal">
                {facility.lastStatusNote || 'Status Verified'}
              </div>
              <div className="text-[11px] text-charcoal-muted mt-0.5">
                Reliability Confidence: {facility.confidenceScore}% • Last confirmed {formatTimeAgo(facility.lastConfirmedAt)} by {facility.lastConfirmedBy}
              </div>
            </div>
          </div>

          {/* Quick Stats: Distance, Walking Time, Fee, Hours */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-bg border border-surface-border">
              <div className="text-[11px] text-charcoal-muted flex items-center gap-1 font-medium">
                <Footprints className="w-3.5 h-3.5 text-brand-600" />
                Distance & Time
              </div>
              <div className="font-bold text-sm text-charcoal mt-1">
                {facility.distanceMeters ? `${facility.distanceMeters} m` : 'Nearby'}
                <span className="font-normal text-xs text-charcoal-muted ml-1">
                  (~{facility.walkingMinutes} min walk)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-bg border border-surface-border">
              <div className="text-[11px] text-charcoal-muted flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Operating Hours
              </div>
              <div className="font-bold text-sm text-charcoal mt-1 truncate">
                {facility.operatingHours.is24x7 ? '24 Hours Open' : `${facility.operatingHours.openTime} – ${facility.operatingHours.closeTime}`}
              </div>
            </div>
          </div>

          {/* Access Policy & Limitations Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Access Policy: {facility.accessCondition.toUpperCase()}</span>
            </div>
            <p className="text-xs text-amber-950 mt-1 leading-relaxed">
              {facility.accessNotes || 'Open for public access. Always follow local ground staff instructions.'}
            </p>
            <div className="mt-2 text-[11px] font-semibold text-amber-800">
              Fee: {facility.fee}
            </div>
          </div>

          {/* Amenities & Accessibility Grid */}
          <div>
            <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider mb-2.5">
              Facility Features
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {facility.accessibility.drinkingWaterType && (
                <div className="p-2.5 rounded-xl bg-surface-bg border border-surface-border flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="truncate">{facility.accessibility.drinkingWaterType}</span>
                </div>
              )}

              {facility.accessibility.wheelchairAccessible && (
                <div className="p-2.5 rounded-xl bg-surface-bg border border-surface-border flex items-center gap-2">
                  <Accessibility className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Wheelchair Accessible</span>
                </div>
              )}

              {facility.accessibility.hasCharging && (
                <div className="p-2.5 rounded-xl bg-surface-bg border border-surface-border flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>{facility.accessibility.powerSocketType || 'Power Sockets Available'}</span>
                </div>
              )}

              {facility.accessibility.hasSeating && (
                <div className="p-2.5 rounded-xl bg-surface-bg border border-surface-border flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Seating / Rest Benches</span>
                </div>
              )}
            </div>
          </div>

          {/* Evidence Timeline */}
          <div>
            <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider mb-2">
              Recent Verification Timeline
            </h4>
            <div className="space-y-2">
              {facility.evidenceHistory && facility.evidenceHistory.length > 0 ? (
                facility.evidenceHistory.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs flex items-start gap-2.5"
                  >
                    <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-charcoal truncate">
                          {ev.reporterRole || (ev.source === 'operator' ? 'Operator' : 'Community Member')}
                        </span>
                        <span className="text-[10px] text-charcoal-muted shrink-0">
                          {formatTimeAgo(ev.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-muted mt-0.5">
                        {ev.note || (ev.status === 'available' ? 'Confirmed usable' : 'Reported issue')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-charcoal-muted">No recent confirmation reports.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border bg-surface-card space-y-2">
          {/* Primary: In-App Directions & Google Maps Shortcut */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onGetDirections(facility)}
              className="py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs min-h-[46px]"
            >
              <Navigation className="w-4 h-4 fill-current" />
              <span>{t.getDirections} (In-App)</span>
            </button>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}&travelmode=walking`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[46px]"
            >
              <ExternalLink className="w-4 h-4 text-rose-500" />
              <span>Open in Google Maps</span>
            </a>
          </div>

          {/* Worker Field Hygiene Inspection Action */}
          {currentUser?.role === 'worker' && onOpenFieldInspection && (
            <button
              onClick={() => onOpenFieldInspection(facility)}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-700" />
              <span>Conduct Field Hygiene Inspection (Worker Privileged)</span>
            </button>
          )}

          {/* Secondary Quick Confirm & Report Problem */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickConfirm}
              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] ${
                confirmedSuccess
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-surface-bg hover:bg-surface-hover border-surface-border text-brand-700'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{confirmedSuccess ? 'Confirmed! Thank you' : t.confirmUsable}</span>
            </button>

            <button
              onClick={() => onReportProblem(facility)}
              className="py-2.5 px-3 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal hover:text-status-red text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{t.reportProblem}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
