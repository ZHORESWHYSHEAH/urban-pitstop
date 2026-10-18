import React, { useState, useEffect } from 'react';
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  MessageSquare, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Building,
  Edit3,
  Save,
  X,
  AlertTriangle,
  ClipboardCheck,
  Droplets,
  Calendar,
  ExternalLink,
  Check,
  ChevronDown
} from 'lucide-react';
import { Facility, UserProfile, AdminPlaceReport, FieldInspectionReport, AccessCondition } from '../types';
import { 
  operatorToggleStatus, 
  operatorUpdateFacilityDetails,
  getAdminReports,
  adminReportAction,
  getFacilityInspections
} from '../services/api';
import { formatTimeAgo } from '../services/trustEngine';

interface OperatorPortalProps {
  facilities: Facility[];
  currentUser: UserProfile;
  onFacilityUpdated: (updated?: Facility) => void;
  onOpenLoginModal: (targetRole: 'operator') => void;
}

export const OperatorPortal: React.FC<OperatorPortalProps> = ({
  facilities,
  currentUser,
  onFacilityUpdated,
  onOpenLoginModal,
}) => {
  const isAuthorizedOperator = currentUser.role === 'operator' || currentUser.role === 'admin';

  // Strict Scoping: Operators ONLY see facilities belonging to their organization, account, or assigned IDs
  const managedFacilities = isAuthorizedOperator
    ? facilities.filter(f => {
        if (currentUser.role === 'admin') return true;

        // 1. Direct match in assignedFacilityIds
        if (currentUser.assignedFacilityIds && currentUser.assignedFacilityIds.includes(f.id)) {
          return true;
        }

        // 2. Organization match (e.g. "Reva Joy Cafe")
        const org = (currentUser.organization || '').toLowerCase().trim();
        const fOp = (f.operatorName || '').toLowerCase().trim();
        const fName = (f.name || '').toLowerCase().trim();
        if (org && (fOp === org || fName.includes(org))) {
          return true;
        }

        // 3. Email association
        const email = (currentUser.email || '').toLowerCase().trim();
        const fEmail = ((f as any).operatorEmail || '').toLowerCase().trim();
        if (email && fEmail === email) {
          return true;
        }

        // 4. Operator manager name match
        const name = (currentUser.name || '').toLowerCase().trim();
        if (name && fOp === name) {
          return true;
        }

        return false;
      })
    : [];

  const [selectedId, setSelectedId] = useState<string>(
    managedFacilities[0]?.id || ''
  );

  // Sync selectedId when managedFacilities loads or changes
  useEffect(() => {
    if (managedFacilities.length > 0 && !managedFacilities.some(f => f.id === selectedId)) {
      setSelectedId(managedFacilities[0].id);
    }
  }, [managedFacilities, selectedId]);

  const currentFacility = managedFacilities.find(f => f.id === selectedId) || managedFacilities[0];

  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Facility Edit Modal / Form State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAccessCondition, setEditAccessCondition] = useState<AccessCondition>('public');
  const [editAccessNotes, setEditAccessNotes] = useState('');
  const [editFee, setEditFee] = useState('Free');
  const [editIs24x7, setEditIs24x7] = useState(false);
  const [editOpenTime, setEditOpenTime] = useState('06:00');
  const [editCloseTime, setEditCloseTime] = useState('23:00');
  const [editDaysNote, setEditDaysNote] = useState('Daily');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Problem Reports & Inspections State
  const [reports, setReports] = useState<AdminPlaceReport[]>([]);
  const [inspections, setInspections] = useState<FieldInspectionReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'reports' | 'inspections'>('overview');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Populate edit form when currentFacility changes
  useEffect(() => {
    if (currentFacility) {
      setEditAccessCondition(currentFacility.accessCondition || 'public');
      setEditAccessNotes(currentFacility.accessNotes || '');
      setEditFee(currentFacility.fee || 'Free');
      setEditIs24x7(currentFacility.operatingHours?.is24x7 ?? false);
      setEditOpenTime(currentFacility.operatingHours?.openTime || '06:00');
      setEditCloseTime(currentFacility.operatingHours?.closeTime || '23:00');
      setEditDaysNote(currentFacility.operatingHours?.daysNote || 'Daily');
    }
  }, [currentFacility]);

  // Load problem reports and inspections for current facility
  useEffect(() => {
    if (!currentFacility) return;

    const loadData = async () => {
      setIsLoadingReports(true);
      try {
        const allReports = await getAdminReports();
        const facilityReports = allReports.filter(r => 
          r.facilityId === currentFacility.id || 
          r.facilityName.toLowerCase() === currentFacility.name.toLowerCase()
        );
        setReports(facilityReports);

        const facilityInspections = await getFacilityInspections(currentFacility.id);
        setInspections(facilityInspections);
      } catch (err) {
        console.debug('Error loading facility reports or inspections:', err);
      } finally {
        setIsLoadingReports(false);
      }
    };

    loadData();
  }, [currentFacility?.id]);

  const handleToggle = async (isAvailable: boolean) => {
    if (!currentFacility) return;
    setIsUpdating(true);
    try {
      const updated = await operatorToggleStatus(
        currentFacility.id,
        isAvailable,
        currentUser.name || 'Verified Operator',
        isAvailable ? undefined : (maintenanceNote || 'Temporary facility maintenance')
      );
      onFacilityUpdated(updated);
      showToast(isAvailable ? 'Status set to AVAILABLE NOW on network' : 'Facility marked TEMPORARILY UNAVAILABLE');
    } catch {
      alert('Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveFacilityDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFacility) return;
    setIsSavingDetails(true);

    try {
      const updated = await operatorUpdateFacilityDetails(currentFacility.id, {
        accessCondition: editAccessCondition,
        accessNotes: editAccessNotes.trim(),
        fee: editFee.trim(),
        operatingHours: {
          is24x7: editIs24x7,
          openTime: editIs24x7 ? '00:00' : editOpenTime,
          closeTime: editIs24x7 ? '23:59' : editCloseTime,
          daysNote: editIs24x7 ? '24/7 Continuous' : editDaysNote.trim(),
        }
      });
      onFacilityUpdated(updated);
      setIsEditModalOpen(false);
      showToast('Operating hours and access policies successfully updated!');
    } catch (err: any) {
      alert('Failed to update facility details: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await adminReportAction(reportId, 'resolve', 'Resolved by facility operator on-site.');
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      // Broadcast available status
      if (currentFacility) {
        const updated = await operatorToggleStatus(
          currentFacility.id,
          true,
          currentUser.name || 'Verified Operator',
          'Issue resolved and facility verified functional by manager'
        );
        onFacilityUpdated(updated);
      }
      showToast('Report marked resolved! Facility confirmed available on live network.');
    } catch {
      alert('Failed to resolve report');
    }
  };

  // IF NOT LOGGED IN AS OPERATOR: SHOW ROLE ACCESS GATE
  if (!isAuthorizedOperator) {
    return (
      <div className="max-w-md mx-auto p-6 my-10 bg-surface-card rounded-3xl border border-surface-border shadow-card text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-charcoal">
            Facility Operator Portal
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed max-w-sm mx-auto">
            This management console is restricted to verified store supervisors, fuel station managers, and public utility operators.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border text-left space-y-1.5 text-xs">
          <div className="font-bold text-charcoal flex items-center gap-1.5">
            <Store className="w-4 h-4 text-brand-600" />
            <span>Operator Privileges:</span>
          </div>
          <ul className="list-disc list-inside text-charcoal-muted text-[11px] space-y-1">
            <li>Toggle "Available Now" / "Temporarily Unavailable" with instant timestamping</li>
            <li>Edit operating hours, access rules, and service notices for your location</li>
            <li>Review community problem reports and physical field worker hygiene audits</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onOpenLoginModal('operator')}
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <span>Sign In with Operator Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // IF NO MANAGED FACILITIES FOUND FOR THIS OPERATOR
  if (managedFacilities.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-6 my-10 bg-surface-card rounded-3xl border border-surface-border shadow-card text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
          <Store className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-lg text-charcoal">
            Welcome, {currentUser.name}!
          </h3>
          <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
            Your account is verified as an operator under <strong className="text-charcoal">{currentUser.organization || 'Urban Pitstop Network'}</strong>, but no active facility spaces are linked to your profile yet.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left text-xs space-y-2">
          <div className="font-bold text-amber-950 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Pending Application or Space Assignment:</span>
          </div>
          <p className="text-amber-900 leading-relaxed text-[11px]">
            If you recently submitted a partner registration, it may be undergoing review in the Administrator Moderation Queue. Once approved by our team, your facility space will immediately appear here.
          </p>
        </div>

        <button
          onClick={() => onFacilityUpdated()}
          className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors"
        >
          Check for Approvals / Refresh
        </button>
      </div>
    );
  }

  const isAvail = currentFacility.status === 'recently_confirmed' || currentFacility.status === 'reported_available';
  const openReportsCount = reports.filter(r => r.status === 'pending' || r.status === 'investigating').length;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-emerald-800 text-white text-xs font-bold shadow-lg flex items-center gap-2 border border-emerald-600 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Operator Profile Banner */}
      <div className="p-5 rounded-3xl bg-surface-card border border-surface-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
            {currentUser.avatar || '⛽'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-charcoal">{currentUser.name}</h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Verified Operator
              </span>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              <strong className="text-charcoal font-semibold">{currentUser.organization || 'Urban Pitstop Partner'}</strong> • {managedFacilities.length} {managedFacilities.length === 1 ? 'facility managed' : 'facilities managed'}
            </p>
          </div>
        </div>

        {/* Facility Selector: ONLY shows this operator's managed facilities */}
        <div className="w-full sm:w-72">
          <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
            Managing Facility ({managedFacilities.length}):
          </label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full p-2.5 pr-8 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {managedFacilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-brand-500 text-white shadow-2xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-card'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Operational Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('reports')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'reports'
              ? 'bg-brand-500 text-white shadow-2xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-card'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Guest & Community Reports</span>
          {openReportsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeSubTab === 'reports' ? 'bg-white text-brand-700' : 'bg-rose-500 text-white'}`}>
              {openReportsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('inspections')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'inspections'
              ? 'bg-brand-500 text-white shadow-2xs'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-card'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Field Hygiene Audits ({inspections.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: OPERATIONAL OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Status Toggle Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg text-charcoal">{currentFacility.name}</h3>
                <p className="text-xs text-charcoal-muted mt-0.5">{currentFacility.address} • {currentFacility.area}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-900 uppercase w-fit">
                {currentFacility.category}
              </span>
            </div>

            {/* Big Prominent Toggle Switch */}
            <div className="p-4 rounded-2xl bg-surface-bg border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-charcoal flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isAvail ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>Live Network Status:</span>
                  <span className={`font-extrabold uppercase ${isAvail ? 'text-brand-600' : 'text-status-red'}`}>
                    {isAvail ? 'Available Now' : 'Temporarily Unavailable'}
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-muted mt-1">
                  Last update: {formatTimeAgo(currentFacility.lastConfirmedAt)} by {currentFacility.lastConfirmedBy}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={isUpdating}
                  onClick={() => handleToggle(true)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAvail
                      ? 'bg-brand-500 text-white shadow-sm ring-2 ring-brand-500/20'
                      : 'bg-surface-card hover:bg-surface-hover text-charcoal border border-surface-border'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Available Now</span>
                </button>

                <button
                  disabled={isUpdating}
                  onClick={() => handleToggle(false)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    !isAvail
                      ? 'bg-status-red text-white shadow-sm ring-2 ring-status-red/20'
                      : 'bg-surface-card hover:bg-surface-hover text-charcoal border border-surface-border'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark Unavailable</span>
                </button>
              </div>
            </div>

            {/* Broadcast Notice Input */}
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Broadcast Operational Notice to Nearby Workers:
              </label>
              <input
                type="text"
                value={maintenanceNote}
                onChange={e => setMaintenanceNote(e.target.value)}
                placeholder="e.g. Regular RO filter sanitization completed; chilled water available"
                className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Access Rules & Operating Hours (Editable) */}
            <div className="pt-4 border-t border-surface-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider">
                    Operating Schedule & Access Rules
                  </h4>
                  <p className="text-[11px] text-charcoal-muted">
                    Commuters and outdoor workers rely on accurate hours and entry policies.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-1.5 px-3 rounded-xl bg-surface-bg hover:bg-brand-50 border border-surface-border hover:border-brand-300 text-xs font-bold text-brand-700 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Schedule & Policy</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-1">
                  <span className="font-bold text-charcoal block">Access Policy & Fee</span>
                  <div className="text-charcoal-muted font-medium text-xs">
                    {currentFacility.accessCondition === 'public'
                      ? 'Unrestricted Free Public Access'
                      : currentFacility.accessCondition === 'customers_only'
                      ? 'Customers & Outdoor Workers Welcome'
                      : 'Permission Required (Ask Counter)'}
                  </div>
                  {currentFacility.accessNotes && (
                    <div className="text-[11px] text-charcoal mt-1 bg-surface-card p-2 rounded-lg border border-surface-border">
                      {currentFacility.accessNotes}
                    </div>
                  )}
                  <div className="text-[11px] text-brand-700 font-semibold pt-1">
                    Fee: {currentFacility.fee}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-1">
                  <span className="font-bold text-charcoal block">Operating Hours</span>
                  <div className="text-charcoal font-semibold text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600" />
                    <span>
                      {currentFacility.operatingHours?.is24x7
                        ? '24/7 Continuous Operation'
                        : `${currentFacility.operatingHours?.openTime} – ${currentFacility.operatingHours?.closeTime}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-charcoal-muted">
                    Schedule: {currentFacility.operatingHours?.daysNote || 'Daily'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Check-ins preview */}
            <div className="pt-4 border-t border-surface-border">
              <h4 className="font-bold text-xs text-charcoal uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
                <span>Recent Worker Check-in Log for this Facility</span>
              </h4>
              <div className="space-y-2">
                {currentFacility.evidenceHistory && currentFacility.evidenceHistory.length > 0 ? (
                  currentFacility.evidenceHistory.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-surface-bg border border-surface-border text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-charcoal">
                          {ev.note || (ev.status === 'available' ? 'Worker confirmed usable' : 'Problem reported')}
                        </div>
                        <div className="text-[11px] text-charcoal-muted mt-0.5">
                          Reported by {ev.reporterRole || 'Visitor'} • {formatTimeAgo(ev.timestamp)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ev.status === 'available'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-charcoal-muted">No worker check-ins logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GUEST & COMMUNITY PROBLEM REPORTS */}
      {activeSubTab === 'reports' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-charcoal">
                Community Reports for {currentFacility.name}
              </h3>
              <p className="text-xs text-charcoal-muted">
                Feedback reported by commuters, outdoor workers, and delivery partners.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900">
              {reports.length} Total Reports ({openReportsCount} Open)
            </span>
          </div>

          {isLoadingReports ? (
            <div className="p-6 text-center text-xs text-charcoal-muted">
              Loading community reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center bg-surface-bg rounded-2xl border border-surface-border space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="font-bold text-xs text-charcoal">No Active Complaints</div>
              <p className="text-[11px] text-charcoal-muted max-w-sm mx-auto">
                No users have reported issues with this facility. Visitors have confirmed this location is operational.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(rep => {
                const isPending = rep.status === 'pending' || rep.status === 'investigating';
                return (
                  <div
                    key={rep.id}
                    className={`p-4 rounded-2xl border text-xs space-y-3 transition-colors ${
                      isPending ? 'bg-amber-50/40 border-amber-200' : 'bg-surface-bg border-surface-border opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.severity === 'high'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {rep.severity} Severity
                          </span>
                          <span className="font-bold text-charcoal capitalize">
                            {rep.issueType.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal mt-1.5 leading-relaxed font-medium">
                          "{rep.note}"
                        </p>
                        <div className="text-[11px] text-charcoal-muted mt-1">
                          Reported by <strong className="text-charcoal">{rep.reporterName}</strong> ({rep.reporterRole === 'worker' ? 'Delivery Fleet Partner' : 'Guest / Commuter'}) • {formatTimeAgo(rep.timestamp)}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    {isPending && (
                      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id)}
                          className="py-1.5 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Fixed & Broadcast Available</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: FIELD WORKER HYGIENE INSPECTIONS */}
      {activeSubTab === 'inspections' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-charcoal">
                Field Hygiene Audits for {currentFacility.name}
              </h3>
              <p className="text-xs text-charcoal-muted">
                Physical sanitation audits conducted by certified field workers and delivery inspectors.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-900">
              {inspections.length} Audits
            </span>
          </div>

          {inspections.length === 0 ? (
            <div className="p-8 text-center bg-surface-bg rounded-2xl border border-surface-border space-y-2">
              <ClipboardCheck className="w-8 h-8 text-charcoal-muted mx-auto" />
              <div className="font-bold text-xs text-charcoal">No Physical Audits Recorded Yet</div>
              <p className="text-[11px] text-charcoal-muted max-w-sm mx-auto">
                Outdoor workers and delivery riders can conduct physical quality audits upon arrival to confirm water cleanliness and washroom hygiene.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map(insp => (
                <div
                  key={insp.id}
                  className="p-4 rounded-2xl bg-surface-bg border border-surface-border text-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-bold text-sm tracking-widest">
                          {'★'.repeat(insp.hygieneRating)}{'☆'.repeat(5 - insp.hygieneRating)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          insp.cleanlinessStatus === 'spotless'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-brand-100 text-brand-800'
                        }`}>
                          {insp.cleanlinessStatus.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-charcoal-muted mt-1">
                        Inspected by <strong className="text-charcoal">{insp.workerName}</strong> • {formatTimeAgo(insp.inspectedAt)}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                      Verified Usable
                    </span>
                  </div>

                  {/* Checklist Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2 border-t border-surface-border">
                    <div className="flex items-center gap-1.5 text-charcoal">
                      <Droplets className="w-3.5 h-3.5 text-brand-600" />
                      <span>Water: {insp.waterQualityStatus ? insp.waterQualityStatus.replace('_', ' ') : 'Potable'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-charcoal">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                      <span>Safety: {insp.safetyRating.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-charcoal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{insp.suppliesPresent ? 'Supplies Present' : 'Supplies Low'}</span>
                    </div>
                  </div>

                  {insp.notes && (
                    <p className="text-xs text-charcoal font-medium bg-surface-card p-2.5 rounded-xl border border-surface-border leading-relaxed">
                      "{insp.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT OPERATING SCHEDULE & ACCESS POLICY MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-card w-full max-w-lg rounded-3xl border border-surface-border shadow-sheet p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div>
                <h3 className="font-bold text-base text-charcoal">
                  Edit Operating Rules & Hours
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Update timings and entry rules for {currentFacility.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-xl text-charcoal-muted hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacilityDetails} className="space-y-4 text-xs">
              {/* Access Condition */}
              <div className="space-y-1.5">
                <label className="block font-bold text-charcoal">
                  Access Policy Condition
                </label>
                <select
                  value={editAccessCondition}
                  onChange={e => setEditAccessCondition(e.target.value as AccessCondition)}
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                >
                  <option value="public">Unrestricted Free Public Access (Anyone can use)</option>
                  <option value="customers_only">Customers & Outdoor Workers Welcome</option>
                  <option value="permission_required">Permission Required (Ask Counter / Guard)</option>
                </select>
              </div>

              {/* Access Notes */}
              <div className="space-y-1.5">
                <label className="block font-bold text-charcoal">
                  Access Instructions & Gate Policy
                </label>
                <input
                  type="text"
                  value={editAccessNotes}
                  onChange={e => setEditAccessNotes(e.target.value)}
                  placeholder="e.g. Washroom key at billing desk. Outdoor delivery riders welcome to refill bottles."
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                />
              </div>

              {/* Fee */}
              <div className="space-y-1.5">
                <label className="block font-bold text-charcoal">
                  Fee Structure
                </label>
                <input
                  type="text"
                  value={editFee}
                  onChange={e => setEditFee(e.target.value)}
                  placeholder="e.g. Free, Free for riders, ₹5 upkeep"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                />
              </div>

              {/* Operating Hours */}
              <div className="pt-2 border-t border-surface-border space-y-3">
                <span className="font-bold text-charcoal uppercase tracking-wider block text-[11px]">
                  Operating Hours
                </span>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-charcoal">
                  <input
                    type="checkbox"
                    checked={editIs24x7}
                    onChange={e => setEditIs24x7(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Open 24 Hours / 7 Days a Week (24/7 Continuous)</span>
                </label>

                {!editIs24x7 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                        Opening Time
                      </label>
                      <input
                        type="time"
                        value={editOpenTime}
                        onChange={e => setEditOpenTime(e.target.value)}
                        className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                        Closing Time
                      </label>
                      <input
                        type="time"
                        value={editCloseTime}
                        onChange={e => setEditCloseTime(e.target.value)}
                        className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-charcoal-muted mb-1">
                        Days Active / Schedule Note
                      </label>
                      <input
                        type="text"
                        value={editDaysNote}
                        onChange={e => setEditDaysNote(e.target.value)}
                        placeholder="e.g. Daily, Monday – Saturday, All days except Sundays"
                        className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails}
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDetails ? 'Saving...' : 'Save Operational Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
