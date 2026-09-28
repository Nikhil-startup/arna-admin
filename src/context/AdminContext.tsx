import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Product, Order, DiscountCoupon, VisitorStats } from '../types';

interface AdminContextType {
  products: Product[];
  orders: Order[];
  coupons: DiscountCoupon[];
  visitorStats: VisitorStats;
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status'], packingNotes?: string) => Promise<void>;
  addCoupon: (coupon: Omit<DiscountCoupon, 'id' | 'usageCount'>) => Promise<void>;
  toggleCoupon: (id: string) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultStats: VisitorStats = {
  totalVisitors: 1450,
  todayVisitors: 180,
  totalPageViews: 4890,
  conversionRate: 3.4,
  activeNow: 26,
  history: [
    { date: 'Mon', visitors: 620, views: 2400 },
    { date: 'Tue', visitors: 710, views: 2800 },
    { date: 'Wed', visitors: 830, views: 3100 },
    { date: 'Thu', visitors: 790, views: 2950 },
    { date: 'Fri', visitors: 940, views: 3700 },
    { date: 'Sat', visitors: 1120, views: 4600 },
    { date: 'Sun', visitors: 180, views: 680 }
  ]
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
      // 1. Fetch Products
      const { data: prodData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (prodData) {
        setProducts(prodData.map((row: any) => ({
          id: row.id,
          title: row.title,
          slug: row.slug,
          category: row.category,
          fit: row.fit || 'Relaxed Fit',
          price: Number(row.price),
          originalPrice: Number(row.original_price || row.price),
          discount: row.discount || 0,
          stockCount: row.stock_count || 10,
          inStock: (row.stock_count || 10) > 0,
          sizes: row.sizes || ['S', 'M', 'L', 'XL'],
          colors: row.colors || [{ name: 'Classic', hex: '#111827' }],
          images: row.images || [],
          description: row.description || '',
          fabric: row.fabric || '',
          rating: Number(row.rating || 4.8),
          reviewsCount: Number(row.reviews_count || 100),
          isNew: row.is_new ?? true,
          isTrending: row.is_trending ?? false,
          isBestSeller: row.is_bestseller ?? false
        })));
      }

      // 2. Fetch Orders
      const { data: orderData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
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
    const newProduct: Product = { ...productData, id };

    await supabase.from('products').insert([
      {
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
        description: productData.description,
        fabric: productData.fabric,
        rating: 4.8,
        reviews_count: 1,
        is_new: true,
        is_trending: false,
        is_bestseller: false
      }
    ]);

    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  };

  const updateProduct = async (productData: Product): Promise<Product> => {
    await supabase.from('products').update({
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
      description: productData.description,
      fabric: productData.fabric
    }).eq('id', productData.id);

    setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    return productData;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  // Order Fulfillment
  const updateOrderStatus = async (orderId: string, status: Order['status'], packingNotes?: string) => {
    const updatePayload: any = { status };
    if (packingNotes !== undefined) updatePayload.packing_notes = packingNotes;

    await supabase.from('orders').update(updatePayload).eq('id', orderId);

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
