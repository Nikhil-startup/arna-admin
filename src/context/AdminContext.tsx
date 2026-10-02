import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
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

  // Fetch all live data from Supabase
  const refreshData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Products with query limit (avoids loading whole DB unbounded)
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(80);

      if (prodData) {
        setProducts(prodData.map((row: any) => {
          const stockCount = row.stock_count ?? 10;
          const soldOutAt = extractSoldOutAt(row) || (stockCount <= 0 ? (row.updated_at || row.created_at || new Date().toISOString()) : undefined);
          return {
            id: row.id,
            title: row.title,
            slug: row.slug,
            category: row.category,
            fit: row.fit || 'Relaxed Fit',
            price: Number(row.price),
            originalPrice: Number(row.original_price || row.price),
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
            reviewsCount: Number(row.reviews_count || 100),
            isNew: row.is_new ?? true,
            isTrending: row.is_trending ?? false,
            isBestSeller: row.is_bestseller ?? false
          };
        }));
      }

      // 2. Fetch Orders with query limit
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

      if (orderData) {
        setOrders(orderData.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          shippingAddress: row.shipping_address,
          items: row.items,
          subtotal: Number(row.subtotal || row.total_amount),
          discount: Number(row.discount || 0),
          shippingFee: Number(row.shipping_fee || 0),
          total: Number(row.total_amount),
          paymentMethod: row.payment_method,
          status: row.status,
          packingNotes: row.packing_notes || '',
          orderVerificationKey: row.order_verification_key,
          createdAt: row.created_at,
          estimatedDelivery: 'In 2-3 business days'
        })));
      }

      // 3. Fetch Coupons
      const { data: couponData } = await supabase.from('coupons').select('*').order('code', { ascending: true });
      if (couponData) {
        setCoupons(couponData.map((c: any) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: Number(c.value),
          minOrderValue: Number(c.min_order_value || 0),
          isActive: c.is_active,
          usageCount: c.usage_count || 0
        })));
      }

      // 4. Fetch Visitor Stats
      const { data: statData } = await supabase.from('visitor_stats').select('*').single();
      if (statData) {
        setVisitorStats({
          totalVisitors: statData.total_visitors,
          todayVisitors: statData.today_visitors,
          totalPageViews: statData.total_page_views,
          conversionRate: Number(statData.conversion_rate),
          activeNow: statData.active_now,
          history: defaultStats.history
        });
      }
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const id = 'prod_' + Date.now();
    const soldOutAt = productData.stockCount <= 0 ? (productData.soldOutAt || new Date().toISOString()) : undefined;
    const descWithTag = embedSoldOutAtInDescription(productData.description, soldOutAt);
    const newProduct: Product = { ...productData, id, soldOutAt };

    const row: any = {
      id,
      title: productData.title,
      slug: productData.slug,
      category: productData.category,
      fit: productData.fit,
      price: productData.price,
      original_price: productData.originalPrice,
      discount: productData.discount,
      stock_count: productData.stockCount,
      sizes: productData.sizes,
      colors: productData.colors,
      images: productData.images,
      description: descWithTag,
      fabric: productData.fabric,
      rating: 4.8,
      reviews_count: 1,
      is_new: true,
      is_trending: false,
      is_bestseller: false
    };

    try {
      row.sold_out_at = soldOutAt || null;
      await supabase.from('products').insert([row]);
    } catch {
      delete row.sold_out_at;
      await supabase.from('products').insert([row]);
    }

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (productData: Product): Promise<Product> => {
    const soldOutAt = productData.stockCount <= 0 ? (productData.soldOutAt || new Date().toISOString()) : undefined;
    const descWithTag = embedSoldOutAtInDescription(productData.description, soldOutAt);

    const updatePayload: any = {
      title: productData.title,
      category: productData.category,
      fit: productData.fit,
      price: productData.price,
      original_price: productData.originalPrice,
      discount: productData.discount,
      stock_count: productData.stockCount,
      sizes: productData.sizes,
      colors: productData.colors,
      images: productData.images,
      description: descWithTag,
      fabric: productData.fabric
    };

    try {
      updatePayload.sold_out_at = soldOutAt || null;
      await supabase.from('products').update(updatePayload).eq('id', productData.id);
    } catch {
      delete updatePayload.sold_out_at;
      await supabase.from('products').update(updatePayload).eq('id', productData.id);
    }

    const updatedProduct = { ...productData, soldOutAt };
    setProducts(prev => prev.map(p => p.id === productData.id ? updatedProduct : p));
    return updatedProduct;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    // Optimistic UI Update: remove from list immediately (0ms)
    const previousProducts = products;
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      // 1. Clean up any historical order items referencing this product to satisfy FK constraint
      await supabase.from('order_items').delete().eq('product_id', id);

      // 2. Delete product from Supabase
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase product delete error:', error);
        setProducts(previousProducts); // Rollback optimistic state
        alert('Could not delete product: ' + error.message);
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
    const descWithTag = embedSoldOutAtInDescription(prod?.description || '', soldOutAt);

    // Optimistic UI Update: immediately update state in 0ms
    const previousProducts = products;
    setProducts(prev => prev.map(p => p.id === id ? { 
      ...p, 
      stockCount: validStock, 
      inStock: validStock > 0,
      soldOutAt 
    } : p));

    const updatePayload: any = {
      stock_count: validStock,
      description: descWithTag
    };

    try {
      updatePayload.sold_out_at = soldOutAt || null;
      await supabase.from('products').update(updatePayload).eq('id', id);
    } catch {
      delete updatePayload.sold_out_at;
      try {
        await supabase.from('products').update(updatePayload).eq('id', id);
      } catch (err) {
        setProducts(previousProducts); // Rollback optimistic state
      }
    }
  };

  // Order Fulfillment (Optimistic UI Rendering)
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

    const updatePayload: any = { status };
    if (packingNotes !== undefined) updatePayload.packing_notes = packingNotes;

    try {
      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) {
        setOrders(previousOrders); // Rollback optimistic state on error
        console.warn('Order status update rollback:', error);
      }
    } catch (err) {
      setOrders(previousOrders); // Rollback optimistic state
    }
  };

  // Coupon CRUD
  const addCoupon = async (couponData: Omit<DiscountCoupon, 'id' | 'usageCount'>) => {
    const id = 'c_' + Date.now();
    const newCoupon: DiscountCoupon = { ...couponData, id, usageCount: 0 };

    await supabase.from('coupons').insert([
      {
        id,
        code: couponData.code.toUpperCase(),
        type: couponData.type,
        value: couponData.value,
        min_order_value: couponData.minOrderValue,
        is_active: couponData.isActive
      }
    ]);

    setCoupons(prev => [newCoupon, ...prev]);
  };

  const toggleCoupon = async (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    const nextState = !coupon.isActive;

    await supabase.from('coupons').update({ is_active: nextState }).eq('id', id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: nextState } : c));
  };

  const deleteCoupon = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id);
    setCoupons(prev => prev.filter(c => c.id !== id));
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
