import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Store, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowLeft,
  Building2,
  Phone,
  Clock,
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { UserProfile, UserRole, FacilityCategory, AccessCondition, OperatorRegistrationRequest } from '../types';
import { DEMO_ACCOUNTS, loginWithCredentials } from '../services/authService';
import { submitOperatorRegistration } from '../services/api';
import { formatTimeAgo } from '../services/trustEngine';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onCancel: () => void;
  targetRoleRequirement?: UserRole | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel,
  targetRoleRequirement,
}) => {
  const [viewMode, setViewMode] = useState<'login' | 'register_operator'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Operator Registration State
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');
  const [opPhone, setOpPhone] = useState('');
  const [opOrg, setOpOrg] = useState('');
  const [opFacilityName, setOpFacilityName] = useState('');
  const [opCategory, setOpCategory] = useState<FacilityCategory>('water');
  const [opAddress, setOpAddress] = useState('');
  const [opArea, setOpArea] = useState('Indiranagar Corridor');
  const [opFee, setOpFee] = useState('Free');
  const [opAccess, setOpAccess] = useState<AccessCondition>('public');
  const [opIs24x7, setOpIs24x7] = useState(false);
  const [opOpenTime, setOpOpenTime] = useState('06:00');
  const [opCloseTime, setOpCloseTime] = useState('22:00');
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Operator Registration State

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithCredentials(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!opName || !opEmail || !opPassword || !opFacilityName || !opAddress) {
      setErrorMsg('Please fill in all required facility and operator details.');
      return;
    }

    setRegLoading(true);
    try {
      const req: OperatorRegistrationRequest = {
        id: `op-req-${Date.now()}`,
        operatorName: opName.trim(),
        email: opEmail.trim().toLowerCase(),
        password: opPassword.trim(),
        phone: opPhone.trim(),
        organization: opOrg.trim() || opName.trim(),
        facilityName: opFacilityName.trim(),
        category: opCategory,
        address: opAddress.trim(),
        area: opArea,
        latitude: 12.9775 + (Math.random() - 0.5) * 0.01,
        longitude: 77.6415 + (Math.random() - 0.5) * 0.01,
        accessCondition: opAccess,
        fee: opFee,
        operatingHours: {
          is24x7: opIs24x7,
          openTime: opOpenTime,
          closeTime: opCloseTime,
          daysNote: opIs24x7 ? '24/7' : 'Daily'
        },
        accessibility: {
          wheelchairAccessible: true,
          drinkingWaterType: opCategory === 'water' ? 'RO Filtered Dispenser' : undefined,
          hasSeating: true,
          hasCharging: opCategory === 'charging',
          coveredShade: true
        },
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      await submitOperatorRegistration(req);
      setRegistrationSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };



  return (
    <div className="min-h-[calc(100vh-61px)] flex flex-col justify-center items-center p-4 sm:p-6 bg-surface-bg select-none">
      <div className="max-w-md w-full space-y-5">
        {/* Back Link */}
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-muted hover:text-charcoal font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Facility Discovery</span>
        </button>

        {/* Card */}
        <div className="bg-surface-card rounded-3xl border border-surface-border p-6 sm:p-8 shadow-card space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center mx-auto shadow-sm">
              {viewMode === 'login' ? <Lock className="w-6 h-6" /> : <Store className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-extrabold text-charcoal tracking-tight">
              {viewMode === 'login' ? 'Sign In to Urban Pitstop' : 'Register Facility as Operator'}
            </h2>
            <p className="text-xs text-charcoal-muted">
              {viewMode === 'login' 
                ? 'Role-Based Access Control for Workers, Operators & Administrators'
                : 'Partner with Urban Pitstop to offer water, washrooms, shade or charging'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 p-1 bg-surface-bg rounded-2xl border border-surface-border text-xs font-bold text-center">
            <button
              type="button"
              onClick={() => { setViewMode('login'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition-all ${
                viewMode === 'login'
                  ? 'bg-surface-card text-brand-700 shadow-2xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('register_operator'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition-all ${
                viewMode === 'register_operator'
                  ? 'bg-surface-card text-brand-700 shadow-2xs'
                  : 'text-charcoal-muted hover:text-charcoal'
              }`}
            >
              Partner / Operator Signup
            </button>
          </div>

          {/* Target Role Notice */}
          {targetRoleRequirement && viewMode === 'login' && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold capitalize">{targetRoleRequirement} Authorization Required: </span>
                <span>
                  Please sign in with credentials authorized for {targetRoleRequirement === 'admin' ? 'Platform Administration' : 'Facility Operations'}.
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-status-redBg border border-status-red/30 text-status-redText text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* VIEW MODE 1: LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-charcoal-muted pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email (e.g. operator@... or rider@...)"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-charcoal">
                    Account Password
                  </label>
                  <span className="text-[11px] text-charcoal-muted">
                    Case-sensitive
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-charcoal-muted pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-charcoal-muted hover:text-charcoal p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-charcoal-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                  />
                  <span>Remember me on this device</span>
                </label>
                <span className="text-[11px] text-charcoal-muted/70 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-brand-600" />
                  <span>Encrypted RBAC</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[46px]"
              >
                <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-charcoal-muted">
                  Own a business, petrol station, or public amenity?{' '}
                  <button
                    type="button"
                    onClick={() => { setViewMode('register_operator'); setErrorMsg(null); }}
                    className="text-brand-600 hover:underline font-bold"
                  >
                    Register your space
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* VIEW MODE 2: OPERATOR SELF-REGISTRATION FORM */}
          {viewMode === 'register_operator' && (
            <div>
              {registrationSubmitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-300">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-charcoal">
                      Application Submitted Successfully!
                    </h3>
                    <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed">
                      Your facility proposal has been sent to the Urban Pitstop Administrator queue. Once verified by our team, your account will be activated and you can sign in to manage live operational status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      setViewMode('login');
                    }}
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="p-3 rounded-2xl bg-brand-50/60 border border-brand-200/80 text-xs text-brand-950 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                    <span>
                      Service providers (washrooms, drinking water, shaded rest, charging) can register their facilities. Administrators review and approve all partner requests.
                    </span>
                  </div>

                  {/* Operator Details */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block">
                      1. Operator / Manager Info
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={opName}
                        onChange={e => setOpName(e.target.value)}
                        placeholder="Manager Full Name"
                        className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                      <input
                        type="tel"
                        required
                        value={opPhone}
                        onChange={e => setOpPhone(e.target.value)}
                        placeholder="Contact Phone"
                        className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <input
                      type="email"
                      required
                      value={opEmail}
                      onChange={e => setOpEmail(e.target.value)}
                      placeholder="Work Email (used for login)"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    <input
                      type="password"
                      required
                      value={opPassword}
                      onChange={e => setOpPassword(e.target.value)}
                      placeholder="Create Password"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    <input
                      type="text"
                      required
                      value={opOrg}
                      onChange={e => setOpOrg(e.target.value)}
                      placeholder="Organization / Business Name (e.g. Swastik Retail)"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  {/* Facility Details */}
                  <div className="space-y-2 pt-2 border-t border-surface-border">
                    <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block">
                      2. Pitstop / Facility Details
                    </span>

                    <input
                      type="text"
                      required
                      value={opFacilityName}
                      onChange={e => setOpFacilityName(e.target.value)}
                      placeholder="Facility Name (e.g. Green Tree Cafe — Water Porch)"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-charcoal-muted mb-1">
                          Primary Service
                        </label>
                        <select
                          value={opCategory}
                          onChange={e => setOpCategory(e.target.value as FacilityCategory)}
                          className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                        >
                          <option value="water">💧 Drinking Water</option>
                          <option value="toilets">🚻 Washroom / Toilet</option>
                          <option value="shade">🌳 Shaded Rest Spot</option>
                          <option value="charging">⚡ Phone Charging</option>
                          <option value="break">☕ Short-Break Location</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-charcoal-muted mb-1">
                          Corridor Area
                        </label>
                        <select
                          value={opArea}
                          onChange={e => setOpArea(e.target.value)}
                          className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                        >
                          <option value="Indiranagar Corridor">Indiranagar Corridor</option>
                          <option value="Indiranagar 100ft Rd">Indiranagar 100ft Rd</option>
                          <option value="Indiranagar 12th Main">Indiranagar 12th Main</option>
                          <option value="Domlur">Domlur / Old Airport Rd</option>
                          <option value="Halasuru">Halasuru / Ulsoor</option>
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={opAddress}
                      onChange={e => setOpAddress(e.target.value)}
                      placeholder="Street Address (e.g. 45, 12th Main Rd, Indiranagar)"
                      className="w-full p-2.5 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={opFee}
                        onChange={e => setOpFee(e.target.value)}
                        placeholder="Fee policy (e.g. Free or ₹5)"
                        className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium placeholder:text-charcoal-muted/60 focus:outline-none"
                      />
                      <select
                        value={opAccess}
                        onChange={e => setOpAccess(e.target.value as AccessCondition)}
                        className="w-full p-2 rounded-xl bg-surface-bg border border-surface-border text-xs text-charcoal font-medium"
                      >
                        <option value="public">Unrestricted Public Access</option>
                        <option value="customers_only">Customers / Partners Only</option>
                        <option value="permission_required">Permission Required</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[44px]"
                  >
                    <span>{regLoading ? 'Submitting Application...' : 'Submit Operator Application'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
