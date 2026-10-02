import React, { useState } from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminNavbar } from './components/AdminNavbar';
import { AdminOrders } from './components/AdminOrders';
import { AdminProducts } from './components/AdminProducts';
import { AdminDiscounts } from './components/AdminDiscounts';
import { AdminAnalytics } from './components/AdminAnalytics';
import { AdminSecurityAndBilling } from './components/AdminSecurityAndBilling';
import { AdminLogin } from './components/AdminLogin';
import { AdminLoader } from './components/AdminLoader';

const AdminContent: React.FC = () => {
  const { orders, visitorStats } = useAdmin();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('arna_admin_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'discounts' | 'analytics' | 'security'>('orders');

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  const pendingOrdersCount = orders.filter(o => o.status === 'confirmed').length;

  const handleLogout = () => {
    localStorage.removeItem('arna_admin_auth');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingOrdersCount={pendingOrdersCount}
        activeNow={visitorStats.activeNow}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'discounts' && <AdminDiscounts />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'security' && <AdminSecurityAndBilling />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}
