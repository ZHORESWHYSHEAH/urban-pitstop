import React from 'react';
import { 
  Navigation, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  XCircle, 
  Bookmark, 
  Footprints, 
  Droplets, 
  Bath, 
  TreePine, 
  Zap, 
  Coffee,
  ExternalLink 
} from 'lucide-react';
import { Facility, FacilityCategory, AccessCondition } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface FacilityCardProps {
  facility: Facility;
  isSelected?: boolean;
  isSaved?: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onGetDirections: () => void;
  onToggleSave?: () => void;
  currentLanguage: Language;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isSelected,
  isSaved,
  onSelect,
  onViewDetails,
  onGetDirections,
  onToggleSave,
  currentLanguage,
}) => {
  const t = TRANSLATIONS[currentLanguage];

  // Category Icon helper
  const getCategoryIcon = (cat: FacilityCategory) => {
    switch (cat) {
      case 'water': return Droplets;
      case 'toilets': return Bath;
      case 'shade': return TreePine;
      case 'charging': return Zap;
      case 'break': return Coffee;
      default: return Droplets;
    }
  };

  const Icon = getCategoryIcon(facility.category);

  // Status Styling Badge
  const getStatusBadge = () => {
    switch (facility.status) {
      case 'recently_confirmed':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-positiveBg border border-status-positive/20 text-status-positiveText text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{facility.lastStatusNote || t.recentlyConfirmed}</span>
          </div>
        );
      case 'reported_available':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">{facility.lastStatusNote || t.reportedAvailable}</span>
          </div>
        );
      case 'conflicting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-amberBg border border-status-amber/40 text-status-amberText text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{facility.lastStatusNote || t.conflictingReports}</span>
          </div>
        );
      case 'reported_unavailable':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-status-redBg border border-status-red/30 text-status-redText text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">{facility.lastStatusNote || t.reportedUnavailable}</span>
          </div>
        );
      case 'stale':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-muted border border-surface-border text-charcoal-muted text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
            <span className="truncate">{facility.lastStatusNote || t.staleStatus}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-muted border border-surface-border text-charcoal-muted text-xs font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
            <span className="truncate">{facility.lastStatusNote || t.unknownStatus}</span>
          </div>
        );
    }
  };

  // Access Condition Badge
  const getAccessBadge = (cond: AccessCondition) => {
    switch (cond) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
            <ShieldCheck className="w-3 h-3 text-brand-600" />
            {t.publicAccess}
          </span>
        );
      case 'customers_only':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-surface-muted text-charcoal border border-surface-border">
            {t.customersOnly}
          </span>
        );
      case 'permission_required':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
            {t.permissionRequired}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-surface-muted text-charcoal-muted border border-surface-border">
            {cond}
          </span>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-2xl bg-surface-card border transition-all cursor-pointer relative shadow-card ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
          : 'border-surface-border hover:border-brand-300'
      }`}
    >
      {/* Header Row: Category Icon, Name, Save toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-charcoal leading-snug line-clamp-1">
              {facility.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-charcoal-muted truncate">{facility.area}</span>
              <span className="text-charcoal-muted/50">•</span>
              {getAccessBadge(facility.accessCondition)}
            </div>
          </div>
        </div>

        {/* Save/Favorite toggle */}
        {onToggleSave && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave();
            }}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              isSaved
                ? 'bg-brand-50 border-brand-300 text-brand-600'
                : 'text-charcoal-muted/60 hover:text-charcoal border-transparent hover:border-surface-border'
            }`}
            title={isSaved ? 'Saved place' : 'Save place'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      {/* Freshness & Reliability Status Bar */}
      <div className="mt-2.5">
        {getStatusBadge()}
      </div>

      {/* Distance, Walking Time, Fee */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-charcoal-muted pt-2 border-t border-surface-border/60">
        <div className="flex items-center gap-3">
          {facility.distanceMeters !== undefined && (
            <div className="flex items-center gap-1 font-semibold text-charcoal">
              <Footprints className="w-3.5 h-3.5 text-brand-600" />
              <span>
                {facility.distanceMeters > 1000
                  ? `${(facility.distanceMeters / 1000).toFixed(1)} km`
                  : `${facility.distanceMeters} m`}
              </span>
              <span className="font-normal text-charcoal-muted">
                (~{facility.walkingMinutes} min)
              </span>
            </div>
          )}
          <span className="text-charcoal-muted/50">•</span>
          <span className="truncate">{facility.fee}</span>
        </div>

        <div className="text-[11px] text-charcoal-muted shrink-0">
          {facility.operatingHours.is24x7 ? (
            <span className="font-semibold text-brand-700">24/7 Open</span>
          ) : (
            <span>{facility.operatingHours.daysNote}</span>
          )}
        </div>
      </div>

      {/* Actions: Get Directions & View Details */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGetDirections();
          }}
          className="flex-1 py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs min-h-[44px]"
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span>{t.getDirections}</span>
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}&travelmode=walking`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Open walking route in Google Maps"
          className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-rose-500 hover:text-rose-600 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="py-2.5 px-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-charcoal font-medium text-xs flex items-center justify-center transition-colors min-h-[44px]"
        >
          <span>{t.viewDetails}</span>
        </button>
      </div>
    </div>
  );
};
