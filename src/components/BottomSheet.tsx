import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  SlidersHorizontal, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpDown 
} from 'lucide-react';
import { Facility } from '../types';
import { FacilityCard } from './FacilityCard';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface BottomSheetProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (id: string) => void;
  onViewDetails: (facility: Facility) => void;
  onGetDirections: (facility: Facility) => void;
  savedFacilityIds: string[];
  onToggleSave: (id: string) => void;
  currentLanguage: Language;
  sortBy: 'reliability' | 'distance';
  onChangeSortBy: (sort: 'reliability' | 'distance') => void;
  isMapOnlyMode?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  onViewDetails,
  onGetDirections,
  savedFacilityIds,
  onToggleSave,
  currentLanguage,
  sortBy,
  onChangeSortBy,
}) => {
  const [sheetState, setSheetState] = useState<'collapsed' | 'expanded' | 'full'>('collapsed');
  const t = TRANSLATIONS[currentLanguage];

  const toggleSheet = () => {
    if (sheetState === 'collapsed') setSheetState('expanded');
    else if (sheetState === 'expanded') setSheetState('full');
    else setSheetState('collapsed');
  };

  const topFacility = facilities[0];

  return (
    <>
      {/* DESKTOP SPLIT VIEW: Left Panel List (lg screens) */}
      <aside className="hidden lg:flex flex-col w-[420px] shrink-0 border-r border-surface-border bg-surface-card h-[calc(100vh-61px)] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-charcoal">
              {t.nearbyPlaces}
            </h2>
            <p className="text-xs text-charcoal-muted mt-0.5">
              {facilities.length} verified facilities nearby
            </p>
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-1 bg-surface-bg p-1 rounded-xl border border-surface-border text-xs">
            <button
              onClick={() => onChangeSortBy('reliability')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'reliability'
                  ? 'bg-brand-500 text-white font-semibold shadow-2xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t.reliabilityFirst}
            </button>
            <button
              onClick={() => onChangeSortBy('distance')}
              className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                sortBy === 'distance'
                  ? 'bg-brand-500 text-white font-semibold shadow-2xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              {t.distanceFirst}
            </button>
          </div>
        </div>

        {/* Scrollable Facility Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {facilities.length === 0 ? (
            <div className="p-8 text-center bg-surface-bg rounded-2xl border border-dashed border-surface-border my-6">
              <AlertCircle className="w-8 h-8 text-charcoal-muted mx-auto mb-2" />
              <h4 className="font-bold text-sm text-charcoal">No facilities found</h4>
              <p className="text-xs text-charcoal-muted mt-1 max-w-xs mx-auto">
                Try selecting "All" categories or searching for another corridor.
              </p>
            </div>
          ) : (
            facilities.map(facility => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                isSelected={selectedFacilityId === facility.id}
                isSaved={savedFacilityIds.includes(facility.id)}
                onSelect={() => onSelectFacility(facility.id)}
                onViewDetails={() => onViewDetails(facility)}
                onGetDirections={() => onGetDirections(facility)}
                onToggleSave={() => onToggleSave(facility.id)}
                currentLanguage={currentLanguage}
              />
            ))
          )}
        </div>
      </aside>

      {/* MOBILE DRAGGABLE BOTTOM SHEET (Phones & Tablets) */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-30 bg-surface-card rounded-t-3xl shadow-sheet border-t border-surface-border transition-all duration-300 ease-in-out flex flex-col ${
          sheetState === 'collapsed'
            ? 'h-[160px]'
            : sheetState === 'expanded'
            ? 'h-[55vh]'
            : 'h-[85vh]'
        }`}
      >
        {/* Drag Handle & Quick Summary Bar */}
        <div
          onClick={toggleSheet}
          className="pt-2.5 pb-2 px-4 cursor-pointer flex flex-col items-center select-none"
        >
          <div className="w-12 h-1.5 rounded-full bg-charcoal-muted/30 mb-2"></div>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-charcoal">
                {t.nearbyPlaces}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                {facilities.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Sort toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeSortBy(sortBy === 'reliability' ? 'distance' : 'reliability');
                }}
                className="text-[11px] font-medium text-charcoal-muted hover:text-charcoal px-2 py-1 rounded bg-surface-bg border border-surface-border flex items-center gap-1"
              >
                <ArrowUpDown className="w-3 h-3 text-brand-500" />
                <span>{sortBy === 'reliability' ? 'Reliability' : 'Distance'}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSheet();
                }}
                className="p-1 text-charcoal-muted hover:text-charcoal"
              >
                {sheetState === 'collapsed' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {sheetState === 'collapsed' ? (
            /* Collapsed Preview: Top Recommended Facility Card */
            topFacility ? (
              <FacilityCard
                facility={topFacility}
                isSelected={selectedFacilityId === topFacility.id}
                isSaved={savedFacilityIds.includes(topFacility.id)}
                onSelect={() => onSelectFacility(topFacility.id)}
                onViewDetails={() => onViewDetails(topFacility)}
                onGetDirections={() => onGetDirections(topFacility)}
                onToggleSave={() => onToggleSave(topFacility.id)}
                currentLanguage={currentLanguage}
              />
            ) : (
              <div className="text-center text-xs text-charcoal-muted py-4">
                No facilities in this area.
              </div>
            )
          ) : (
            /* Expanded Full List */
            facilities.map(facility => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                isSelected={selectedFacilityId === facility.id}
                isSaved={savedFacilityIds.includes(facility.id)}
                onSelect={() => onSelectFacility(facility.id)}
                onViewDetails={() => onViewDetails(facility)}
                onGetDirections={() => onGetDirections(facility)}
                onToggleSave={() => onToggleSave(facility.id)}
                currentLanguage={currentLanguage}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};
