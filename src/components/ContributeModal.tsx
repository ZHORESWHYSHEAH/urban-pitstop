import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ThumbsUp, 
  Mic, 
  MicOff, 
  MapPin, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { Facility, FacilityCategory, AccessCondition, IssueType } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  preselectedFacility?: Facility | null;
  initialTab?: 'confirm' | 'problem' | 'add';
  onSubmitConfirmation: (facilityId: string, outcome: 'available' | 'unavailable', note?: string) => void;
  onSubmitProblem: (facilityId: string, issueType: IssueType, note?: string) => void;
  onSubmitNewPlace: (newPlace: any) => void;
  userLocation: [number, number];
  currentLanguage: Language;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  facilities,
  preselectedFacility,
  initialTab = 'confirm',
  onSubmitConfirmation,
  onSubmitProblem,
  onSubmitNewPlace,
  userLocation,
  currentLanguage,
}) => {
  const [activeTab, setActiveTab] = useState<'confirm' | 'problem' | 'add'>(initialTab);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    preselectedFacility?.id || (facilities[0]?.id ?? '')
  );

  // Sync state when props change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (preselectedFacility?.id) {
        setSelectedFacilityId(preselectedFacility.id);
      } else if ((!selectedFacilityId || selectedFacilityId === '') && facilities.length > 0) {
        setSelectedFacilityId(facilities[0].id);
      }
    }
  }, [isOpen, initialTab, preselectedFacility, facilities]);

  // Confirm state
  const [confirmOutcome, setConfirmOutcome] = useState<'available' | 'unavailable'>('available');
  const [confirmNote, setConfirmNote] = useState('');

  // Problem report state
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('closed');
  const [problemNote, setProblemNote] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // New facility state
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newCategory, setNewCategory] = useState<FacilityCategory>('water');
  const [newAccess, setNewAccess] = useState<AccessCondition>('public');
  const [newAddress, setNewAddress] = useState('Near current location');
  const [newFee, setNewFee] = useState('Free');

  // Success state
  const [submittedToast, setSubmittedToast] = useState(false);

  const t = TRANSLATIONS[currentLanguage];

  if (!isOpen) return null;

  const handleVoiceReport = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recording is not supported in this browser. Please type your short report.');
      return;
    }

    try {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new Speech();
      rec.lang = 'en-US';
      rec.onstart = () => setIsRecordingVoice(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setProblemNote(text);
        setIsRecordingVoice(false);
      };
      rec.onerror = () => setIsRecordingVoice(false);
      rec.onend = () => setIsRecordingVoice(false);
      rec.start();
    } catch {
      setIsRecordingVoice(false);
    }
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedFacilityId || preselectedFacility?.id || (facilities && facilities[0]?.id);
    if (!targetId) {
      console.warn('ContributeModal: No target facility found to submit confirmation');
      return;
    }
    onSubmitConfirmation(targetId, confirmOutcome, confirmNote);
    setSubmittedToast(true);
    setTimeout(() => {
      setSubmittedToast(false);
      onClose();
    }, 1600);
  };

  const handleProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedFacilityId || preselectedFacility?.id || (facilities && facilities[0]?.id);
    if (!targetId) {
      console.warn('ContributeModal: No target facility found to submit problem report');
      return;
    }
    onSubmitProblem(targetId, selectedIssue, problemNote);
    setSubmittedToast(true);
    setTimeout(() => {
      setSubmittedToast(false);
      onClose();
    }, 1600);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceName.trim()) return;

    onSubmitNewPlace({
      name: newPlaceName,
      category: newCategory,
      latitude: userLocation[0] + (Math.random() - 0.5) * 0.002,
      longitude: userLocation[1] + (Math.random() - 0.5) * 0.002,
      address: newAddress,
      area: 'Local Corridor',
      accessCondition: newAccess,
      accessNotes: newAccess === 'public' ? 'Open for all workers' : 'Customer or permission needed',
      fee: newFee,
      accessibility: {
        wheelchairAccessible: true,
        drinkingWaterType: newCategory === 'water' ? 'RO Filtered Dispenser' : undefined,
      },
      operatingHours: {
        is24x7: false,
        openTime: '06:00',
        closeTime: '22:00',
        daysNote: 'Daily',
      },
    });

    setSubmittedToast(true);
    setTimeout(() => {
      setSubmittedToast(false);
      onClose();
    }, 1600);
  };

  const problemOptions: { id: IssueType; label: string }[] = [
    { id: 'closed', label: 'Closed / Locked' },
    { id: 'no_water', label: 'No Water / Tap Dry' },
    { id: 'toilet_unavailable', label: 'Toilet Out of Service' },
    { id: 'access_denied', label: 'Access Denied to Non-Customers' },
    { id: 'incorrect_location', label: 'Wrong Location on Map' },
    { id: 'other', label: 'Other Issue' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-base text-charcoal">
            Fast Community Update
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Large Utility Tabs */}
        <div className="grid grid-cols-3 border-b border-surface-border bg-surface-bg p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('confirm')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'confirm'
                ? 'bg-surface-card text-brand-700 shadow-2xs font-bold'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Confirm Usable</span>
          </button>

          <button
            onClick={() => setActiveTab('problem')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'problem'
                ? 'bg-surface-card text-status-redText shadow-2xs font-bold'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Issue</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'add'
                ? 'bg-surface-card text-brand-700 shadow-2xs font-bold'
                : 'text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Place</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {submittedToast ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-charcoal">Report Registered</h4>
              <p className="text-xs text-charcoal-muted max-w-xs mx-auto">
                Thank you. The reliability score has been re-evaluated and updated across the network.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: CONFIRM AVAILABILITY */}
              {activeTab === 'confirm' && (
                <form onSubmit={handleConfirmSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Select Place:
                    </label>
                    <select
                      value={selectedFacilityId || facilities[0]?.id || ''}
                      onChange={e => setSelectedFacilityId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal focus:ring-2 focus:ring-brand-500/20"
                    >
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.area})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-2">
                      Were you able to use it?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmOutcome('available')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          confirmOutcome === 'available'
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-surface-bg text-charcoal border-surface-border'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes, Available</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmOutcome('unavailable')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          confirmOutcome === 'unavailable'
                            ? 'bg-status-red text-white border-status-red shadow-sm'
                            : 'bg-surface-bg text-charcoal border-surface-border'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>No, Couldn't Use</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-muted mb-1">
                      Optional Quick Note:
                    </label>
                    <input
                      type="text"
                      value={confirmNote}
                      onChange={e => setConfirmNote(e.target.value)}
                      placeholder="e.g. Clean water, cold temperature, open now"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors min-h-[48px]"
                  >
                    Submit 1-Tap Confirmation
                  </button>
                </form>
              )}

              {/* TAB 2: REPORT A PROBLEM */}
              {activeTab === 'problem' && (
                <form onSubmit={handleProblemSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Select Facility:
                    </label>
                    <select
                      value={selectedFacilityId || facilities[0]?.id || ''}
                      onChange={e => setSelectedFacilityId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                    >
                      {facilities.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.area})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-2">
                      What is the issue?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {problemOptions.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedIssue(opt.id)}
                          className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                            selectedIssue === opt.id
                              ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold ring-1 ring-rose-400'
                              : 'bg-surface-bg border-surface-border text-charcoal hover:bg-surface-hover'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-charcoal-muted">
                        Short Voice or Written Details:
                      </label>
                      <button
                        type="button"
                        onClick={handleVoiceReport}
                        className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                          isRecordingVoice
                            ? 'bg-status-red text-white border-status-red animate-pulse'
                            : 'text-brand-700 bg-brand-50 border-brand-200'
                        }`}
                      >
                        {isRecordingVoice ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                        <span>{isRecordingVoice ? 'Listening...' : 'Voice input'}</span>
                      </button>
                    </div>
                    <textarea
                      value={problemNote}
                      onChange={e => setProblemNote(e.target.value)}
                      placeholder="e.g. Door locked, tap dry since 2 PM"
                      rows={2}
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-status-red hover:bg-rose-700 text-white font-bold text-xs transition-colors min-h-[48px]"
                  >
                    Submit Problem Report
                  </button>
                </form>
              )}

              {/* TAB 3: ADD MISSING PLACE */}
              {activeTab === 'add' && (
                <form onSubmit={handleAddSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Facility Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={newPlaceName}
                      onChange={e => setNewPlaceName(e.target.value)}
                      placeholder="e.g. Metro Pillar 58 Drinking Water Cooler"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Category:
                      </label>
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value as FacilityCategory)}
                        className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                      >
                        <option value="water">Drinking Water</option>
                        <option value="toilets">Public Toilet</option>
                        <option value="shade">Shaded Rest Spot</option>
                        <option value="charging">Phone Charging</option>
                        <option value="break">Short Break Space</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal mb-1">
                        Access Policy:
                      </label>
                      <select
                        value={newAccess}
                        onChange={e => setNewAccess(e.target.value as AccessCondition)}
                        className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                      >
                        <option value="public">Free Public Access</option>
                        <option value="permission_required">Ask Permission</option>
                        <option value="customers_only">Customers Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-muted mb-1">
                      Location / Landmark:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newAddress}
                        onChange={e => setNewAddress(e.target.value)}
                        placeholder="Street or junction"
                        className="flex-1 p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                      />
                      <span className="text-[11px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-2.5 rounded-xl flex items-center gap-1 font-semibold shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                        Current GPS
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-muted mb-1">
                      Fee or Upkeep:
                    </label>
                    <input
                      type="text"
                      value={newFee}
                      onChange={e => setNewFee(e.target.value)}
                      placeholder="Free or ₹2"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors min-h-[48px]"
                  >
                    Add Facility for Verification
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
