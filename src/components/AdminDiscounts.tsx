import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export const AdminDiscounts: React.FC = () => {
  const { coupons, addCoupon, toggleCoupon, deleteCoupon } = useAdmin();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'flat'>('percentage');
  const [value, setValue] = useState(15);
  const [minOrderValue, setMinOrderValue] = useState(999);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    await addCoupon({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue),
      isActive: true
    });

    setCode('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <Tag className="w-6 h-6 text-black" />
            <span>DISCOUNTS & PROMOTIONAL COUPONS</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Create coupon codes and turn them ON/OFF with 1-click. Saved directly in Supabase.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black tracking-widest text-black bg-gray-100 px-3 py-1 rounded-lg">
                  {coupon.code}
                </span>
                <button
                  onClick={() => toggleCoupon(coupon.id)}
                  className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border transition ${
                    coupon.isActive
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}
                >
                  {coupon.isActive ? 'Active (Live)' : 'Disabled'}
                </button>
              </div>

              <div className="text-xs text-gray-700 font-medium pt-2">
                <p>Discount: <strong>{coupon.type === 'percentage' ? `${coupon.value}% OFF` : `₹${coupon.value} FLAT OFF`}</strong></p>
                <p className="text-[11px] text-gray-500">Min Cart Value: ₹{coupon.minOrderValue}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-400">Used: {coupon.usageCount || 0} times</span>
              <button
                onClick={() => {
                  if (confirm(`Delete coupon "${coupon.code}"?`)) deleteCoupon(coupon.id);
                }}
                className="text-gray-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm uppercase">Create New Promo Code</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP20"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg uppercase font-mono font-bold focus:border-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg font-bold focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Minimum Order Value (₹)</label>
                <input
                  type="number"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-xs font-bold uppercase rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-neutral-800"
                >
                  Create & Activate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
