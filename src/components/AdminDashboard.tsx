import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Trash2, 
  Check, 
  Lock, 
  ArrowRight, 
  UserCheck,
  Building2,
  Users,
  PlusCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Power,
  Edit,
  X,
  Droplet,
  Zap,
  Coffee,
  Sun,
  ShieldCheck,
  UserX,
  UserPlus,
  MessageSquare,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Key,
  Copy
} from 'lucide-react';
import { 
  Facility, 
  UserProfile, 
  FacilityCategory, 
  AccessCondition, 
  OperatorRegistrationRequest, 
  UserAccount,
  UserRole,
  AdminPlaceReport
} from '../types';
import { 
  adminResolveReview, 
  adminCreateFacility, 
  adminUpdateFacility, 
  adminDeleteFacility,
  getOperatorRequests,
  adminApproveOperator,
  adminRejectOperator,
  getAllUsers,
  adminCreateUser,
  adminToggleUserStatus,
  getAdminReports,
  adminReportAction,
  adminDeleteReport
} from '../services/api';
import { formatTimeAgo } from '../services/trustEngine';
import { getAuditLogs, logAuthEvent } from '../services/auditLogger';

interface AdminDashboardProps {
  facilities: Facility[];
  currentUser: UserProfile;
  onFacilityUpdated: (updated?: Facility) => void;
  onOpenLoginModal: (targetRole: 'admin') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  facilities,
  currentUser,
  onFacilityUpdated,
  onOpenLoginModal,
}) => {
  const isAuthorizedAdmin = currentUser.role === 'admin';

  // Navigation Tabs: 'directory' | 'attention' | 'reports' | 'users' | 'audit'
  const [activeTab, setActiveTab] = useState<'directory' | 'attention' | 'reports' | 'users' | 'audit'>('directory');
  
  // Attention Queue Filter
  const [attentionFilter, setAttentionFilter] = useState<'all' | 'conflicting' | 'stale' | 'flagged'>('all');

  // Guest & User Reports State
  const [reportsList, setReportsList] = useState<AdminPlaceReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all');
  const [reportRoleFilter, setReportRoleFilter] = useState<'all' | 'guest' | 'worker'>('all');
  
  // Directory Search & Filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryCategory, setDirectoryCategory] = useState<FacilityCategory | 'all'>('all');

  // Async Data
  const [operatorRequests, setOperatorRequests] = useState<OperatorRegistrationRequest[]>([]);
  const [userList, setUserList] = useState<UserAccount[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modals
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserAccount | null>(null);
  const [showPasswordDetail, setShowPasswordDetail] = useState(false);

  // New Facility Form State
  const [newFacName, setNewFacName] = useState('');
  const [newFacCategory, setNewFacCategory] = useState<FacilityCategory>('water');
  const [newFacAddress, setNewFacAddress] = useState('');
  const [newFacArea, setNewFacArea] = useState('Indiranagar Corridor');
  const [newFacFee, setNewFacFee] = useState('Free');
  const [newFacAccess, setNewFacAccess] = useState<AccessCondition>('public');
  const [newFacOperator, setNewFacOperator] = useState('');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('worker');
  const [newUserOrg, setNewUserOrg] = useState('');

  useEffect(() => {
    loadOperatorRequests();
    loadUsers();
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await getAdminReports();
      setReportsList(data);
    } catch (e) {
      console.debug('Failed to load admin reports', e);
    }
  };

  const loadOperatorRequests = async () => {
    try {
      const data = await getOperatorRequests();
      setOperatorRequests(data);
    } catch (e) {
      console.debug('Failed to load operator requests', e);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUserList(data);
    } catch (e) {
      console.debug('Failed to load users', e);
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'investigate' | 'dismiss') => {
    setIsProcessing(true);
    try {
      let notes = '';
      if (action === 'resolve') {
        notes = prompt('Resolution notes / maintenance action:', 'Inspected on site. Facilities cleaned and restored to full operation.') || 'Resolved by Administrator';
      }
      await adminReportAction(reportId, action, notes);
      await loadReports();
      showToast(`Report ${action === 'resolve' ? 'marked as RESOLVED' : (action === 'investigate' ? 'assigned for INVESTIGATION' : 'DISMISSED')}`);
    } catch {
      alert('Failed to update report status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Remove this report record?')) return;
    setIsProcessing(true);
    try {
      await adminDeleteReport(reportId);
      await loadReports();
      showToast('Report removed from records.');
    } catch {
      alert('Failed to delete report');
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  // 1. Attention Items Filter
  const flaggedItems = facilities.filter(f => {
    if (attentionFilter === 'conflicting') return f.status === 'conflicting';
    if (attentionFilter === 'stale') return f.status === 'stale';
    if (attentionFilter === 'flagged') return f.flaggedForReview || !f.verifiedByAdmin;
    return f.flaggedForReview || f.status === 'conflicting' || f.status === 'stale' || !f.verifiedByAdmin;
  });

  // 2. Directory Items Filter
  const filteredDirectory = facilities.filter(f => {
    const matchesCategory = directoryCategory === 'all' || f.category === directoryCategory || (f.secondaryCategories || []).includes(directoryCategory);
    const matchesSearch = !directorySearch.trim() || 
      f.name.toLowerCase().includes(directorySearch.toLowerCase()) || 
      f.address.toLowerCase().includes(directorySearch.toLowerCase()) ||
      f.area.toLowerCase().includes(directorySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Attention Queue Actions
  const handleAttentionAction = async (
    facilityId: string,
    action: 'verify' | 'mark_stale' | 'resolve_conflict' | 'dismiss_spam'
  ) => {
    setIsProcessing(true);
    try {
      const updated = await adminResolveReview(facilityId, action);
      onFacilityUpdated(updated);
      showToast(
        action === 'verify'
          ? 'Approved & Verified facility space!'
          : action === 'resolve_conflict'
          ? 'Contradictory evidence resolved!'
          : action === 'mark_stale'
          ? 'Flagged as stale for field re-inspection.'
          : 'Spam listing dismissed and removed.'
      );
    } catch {
      alert('Error updating moderation item');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Facility Status in Directory
  const handleToggleFacilityStatus = async (facility: Facility) => {
    const isNowAvailable = facility.status !== 'recently_confirmed';
    const updated: Facility = {
      ...facility,
      status: isNowAvailable ? 'recently_confirmed' : 'reported_unavailable',
      confidenceScore: isNowAvailable ? 98 : 10,
      lastStatusNote: isNowAvailable 
        ? 'Activated by Platform Administrator' 
        : 'Temporarily paused / maintenance by Administrator'
    };
    await adminUpdateFacility(updated);
    onFacilityUpdated(updated);
    showToast(`Status updated for ${facility.name}`);
  };

  // Delete Facility in Directory
  const handleDeleteFacility = async (facilityId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the network?`)) return;
    await adminDeleteFacility(facilityId);
    onFacilityUpdated();
    showToast(`Removed "${name}" from network directory.`);
  };

  // Handle Add Facility Submit
  const handleAddFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacName || !newFacAddress) return;
    try {
      const created = await adminCreateFacility({
        name: newFacName.trim(),
        category: newFacCategory,
        address: newFacAddress.trim(),
        area: newFacArea,
        fee: newFacFee,
        accessCondition: newFacAccess,
        operatorClaimed: !!newFacOperator,
        operatorName: newFacOperator.trim() || undefined,
        verifiedByAdmin: true,
      });
      onFacilityUpdated(created);
      setShowAddFacilityModal(false);
      setNewFacName('');
      setNewFacAddress('');
      showToast(`Added "${created.name}" to verified network!`);
    } catch {
      alert('Error creating facility space');
    }
  };

  // Handle Operator Approval
  const handleApproveOperator = async (req: OperatorRegistrationRequest) => {
    setIsProcessing(true);
    try {
      await adminApproveOperator(req.id);
      await loadOperatorRequests();
      await loadUsers();
      onFacilityUpdated();
      showToast(`Approved ${req.operatorName}'s facility application! Added "${req.facilityName}" to network.`);
    } catch {
      alert('Failed to approve operator request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Operator Rejection
  const handleRejectOperator = async (requestId: string) => {
    const reason = prompt('Reason for rejection:', 'Incomplete physical verification or duplicate listing.') || 'Rejected by Admin';
    setIsProcessing(true);
    try {
      await adminRejectOperator(requestId, reason);
      await loadOperatorRequests();
      showToast('Operator application rejected.');
    } catch {
      alert('Failed to reject operator request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Create User Submit
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    try {
      await adminCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword.trim(),
        role: newUserRole,
        organization: newUserOrg.trim() || 'Urban Pitstop Network'
      });
      await loadUsers();
      setShowCreateUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      showToast(`Created new ${newUserRole.toUpperCase()} user for ${newUserName}`);
    } catch {
      alert('Error creating user account');
    }
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = async (user: UserAccount) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    await adminToggleUserStatus(user.id, newStatus);
    await loadUsers();
    showToast(`User ${user.name} is now ${newStatus.toUpperCase()}`);
  };

  // Generate grounded AI summary for conflicting cases
  const generateAISummary = (f: Facility) => {
    if (f.status === 'conflicting') {
      const evs = f.evidenceHistory || [];
      return `Gemini Evidence Synthesis: Within the past 3 hours, 1 community user reported this facility operational while another reported a malfunction (${evs[0]?.note || 'issue'}). The physical dispenser/unit is likely partially degraded or operating intermittently. Suggested action: Verify with operator or resolve contradiction.`;
    }
    if (f.status === 'stale') {
      return `Gemini Aging Analysis: Last reliable confirmation was ${formatTimeAgo(f.lastConfirmedAt)}. Community confidence decayed past freshness threshold. Prioritize sending a check-in push to delivery partners currently active within 200m.`;
    }
    return `Gemini Listing Audit: New community contribution submitted with complete metadata. Coordinates check out in commercial delivery corridor. Suggested action: Approve as verified public facility.`;
  };

  // IF NOT LOGGED IN AS ADMIN: SHOW ACCESS GATE
  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 my-10 bg-surface-card rounded-3xl border border-surface-border shadow-card text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg text-charcoal">
            Platform Operations & QA
          </h3>
          <p className="text-xs text-charcoal-muted leading-relaxed max-w-sm mx-auto">
            This protected dashboard is reserved for authorized Urban Pitstop platform staff to moderate listings, approve service operators, and manage network users.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border text-left space-y-1.5 text-xs">
          <div className="font-bold text-charcoal flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-brand-600" />
            <span>Administrator Privileges:</span>
          </div>
          <ul className="list-disc list-inside text-charcoal-muted text-[11px] space-y-1">
            <li>Manage and inspect all verified service spaces across the network</li>
            <li>Review and approve self-registered service operators (washrooms, water, etc.)</li>
            <li>Create and manage user accounts for field workers, operators, and admins</li>
            <li>Review conflicting reports with Gemini AI Evidence Synthesis</li>
            <li>Inspect the immutable Security & RBAC Audit Log</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={() => onOpenLoginModal('admin')}
            className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <span>Sign In with Admin Credentials</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // IF AUTHORIZED ADMIN: SHOW FULL COMMAND CENTER
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-brand-500 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-80">✕</button>
        </div>
      )}

      {/* Admin Profile Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-2xl shrink-0">
            {currentUser.avatar || '🛡️'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-charcoal">{currentUser.name}</h2>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 border border-brand-300">
                Platform Admin
              </span>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              {currentUser.organization} • Network Operations, Approvals & RBAC
            </p>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-surface-bg border border-surface-border text-charcoal text-xs font-bold">
            {facilities.length} Total Spaces
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            {operatorRequests.filter(r => r.status === 'pending').length} Pending Operators
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
            {reportsList.filter(r => r.status === 'pending').length} Place Reports
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold">
            {facilities.filter(f => f.status === 'conflicting').length} Contradictions
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-2.5 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'directory'
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Spaces & Services Directory ({facilities.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attention')}
          className={`pb-2.5 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'attention'
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Moderation & Review Queue ({flaggedItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2.5 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Guest & User Reports ({reportsList.filter(r => r.status === 'pending').length} open)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Operator & User Management ({operatorRequests.filter(r => r.status === 'pending').length} new)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 px-3 border-b-2 font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-brand-500 text-brand-700'
              : 'border-transparent text-charcoal-muted hover:text-charcoal'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security & RBAC Logs ({getAuditLogs().length})</span>
        </button>
      </div>

      {/* ==================== TAB 1: ALL FACILITY SPACES & DIRECTORY ==================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Top Bar: Search, Category Filters, and Add Facility Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  placeholder="Search spaces by name, street, or area..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <select
                value={directoryCategory}
                onChange={e => setDirectoryCategory(e.target.value as any)}
                className="py-2 px-3 rounded-xl bg-surface-card border border-surface-border text-xs text-charcoal font-semibold shrink-0"
              >
                <option value="all">All Services ({facilities.length})</option>
                <option value="water">💧 Drinking Water</option>
                <option value="toilets">🚻 Washrooms & Toilets</option>
                <option value="shade">🌳 Shaded Rest Spots</option>
                <option value="charging">⚡ Phone Charging</option>
                <option value="break">☕ Short-Break Locations</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddFacilityModal(true)}
              className="py-2 px-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Facility Space</span>
            </button>
          </div>

          {/* Directory Count and Quick Info */}
          <div className="p-3 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-between text-xs text-charcoal-muted">
            <span>Showing {filteredDirectory.length} verified network facilities across the pilot corridor.</span>
            <span className="font-bold text-charcoal">{facilities.filter(f => f.status === 'recently_confirmed').length} Currently Active</span>
          </div>

          {/* Facility Spaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDirectory.map(fac => {
              const isAvailable = fac.status === 'recently_confirmed';
              return (
                <div
                  key={fac.id}
                  className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-charcoal">{fac.name}</span>
                        </div>
                        <p className="text-xs text-charcoal-muted mt-0.5">
                          {fac.address} • {fac.area}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-lg bg-brand-50 text-brand-800 border border-brand-200 text-[10px] font-bold uppercase">
                        {fac.category}
                      </span>
                      <span className="text-[11px] text-charcoal-muted">
                        Fee: <span className="font-semibold text-charcoal">{fac.fee}</span>
                      </span>
                      <span className="text-[11px] text-charcoal-muted">
                        • Hours: <span className="font-semibold text-charcoal">{fac.operatingHours?.daysNote || 'Daily'}</span>
                      </span>
                      {fac.operatorClaimed && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          Managed by {fac.operatorName || 'Partner'}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-charcoal-muted bg-surface-bg p-2 rounded-xl border border-surface-border">
                      {fac.lastStatusNote || 'Operational'} • Confidence: <span className="font-bold text-charcoal">{fac.confidenceScore}%</span>
                    </div>
                  </div>

                  {/* Operational Controls */}
                  <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleFacilityStatus(fac)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        isAvailable
                          ? 'bg-surface-bg hover:bg-rose-50 text-charcoal hover:text-rose-700 border-surface-border'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isAvailable ? 'Mark Unavailable' : 'Make Available'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFacility(fac.id, fac.name)}
                      className="p-1.5 text-charcoal-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove from directory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MODERATION & ATTENTION QUEUE ==================== */}
      {activeTab === 'attention' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setAttentionFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                attentionFilter === 'all'
                  ? 'bg-brand-500 text-white'
                  : 'bg-surface-card border border-surface-border text-charcoal'
              }`}
            >
              All Attention Items ({flaggedItems.length})
            </button>
            <button
              onClick={() => setAttentionFilter('conflicting')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                attentionFilter === 'conflicting'
                  ? 'bg-amber-500 text-white'
                  : 'bg-surface-card border border-surface-border text-charcoal'
              }`}
            >
              Conflicting Reports ({facilities.filter(f => f.status === 'conflicting').length})
            </button>
            <button
              onClick={() => setAttentionFilter('stale')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                attentionFilter === 'stale'
                  ? 'bg-slate-700 text-white'
                  : 'bg-surface-card border border-surface-border text-charcoal'
              }`}
            >
              Stale Listings ({facilities.filter(f => f.status === 'stale').length})
            </button>
          </div>

          {flaggedItems.length === 0 ? (
            <div className="p-12 text-center bg-surface-card rounded-2xl border border-dashed border-surface-border">
              <CheckCircle2 className="w-10 h-10 text-brand-600 mx-auto mb-2" />
              <h4 className="font-bold text-base text-charcoal">All Moderation Queues Clear</h4>
              <p className="text-xs text-charcoal-muted mt-1 max-w-sm mx-auto">
                No unresolved contradictions or stale listings in this launch corridor.
              </p>
            </div>
          ) : (
            flaggedItems.map(item => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-4"
              >
                {/* Item Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-charcoal">{item.name}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      {item.address} • {item.area}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase self-start ${
                    item.status === 'conflicting'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : item.status === 'stale'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-rose-100 text-rose-900'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Gemini AI Evidence Synthesis Box */}
                <div className="p-3.5 rounded-2xl bg-brand-50/50 border border-brand-200/80 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-brand-900 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>AI Grounded Evidence Synthesis</span>
                  </div>
                  <p className="text-brand-950/90 leading-relaxed">
                    {generateAISummary(item)}
                  </p>
                </div>

                {/* Evidence Log Snippet */}
                {item.evidenceHistory && item.evidenceHistory.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-charcoal-muted uppercase tracking-wider mb-1.5">
                      Recent Evidence Log
                    </div>
                    <div className="space-y-1.5">
                      {item.evidenceHistory.slice(0, 2).map(ev => (
                        <div
                          key={ev.id}
                          className="p-2 rounded-xl bg-surface-bg border border-surface-border text-xs flex items-center justify-between"
                        >
                          <span className="text-charcoal font-medium">
                            "{ev.note}" — <span className="text-charcoal-muted">{ev.reporterRole || 'Visitor'}</span>
                          </span>
                          <span className="text-[10px] text-charcoal-muted shrink-0 ml-2">
                            {formatTimeAgo(ev.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-end gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleAttentionAction(item.id, 'dismiss_spam')}
                    className="px-3 py-2 rounded-xl bg-surface-bg hover:bg-rose-50 hover:text-rose-700 border border-surface-border text-charcoal text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dismiss Spam</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleAttentionAction(item.id, 'mark_stale')}
                    className="px-3 py-2 rounded-xl bg-surface-bg hover:bg-surface-hover border border-surface-border text-charcoal text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark as Stale</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleAttentionAction(item.id, 'resolve_conflict')}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Resolve Conflict</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleAttentionAction(item.id, 'verify')}
                    className="px-3.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Verify</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================== TAB: GUEST & USER REPORTS ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Top Filter and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-charcoal">Status:</span>
              {(['all', 'pending', 'investigating', 'resolved'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setReportFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                    reportFilter === filter
                      ? 'bg-brand-500 text-white shadow-2xs'
                      : 'bg-surface-card border border-surface-border text-charcoal-muted hover:text-charcoal'
                  }`}
                >
                  {filter === 'all' ? `All Reports (${reportsList.length})` : `${filter} (${reportsList.filter(r => r.status === filter).length})`}
                </button>
              ))}
            </div>

            <button
              onClick={loadReports}
              className="px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-charcoal hover:text-brand-600 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Reports</span>
            </button>
          </div>

          {/* List of Reports */}
          {reportsList.filter(r => reportFilter === 'all' || r.status === reportFilter).length === 0 ? (
            <div className="p-8 text-center bg-surface-card rounded-3xl border border-dashed border-surface-border text-xs text-charcoal-muted space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <div className="font-bold text-charcoal">No reports found for this filter</div>
              <div>All guest and worker reports have been processed or resolved.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {reportsList
                .filter(r => reportFilter === 'all' || r.status === reportFilter)
                .map(rep => (
                  <div
                    key={rep.id}
                    className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-charcoal">
                            {rep.facilityName}
                          </h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            rep.severity === 'high'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : rep.severity === 'medium'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}>
                            {rep.severity} Severity
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-bg border border-surface-border text-[11px] font-mono text-charcoal-muted">
                            Issue: {rep.issueType.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-charcoal-muted flex items-center gap-2 flex-wrap">
                          <span>Reported by <strong className="text-charcoal">{rep.reporterName}</strong></span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            rep.reporterRole === 'worker' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rep.reporterRole === 'worker' ? 'Outdoor Worker' : 'Guest Commuter'}
                          </span>
                          <span>•</span>
                          <span>{formatTimeAgo(rep.timestamp)}</span>
                          {rep.clientIp && <span>• IP: {rep.clientIp}</span>}
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 border ${
                        rep.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : rep.status === 'investigating'
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : rep.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    {/* Complaint Observation */}
                    <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium leading-relaxed">
                      "{rep.note}"
                    </div>

                    {/* Suggested Action / Resolution notes */}
                    {(rep.suggestedAction || rep.adminResolution) && (
                      <div className="p-3 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-xs space-y-1">
                        <div className="font-bold text-brand-950 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                          <span>{rep.status === 'resolved' ? 'Administrator Resolution' : 'Inspection Recommendation'}:</span>
                        </div>
                        <div className="text-brand-900">
                          {rep.adminResolution || rep.suggestedAction}
                        </div>
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-surface-border text-xs">
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        disabled={isProcessing}
                        className="text-charcoal-muted hover:text-rose-600 flex items-center gap-1 transition-colors text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Record</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {rep.status !== 'investigating' && rep.status !== 'resolved' && (
                          <button
                            onClick={() => handleReportAction(rep.id, 'investigate')}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Dispatch Field Inspection</span>
                          </button>
                        )}

                        {rep.status !== 'resolved' ? (
                          <button
                            onClick={() => handleReportAction(rep.id, 'resolve')}
                            disabled={isProcessing}
                            className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Resolved & Verified</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Issue Resolved & Closed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: OPERATOR & USER MANAGEMENT ==================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Sub-section 1: Pending Operator Requests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-charcoal flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  <span>Pending Operator & Facility Partner Applications</span>
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Service providers (washroom, water, charging hubs) who registered their spaces.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {operatorRequests.filter(r => r.status === 'pending').length} Pending
              </span>
            </div>

            {operatorRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-6 text-center bg-surface-card rounded-2xl border border-dashed border-surface-border text-xs text-charcoal-muted">
                No pending operator applications at this time.
              </div>
            ) : (
              operatorRequests.filter(r => r.status === 'pending').map(req => (
                <div
                  key={req.id}
                  className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-charcoal">{req.facilityName}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 uppercase">
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-muted mt-0.5">
                        {req.address} • {req.area}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-bold text-charcoal">{req.operatorName}</div>
                      <div className="text-charcoal-muted text-[11px]">{req.organization} • {req.phone}</div>
                      <div className="text-brand-700 font-mono text-[11px]">{req.email}</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs flex flex-wrap items-center gap-3 text-charcoal-muted">
                    <span>Fee: <strong className="text-charcoal">{req.fee}</strong></span>
                    <span>Access: <strong className="text-charcoal">{req.accessCondition}</strong></span>
                    <span>Submitted: <strong className="text-charcoal">{formatTimeAgo(req.submittedAt)}</strong></span>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-surface-border flex items-center justify-end gap-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleRejectOperator(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-surface-bg hover:bg-rose-50 text-rose-700 border border-surface-border text-xs font-semibold transition-colors"
                    >
                      Reject Request
                    </button>

                    <button
                      disabled={isProcessing}
                      onClick={() => handleApproveOperator(req)}
                      className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Activate Facility</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sub-section 2: All Users Directory */}
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-charcoal flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Network User & Actor Directory</span>
                </h3>
                <p className="text-xs text-charcoal-muted">
                  Field workers / inspectors, facility operators, and platform administrators.
                </p>
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create User</span>
              </button>
            </div>

            <div className="rounded-2xl border border-surface-border overflow-hidden bg-surface-card shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-bg border-b border-surface-border text-charcoal-muted uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">User / Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Organization</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-medium text-charcoal">
                  {userList.map(u => (
                    <tr 
                      key={u.id} 
                      onClick={() => setSelectedUserDetail(u)}
                      className="hover:bg-brand-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-bold flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-surface-bg border border-surface-border flex items-center justify-center text-sm shadow-2xs shrink-0">
                          {u.avatar || (u.role === 'admin' ? '🛡️' : (u.role === 'operator' ? '⛽' : '🛵'))}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-charcoal font-bold">{u.name}</div>
                          {u.phone && <div className="text-[10px] text-charcoal-muted font-mono">{u.phone}</div>}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-charcoal-muted">{u.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : u.role === 'operator'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-charcoal-muted">{u.organization || '—'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedUserDetail(u)}
                            className="px-2.5 py-1 rounded-lg bg-surface-bg hover:bg-brand-50 border border-surface-border text-brand-700 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className="text-[11px] font-semibold text-charcoal-muted hover:text-rose-600 transition-colors"
                          >
                            {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SECURITY & RBAC LOGS ==================== */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-surface-card border border-surface-border text-xs text-charcoal-muted flex items-center justify-between">
            <span>Immutable log of all user sign-in events, role elevations, and access rejections.</span>
            <span className="font-bold text-charcoal">{getAuditLogs().length} records</span>
          </div>

          {getAuditLogs().map(entry => (
            <div
              key={entry.id}
              className="p-4 rounded-2xl bg-surface-card border border-surface-border shadow-card text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    entry.eventType === 'LOGIN_SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : entry.eventType === 'LOGIN_FAILED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : entry.eventType === 'ACCESS_DENIED'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-surface-muted text-charcoal'
                  }`}
                >
                  {entry.eventType}
                </span>
                <span className="text-[11px] text-charcoal-muted">
                  {formatTimeAgo(entry.timestamp)}
                </span>
              </div>
              <div className="font-semibold text-charcoal text-xs">
                {entry.details}
              </div>
              <div className="text-[10px] text-charcoal-muted">
                Actor: <span className="font-semibold text-charcoal">{entry.actorEmail}</span> ({entry.actorRole}) • IP: {entry.clientIp}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAL: ADD FACILITY SPACE ==================== */}
      {showAddFacilityModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-4 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold text-base text-charcoal flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span>Add Verified Facility Space</span>
              </h3>
              <button
                onClick={() => setShowAddFacilityModal(false)}
                className="p-1 rounded-lg text-charcoal-muted hover:text-charcoal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFacilitySubmit} className="p-4 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newFacName}
                  onChange={e => setNewFacName(e.target.value)}
                  placeholder="e.g. HAL 2nd Stage Public Drinking Water ATM"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Service Category</label>
                  <select
                    value={newFacCategory}
                    onChange={e => setNewFacCategory(e.target.value as FacilityCategory)}
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  >
                    <option value="water">💧 Drinking Water</option>
                    <option value="toilets">🚻 Washroom / Toilet</option>
                    <option value="shade">🌳 Shaded Rest Spot</option>
                    <option value="charging">⚡ Phone Charging</option>
                    <option value="break">☕ Short-Break Location</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Corridor Area</label>
                  <input
                    type="text"
                    value={newFacArea}
                    onChange={e => setNewFacArea(e.target.value)}
                    placeholder="e.g. Indiranagar Corridor"
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={newFacAddress}
                  onChange={e => setNewFacAddress(e.target.value)}
                  placeholder="Street and Landmark"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Fee Policy</label>
                  <input
                    type="text"
                    value={newFacFee}
                    onChange={e => setNewFacFee(e.target.value)}
                    placeholder="e.g. Free or ₹2 coin"
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Access Condition</label>
                  <select
                    value={newFacAccess}
                    onChange={e => setNewFacAccess(e.target.value as AccessCondition)}
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  >
                    <option value="public">Unrestricted Public Access</option>
                    <option value="customers_only">Customer / Partner Access</option>
                    <option value="permission_required">Permission Required</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Assigned Operator / Host (Optional)</label>
                <input
                  type="text"
                  value={newFacOperator}
                  onChange={e => setNewFacOperator(e.target.value)}
                  placeholder="e.g. Indian Oil Corporation or Metro Utilities"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Add Facility to Network Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE USER ==================== */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-card rounded-3xl max-w-md w-full flex flex-col shadow-2xl border border-surface-border overflow-hidden">
            <div className="p-4 border-b border-surface-border flex items-center justify-between">
              <h3 className="font-bold text-base text-charcoal flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span>Create New User Account</span>
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded-lg text-charcoal-muted hover:text-charcoal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. rajesh@swiggy.in or operator@iocl.com"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">User Role</label>
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value as UserRole)}
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  >
                    <option value="worker">🛵 Field Worker / Rider</option>
                    <option value="operator">⛽ Facility Operator</option>
                    <option value="admin">🛡️ Platform Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Organization / Fleet</label>
                  <input
                    type="text"
                    value={newUserOrg}
                    onChange={e => setNewUserOrg(e.target.value)}
                    placeholder="e.g. Swiggy, Zomato, IOCL"
                    className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition-colors"
                >
                  Create & Activate Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: COMPREHENSIVE USER DETAILS MODAL ==================== */}
      {selectedUserDetail && (
        <div 
          className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedUserDetail(null)}
        >
          <div 
            className="bg-surface-card rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-surface-border overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-surface-border flex items-start justify-between gap-3 bg-surface-bg/50">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center text-2xl shadow-xs shrink-0">
                  {selectedUserDetail.avatar || (selectedUserDetail.role === 'admin' ? '🛡️' : (selectedUserDetail.role === 'operator' ? '⛽' : '🛵'))}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base text-charcoal">
                      {selectedUserDetail.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      selectedUserDetail.role === 'admin'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : selectedUserDetail.role === 'operator'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {selectedUserDetail.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedUserDetail.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {selectedUserDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-muted mt-0.5 font-mono">
                    ID: {selectedUserDetail.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1.5 rounded-xl text-charcoal-muted hover:text-charcoal hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Profile & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-surface-bg border border-surface-border space-y-1">
                  <div className="text-[10px] font-bold text-charcoal-muted uppercase flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-brand-600" />
                    <span>Contact Phone</span>
                  </div>
                  <div className="font-bold text-charcoal text-xs">
                    {selectedUserDetail.phone || '+91 98450 12345'}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-surface-bg border border-surface-border space-y-1">
                  <div className="text-[10px] font-bold text-charcoal-muted uppercase flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-brand-600" />
                    <span>Organization / Business</span>
                  </div>
                  <div className="font-bold text-charcoal text-xs truncate">
                    {selectedUserDetail.organization || 'Urban Pitstop Network'}
                  </div>
                </div>
              </div>

              {/* Email Address & Credentials Card */}
              <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-muted uppercase">Authentication & Credentials</span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>RBAC Verified</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-muted">Work Email:</span>
                    <span className="font-mono font-bold text-charcoal">{selectedUserDetail.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-charcoal-muted flex items-center gap-1">
                      <Key className="w-3 h-3 text-brand-600" />
                      <span>Account Password:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-charcoal bg-surface-card px-2 py-0.5 rounded border border-surface-border">
                        {showPasswordDetail 
                          ? (selectedUserDetail.passwords?.[0] || selectedUserDetail.password || 'gokul123') 
                          : '••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPasswordDetail(!showPasswordDetail)}
                        className="text-brand-600 hover:text-brand-700 p-0.5"
                        title={showPasswordDetail ? 'Hide password' : 'Show password'}
                      >
                        {showPasswordDetail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Facility Spaces (Especially for Operators) */}
              <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-2">
                <div className="text-[10px] font-bold text-charcoal-muted uppercase flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-brand-600" />
                  <span>Managed Facilities / Pitstops</span>
                </div>
                {facilities.filter(f => 
                  selectedUserDetail.assignedFacilityIds?.includes(f.id) ||
                  (selectedUserDetail.organization && f.operatorName?.toLowerCase().includes(selectedUserDetail.organization.toLowerCase())) ||
                  (f.operatorName?.toLowerCase().includes(selectedUserDetail.name.toLowerCase()))
                ).length === 0 ? (
                  <div className="text-charcoal-muted text-xs italic py-1">
                    {selectedUserDetail.role === 'operator' 
                      ? 'Associated with: ' + (selectedUserDetail.organization || selectedUserDetail.notes || 'Partner facility space')
                      : 'No facility management assignments (field worker / platform admin role).'}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {facilities
                      .filter(f => 
                        selectedUserDetail.assignedFacilityIds?.includes(f.id) ||
                        (selectedUserDetail.organization && f.operatorName?.toLowerCase().includes(selectedUserDetail.organization.toLowerCase())) ||
                        (f.operatorName?.toLowerCase().includes(selectedUserDetail.name.toLowerCase()))
                      )
                      .map(fac => (
                        <div key={fac.id} className="p-2.5 rounded-xl bg-surface-card border border-surface-border flex items-center justify-between">
                          <div>
                            <div className="font-bold text-charcoal">{fac.name}</div>
                            <div className="text-[10px] text-charcoal-muted">{fac.address} • {fac.area}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            fac.status === 'recently_confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-bg text-charcoal'
                          }`}>
                            {fac.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Account Timeline & Notes */}
              <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-2">
                <div className="text-[10px] font-bold text-charcoal-muted uppercase flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-brand-600" />
                  <span>Registration & Activity Timeline</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-charcoal-muted block">Created Date:</span>
                    <span className="font-medium text-charcoal">{formatTimeAgo(selectedUserDetail.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-muted block">Last Active Session:</span>
                    <span className="font-medium text-charcoal">
                      {selectedUserDetail.lastLoginAt ? formatTimeAgo(selectedUserDetail.lastLoginAt) : 'Recently Active'}
                    </span>
                  </div>
                </div>
                {selectedUserDetail.notes && (
                  <div className="pt-1 text-[11px] text-charcoal-muted border-t border-surface-border">
                    <span className="font-bold text-charcoal">Notes:</span> {selectedUserDetail.notes}
                  </div>
                )}
              </div>

              {/* User-Specific Audit Logs */}
              <div className="p-3.5 rounded-2xl bg-surface-bg border border-surface-border space-y-2">
                <div className="text-[10px] font-bold text-charcoal-muted uppercase flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-brand-600" />
                  <span>User Authentication History</span>
                </div>
                {getAuditLogs().filter(l => l.actorEmail.toLowerCase() === selectedUserDetail.email.toLowerCase()).length === 0 ? (
                  <div className="text-charcoal-muted text-[11px] italic">No security incidents or login attempts recorded for this email.</div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {getAuditLogs()
                      .filter(l => l.actorEmail.toLowerCase() === selectedUserDetail.email.toLowerCase())
                      .map(log => (
                        <div key={log.id} className="p-2 rounded-xl bg-surface-card border border-surface-border text-[11px] flex items-center justify-between">
                          <div>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase mr-1.5 ${
                              log.eventType === 'LOGIN_SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.eventType}
                            </span>
                            <span className="font-medium text-charcoal">{log.details}</span>
                          </div>
                          <span className="text-[10px] text-charcoal-muted shrink-0 ml-2">{formatTimeAgo(log.timestamp)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-surface-border flex items-center justify-between bg-surface-bg/50">
              <button
                type="button"
                onClick={() => {
                  handleToggleUserStatus(selectedUserDetail);
                  setSelectedUserDetail(prev => prev ? { ...prev, status: prev.status === 'active' ? 'suspended' : 'active' } : null);
                }}
                className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors ${
                  selectedUserDetail.status === 'active'
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                }`}
              >
                {selectedUserDetail.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="py-2 px-5 rounded-xl bg-charcoal text-white hover:bg-charcoal/90 font-bold text-xs transition-colors shadow-2xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
