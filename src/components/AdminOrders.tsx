import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Package, Search, CheckCircle2, Clock, 
  Truck, Printer, Phone, MapPin, User, Check, AlertCircle 
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Order } from '../types';

export const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'packing' | 'shipped' | 'delivered'>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);

  const toggleItemCheck = (orderId: string, itemId: string) => {
    const key = `${orderId}-${itemId}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.phone.includes(searchTerm) ||
      order.shippingAddress.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <Package className="w-6 h-6 text-black" />
            <span>ORDER PACKING & DELIVERY FULFILLMENT</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review who ordered what, verify items against size labels, pack the parcel, and dispatch.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="bg-white text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            Total Orders: <strong className="text-black">{orders.length}</strong>
          </span>
          <span className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200">
            Needs Packing: <strong className="text-amber-900">{orders.filter(o => o.status === 'confirmed').length}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #, customer, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          {(['all', 'confirmed', 'packing', 'shipped', 'delivered'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 transition ${
                statusFilter === tab
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              {tab === 'confirmed' ? 'Needs Packing' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 space-y-2">
            <Package className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-bold text-gray-800">No orders found</p>
            <p className="text-xs text-gray-500">Try changing your search query or filter tab</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm transition"
            >
              {/* Card Header */}
              <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-black text-sm text-black">
                    {order.orderNumber}
                  </span>
                  <span className="text-gray-300 text-xs">&bull;</span>
                  <span className="text-xs text-gray-500 font-medium">
                    {new Date(order.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-black text-black">
                    ₹{order.total.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    order.status === 'confirmed'
                      ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                      : order.status === 'packing'
                      ? 'bg-blue-100/80 text-blue-900 border-blue-300'
                      : order.status === 'shipped'
                      ? 'bg-purple-100/80 text-purple-900 border-purple-300'
                      : 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                  }`}>
                    {order.status === 'confirmed' ? '⚠️ Needs Packing' : order.status}
                  </span>
                  <button
                    onClick={() => setSelectedOrderForSlip(order)}
                    className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-200 rounded-lg transition"
                    title="Print Packing Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Items to Pack Checklist */}
                <div className="lg:col-span-7 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600 flex items-center justify-between">
                    <span>Items to Pack ({order.items.reduce((s, i) => s + i.quantity, 0)} Pcs)</span>
                    <span className="text-[10px] text-gray-400 font-normal">Check box once garment placed in parcel</span>
                  </p>

                  <div className="space-y-2">
                    {order.items.map(item => {
                      const isChecked = checkedItems[`${order.id}-${item.id}`];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItemCheck(order.id, item.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                                isChecked ? 'bg-emerald-600 text-white' : 'border border-gray-300 bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            {item.product.images?.[0] && (
                              <img
                                src={item.product.images[0]}
                                alt=""
                                className="w-10 h-12 object-cover rounded bg-gray-100"
                              />
                            )}

                            <div>
                              <p className={`text-xs font-bold uppercase ${isChecked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.product.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-gray-500">
                                <span className="bg-black text-white px-1.5 py-0.2 rounded font-black text-[10px]">
                                  SIZE: {item.selectedSize}
                                </span>
                                <span>&bull;</span>
                                <span>Qty: <strong>{item.quantity}</strong></span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            isChecked ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isChecked ? '✓ Boxed' : 'Verify'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {order.packingNotes && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Packing Instructions:</strong> {order.packingNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer & Delivery Destination */}
                <div className="lg:col-span-5 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Delivery Destination
                    </p>

                    <div className="space-y-1.5 text-xs text-gray-800">
                      <div className="flex items-center space-x-2 font-bold text-black">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{order.shippingAddress.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <a href={`tel:${order.shippingAddress.phone}`} className="hover:underline">
                          {order.shippingAddress.phone}
                        </a>
                      </div>
                      <div className="flex items-start space-x-2 text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Action Bar */}
                  <div className="pt-3 border-t border-gray-200 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      Update Order Status:
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'packing')}
                        disabled={order.status === 'packing'}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition ${
                          order.status === 'packing'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        Packing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                        disabled={order.status === 'shipped'}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition ${
                          order.status === 'shipped'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        Shipped
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        disabled={order.status === 'delivered'}
                        className={`py-2 text-[10px] font-bold uppercase rounded-lg border transition ${
                          order.status === 'delivered'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        Delivered
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Printable Packing Slip Modal */}
      {selectedOrderForSlip && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
          onClick={() => setSelectedOrderForSlip(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm uppercase">Packing Slip // {selectedOrderForSlip.orderNumber}</h3>
              <button onClick={() => setSelectedOrderForSlip(null)} className="text-gray-400 hover:text-black font-bold">✕</button>
            </div>
            <div className="text-xs space-y-2 text-gray-700">
              <p><strong>Customer:</strong> {selectedOrderForSlip.shippingAddress.name} ({selectedOrderForSlip.shippingAddress.phone})</p>
              <p><strong>Ship To:</strong> {selectedOrderForSlip.shippingAddress.street}, {selectedOrderForSlip.shippingAddress.city}, {selectedOrderForSlip.shippingAddress.pinCode}</p>
              <div className="border-t pt-2">
                <p className="font-bold mb-1">Items to Pack:</p>
                {selectedOrderForSlip.items.map(i => (
                  <p key={i.id}>&bull; {i.product.title} — Size: <strong>{i.selectedSize}</strong> (Qty: {i.quantity})</p>
                ))}
              </div>
            </div>
            <div className="pt-3 border-t flex justify-end space-x-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg">
                Print Now
              </button>
              <button onClick={() => setSelectedOrderForSlip(null)} className="px-4 py-2 bg-gray-100 text-xs font-bold uppercase rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
