import React, { useState, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Upload, 
  Image as ImageIcon, Check, X, Sparkles, Tag, Layers
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { Product } from '../types';

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
            Add new clothes directly with phone/laptop photo uploads. Updates live in Supabase.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

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

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="relative aspect-[3/4] bg-gray-100">
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                  {p.category}
                </span>
                <span className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-black text-[10px] font-black px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                  Stock: {p.stockCount}
                </span>
              </div>

              <div className="p-4 space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                  {p.title}
                </h3>
                <p className="text-[11px] text-gray-500">{p.fit}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-sm font-black text-black">₹{p.price.toLocaleString('en-IN')}</span>
                  {p.originalPrice > p.price && (
                    <span className="text-xs text-gray-400 line-through">₹{p.originalPrice}</span>
                  )}
                  {p.discount > 0 && (
                    <span className="text-[10px] font-black text-emerald-600">({p.discount}% OFF)</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenEditModal(p)}
                className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 hover:text-black transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${p.title}" from Supabase database?`)) deleteProduct(p.id);
                }}
                className="text-gray-400 hover:text-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal with Device Photo Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black uppercase tracking-wider">
                {editingProduct ? 'EDIT PRODUCT' : 'ADD NEW CLOTHING PIECE'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Photo Upload Section */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1.5">
                  Product Photo (Upload directly from Device or URL)
                </label>
                <div className="flex items-center space-x-4">
                  {primaryImage && (
                    <img src={primaryImage} alt="Preview" className="w-20 h-24 object-cover rounded-xl border border-gray-200" />
                  )}
                  <div className="flex-1 space-y-2">
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
                      className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:border-black flex items-center justify-center space-x-2 transition"
                    >
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span>Choose Photo from Device</span>
                    </button>
                    <input
                      type="url"
                      placeholder="Or paste public image link"
                      value={primaryImage.startsWith('data:') ? '' : primaryImage}
                      onChange={(e) => setPrimaryImage(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
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
                    placeholder="e.g. Linen Camp Shirt"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  >
                    <option value="shirts">Shirts</option>
                    <option value="t-shirts">T-Shirts</option>
                    <option value="trousers">Trousers</option>
                    <option value="jeans">Jeans</option>
                    <option value="jackets">Jackets</option>
                    <option value="co-ords">Co-Ords</option>
                  </select>
                </div>
              </div>

              {/* Prices & Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Stock Units</label>
                  <input
                    type="number"
                    value={stockCount}
                    onChange={(e) => setStockCount(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Fit & Fabric */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Fit Type</label>
                  <input
                    type="text"
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    placeholder="e.g. Relaxed Fit, Oversized"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">Fabric Details</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. 100% Linen"
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:border-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-xs font-bold uppercase rounded-xl hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-800 shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
