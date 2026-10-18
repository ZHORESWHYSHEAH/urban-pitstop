import React, { useState } from 'react';
import { 
  Navigation, 
  X, 
  Footprints, 
  AlertTriangle, 
  CheckCircle2, 
  CornerUpRight, 
  CornerUpLeft,
  ArrowUp,
  ArrowRight,
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  ClipboardCheck,
  MapPin,
  ExternalLink,
  Map as MapIcon
} from 'lucide-react';
import { Facility, UserProfile } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface DirectionsPanelProps {
  destination: Facility;
  alternativeFacility?: Facility | null;
  onSelectAlternative?: (alt: Facility) => void;
  onCloseDirections: () => void;
  onSubmitArrivalFeedback: (
    outcome: 'available' | 'unavailable' | 'access_denied' | 'other',
    note?: string
  ) => void;
  onOpenFieldInspection?: () => void;
  currentUser?: UserProfile;
  currentLanguage: Language;
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  destination,
  alternativeFacility,
  onSelectAlternative,
  onCloseDirections,
  onSubmitArrivalFeedback,
  onOpenFieldInspection,
  currentUser,
  currentLanguage,
}) => {
  const [navMode, setNavMode] = useState<'in_app' | 'google_maps'>('in_app');
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  // Dynamically generate in-app turn maneuvers for the walking route
  const dist = destination.distanceMeters || 320;
  const walkMins = destination.walkingMinutes || Math.max(1, Math.round(dist / 75));
  const streetName = destination.address.split(',')[0] || destination.area;

  // Google Maps Direct URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=walking`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${destination.latitude},${destination.longitude}&hl=en&z=17&output=embed`;

  const steps = [
    {
      instruction: `Head towards ${streetName} on foot`,
      distance: Math.round(dist * 0.35) + 'm',
      icon: <ArrowUp className="w-5 h-5 text-brand-600" />,
      subtext: 'Follow the highlighted green walking path on the map.'
    },
    {
      instruction: `Turn right onto ${destination.area} corridor`,
      distance: Math.round(dist * 0.45) + 'm',
      icon: <CornerUpRight className="w-5 h-5 text-brand-600" />,
      subtext: 'Pedestrian walkway with shaded tree cover.'
    },
    {
      instruction: `Arriving at ${destination.name}`,
      distance: Math.round(dist * 0.20) + 'm',
      icon: <MapPin className="w-5 h-5 text-brand-600" />,
      subtext: destination.accessNotes || 'Facility entry gate on your immediate right.'
    }
  ];

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFeedback = (outcome: 'available' | 'unavailable' | 'access_denied' | 'other') => {
    onSubmitArrivalFeedback(outcome);
    setFeedbackSubmitted(true);
    setTimeout(() => {
      onCloseDirections();
    }, 2000);
  };

  const isWorker = currentUser?.role === 'worker';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-surface-card rounded-t-3xl shadow-sheet border-t border-surface-border p-4 sm:p-5 max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
      {/* Top Banner: Destination & Close */}
      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-surface-border">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-brand-600 font-bold text-xs uppercase tracking-wide">
            <Navigation className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>Navigation & Directions</span>
          </div>
          <h3 className="text-base font-bold text-charcoal mt-0.5 truncate">
            {destination.name}
          </h3>
          <p className="text-xs text-charcoal-muted truncate">
            {destination.area} • {dist}m (~{walkMins} min walk)
          </p>
        </div>

        <button
          onClick={onCloseDirections}
          className="p-1.5 rounded-xl text-charcoal-muted hover:text-charcoal hover:bg-surface-hover transition-colors"
          title="Exit directions"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Mode Switcher: In-App Leaflet vs Google Maps */}
      <div className="grid grid-cols-2 p-1 bg-surface-bg rounded-2xl border border-surface-border text-xs font-bold my-2.5 text-center">
        <button
          type="button"
          onClick={() => setNavMode('in_app')}
          className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            navMode === 'in_app'
              ? 'bg-surface-card text-brand-700 shadow-2xs'
              : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>In-App Route (Leaflet)</span>
        </button>

        <button
          type="button"
          onClick={() => setNavMode('google_maps')}
          className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            navMode === 'google_maps'
              ? 'bg-surface-card text-brand-700 shadow-2xs'
              : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 text-rose-500" />
          <span>Google Maps View</span>
        </button>
      </div>

      {/* MODE 1: IN-APP LEAFLET ROUTE HUD */}
      {navMode === 'in_app' && (
        <>
          {!isNavigating ? (
            <div className="space-y-2.5">
              {/* Walking Route Summary */}
              <div className="p-3 rounded-2xl bg-brand-50/70 border border-brand-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-950">
                      {dist} meters walking corridor
                    </div>
                    <div className="text-[11px] text-brand-800">
                      Estimated walking time: ~{walkMins} min at normal outdoor pace
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Warning if conditional */}
              {destination.accessCondition !== 'public' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Access Check: </span>
                    <span>{destination.accessNotes || 'Permission or customer access required.'}</span>
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsNavigating(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start In-App Maneuvers</span>
                </button>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                  <span>Redirect to Google Maps</span>
                </a>
              </div>
            </div>
          ) : (
            /* Live Turn-by-Turn Maneuver HUD */
            <div className="space-y-2.5">
              {/* Maneuver Card */}
              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 shadow-2xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      {steps[currentStepIndex].icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-950 leading-snug">
                        {steps[currentStepIndex].instruction}
                      </div>
                      <div className="text-[11px] text-brand-800 mt-0.5">
                        {steps[currentStepIndex].subtext}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-brand-100 text-brand-900 font-mono font-bold text-[11px] shrink-0">
                    {steps[currentStepIndex].distance}
                  </span>
                </div>

                {/* Stepper controls */}
                <div className="flex items-center justify-between pt-2 border-t border-brand-200/60 text-xs">
                  <span className="text-[11px] font-semibold text-brand-800">
                    Step {currentStepIndex + 1} of {steps.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentStepIndex === 0}
                      onClick={handlePrevStep}
                      className="px-2.5 py-1 rounded-lg bg-surface-card border border-brand-200 text-brand-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-100 transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={currentStepIndex === steps.length - 1}
                      onClick={handleNextStep}
                      className="px-2.5 py-1 rounded-lg bg-brand-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 transition-colors"
                    >
                      Next Maneuver
                    </button>
                  </div>
                </div>
              </div>

              {/* Telemetry Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-surface-bg border border-surface-border">
                  <div className="text-[10px] text-charcoal-muted uppercase font-bold">Speed</div>
                  <div className="font-bold text-charcoal text-xs mt-0.5">4.6 km/h</div>
                </div>
                <div className="p-2 rounded-xl bg-surface-bg border border-surface-border">
                  <div className="text-[10px] text-charcoal-muted uppercase font-bold">Heading</div>
                  <div className="font-bold text-charcoal text-xs mt-0.5 flex items-center justify-center gap-1">
                    <Compass className="w-3 h-3 text-brand-600" />
                    <span>NE 42°</span>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-surface-bg border border-surface-border">
                  <div className="text-[10px] text-charcoal-muted uppercase font-bold">ETA</div>
                  <div className="font-bold text-brand-700 text-xs mt-0.5">~{walkMins} mins</div>
                </div>
              </div>

              {/* Reset & External Google Maps fallback */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNavigating(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-charcoal-muted" />
                  <span>Reset HUD</span>
                </button>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                  <span>Google Maps</span>
                </a>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODE 2: INTEGRATED GOOGLE MAPS EMBED & DIRECT LINK */}
      {navMode === 'google_maps' && (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden border border-surface-border shadow-xs relative bg-surface-bg">
            <iframe
              title={`Google Map for ${destination.name}`}
              src={googleMapsEmbedUrl}
              className="w-full h-48 border-0"
              loading="lazy"
              allowFullScreen
            />
            <div className="absolute top-2 right-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 rounded-lg bg-surface-card/90 backdrop-blur-xs text-charcoal hover:text-brand-700 font-bold text-[11px] flex items-center gap-1 shadow-2xs border border-surface-border"
              >
                <span>Full Map</span>
                <ExternalLink className="w-3 h-3 text-rose-500" />
              </a>
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <MapIcon className="w-4 h-4" />
            <span>Launch Walking Route in Google Maps App</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      )}

      {/* Privileged Field Hygiene Inspection Trigger (for workers) */}
      {isWorker && onOpenFieldInspection && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenFieldInspection}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Conduct Field Hygiene Audit for this Space</span>
          </button>
        </div>
      )}

      {/* Alternative if requested */}
      {alternativeFacility && !isNavigating && (
        <div className="mt-2.5 pt-2.5 border-t border-surface-border">
          <div className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1">
            Verified Nearby Alternative
          </div>
          <div
            onClick={() => onSelectAlternative && onSelectAlternative(alternativeFacility)}
            className="p-2 rounded-xl bg-surface-bg border border-surface-border hover:border-brand-400 cursor-pointer flex items-center justify-between text-xs transition-colors"
          >
            <div className="min-w-0">
              <span className="font-semibold text-charcoal truncate block">
                {alternativeFacility.name}
              </span>
              <span className="text-[11px] text-charcoal-muted">
                {alternativeFacility.distanceMeters}m away • {alternativeFacility.lastStatusNote}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-600 shrink-0 ml-2" />
          </div>
        </div>
      )}

      {/* Arrival Prompt: "Were you able to use this place?" */}
      <div className="mt-2.5 pt-2.5 border-t border-surface-border">
        {feedbackSubmitted ? (
          <div className="p-2.5 rounded-xl bg-brand-100 text-brand-900 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span>Thank you! Your arrival check-in keeps the network reliable for everyone.</span>
          </div>
        ) : (
          <div>
            <div className="text-xs font-bold text-charcoal mb-1.5">
              {t.wereYouAbleToUse}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleFeedback('available')}
                className="py-2 px-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                <span>{t.yesItWorked}</span>
              </button>

              <button
                onClick={() => handleFeedback('unavailable')}
                className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <X className="w-3.5 h-3.5 text-rose-600" />
                <span>{t.unavailable}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
