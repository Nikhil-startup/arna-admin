import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, Edit2, Trash2, Search, Upload, 
  Image as ImageIcon, Check, X, Sparkles, Tag, Layers,
  AlertTriangle, Clock, Bell
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Product } from '../types';
import { defaultDrops } from '../data/defaultDrops';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, updateStock, refreshData } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'shirts' | 't-shirts' | 'jeans' | 'trousers' | 'jackets' | 'co-ords' | 'accessories'>('shirts');
  const [fit, setFit] = useState('Relaxed Fit');
  const [price, setPrice] = useState(1499);
  const [originalPrice, setOriginalPrice] = useState(2499);
  const [discount, setDiscount] = useState(40);
  const [stockCount, setStockCount] = useState(20);
  const [primaryImage, setPrimaryImage] = useState('');
  const [fabric, setFabric] = useState('100% Premium Combed Cotton');
  const [description, setDescription] = useState('Contemporary relaxed fit for everyday statement styling.');
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);

  const primaryFileInputRef = useRef<HTMLInputElement>(null);

  const toggleSize = (s: string) => {
    setSizes(prev => 
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };


  // Image compressor from local device
  const processImageFile = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setCategory('shirts');
    setFit('Relaxed Fit');
    setPrice(1499);
    setOriginalPrice(2499);
    setDiscount(40);
    setStockCount(20);
    setPrimaryImage('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop&q=80');
    setFabric('100% Combed Cotton');
    setDescription('Crafted for contemporary everyday luxury.');
    setSizes(['S', 'M', 'L', 'XL']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setCategory(p.category as any);
    setFit(p.fit);
    setPrice(p.price);
    setOriginalPrice(p.originalPrice || p.price);
    setDiscount(p.discount || 0);
    setStockCount(p.stockCount);
    setPrimaryImage(p.images[0] || '');
    setFabric(p.fabric);
    setDescription(p.description);
    setSizes(p.sizes);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !primaryImage.trim()) {
      alert('Please provide a title and at least one product photo.');
      return;
    }

    if (editingProduct) {
      await updateProduct({
        ...editingProduct,
        title,
        category,
        fit,
        price: Number(price),
        originalPrice: Number(originalPrice),
        discount: Number(discount),
        stockCount: Number(stockCount),
        inStock: Number(stockCount) > 0,
        images: [primaryImage],
        fabric,
        description,
        sizes
      });
    } else {
      await addProduct({
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category,
        fit,
        price: Number(price),
        originalPrice: Number(originalPrice),
        discount: Number(discount),
        sizes,
        colors: [{ name: 'Classic Edition', hex: '#111827' }],
        images: [primaryImage],
        rating: 4.8,
        reviewsCount: 1,
        isNew: true,
        isTrending: false,
        isBestSeller: false,
        inStock: Number(stockCount) > 0,
        stockCount: Number(stockCount),
        description,
        fabric,
        washCare: 'Machine wash cold with like colors.'
      });
    }

    setIsModalOpen(false);
  };

  const handleRestoreDefaults = async () => {
    setIsRestoring(true);
    try {
      for (const drop of defaultDrops) {
        const exists = products.find(p => p.id === drop.id || p.title === drop.title);
        if (!exists) {
          await addProduct({
            title: drop.title,
            slug: drop.slug,
            category: drop.category as any,
            fit: drop.fit,
            price: drop.price,
            originalPrice: drop.original_price,
            discount: drop.discount,
            stockCount: drop.stock_count,
            inStock: drop.stock_count > 0,
            sizes: drop.sizes,
            colors: drop.colors,
            images: drop.images,
            description: drop.description,
            fabric: drop.fabric,
            rating: drop.rating,
            reviewsCount: drop.reviews_count,
            isNew: drop.is_new,
            isTrending: drop.is_trending,
            isBestSeller: drop.is_bestseller
          });
        }
      }
      await refreshData();
      alert('12 Core Luxury Drops successfully verified & synced to catalog!');
    } catch (e: any) {
      alert('Error restoring drops: ' + e.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const [dismissedNoticeIds, setDismissedNoticeIds] = useState<string[]>([]);

  const getSoldOutDetails = (p: Product) => {
    if (p.stockCount > 0 || !p.soldOutAt) {
      return { isAutoPruned: false, elapsedText: '', badgeText: '' };
    }
    const soldOutTime = new Date(p.soldOutAt).getTime();
    if (isNaN(soldOutTime)) return { isAutoPruned: false, elapsedText: '', badgeText: '' };
    const elapsedMinutes = Math.floor((Date.now() - soldOutTime) / (60 * 1000));
    const FIVE_HOURS_MINS = 300;

    if (elapsedMinutes >= FIVE_HOURS_MINS) {
      const hours = Math.floor(elapsedMinutes / 60);
      const mins = elapsedMinutes % 60;
      return {
        isAutoPruned: true,
        elapsedText: `${hours}h ${mins}m`,
        badgeText: `🚫 HIDDEN (5h+ Sold Out)`
      };
    } else {
      const remainingMins = FIVE_HOURS_MINS - elapsedMinutes;
      const remHours = Math.floor(remainingMins / 60);
      const remMins = remainingMins % 60;
      return {
        isAutoPruned: false,
        elapsedText: `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`,
        badgeText: `⏳ Auto-prunes in ${remHours}h ${remMins}m`
      };
    }
  };

  const autoPrunedProducts = products.filter(p => {
    if (dismissedNoticeIds.includes(p.id)) return false;
    return getSoldOutDetails(p).isAutoPruned;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-black" />
            <span>PRODUCT CATALOG MANAGER</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Add new clothes directly with photo uploads. 5-hour sold-out auto-removal active.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {products.length === 0 && (
            <button
              onClick={handleRestoreDefaults}
              disabled={isRestoring}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-200 transition border border-gray-200"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRestoring ? 'Restoring...' : 'Restore Drops'}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* 5-Hour Sold-Out Auto-Pruning Notification Alert Banner */}
      {autoPrunedProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-red-950 uppercase tracking-wide flex items-center space-x-1.5">
                  <span>5-HOUR SOLD-OUT AUTO-REMOVAL NOTICE</span>
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {autoPrunedProducts.length} Item{autoPrunedProducts.length > 1 ? 's' : ''} Hidden
                  </span>
                </h3>
                <p className="text-[11px] text-red-800">
                  These items have been sold out for 5+ hours and were automatically removed from customer storefront to maintain luxury catalog freshness.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissedNoticeIds(prev => [...prev, ...autoPrunedProducts.map(p => p.id)])}
              className="text-[11px] font-bold text-red-800 hover:text-black bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-red-200 transition self-start sm:self-auto"
            >
              Dismiss Notice
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {autoPrunedProducts.map(p => {
              const details = getSoldOutDetails(p);
              return (
                <div key={p.id} className="bg-white rounded-xl border border-red-200/80 p-3 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img src={p.images[0]} alt={p.title} className="w-11 h-13 object-cover rounded-lg bg-gray-100 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 uppercase truncate">{p.title}</h4>
                      <p className="text-[10px] text-gray-500 capitalize">{p.category} &bull; ₹{p.price}</p>
                      <p className="text-[10px] font-bold text-red-600 flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>Sold out for {details.elapsedText}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => updateStock(p.id, 10)}
                      className="px-2.5 py-1 bg-black hover:bg-neutral-800 text-white text-[10px] font-black uppercase rounded-lg transition"
                      title="Restock +10 units to republish on storefront"
                    >
                      Restock +10
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Permanently delete "${p.title}"?`)) {
                          await deleteProduct(p.id);
                        }
                      }}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-lg transition border border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search clothes by title, fit, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          {['all', 'shirts', 't-shirts', 'jeans', 'trousers', 'jackets', 'co-ords'].map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                categoryFilter === c ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:text-black'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black uppercase tracking-wider text-gray-900">
              No Products in Catalog
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Your catalog has 0 items right now. Add custom garments with photo upload, or restore the 12 core luxury drops with one click.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Product</span>
            </button>
            <button
              onClick={handleRestoreDefaults}
              disabled={isRestoring}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-200 transition border border-gray-200"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isRestoring ? 'Restoring Drops...' : 'Restore 12 Core Luxury Drops'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map(p => {
          const details = getSoldOutDetails(p);
          return (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="relative aspect-[3/4] bg-gray-100">
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  {p.category}
                </span>
                <span className={`absolute bottom-2 right-2 backdrop-blur-sm text-[10px] font-black px-2 py-0.5 rounded border shadow-sm ${
                  details.isAutoPruned
                    ? 'bg-red-700 text-white border-red-800'
                    : p.stockCount <= 0
                    ? 'bg-red-600 text-white border-red-700'
                    : p.stockCount <= 5
                    ? 'bg-amber-400 text-black border-amber-500'
                    : 'bg-white/95 text-black border-gray-200'
                }`}>
                  {details.isAutoPruned ? '🚫 HIDDEN (5h+ OUT)' : p.stockCount <= 0 ? '🔴 SOLD OUT (0)' : `Stock: ${p.stockCount}`}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-gray-500">{p.fit}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-black">₹{p.price.toLocaleString('en-IN')}</span>
                  {p.originalPrice > p.price && (
                    <span className="text-xs text-gray-400 line-through">₹{p.originalPrice}</span>
                  )}
                  {p.discount > 0 && (
                    <span className="text-[10px] font-black text-emerald-600">({p.discount}% OFF)</span>
                  )}
                </div>

                {/* Stock Controls */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-gray-500">Live Inventory:</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => updateStock(p.id, Math.max(0, p.stockCount - 1))}
                      className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-black font-bold flex items-center justify-center transition"
                      title="Decrease Stock by 1"
                    >
                      -
                    </button>
                    <span className={`px-2 py-0.5 rounded text-xs font-black font-mono ${p.stockCount <= 0 ? 'text-red-600 bg-red-50' : 'text-gray-900'}`}>
                      {p.stockCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStock(p.id, p.stockCount + 5)}
                      className="px-2 h-6 rounded bg-black hover:bg-neutral-800 text-white text-[10px] font-bold flex items-center justify-center transition"
                      title="Quick Restock +5 Units"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenEditModal(p)}
                className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-black transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </button>
              <button
                onClick={async () => {
                  if (confirm(`Are you sure you want to permanently delete "${p.title}"? It will be removed from both the database and the customer storefront immediately.`)) {
                    await deleteProduct(p.id);
                  }
                }}
                className="flex items-center space-x-1 text-xs font-bold text-gray-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
                title="Delete Product"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        );
        })}
        </div>
      )}

      {/* Add / Edit Modal with Device Photo Upload (Portaled to document.body to avoid parent CSS clipping) */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                    {editingProduct ? 'Edit Catalog Product' : 'Add New Luxury Piece'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Instant sync to Supabase database and shopping storefront
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-black transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                
                {/* Photo Upload Section */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <label className="block text-[11px] font-black uppercase text-gray-700 tracking-wider mb-2">
                    Product Photo (Upload from Device or Paste Link)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-28 shrink-0 bg-white rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center relative shadow-sm">
                      {primaryImage ? (
                        <img src={primaryImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2 text-gray-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                          <span className="text-[10px] font-bold uppercase">No Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="file"
                        ref={primaryFileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processImageFile(file, (dataUrl) => setPrimaryImage(dataUrl));
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => primaryFileInputRef.current?.click()}
                        className="w-full py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 hover:border-black hover:bg-gray-100 flex items-center justify-center space-x-2 transition shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-black" />
                        <span>Upload Photo from Phone / Laptop</span>
                      </button>
                      <input
                        type="url"
                        placeholder="Or paste public image URL here"
                        value={primaryImage.startsWith('data:') ? '' : primaryImage}
                        onChange={(e) => setPrimaryImage(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-gray-200 rounded-xl focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Title & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cuban Camp Collar Shirt"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none font-medium bg-white"
                    >
                      <option value="shirts">Shirts</option>
                      <option value="t-shirts">T-Shirts</option>
                      <option value="trousers">Trousers</option>
                      <option value="jeans">Jeans</option>
                      <option value="jackets">Jackets</option>
                      <option value="co-ords">Co-Ords</option>
                      <option value="accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">MRP Price (₹)</label>
                    <input
                      type="number"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Stock Units</label>
                    <input
                      type="number"
                      min="0"
                      value={stockCount}
                      onChange={(e) => setStockCount(Number(e.target.value))}
                      className={`w-full text-xs p-2.5 border rounded-xl focus:outline-none font-bold ${
                        stockCount <= 0 
                          ? 'border-red-300 bg-red-50 text-red-600' 
                          : 'border-gray-300 text-gray-900 focus:border-black'
                      }`}
                    />
                  </div>
                </div>

                {/* Fit & Fabric */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Fit Type</label>
                    <input
                      type="text"
                      value={fit}
                      onChange={(e) => setFit(e.target.value)}
                      placeholder="e.g. Relaxed Fit, Oversized"
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Fabric Details</label>
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="e.g. 100% Combed Linen"
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none"
                    />
                  </div>
                </div>

                {/* Available Sizes Toggle Chips */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1.5">
                    Available Sizes (Click to toggle)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_SIZES.map(s => {
                      const isSelected = sizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSize(s)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition border ${
                            isSelected
                              ? 'bg-black text-white border-black shadow-sm'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isSelected ? `✓ ${s}` : s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Product Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of piece cut, styling, and aesthetic..."
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:border-black focus:outline-none"
                  />
                </div>

              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 bg-gray-50">
                <span className="text-[11px] text-gray-500 font-medium">
                  {stockCount <= 0 ? (
                    <span className="text-red-600 font-bold">⚠️ 0 Stock: Will be marked as SOLD OUT on storefront</span>
                  ) : (
                    <span>✅ In Stock: <strong>{stockCount} units</strong> available</span>
                  )}
                </span>
                <div className="flex items-center space-x-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-md transition"
                  >
                    {editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
