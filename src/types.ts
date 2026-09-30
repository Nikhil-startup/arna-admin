export interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  fit: string;
  price: number;
  originalPrice: number;
  discount: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  rating: number;
  reviewsCount: number;
  isNew: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  inStock: boolean;
  stockCount: number;
  soldOutAt?: string;
  description: string;
  fabric: string;
  washCare?: string;
  details?: string[];
}

export interface OrderItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string[];
  };
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  shippingAddress: {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    pinCode: string;
  };
  paymentMethod: 'upi' | 'card' | 'cod' | 'netbanking';
  paymentStatus?: 'pending' | 'paid' | 'pending_delivery';
  status: 'confirmed' | 'packing' | 'shipped' | 'delivered';
  createdAt: string;
  estimatedDelivery?: string;
  packingNotes?: string;
  orderVerificationKey?: string;
}

export interface DiscountCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'flat';
  value: number;
  minOrderValue: number;
  isActive: boolean;
  usageCount: number;
}

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  totalPageViews: number;
  conversionRate: number;
  activeNow: number;
  history: { date: string; visitors: number; views: number }[];
}
