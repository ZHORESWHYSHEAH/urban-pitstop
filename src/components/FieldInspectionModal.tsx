import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Droplet, 
  ShieldCheck, 
  Mic, 
  MicOff,
  ClipboardCheck,
  Building2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Facility, UserProfile, FieldInspectionReport } from '../types';
import { submitFieldInspection } from '../services/api';

interface FieldInspectionModalProps {
  facility: Facility | null;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onInspectionCompleted: (updatedFacility: Facility) => void;
}

export const FieldInspectionModal: React.FC<FieldInspectionModalProps> = ({
  facility,
  currentUser,
  isOpen,
  onClose,
  onInspectionCompleted,
}) => {
  const [rating, setRating] = useState(5);
  const [cleanliness, setCleanliness] = useState<'spotless' | 'clean' | 'needs_attention' | 'unsanitary'>('clean');
  const [waterQuality, setWaterQuality] = useState<'potable_clean' | 'low_pressure' | 'dry' | 'not_applicable'>('potable_clean');
  const [suppliesPresent, setSuppliesPresent] = useState(true);
  const [safety, setSafety] = useState<'very_safe' | 'acceptable' | 'poor_lighting'>('very_safe');
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !facility) return null;

  const handleVoiceNote = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNotes(prev => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const report: FieldInspectionReport = {
        id: `insp-${Date.now()}`,
        facilityId: facility.id,
        facilityName: facility.name,
        workerId: currentUser.id,
        workerName: currentUser.name,
        hygieneRating: rating,
        cleanlinessStatus: cleanliness,
        waterQualityStatus: facility.category === 'water' || (facility.secondaryCategories || []).includes('water') ? waterQuality : 'not_applicable',
        suppliesPresent,
        safetyRating: safety,
        notes: notes.trim(),
        inspectedAt: new Date().toISOString()
      };

      const updated = await submitFieldInspection(report);
      onInspectionCompleted(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit inspection report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-charcoal">
                Field Hygiene & Quality Inspection
              </h3>
              <p className="text-[11px] text-charcoal-muted">
                Inspector: <span className="font-semibold text-charcoal">{currentUser.name}</span> ({currentUser.organization || 'Field Staff'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Facility Info */}
          <div className="p-3 rounded-2xl bg-surface-bg border border-surface-border flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-bold text-charcoal text-xs truncate">{facility.name}</div>
              <div className="text-[11px] text-charcoal-muted truncate">{facility.area} • {facility.address}</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-100 text-brand-900 shrink-0 ml-2">
              {facility.category}
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-status-redBg border border-status-red/30 text-status-redText text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Cleanliness Star Rating */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal">
              Overall Hygiene & Cleanliness Rating:
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="font-bold text-charcoal text-xs ml-2">
                {rating === 5 ? 'Spotless / Premium' : rating === 4 ? 'Very Good' : rating === 3 ? 'Acceptable' : rating === 2 ? 'Needs Cleaning' : 'Unsanitary'}
              </span>
            </div>
          </div>

          {/* Cleanliness Condition */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal">
              Sanitation State:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: 'spotless', label: '✨ Spotless' },
                { id: 'clean', label: '🧹 Clean' },
                { id: 'needs_attention', label: '⚠️ Needs Attention' },
                { id: 'unsanitary', label: '❌ Unsanitary' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCleanliness(opt.id as any)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    cleanliness === opt.id
                      ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-2xs'
                      : 'bg-surface-bg border-surface-border text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Water Status Check if facility provides water */}
          {(facility.category === 'water' || (facility.secondaryCategories || []).includes('water')) && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-charcoal flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-600" />
                <span>Drinking Water Quality / Flow:</span>
              </label>
              <select
                value={waterQuality}
                onChange={e => setWaterQuality(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
              >
                <option value="potable_clean">Cold, clean, good pressure</option>
                <option value="low_pressure">Potable but slow flow</option>
                <option value="dry">Dry / Dispenser empty</option>
              </select>
            </div>
          )}

          {/* Supplies & Amenities */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal">
              Supplies & Amenities (Soap / Toilet Paper / Sanitizer):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSuppliesPresent(true)}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  suppliesPresent
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : 'bg-surface-bg border-surface-border text-charcoal-muted'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Supplies Present</span>
              </button>
              <button
                type="button"
                onClick={() => setSuppliesPresent(false)}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  !suppliesPresent
                    ? 'bg-rose-50 border-rose-400 text-rose-900'
                    : 'bg-surface-bg border-surface-border text-charcoal-muted'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Supplies Missing / Low</span>
              </button>
            </div>
          </div>

          {/* Safety & Lighting */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-charcoal flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Safety for Outdoor Workers:</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'very_safe', label: 'Very Safe' },
                { id: 'acceptable', label: 'Acceptable' },
                { id: 'poor_lighting', label: 'Poor Lighting' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSafety(opt.id as any)}
                  className={`py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    safety === opt.id
                      ? 'bg-brand-50 border-brand-500 text-brand-900'
                      : 'bg-surface-bg border-surface-border text-charcoal-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inspector Voice & Text Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-charcoal">
                Field Inspection Observations:
              </label>
              <button
                type="button"
                onClick={handleVoiceNote}
                className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-surface-bg text-charcoal hover:bg-surface-hover border-surface-border'
                }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-brand-600" />}
                <span>{isListening ? 'Listening...' : 'Voice Note'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Washroom cleaned 15 mins ago, dispenser running, friendly security guard."
              className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[46px]"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Inspection...' : 'Submit Official Field Inspection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
