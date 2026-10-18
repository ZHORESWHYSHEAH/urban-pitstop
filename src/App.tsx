import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Compass, 
  History, 
  PlusCircle, 
  Store, 
  ShieldAlert, 
  WifiOff, 
  Lock 
} from 'lucide-react';

import { 
  Facility, 
  FacilityCategory, 
  PilotArea, 
  SmartConstraintResult, 
  UserVisitHistory, 
  UserReportHistory, 
  IssueType, 
  UserProfile, 
  UserRole 
} from './types';
import { PILOT_AREAS } from './data/seedFacilities';
import { 
  fetchFacilities, 
  submitArrivalConfirmation, 
  submitProblemReport, 
  addNewFacility, 
  getUserFavorites, 
  toggleUserFavorite, 
  getUserVisits, 
  getUserReports, 
  resetDemoData, 
  getOfflineQueueCount 
} from './services/api';
import { 
  getCurrentUser, 
  logoutUser 
} from './services/authService';
import { parseNaturalLanguageQuery } from './services/nlpEngine';
import { Language, TRANSLATIONS } from './utils/i18n';

// Components
import { Navbar } from './components/Navbar';
import { SearchBar } from './components/SearchBar';
import { CategoryChips } from './components/CategoryChips';
import { InteractiveMap } from './components/InteractiveMap';
import { BottomSheet } from './components/BottomSheet';
import { FacilityDetailModal } from './components/FacilityDetailModal';
import { DirectionsPanel } from './components/DirectionsPanel';
import { ContributeModal } from './components/ContributeModal';
import { ActivityView } from './components/ActivityView';
import { OperatorPortal } from './components/OperatorPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/LoginPage';
import { FieldInspectionModal } from './components/FieldInspectionModal';

