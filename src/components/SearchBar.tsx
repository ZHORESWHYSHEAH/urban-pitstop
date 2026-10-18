import React, { useState, useEffect } from 'react';
import { Search, Mic, MicOff, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { SmartConstraintResult } from '../types';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (val: string) => void;
  smartConstraints?: SmartConstraintResult | null;
  onApplyClarification?: (patch: Partial<SmartConstraintResult>) => void;
  onClearSearch: () => void;
  currentLanguage: Language;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  smartConstraints,
  onApplyClarification,
  onClearSearch,
  currentLanguage,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setSpeechSupported(hasSpeech);
    }
  }, []);

  const handleVoiceSearch = () => {
    if (!speechSupported) {
      alert('Voice input is not supported in this browser version. You can type your request directly.');
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : (currentLanguage === 'kn' ? 'kn-IN' : 'en-US');

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(transcript);
        onSubmit(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed', e);
      setIsListening(false);
    }
  };

  const sampleSuggestions = [
    'Drinking water near me',
    'A toilet I can use now',
    'Somewhere shaded to rest',
    'Charging point on my route',
    'Toilet open to non-customers',
  ];

  return (
    <div className="w-full space-y-2">
      {/* Main Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-charcoal-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onSubmit(value);
            }
          }}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-20 py-2.5 bg-surface-card border border-surface-border rounded-xl text-sm font-medium text-charcoal placeholder:text-charcoal-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {value && (
            <button
              onClick={onClearSearch}
              className="p-1 text-charcoal-muted hover:text-charcoal rounded-full hover:bg-surface-hover"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Input Button */}
          <button
            onClick={handleVoiceSearch}
            className={`p-1.5 rounded-lg border transition-all ${
              isListening
                ? 'bg-status-red text-white border-status-red animate-pulse'
                : 'text-charcoal-muted hover:text-brand-600 border-surface-border hover:bg-surface-hover'
            }`}
            title={isListening ? 'Listening...' : 'Voice search'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Tap Suggestions (When search is empty) */}
      {!value && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] text-charcoal-muted font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Try:
          </span>
          {sampleSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(s);
                onSubmit(s);
              }}
              className="px-2.5 py-1 rounded-full bg-surface-card hover:bg-surface-hover border border-surface-border text-charcoal-muted hover:text-charcoal whitespace-nowrap text-xs transition-colors shadow-2xs"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* AI Disambiguation / Clarification Banner (If multi-need query triggered prompt) */}
      {smartConstraints?.clarificationPrompt && (
        <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 text-brand-900 font-medium">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{smartConstraints.clarificationPrompt.question}</span>
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() =>
                onApplyClarification &&
                onApplyClarification(smartConstraints.clarificationPrompt!.optionA.patch)
              }
              className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-semibold text-[11px] hover:bg-brand-700 transition-colors shadow-xs"
            >
              {smartConstraints.clarificationPrompt.optionA.label}
            </button>
            <button
              onClick={() =>
                onApplyClarification &&
                onApplyClarification(smartConstraints.clarificationPrompt!.optionB.patch)
              }
              className="px-2.5 py-1 rounded-lg bg-surface-card border border-brand-300 text-brand-900 font-medium text-[11px] hover:bg-surface-hover transition-colors"
            >
              {smartConstraints.clarificationPrompt.optionB.label}
            </button>
          </div>
        </div>
      )}

      {/* Grounded Explanation of Active Constraint */}
      {smartConstraints?.explanation && value && (
        <div className="flex items-center justify-between text-[11px] text-charcoal-muted px-1">
          <span className="truncate">{smartConstraints.explanation}</span>
          <button
            onClick={onClearSearch}
            className="text-brand-600 hover:underline font-semibold shrink-0 ml-2"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
