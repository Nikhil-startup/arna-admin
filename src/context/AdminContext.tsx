import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, defaultHeaders } from '../services/api';
import { Product, Order, DiscountCoupon, VisitorStats } from '../types';

export function extractSoldOutAt(row: any): string | undefined {
  if (row.sold_out_at) return row.sold_out_at;
  if (row.description && typeof row.description === 'string') {
    const match = row.description.match(/<!--sold_out_at:([^>]+)-->/);
    if (match && match[1]) return match[1];
  }
  return undefined;
}

export function embedSoldOutAtInDescription(description: string, soldOutAt?: string | null): string {
  const clean = (description || '').replace(/<!--sold_out_at:[^>]+-->/g, '').trim();
  if (soldOutAt) {
    return `${clean}\n<!--sold_out_at:${soldOutAt}-->`;
  }
  return clean;
}

interface AdminContextType {
  products: Product[];
  orders: Order[];
  coupons: DiscountCoupon[];
  visitorStats: VisitorStats;
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status'], packingNotes?: string) => Promise<void>;
  addCoupon: (coupon: Omit<DiscountCoupon, 'id' | 'usageCount'>) => Promise<void>;
  toggleCoupon: (id: string) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultStats: VisitorStats = {
  totalVisitors: 0,
  todayVisitors: 0,
  totalPageViews: 0,
  conversionRate: 0,
  activeNow: 1,
  history: []
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [visitorStats, setVisitorStats] = useState<VisitorStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all live data from FastAPI Backend (Keys strictly protected on backend)
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Products with query limit (avoids loading whole DB unbounded)
      const prodRes = await fetch(`${API_BASE_URL}/products?limit=80`, { headers: defaultHeaders });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.map((row: any) => {
          const stockCount = row.stockCount ?? row.stock_count ?? 10;
          const soldOutAt = row.soldOutAt || extractSoldOutAt(row) || (stockCount <= 0 ? (row.updated_at || row.created_at || new Date().toISOString()) : undefined);
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
            fit: row.fit || 'Relaxed Fit',
            price: Number(row.price),
            originalPrice: Number(row.originalPrice || row.original_price || row.price),
            discount: row.discount || 0,
            stockCount,
            inStock: stockCount > 0,
            soldOutAt,
            sizes: row.sizes || ['S', 'M', 'L', 'XL'],
            colors: row.colors || [{ name: 'Classic', hex: '#111827' }],
            images: row.images || [],
            description: (row.description || '').replace(/<!--sold_out_at:[^>]+-->/g, '').trim(),
            fabric: row.fabric || '',
            rating: Number(row.rating || 4.8),
            reviewsCount: Number(row.reviewsCount || row.reviews_count || 100),
            isNew: row.isNew ?? row.is_new ?? true,
            isTrending: row.isTrending ?? row.is_trending ?? false,
            isBestSeller: row.isBestSeller ?? row.is_bestseller ?? false
          };
        }));
      }

      // 2. Fetch Orders with query limit
      const orderRes = await fetch(`${API_BASE_URL}/orders?limit=60`, { headers: defaultHeaders });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        setOrders(orderData.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number || row.orderNumber,
          shippingAddress: row.shipping_address || row.shippingAddress,
          items: row.items || (row.order_items ? row.order_items.map((it: any) => ({
            id: it.id,
            product: { id: it.product_id, title: it.product_title, price: it.unit_price, images: [] },
            selectedSize: it.selected_size,
            selectedColor: it.selected_color,
            quantity: it.quantity
          })) : []),
          subtotal: Number(row.subtotal || row.total_amount),
          discount: Number(row.discount || 0),
          shippingFee: Number(row.shipping_fee || 0),
          total: Number(row.total_amount || row.total),
          paymentMethod: row.payment_method || row.paymentMethod,
          status: row.status,
          packingNotes: row.packing_notes || row.packingNotes || '',
          orderVerificationKey: row.order_verification_key || row.orderVerificationKey,
          createdAt: row.created_at || row.createdAt,
          estimatedDelivery: 'In 2-3 business days'
        })));
      }

      // 3. Fetch Coupons
      const couponRes = await fetch(`${API_BASE_URL}/coupons`, { headers: defaultHeaders });
      if (couponRes.ok) {
        const couponData = await couponRes.json();
        setCoupons(couponData.map((c: any) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: Number(c.value),
          minOrderValue: Number(c.min_order_value || c.minOrderValue || 0),
          isActive: c.is_active ?? c.isActive ?? true,
          usageCount: c.usage_count || c.usageCount || 0
        })));
      }

      // 4. Fetch Visitor Stats
      const statRes = await fetch(`${API_BASE_URL}/analytics`, { headers: defaultHeaders });
      if (statRes.ok) {
        const statData = await statRes.json();
        setVisitorStats({
          totalVisitors: statData.totalVisitors ?? statData.total_visitors ?? 0,
          todayVisitors: statData.todayVisitors ?? statData.today_visitors ?? 0,
          totalPageViews: statData.totalPageViews ?? statData.total_page_views ?? 0,
          conversionRate: Number(statData.conversionRate ?? statData.conversion_rate ?? 0),
          activeNow: statData.activeNow ?? statData.active_now ?? 1,
          history: defaultStats.history
        });
      }
    } catch (err) {
      console.warn('Backend API connection notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Product CRUD (Routed securely through backend API)
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const id = 'prod_' + Date.now();
    const soldOutAt = productData.stockCount <= 0 ? (productData.soldOutAt || new Date().toISOString()) : undefined;
    const newProduct: Product = { ...productData, id, soldOutAt };

    try {
      await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          title: productData.title,
          slug: productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: productData.category,
          fit: productData.fit,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discount: productData.discount,
          stockCount: productData.stockCount,
          sizes: productData.sizes,
          colors: productData.colors,
          images: productData.images,
          description: productData.description,
          fabric: productData.fabric,
          washCare: productData.washCare || 'Machine wash cold with like colors.',
          rating: productData.rating || 4.8,
          reviewsCount: productData.reviewsCount || 100,
          isNew: productData.isNew ?? true,
          isTrending: productData.isTrending ?? false,
          isBestSeller: productData.isBestSeller ?? false,
          soldOutAt
        })
      });
    } catch (e) {
      console.warn('Backend addProduct notice:', e);
    }

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (productData: Product): Promise<Product> => {
    const soldOutAt = productData.stockCount <= 0 ? (productData.soldOutAt || new Date().toISOString()) : undefined;
    const updatedProduct = { ...productData, soldOutAt };
    setProducts(prev => prev.map(p => p.id === productData.id ? updatedProduct : p));

    try {
      await fetch(`${API_BASE_URL}/products/${productData.id}`, {
        method: 'PATCH',
        headers: defaultHeaders,
        body: JSON.stringify({
          title: productData.title,
          slug: productData.slug,
          category: productData.category,
          fit: productData.fit,
          price: productData.price,
          originalPrice: productData.originalPrice,
          discount: productData.discount,
          stockCount: productData.stockCount,
          sizes: productData.sizes,
          colors: productData.colors,
          images: productData.images,
          description: productData.description,
          fabric: productData.fabric,
          washCare: productData.washCare,
          soldOutAt
        })
      });
    } catch (e) {
      console.warn('Backend updateProduct notice:', e);
    }

    return updatedProduct;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    // Optimistic UI Update: remove from list immediately (0ms)
    const previousProducts = products;
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders
      });
      if (!res.ok) {
        setProducts(previousProducts); // Rollback optimistic state
        alert('Could not delete product: server returned an error');
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Delete error:', err);
      setProducts(previousProducts); // Rollback optimistic state
      alert('Delete failed: ' + err.message);
      return false;
    }
  };

  const updateStock = async (id: string, newStock: number): Promise<void> => {
    const validStock = Math.max(0, newStock);
    const prod = products.find(p => p.id === id);
    const soldOutAt = validStock <= 0 ? (prod?.soldOutAt || new Date().toISOString()) : undefined;

    // Optimistic UI Update: immediately update state in 0ms
    const previousProducts = products;
    setProducts(prev => prev.map(p => p.id === id ? { 
      ...p, 
      stockCount: validStock, 
      inStock: validStock > 0, 
      soldOutAt 
    } : p));

    try {
      await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PATCH',
        headers: defaultHeaders,
        body: JSON.stringify({ stockCount: validStock, soldOutAt })
      });
    } catch (err) {
      setProducts(previousProducts); // Rollback optimistic state
    }
  };

  // Order Fulfillment (Optimistic UI Rendering via backend)
  const updateOrderStatus = async (orderId: string, status: Order['status'], packingNotes?: string) => {
    // Optimistic UI Update: update badge and status in 0ms
    const previousOrders = orders;
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status,
          packingNotes: packingNotes !== undefined ? packingNotes : o.packingNotes
        };
      }
      return o;
    }));

    try {
      await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: defaultHeaders,
        body: JSON.stringify({ status, packingNotes })
      });
    } catch (err) {
      setOrders(previousOrders); // Rollback optimistic state
    }
  };

  // Coupon CRUD (Backend Proxy)
  const addCoupon = async (couponData: Omit<DiscountCoupon, 'id' | 'usageCount'>) => {
    const id = 'c_' + Date.now();
    const newCoupon: DiscountCoupon = { ...couponData, id, usageCount: 0 };
    setCoupons(prev => [newCoupon, ...prev]);

    try {
      await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          code: couponData.code.toUpperCase(),
          type: couponData.type,
          value: couponData.value,
          minOrderValue: couponData.minOrderValue,
          isActive: couponData.isActive
        })
      });
    } catch (e) {
      console.warn('Backend addCoupon notice:', e);
    }
  };

  const toggleCoupon = async (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    const nextState = !coupon.isActive;

    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: nextState } : c));

    try {
      await fetch(`${API_BASE_URL}/coupons/${id}/toggle?is_active=${nextState}`, {
        method: 'PATCH',
        headers: defaultHeaders
      });
    } catch (e) {
      console.warn('Backend toggleCoupon notice:', e);
    }
  };

  const deleteCoupon = async (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`${API_BASE_URL}/coupons/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders
      });
    } catch (e) {
      console.warn('Backend deleteCoupon notice:', e);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        products,
        orders,
        coupons,
        visitorStats,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        updateOrderStatus,
        addCoupon,
        toggleCoupon,
        deleteCoupon,
        refreshData
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminProvider');
  return context;
};
