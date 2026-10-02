import React from 'react';
import { Package, ShoppingBag, Tag, BarChart3, ExternalLink, LogOut, Radio, ShieldCheck } from 'lucide-react';

interface Props {
  activeTab: 'orders' | 'products' | 'discounts' | 'analytics' | 'security';
  setActiveTab: (tab: 'orders' | 'products' | 'discounts' | 'analytics' | 'security') => void;
  pendingOrdersCount: number;
  activeNow: number;
  onLogout: () => void;
}

export const AdminNavbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  pendingOrdersCount,
  activeNow,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Status */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <img 
                  src="/logo.png" 
                  alt="ARNA MENS WEAR" 
                  className="h-8 w-auto object-contain select-none"
                  decoding="async"
                />
                <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                  MERCHANT
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wide">
                Supabase Cloud Connected
              </p>
            </div>

            {/* Live Traffic Pulse */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/80 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeNow} Active Shoppers</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'orders'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Orders</span>
              {pendingOrdersCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'orders' ? 'bg-amber-400 text-black' : 'bg-amber-500 text-white'
                }`}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'products'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('discounts')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'discounts'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Discounts</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'analytics'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'security'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Security & Alerts</span>
            </button>
          </nav>

          {/* Customer Store Link & Logout */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLogout}
              title="Lock Admin Portal"
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
