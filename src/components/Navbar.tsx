import React, { useState } from 'react';
import { 
  MapPin, 
  Languages, 
  ShieldAlert, 
  Store, 
  Compass, 
  History, 
  PlusCircle, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  Check, 
  RefreshCw, 
  User, 
  LogOut, 
  LogIn, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import { PilotArea, UserProfile } from '../types';
import { PILOT_AREAS } from '../data/seedFacilities';
import { Language, TRANSLATIONS } from '../utils/i18n';

interface NavbarProps {
  currentArea: PilotArea;
  onSelectArea: (area: PilotArea) => void;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  activeTab: 'find' | 'activity' | 'contribute' | 'operator' | 'admin' | 'login';
  onSelectTab: (tab: 'find' | 'activity' | 'contribute' | 'operator' | 'admin' | 'login') => void;
  isOnline: boolean;
  onResetData: () => void;
  currentUser: UserProfile;
  onOpenLoginModal: (targetRole?: 'operator' | 'admin' | 'worker') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentArea,
  onSelectArea,
  currentLanguage,
  onSelectLanguage,
  activeTab,
  onSelectTab,
  isOnline,
  onResetData,
  currentUser,
  onOpenLoginModal,
  onLogout,
}) => {

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = TRANSLATIONS[currentLanguage];

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'es', label: 'Spanish', native: 'Español' },
  ];

  // Helper for role badge styling
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return {
          label: 'Admin',
          classes: 'bg-brand-50 text-brand-800 border-brand-200',
        };
      case 'operator':
        return {
          label: 'Operator',
          classes: 'bg-amber-50 text-amber-900 border-amber-200',
        };
      case 'worker':
        return {
          label: 'Rider / Worker',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      default:
        return {
          label: 'Guest',
          classes: 'bg-surface-muted text-charcoal-muted border-surface-border',
        };
    }
  };

  const roleBadge = getRoleBadge();

  const handleTabClick = (tab: 'find' | 'activity' | 'contribute' | 'operator' | 'admin') => {
    if (tab === 'operator' && currentUser.role !== 'operator' && currentUser.role !== 'admin') {
      onOpenLoginModal('operator');
      return;
    }
    if (tab === 'admin' && currentUser.role !== 'admin') {
      onOpenLoginModal('admin');
      return;
    }
    onSelectTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-card border-b border-surface-border/80 px-3 py-2.5 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Wordmark & Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('find')}>
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 100 100">
                <path d="M50 18 C36.7 18 26 28.7 26 42 C26 58 46 78 48.5 80.4 C49.3 81.2 50.7 81.2 51.5 80.4 C54 78 74 58 74 42 C74 28.7 63.3 18 50 18 Z" fill="#FFFFFF" />
                <circle cx="50" cy="42" r="14" fill="#176B4D" />
                <path d="M50 34 C47 38 44 41 44 44 C44 47.3 46.7 50 50 50 C53.3 50 56 47.3 56 44 C56 41 53 38 50 34 Z" fill="#E4F3E9" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[17px] tracking-tight text-charcoal leading-none">
                  Urban Pitstop
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                  Pilot
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted leading-tight hidden xs:block">
                Real-Time Facilities Network
              </p>
            </div>
          </div>

          {/* Location Selector Pill */}
          <button
            onClick={() => setShowAreaModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal text-xs font-medium transition-colors max-w-[150px] sm:max-w-xs truncate"
            title="Change launch area corridor"
          >
            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate">{currentArea.name.split('—')[1] || currentArea.city}</span>
            <ChevronDown className="w-3 h-3 text-charcoal-muted shrink-0" />
          </button>

          {/* Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Online/Offline status pill */}
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${
                isOnline 
                  ? 'bg-status-positiveBg/70 border-status-positive/20 text-status-positiveText' 
                  : 'bg-status-amberBg border-status-amber/30 text-status-amberText'
              }`}
              title={isOnline ? 'Connected to live network' : 'Working offline with cached data'}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden md:inline">{isOnline ? 'Live' : 'Offline'}</span>
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-1.5 rounded-lg hover:bg-surface-hover border border-surface-border text-charcoal-muted hover:text-charcoal transition-colors flex items-center gap-1 text-xs"
                title="Select Language"
              >
                <Languages className="w-4 h-4 text-charcoal-muted" />
                <span className="font-semibold uppercase text-[11px]">{currentLanguage}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-1 w-44 bg-surface-card rounded-xl shadow-lg border border-surface-border py-1 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-charcoal-muted border-b border-surface-border">
                    Select Language
                  </div>
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onSelectLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface-hover transition-colors ${
                        currentLanguage === lang.code ? 'font-bold text-brand-600 bg-brand-50' : 'text-charcoal'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[11px] text-charcoal-muted">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile & Role Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full border border-surface-border bg-surface-bg hover:bg-surface-hover transition-all text-xs"
                title="Account & Role"
              >
                <span className="text-base">{currentUser.avatar || '👤'}</span>
                <span className="font-semibold text-charcoal hidden sm:inline truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase hidden md:inline ${roleBadge.classes}`}>
                  {roleBadge.label}
                </span>
                <ChevronDown className="w-3 h-3 text-charcoal-muted shrink-0" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-1.5 w-64 bg-surface-card rounded-2xl shadow-xl border border-surface-border p-3 z-50 space-y-3">
                  {/* Active User Information */}
                  <div className="pb-2 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentUser.avatar || '👤'}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-charcoal truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[10px] text-charcoal-muted truncate">
                          {currentUser.organization || currentUser.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${roleBadge.classes}`}>
                        Active Role: {currentUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="space-y-1.5 pt-1">
                    <button
                      onClick={() => {
                        onOpenLoginModal();
                        setShowUserMenu(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal font-semibold text-xs flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-brand-600" />
                        <span>{currentUser.role === 'guest' ? 'Sign In with Credentials' : 'Switch Account / Role'}</span>
                      </div>
                      <span className="text-[10px] text-charcoal-muted font-normal">Login Page →</span>
                    </button>

                    {currentUser.role !== 'guest' && (
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-surface-bg hover:bg-rose-50 hover:text-rose-700 border border-surface-border text-charcoal-muted text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out ({currentUser.name.split(' ')[0]})</span>
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-surface-border">
              <button
                onClick={() => onSelectTab('find')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'find' ? 'bg-brand-500 text-white' : 'text-charcoal hover:bg-surface-hover'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{t.findTab}</span>
              </button>
              <button
                onClick={() => onSelectTab('activity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'activity' ? 'bg-brand-500 text-white' : 'text-charcoal hover:bg-surface-hover'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{t.activityTab}</span>
              </button>
              <button
                onClick={() => onSelectTab('contribute')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === 'contribute' ? 'bg-brand-500 text-white' : 'text-charcoal hover:bg-surface-hover'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.contributeTab}</span>
              </button>

              {/* Operator Portal Link (Role Protected) */}
              <button
                onClick={() => handleTabClick('operator')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeTab === 'operator'
                    ? 'bg-brand-100 text-brand-700 font-bold'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
                title="Facility Operator Portal"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Operator</span>
                {currentUser.role !== 'operator' && currentUser.role !== 'admin' && (
                  <Lock className="w-2.5 h-2.5 text-charcoal-muted/70 shrink-0" />
                )}
              </button>

              {/* Admin Dashboard Link (Role Protected) */}
              <button
                onClick={() => handleTabClick('admin')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-brand-100 text-brand-700 font-bold'
                    : 'text-charcoal-muted hover:text-charcoal'
                }`}
                title="Administrator Review Dashboard"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
                {currentUser.role !== 'admin' && (
                  <Lock className="w-2.5 h-2.5 text-charcoal-muted/70 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Area Selector Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-5 shadow-xl border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal">Select Launch Pilot Area</h3>
                <p className="text-xs text-charcoal-muted">
                  Urban Pitstop deploys high-density facility networks corridor-by-corridor.
                </p>
              </div>
              <button
                onClick={() => setShowAreaModal(false)}
                className="text-charcoal-muted hover:text-charcoal p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 mt-4">
              {PILOT_AREAS.map(area => (
                <div
                  key={area.id}
                  onClick={() => {
                    onSelectArea(area);
                    setShowAreaModal(false);
                  }}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    currentArea.id === area.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                      : 'border-surface-border hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-charcoal">{area.name}</span>
                    {currentArea.id === area.id && (
                      <Check className="w-4 h-4 text-brand-600" />
                    )}
                  </div>
                  <p className="text-xs text-charcoal-muted mt-1 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-surface-border flex items-center justify-between">
              <button
                onClick={() => {
                  onResetData();
                  setShowAreaModal(false);
                }}
                className="text-xs text-charcoal-muted hover:text-brand-600 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Demo Baseline Data</span>
              </button>
              <button
                onClick={() => setShowAreaModal(false)}
                className="px-4 py-2 bg-charcoal text-white text-xs font-semibold rounded-lg hover:bg-charcoal/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
