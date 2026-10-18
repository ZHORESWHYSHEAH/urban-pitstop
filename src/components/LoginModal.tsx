import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Store, 
  ShieldAlert, 
  Bike, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { DEMO_ACCOUNTS, loginWithCredentials } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  targetRoleRequirement?: UserRole | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  targetRoleRequirement,
}) => {
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, 'guest'>>(
    targetRoleRequirement === 'admin'
      ? 'admin'
      : targetRoleRequirement === 'operator'
      ? 'operator'
      : 'worker'
  );
  const [email, setEmail] = useState(DEMO_ACCOUNTS[selectedRole].email);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectRoleCard = (role: Exclude<UserRole, 'guest'>) => {
    setSelectedRole(role);
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithCredentials(email, password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-surface-border overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-surface-border flex items-center justify-between bg-surface-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-charcoal">
                Sign In to Urban Pitstop
              </h3>
              <p className="text-[11px] text-charcoal-muted">
                Role-based access for workers, operators & administrators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Target Role Notice if redirected from a protected page */}
          {targetRoleRequirement && (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold capitalize">{targetRoleRequirement} Access Required: </span>
                <span>
                  Please log in as {targetRoleRequirement === 'admin' ? 'a Platform Administrator' : 'a Facility Operator'} to access this portal.
                </span>
              </div>
            </div>
          )}

          {/* 3 Quick Role Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-charcoal mb-2">
              Select Your Role (1-Tap Demo Credentials):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Role 1: Outdoor Worker */}
              <div
                onClick={() => handleSelectRoleCard('worker')}
                className={`p-3 rounded-2xl border cursor-pointer text-left transition-all ${
                  selectedRole === 'worker'
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-xs'
                    : 'border-surface-border bg-surface-bg hover:bg-surface-hover'
                }`}
              >
                <div className="text-xl mb-1">🛵</div>
                <div className="font-bold text-xs text-charcoal">Worker</div>
                <div className="text-[10px] text-charcoal-muted mt-0.5 leading-tight">
                  Rider / Field Staff
                </div>
              </div>

              {/* Role 2: Facility Operator */}
              <div
                onClick={() => handleSelectRoleCard('operator')}
                className={`p-3 rounded-2xl border cursor-pointer text-left transition-all ${
                  selectedRole === 'operator'
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-xs'
                    : 'border-surface-border bg-surface-bg hover:bg-surface-hover'
                }`}
              >
                <div className="text-xl mb-1">⛽</div>
                <div className="font-bold text-xs text-charcoal">Operator</div>
                <div className="text-[10px] text-charcoal-muted mt-0.5 leading-tight">
                  Store / Station Mgr
                </div>
              </div>

              {/* Role 3: Administrator */}
              <div
                onClick={() => handleSelectRoleCard('admin')}
                className={`p-3 rounded-2xl border cursor-pointer text-left transition-all ${
                  selectedRole === 'admin'
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 shadow-xs'
                    : 'border-surface-border bg-surface-bg hover:bg-surface-hover'
                }`}
              >
                <div className="text-xl mb-1">🛡️</div>
                <div className="font-bold text-xs text-charcoal">Admin</div>
                <div className="text-[10px] text-charcoal-muted mt-0.5 leading-tight">
                  QA & Operations
                </div>
              </div>
            </div>
          </div>

          {/* Active Role Description Banner */}
          <div className="p-3 rounded-2xl bg-surface-bg border border-surface-border text-xs text-charcoal-muted space-y-1">
            <div className="font-bold text-charcoal flex items-center justify-between">
              <span>{DEMO_ACCOUNTS[selectedRole].name}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                {selectedRole}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {selectedRole === 'worker' &&
                'Can find places, sync saved bookmarks, report status, and earn worker verification trust.'}
              {selectedRole === 'operator' &&
                'Can toggle "Available Now" / "Unavailable", post maintenance alerts, and view check-in logs for managed places.'}
              {selectedRole === 'admin' &&
                'Can approve new places, resolve conflicting community reports with Gemini AI synthesis, and manage audit logs.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-status-redBg border border-status-red/30 text-status-redText text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-card border border-surface-border text-xs text-charcoal focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                Password:
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-card border border-surface-border text-xs text-charcoal focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs min-h-[46px]"
              >
                <span>{isLoading ? 'Verifying...' : `Sign In as ${selectedRole.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Guest Option */}
          <div className="pt-2 text-center border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-charcoal-muted hover:text-charcoal font-medium underline"
            >
              Continue as Anonymous Guest (Discovery Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
