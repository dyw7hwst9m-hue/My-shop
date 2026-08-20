import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  Receipt,
  User,
  LayoutDashboard,
  PackageCheck,
  ClipboardList,
  Users,
  Settings,
} from 'lucide-react';

export type CustomerTab = 'home' | 'categories' | 'cart' | 'orders' | 'profile';
export type OwnerTab = 'dashboard' | 'products' | 'orders' | 'customers' | 'settings' | 'owner_dashboard' | 'owner_products' | 'owner_orders' | 'owner_customers' | 'owner_settings';

export interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  currentCustomerTab?: CustomerTab;
  setCustomerTab?: (tab: CustomerTab) => void;
  currentOwnerTab?: OwnerTab;
  setOwnerTab?: (tab: OwnerTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  currentCustomerTab,
  setCustomerTab,
  currentOwnerTab,
  setOwnerTab,
}) => {
  const { role, currentUser } = useAuth();
  const { cartItemCount, orders } = useShop();

  // Badges calculation
  const customerPendingOrders = orders.filter(
    (o) =>
      o.customerId === currentUser?.id &&
      (o.status === 'pending_payment' || o.status === 'ready')
  ).length;

  const ownerPendingOrders = orders.filter(
    (o) => o.status === 'verifying_payment' || o.status === 'pending_payment'
  ).length;

  const handleCustomerTabClick = (tabId: CustomerTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (typeof setCustomerTab === 'function') {
      setCustomerTab(tabId);
    }
  };

  const handleOwnerTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else if (typeof setOwnerTab === 'function') {
      setOwnerTab(tabId as OwnerTab);
    }
  };

  if (role === 'owner') {
    const activeOwnerKey = activeTab || currentOwnerTab || 'dashboard';
    const ownerTabs: { id: string; label: string; icon: React.ElementType; badge?: number }[] = [
      { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { id: 'products', label: 'สินค้า', icon: PackageCheck },
      { id: 'orders', label: 'ออเดอร์', icon: ClipboardList, badge: ownerPendingOrders },
      { id: 'customers', label: 'ลูกค้า', icon: Users },
      { id: 'settings', label: 'ตั้งค่า', icon: Settings },
    ];

    return (
      <nav
        id="owner-bottom-navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800 text-stone-400 safe-bottom"
      >
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
          {ownerTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeOwnerKey === tab.id || activeOwnerKey === `owner_${tab.id}`;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => handleOwnerTabClick(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-amber-400 font-medium scale-105'
                    : 'hover:text-stone-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[11px] mt-0.5 whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-0.5"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // Customer Navigation
  const activeCustomerKey = activeTab || currentCustomerTab || 'home';
  const customerTabs: { id: CustomerTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'categories', label: 'หมวดหมู่', icon: LayoutGrid },
    { id: 'cart', label: 'ตะกร้า', icon: ShoppingBag, badge: cartItemCount },
    { id: 'orders', label: 'ออเดอร์', icon: Receipt, badge: customerPendingOrders },
    { id: 'profile', label: 'โปรไฟล์', icon: User },
  ];

  return (
    <nav
      id="customer-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 text-stone-500 shadow-lg safe-bottom"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {customerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCustomerKey === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => handleCustomerTabClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-orange-600 font-semibold scale-105'
                  : 'hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5 whitespace-nowrap">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 absolute bottom-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