export const App: React.FC = () => {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'find' | 'activity' | 'contribute' | 'operator' | 'admin' | 'login'>('find');
  const [currentArea, setCurrentArea] = useState<PilotArea>(PILOT_AREAS[0]);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser());
  const [loginTargetRole, setLoginTargetRole] = useState<'operator' | 'admin' | 'worker' | null>(null);

  // Location
  const [userLocation, setUserLocation] = useState<[number, number]>(PILOT_AREAS[0].center);

  // Facilities & Filters
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [smartConstraints, setSmartConstraints] = useState<SmartConstraintResult | null>(null);
  const [sortBy, setSortBy] = useState<'reliability' | 'distance'>('reliability');

  // Active Selections
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [focusedDetailFacility, setFocusedDetailFacility] = useState<Facility | null>(null);
  const [activeDestination, setActiveDestination] = useState<Facility | null>(null);
  const [inspectionTargetFacility, setInspectionTargetFacility] = useState<Facility | null>(null);

  // User Storage & History
  const [savedFacilityIds, setSavedFacilityIds] = useState<string[]>([]);
  const [visitHistory, setVisitHistory] = useState<UserVisitHistory[]>([]);
  const [reportHistory, setReportHistory] = useState<UserReportHistory[]>([]);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Contribute Modals
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributeInitialTab, setContributeInitialTab] = useState<'confirm' | 'problem' | 'add'>('confirm');
  const [contributeTargetFacility, setContributeTargetFacility] = useState<Facility | null>(null);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Refresh user data from localStorage
  const refreshUserData = useCallback(() => {
    setSavedFacilityIds(getUserFavorites());
    setVisitHistory(getUserVisits());
    setReportHistory(getUserReports());
    setOfflineQueueCount(getOfflineQueueCount());
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Load facilities when location, category, search, or sort changes
  const loadFacilities = useCallback(async () => {
    const data = await fetchFacilities({
      userLocation,
      category: selectedCategory,
      searchQuery,
      smartConstraints: smartConstraints || undefined,
      sortBy,
    });
    setFacilities(data);
  }, [userLocation, selectedCategory, searchQuery, smartConstraints, sortBy]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  // Auth Handlers
  const handleNavigateToLogin = (targetRole?: 'operator' | 'admin' | 'worker') => {
    setLoginTargetRole(targetRole || null);
    setActiveTab('login');
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'operator') {
      setActiveTab('operator');
    } else if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('find');
    }
  };

  const handleLogout = () => {
    const user = logoutUser();
    setCurrentUser(user);
    setActiveTab('find');
  };

  // Area change handler
  const handleSelectArea = (area: PilotArea) => {
    setCurrentArea(area);
    setUserLocation(area.center);
    setSelectedFacilityId(null);
    setActiveDestination(null);
    setFocusedDetailFacility(null);
  };

  // Natural Language Search Submission
  const handleSearchSubmit = async (queryText: string) => {
    if (!queryText.trim()) {
      setSmartConstraints(null);
      setSelectedCategory('all');
      return;
    }

    const parsed = await parseNaturalLanguageQuery(queryText);
    setSmartConstraints(parsed);

    if (parsed.categories && parsed.categories.length === 1) {
      setSelectedCategory(parsed.categories[0]);
    } else {
      setSelectedCategory('all');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSmartConstraints(null);
    setSelectedCategory('all');
  };

  const handleApplyClarification = (patch: Partial<SmartConstraintResult>) => {
    if (!smartConstraints) return;
    setSmartConstraints({
      ...smartConstraints,
      ...patch,
      clarificationPrompt: undefined,
    });
  };

  // Facility Actions
  const handleSelectFacility = (id: string) => {
    setSelectedFacilityId(id);
    const target = facilities.find(f => f.id === id);
    if (target) {
      setFocusedDetailFacility(target);
    }
  };

  const handleGetDirections = (facility: Facility) => {
    setActiveDestination(facility);
    setSelectedFacilityId(facility.id);
    setFocusedDetailFacility(null);
  };

  const handleCloseDirections = () => {
    setActiveDestination(null);
  };

  const handleToggleSave = (facilityId: string) => {
    toggleUserFavorite(facilityId);
    refreshUserData();
  };

  // Arrival Feedback Confirmation Handler
  const handleArrivalFeedback = async (
    outcome: 'available' | 'unavailable' | 'access_denied' | 'other'
  ) => {
    if (!activeDestination) return;
    const finalOutcome = outcome === 'other' ? 'unavailable' : outcome;
    const roleTitle = currentUser.role === 'worker' ? `${currentUser.name} (Verified Rider)` : 'Arrival Check-in';
    await submitArrivalConfirmation(
      activeDestination.id,
      finalOutcome,
      roleTitle,
      'Confirmed during walking navigation'
    );
    await loadFacilities();
    refreshUserData();
  };

  // Problem Report modal trigger
  const handleOpenProblemReport = (facility?: Facility) => {
    setContributeTargetFacility(facility || null);
    setContributeInitialTab('problem');
    setIsContributeModalOpen(true);
  };

  // Confirm Usable modal trigger
  const handleOpenConfirmUsable = (facilityId: string) => {
    const target = facilities.find(f => f.id === facilityId) || null;
    setContributeTargetFacility(target);
    setContributeInitialTab('confirm');
    setIsContributeModalOpen(true);
  };

  // Contribution Modal Submissions
  const handleConfirmSubmit = async (
    facilityId: string,
    outcome: 'available' | 'unavailable',
    note?: string
  ) => {
    try {
      const roleTitle = currentUser.role === 'worker' ? `${currentUser.name} (Swiggy Fleet)` : 'Community Visitor';
      await submitArrivalConfirmation(facilityId, outcome, roleTitle, note);
      await loadFacilities();
      refreshUserData();
    } catch (err) {
      console.error('Failed submitting confirmation:', err);
    }
  };

  const handleProblemSubmit = async (
    facilityId: string,
    issueType: IssueType,
    note?: string
  ) => {
    try {
      const roleTitle = currentUser.role === 'worker' ? `${currentUser.name} (Worker)` : 'Community Report';
      await submitProblemReport(facilityId, issueType, note, roleTitle);
      await loadFacilities();
      refreshUserData();
    } catch (err) {
      console.error('Failed submitting problem report:', err);
    }
  };

  const handleNewPlaceSubmit = async (newPlace: any) => {
    await addNewFacility(newPlace);
    await loadFacilities();
    refreshUserData();
  };

  const handleResetData = () => {
    resetDemoData();
    loadFacilities();
    refreshUserData();
  };

  // Category Counts calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<FacilityCategory, number> = {
      all: facilities.length,
      water: 0,
      toilets: 0,
      shade: 0,
      charging: 0,
      break: 0,
    };
    facilities.forEach(f => {
      if (counts[f.category] !== undefined) counts[f.category]++;
      f.secondaryCategories?.forEach(sc => {
        if (counts[sc] !== undefined) counts[sc]++;
      });
    });
    return counts;
  }, [facilities]);

  // Saved Facilities Objects
  const savedFacilitiesList = useMemo(() => {
    return facilities.filter(f => savedFacilityIds.includes(f.id));
  }, [facilities, savedFacilityIds]);

  // Alternative facility recommendation for active destination
  const alternativeFacility = useMemo(() => {
    if (!activeDestination) return null;
    return (
      facilities.find(
        f =>
          f.id !== activeDestination.id &&
          f.category === activeDestination.category &&
          (f.status === 'recently_confirmed' || f.status === 'reported_available')
      ) || null
    );
  }, [activeDestination, facilities]);

  const t = TRANSLATIONS[currentLanguage];

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-charcoal">
      {/* Top Navbar with User Role Controls */}
      <Navbar
        currentArea={currentArea}
        onSelectArea={handleSelectArea}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOnline={isOnline}
        onResetData={handleResetData}
        currentUser={currentUser}
        onOpenLoginModal={handleNavigateToLogin}
        onLogout={handleLogout}
      />

      {/* Low Connectivity / Offline Notice Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>
            Working offline. Showing cached facilities from local memory. Submissions will sync automatically.
          </span>
        </div>
      )}

      {/* MAIN SCREEN AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* VIEW 0: DEDICATED LOGIN & RBAC PAGE */}
        {activeTab === 'login' && (
          <div className="flex-1 overflow-y-auto">
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onCancel={() => setActiveTab('find')}
              targetRoleRequirement={loginTargetRole}
            />
          </div>
        )}

        {/* VIEW 1: FIND (Main Map & Facility Discovery) */}
        {activeTab === 'find' && (
          <div className="flex-1 flex flex-col lg:flex-row relative h-[calc(100vh-61px)]">
            {/* Left Desktop List / Bottom Sheet Panel */}
            <BottomSheet
              facilities={facilities}
              selectedFacilityId={selectedFacilityId}
              onSelectFacility={handleSelectFacility}
              onViewDetails={f => setFocusedDetailFacility(f)}
              onGetDirections={handleGetDirections}
              savedFacilityIds={savedFacilityIds}
              onToggleSave={handleToggleSave}
              currentLanguage={currentLanguage}
              sortBy={sortBy}
              onChangeSortBy={setSortBy}
            />

            {/* Interactive Map Area */}
            <div className="flex-1 flex flex-col relative h-full">
              {/* Floating Top Controls over Map: Search Bar & Horizontal Category Chips */}
              <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 space-y-2 max-w-xl mx-auto pointer-events-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearchSubmit}
                  smartConstraints={smartConstraints}
                  onApplyClarification={handleApplyClarification}
                  onClearSearch={handleClearSearch}
                  currentLanguage={currentLanguage}
                />

                <CategoryChips
                  selectedCategory={selectedCategory}
                  onSelectCategory={cat => {
                    setSelectedCategory(cat);
                    setSmartConstraints(null);
                  }}
                  categoryCounts={categoryCounts}
                  currentLanguage={currentLanguage}
                />
              </div>

              {/* Map */}
              <div className="flex-1 w-full h-full">
                <InteractiveMap
                  center={currentArea.center}
                  zoom={currentArea.zoom}
                  userLocation={userLocation}
                  facilities={facilities}
                  selectedFacilityId={selectedFacilityId}
                  onSelectFacility={handleSelectFacility}
                  activeDestination={activeDestination}
                  onRecenter={() => setUserLocation(currentArea.center)}
                  onOpenReportModal={() => handleOpenProblemReport()}
                />
              </div>

              {/* Active Directions Guidance Panel (In-App Turn-by-Turn Navigation) */}
              {activeDestination && (
                <DirectionsPanel
                  destination={activeDestination}
                  alternativeFacility={alternativeFacility}
                  onSelectAlternative={handleGetDirections}
                  onCloseDirections={handleCloseDirections}
                  onSubmitArrivalFeedback={handleArrivalFeedback}
                  onOpenFieldInspection={() => setInspectionTargetFacility(activeDestination)}
                  currentUser={currentUser}
                  currentLanguage={currentLanguage}
                />
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVITY & SAVED PLACES */}
        {activeTab === 'activity' && (
          <div className="flex-1 overflow-y-auto">
            <ActivityView
              savedFacilities={savedFacilitiesList}
              visitHistory={visitHistory}
              reportHistory={reportHistory}
              onSelectFacility={id => {
                setActiveTab('find');
                handleSelectFacility(id);
              }}
              onClearHistory={refreshUserData}
              currentLanguage={currentLanguage}
            />
          </div>
        )}

        {/* VIEW 3: CONTRIBUTE */}
        {activeTab === 'contribute' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-md mx-auto">
              <ContributeModal
                isOpen={true}
                onClose={() => setActiveTab('find')}
                facilities={facilities}
                preselectedFacility={contributeTargetFacility}
                initialTab="confirm"
                onSubmitConfirmation={handleConfirmSubmit}
                onSubmitProblem={handleProblemSubmit}
                onSubmitNewPlace={handleNewPlaceSubmit}
                userLocation={userLocation}
                currentLanguage={currentLanguage}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: OPERATOR PORTAL (ROLE PROTECTED) */}
        {activeTab === 'operator' && (
          <div className="flex-1 overflow-y-auto">
            <OperatorPortal
              facilities={facilities}
              currentUser={currentUser}
              onFacilityUpdated={() => {
                loadFacilities();
              }}
              onOpenLoginModal={() => handleNavigateToLogin('operator')}
            />
          </div>
        )}

        {/* VIEW 5: ADMINISTRATOR DASHBOARD (ROLE PROTECTED) */}
        {activeTab === 'admin' && (
          <div className="flex-1 overflow-y-auto">
            <AdminDashboard
              facilities={facilities}
              currentUser={currentUser}
              onFacilityUpdated={() => {
                loadFacilities();
              }}
              onOpenLoginModal={() => handleNavigateToLogin('admin')}
            />
          </div>
        )}
      </main>

      {/* Focused Facility Details Bottom Sheet Modal */}
      <FacilityDetailModal
        facility={focusedDetailFacility}
        onClose={() => setFocusedDetailFacility(null)}
        onGetDirections={handleGetDirections}
        onConfirmUsable={handleOpenConfirmUsable}
        onReportProblem={handleOpenProblemReport}
        isSaved={focusedDetailFacility ? savedFacilityIds.includes(focusedDetailFacility.id) : false}
        onToggleSave={handleToggleSave}
        onOpenFieldInspection={fac => setInspectionTargetFacility(fac)}
        currentUser={currentUser}
        currentLanguage={currentLanguage}
      />

      {/* Pop-up Contribution Modal (from map or cards) */}
      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        facilities={facilities}
        preselectedFacility={contributeTargetFacility}
        initialTab={contributeInitialTab}
        onSubmitConfirmation={handleConfirmSubmit}
        onSubmitProblem={handleProblemSubmit}
        onSubmitNewPlace={handleNewPlaceSubmit}
        userLocation={userLocation}
        currentLanguage={currentLanguage}
      />

      {/* Dedicated Field Worker Hygiene & Cleanliness Inspection Modal */}
      <FieldInspectionModal
        isOpen={!!inspectionTargetFacility}
        facility={inspectionTargetFacility}
        currentUser={currentUser}
        onClose={() => setInspectionTargetFacility(null)}
        onInspectionCompleted={updated => {
          loadFacilities();
          if (activeDestination?.id === updated.id) {
            setActiveDestination(updated);
          }
          if (focusedDetailFacility?.id === updated.id) {
            setFocusedDetailFacility(updated);
          }
        }}
      />

      {/* MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly 48px targets) */}
      <nav className="lg:hidden sticky bottom-0 z-30 bg-surface-card border-t border-surface-border px-3 py-1.5 flex items-center justify-around shadow-sheet">
        <button
          onClick={() => setActiveTab('find')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
            activeTab === 'find' ? 'text-brand-600 font-bold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.findTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
            activeTab === 'activity' ? 'text-brand-600 font-bold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <History className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">{t.activityTab}</span>
        </button>

        <button
          onClick={() => {
            setContributeInitialTab('confirm');
            setContributeTargetFacility(facilities[0] || null);
            setIsContributeModalOpen(true);
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-brand-600 font-bold transition-transform active:scale-95 min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-xs mb-0.5">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-charcoal font-semibold">{t.contributeTab}</span>
        </button>

        <button
          onClick={() => {
            if (currentUser.role !== 'operator' && currentUser.role !== 'admin') {
              handleNavigateToLogin('operator');
            } else {
              setActiveTab('operator');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
            activeTab === 'operator' ? 'text-brand-600 font-bold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <div className="relative">
            <Store className="w-5 h-5 mb-0.5" />
            {currentUser.role !== 'operator' && currentUser.role !== 'admin' && (
              <Lock className="w-2.5 h-2.5 text-charcoal-muted absolute -top-1 -right-1" />
            )}
          </div>
          <span className="text-[10px]">{t.operatorTab}</span>
        </button>

        <button
          onClick={() => {
            if (currentUser.role !== 'admin') {
              handleNavigateToLogin('admin');
            } else {
              setActiveTab('admin');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
            activeTab === 'admin' ? 'text-brand-600 font-bold' : 'text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5 mb-0.5" />
            {currentUser.role !== 'admin' && (
              <Lock className="w-2.5 h-2.5 text-charcoal-muted absolute -top-1 -right-1" />
            )}
          </div>
          <span className="text-[10px]">{t.adminTab}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
