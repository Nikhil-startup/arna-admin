import React from 'react';
import { 
  Users, Eye, TrendingUp, Radio, 
  ShoppingBag, ArrowUpRight, BarChart3, RefreshCw 
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminAnalytics: React.FC = () => {
  const { visitorStats, orders, products, refreshData } = useAdmin();

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-black" />
            <span>TRAFFIC & STORE PERFORMANCE ANALYTICS</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time pulse of customer visits, active shoppers, conversion rates, and sales.
          </p>
        </div>

        <button
          onClick={refreshData}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase rounded-xl hover:bg-gray-100 transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Total Visitors</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-black">
            {visitorStats.totalVisitors.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> +14.2% this week
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Today's Visitors</span>
            <Eye className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-black">
            {visitorStats.todayVisitors.toLocaleString()}
          </p>
          <span className="text-[10px] text-gray-400 font-medium">Unique IP sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Active Shoppers</span>
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {visitorStats.activeNow} Live
          </p>
          <span className="text-[10px] text-emerald-700 font-bold">Browsing ARNA right now</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-black">
            ₹{totalSales.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-500 font-semibold">{orders.length} orders fulfilled</span>
        </div>
      </div>

      {/* Weekly Traffic Bar Chart */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-black">
          Daily Visitor Traffic (Last 7 Days)
        </h3>

        <div className="grid grid-cols-7 gap-3 pt-6 items-end h-48">
          {visitorStats.history.map(day => (
            <div key={day.date} className="flex flex-col items-center h-full justify-end group">
              <span className="text-[10px] font-black text-gray-600 mb-1 opacity-0 group-hover:opacity-100 transition">
                {day.visitors}
              </span>
              <div
                style={{ height: `${Math.min(100, Math.max(15, (day.visitors / 1200) * 100))}%` }}
                className="w-full max-w-[40px] bg-neutral-900 group-hover:bg-black rounded-t-lg transition-all"
              />
              <span className="text-[11px] font-bold text-gray-500 mt-2 uppercase">
                {day.date}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
