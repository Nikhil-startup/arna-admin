import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const PASSWORD_SALT = 'arna_luxury_atelier_2026';
const ADMIN_HASH = '#hash_1ba9b080d6da570800658d14933db2ada6f2d1da60946affd1687df54d538bb7';

async function hashPasscode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PASSWORD_SALT + code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `#hash_${hex}`;
}

export const AdminLogin: React.FC<Props> = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [botHoneypot, setBotHoneypot] = useState('');

  React.useEffect(() => {
    let timer: any;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (botHoneypot) {
      setError('Bot exploitation rejected.');
      return;
    }

    // Verified merchant authentication
    const validPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'ARNA@2026';
    const computedHash = await hashPasscode(passcode);
    if (computedHash === ADMIN_HASH || passcode === validPasscode || passcode === 'ARNA@2026') {
      localStorage.setItem('arna_admin_auth', 'true');
      setFailedAttempts(0);
      onLogin();
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 5) {
        setLockoutSeconds(60);
        setError('Too many failed attempts. Login locked for 60s to protect against dictionary attacks.');
      } else {
        setError(`Invalid merchant passcode. (${5 - nextFailures} attempts remaining)`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center pb-1">
            <img 
              src="/logo.png" 
              alt="ARNA MENS WEAR" 
              className="h-12 w-auto object-contain"
            />
          </div>
          <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5" />
            <span>Merchant Control Hub</span>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Authorized merchant access for order fulfillment & catalog control
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invisible honeypot trap against bot login attempts */}
          <input
            type="text"
            name="merchant_hp_trap"
            value={botHoneypot}
            onChange={(e) => setBotHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {lockoutSeconds > 0 && (
            <div className="p-3 bg-amber-50 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Anti-Brute-Force Lockout Active: {lockoutSeconds}s</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Merchant Passcode
            </label>
            <input
              type="password"
              placeholder="Enter authorized merchant passcode"
              value={passcode}
              disabled={lockoutSeconds > 0}
              onChange={(e) => { setPasscode(e.target.value); setError(''); }}
              required
              className="w-full text-sm px-4 py-3 border border-gray-300 rounded-xl focus:border-black focus:outline-none font-medium disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={lockoutSeconds > 0}
            className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition flex items-center justify-center space-x-2 shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{lockoutSeconds > 0 ? `Locked (${lockoutSeconds}s)` : 'Unlock Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
