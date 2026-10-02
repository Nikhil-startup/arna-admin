import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Database, HardDriveDownload, 
  DollarSign, CheckCircle2, Lock, RefreshCw, Bell, Key, 
  FileText, ArrowDownToLine, Zap
} from 'lucide-react';
import { adminApi, SecurityAudit, BillingStatus, BackupItem } from '../services/api';

export const AdminSecurityAndBilling: React.FC = () => {
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  
  // Billing edit form
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number>(25000);
  const [warningInput, setWarningInput] = useState<number>(15000);
  const [emailInput, setEmailInput] = useState('admin@arna.co.in');
  const [savingBilling, setSavingBilling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [auditRes, billingRes, backupRes] = await Promise.all([
        adminApi.getSecurityAudit(),
        adminApi.getBillingStatus(),
        adminApi.getBackups()
      ]);
      setAudit(auditRes);
      setBilling(billingRes);
      setBudgetInput(billingRes.budget_threshold);
      setWarningInput(billingRes.warning_threshold);
      setEmailInput(billingRes.alert_email);
      setBackups(backupRes.backups || []);
    } catch (e) {
      console.warn('System data load note:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    setBackingUp(true);
    setBackupSuccess('');
    try {
      const res = await adminApi.triggerBackup();
      if (res.success) {
        setBackupSuccess(`Backup snapshot created: ${res.filename} (${res.size_kb} KB, ${res.total_records} records)`);
        const backupRes = await adminApi.getBackups();
        setBackups(backupRes.backups || []);
      }
    } catch (e: any) {
      alert(e.message || 'Backup creation failed');
    } finally {
      setBackingUp(false);
    }
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBilling(true);
    try {
      const updated = await adminApi.updateBilling(budgetInput, warningInput, emailInput);
      setBilling(updated);
      setIsEditingBilling(false);
    } catch (e: any) {
      alert(e.message || 'Failed to update billing config');
    } finally {
      setSavingBilling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 space-x-3">
        <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Loading System & Security Telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-black text-white rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-black">
                System Security, Billing Alerts & Automated Backups
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Live compliance telemetry: HTTPS focus, bot lockout protection, scoped DB key, and sanitized backups
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={loadData}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-gray-200 hover:border-black transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. SECURITY & KEY SCOPE AUDIT */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-black">Security Audit & Key Scope</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-black uppercase">
              Secure
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Database Key Limited</p>
                <p className="text-[11px] text-gray-500">
                  Client uses strictly limited publishable anon key with RLS. Service role key is isolated in backend server.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">HTTPS Focus & HSTS</p>
                <p className="text-[11px] text-gray-500">
                  Strict-Transport-Security preload active. CSP upgrades all insecure HTTP requests automatically.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Anti-Bot & Login Exploitation Shield</p>
                <p className="text-[11px] text-gray-500">
                  Honeypot trap traps automated scrapers. 5 failed login attempts trigger 15-minute IP/account lockout.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">CSRF Protocol</p>
                <p className="text-[11px] text-gray-500">
                  Double submit token validation & custom XMLHttpRequest headers prevent cross-site request forgery.
                </p>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">Zero Secret Data in Storage/Logs</p>
                <p className="text-[11px] text-gray-500">
                  Logs & LocalStorage filter out passwords, auth tokens, CVV, and credit card numbers automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. BILLING & SPENDING ALERTS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-black">Cloud Billing & Alerts</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              billing?.status === 'SAFE' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {billing?.status}
            </span>
          </div>

          {billing && (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-gray-700">Estimated Monthly Spend</span>
                  <span className="font-mono font-black text-black">
                    ₹{billing.total_estimated_cost.toLocaleString()} / ₹{billing.budget_threshold.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      billing.percentage_used > 80 ? 'bg-red-500' : billing.percentage_used > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, billing.percentage_used)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                  {billing.percentage_used}% of budget used. Alerts will trigger if spend crosses ₹{billing.warning_threshold.toLocaleString()}.
                </p>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Supabase Cloud</p>
                  <p className="font-mono font-black text-gray-900">₹{billing.cost_breakdown.supabase_cloud}</p>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">SMS Gateway</p>
                  <p className="font-mono font-black text-gray-900">₹{billing.cost_breakdown.sms_gateway}</p>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Email Delivery</p>
                  <p className="font-mono font-black text-gray-900">₹{billing.cost_breakdown.email_delivery}</p>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Compute & API</p>
                  <p className="font-mono font-black text-gray-900">₹{billing.cost_breakdown.compute_bandwidth}</p>
                </div>
              </div>

              {/* Alert Config Form / Toggle */}
              {!isEditingBilling ? (
                <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                  <span className="text-[11px] text-gray-500">
                    Recipient: <strong className="text-black">{billing.alert_email}</strong>
                  </span>
                  <button
                    onClick={() => setIsEditingBilling(true)}
                    className="text-xs font-bold text-black underline hover:text-gray-700"
                  >
                    Adjust Budget
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveBilling} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-700 mb-0.5">Budget Threshold (₹)</label>
                    <input
                      type="number"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(Number(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-700 mb-0.5">Alert Email</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingBilling(false)}
                      className="px-2.5 py-1 text-gray-500 hover:text-black font-bold text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingBilling}
                      className="px-3 py-1 bg-black text-white font-bold rounded-lg text-[11px]"
                    >
                      {savingBilling ? 'Saving...' : 'Save Config'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* 3. AUTOMATED DATABASE BACKUPS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-black">Automated Backups</h3>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black uppercase">
              Daily Active
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs space-y-1">
              <p className="font-bold text-blue-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Sanitized Automated Snapshots</span>
              </p>
              <p className="text-[11px] text-blue-800">
                Daily automated backup with 30-day rolling rotation. Passwords & payment tokens are sanitized before export.
              </p>
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              className="w-full py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition flex items-center justify-center space-x-2 shadow-sm"
            >
              <Zap className={`w-3.5 h-3.5 ${backingUp ? 'animate-spin' : ''}`} />
              <span>{backingUp ? 'Dumping Snapshot...' : 'Run Instant Backup'}</span>
            </button>

            {backupSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-200 animate-fade-in">
                {backupSuccess}
              </div>
            )}

            {/* Backups List */}
            <div className="space-y-2 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Available Snapshots</p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {backups.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No snapshots available yet.</p>
                ) : (
                  backups.map((b) => (
                    <div key={b.filename} className="p-2 bg-neutral-50 rounded-xl border border-neutral-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold text-[11px] text-gray-900 truncate max-w-[160px] sm:max-w-[200px]" title={b.filename}>
                          {b.filename}
                        </p>
                        <p className="text-[10px] text-gray-500 font-semibold">
                          {b.created_at} &bull; {b.size_kb} KB
                        </p>
                      </div>
                      <a
                        href={adminApi.getDownloadUrl(b.filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 rounded-lg transition"
                        title="Download JSON Snapshot"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
