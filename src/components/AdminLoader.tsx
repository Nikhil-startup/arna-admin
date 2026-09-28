import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Check } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminLoader: React.FC = () => {
  const { isLoading } = useAdmin();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(p + (p < 70 ? 5 : 2), 95);
      setProgress(p);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setProgress(100);
        const exitTimer = setTimeout(() => {
          setIsExiting(true);
          const hideTimer = setTimeout(() => {
            setIsVisible(false);
          }, 600);
          return () => clearTimeout(hideTimer);
        }, 300);
        return () => clearTimeout(exitTimer);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] bg-[#0c0d12] text-white flex flex-col justify-between p-6 sm:p-12 select-none transition-all duration-700 ease-in-out ${
        isExiting ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.05) 0%, transparent 65%)`
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full text-[11px] font-mono tracking-widest text-neutral-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="uppercase">ARNA MERCHANT // ENTERPRISE CONSOLE</span>
        </div>
        <div className="hidden sm:block text-neutral-500 uppercase">
          SECURE SUPABASE CLOUD VAULT
        </div>
      </div>

      {/* Center Monogram & Title */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-8">
        <div className="relative w-20 h-20 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl" />
          <div className="absolute inset-0 border border-white/20 rounded-2xl rotate-45 animate-spin" style={{ animationDuration: '10s' }} />
          <div className="w-10 h-10 bg-white/10 border border-white/50 rotate-45 flex items-center justify-center">
            <Layers className="-rotate-45 w-5 h-5 text-white" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.4em] text-white pl-[0.4em]">
          ARNA CONSOLE
        </h1>

        <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-neutral-400 mt-3">
          SYNCHRONIZING LIVE ORDERS & CATALOGUE
        </p>

        {/* Hairline Progress Bar */}
        <div className="w-64 h-[2px] bg-neutral-800 rounded-full overflow-hidden mt-8 mb-4">
          <div 
            className="h-full bg-gradient-to-r from-neutral-400 via-white to-emerald-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(255,255,255,0.7)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-64 text-[10px] font-mono text-neutral-400">
          <span>{progress < 100 ? 'CONNECTING POSTGRES...' : 'INITIALIZATION COMPLETE'}</span>
          <span className="font-bold text-white">{progress}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-neutral-500 uppercase">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PORTAL VERIFIED</span>
        </div>
        <div>
          {progress === 100 ? (
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>READY</span>
            </span>
          ) : (
            <span>ESTABLISHING WEBSOCKET...</span>
          )}
        </div>
      </div>
    </div>
  );
};
