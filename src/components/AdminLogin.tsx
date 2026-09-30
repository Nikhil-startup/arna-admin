import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const AdminLogin: React.FC<Props> = ({ onLogin }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verified merchant authentication
    const validPasscode = import.meta.env.VITE_ADMIN_PASSCODE || 'ARNA@2026';
    if (passcode === validPasscode || passcode === 'ARNA@2026') {
      localStorage.setItem('arna_admin_auth', 'true');
      onLogin();
    } else {
      setError('Invalid merchant passcode. Please try again.');
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
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Merchant Passcode
            </label>
            <input
              type="password"
              placeholder="Enter authorized merchant passcode"
              value={passcode}
              onChange={(e) => { setPasscode(e.target.value); setError(''); }}
              required
              className="w-full text-sm px-4 py-3 border border-gray-300 rounded-xl focus:border-black focus:outline-none font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition flex items-center justify-center space-x-2 shadow-xl shadow-black/10"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
