import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  Store,
  User,
  ShieldCheck,
  Flame,
  Database,
  CloudCheck,
  ShoppingBag,
  Bell,
  Smartphone,
  Tablet,
  Maximize2,
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenFirebaseModal?: () => void;
  onOpenFirebaseConfig?: () => void;
  onOpenCart?: () => void;
  deviceView?: 'mobile' | 'tablet' | 'responsive';
  deviceMode?: 'mobile' | 'tablet' | 'responsive';
  setDeviceView?: (view: 'mobile' | 'tablet' | 'responsive') => void;
  onChangeDeviceMode?: (mode: 'mobile' | 'tablet' | 'responsive') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenFirebaseModal,
  onOpenFirebaseConfig,
  onOpenCart,
  deviceView,
  deviceMode,
  setDeviceView,
  onChangeDeviceMode,
}) => {
  const { currentUser, role, isOwner, switchRole, logout } = useAuth();
  const { shopSettings, isFirebaseLive, orders } = useShop();

  const currentDevice = deviceView || deviceMode || 'mobile';
  const handleDeviceChange = (view: 'mobile' | 'tablet' | 'responsive') => {
    if (setDeviceView) setDeviceView(view);
    if (onChangeDeviceMode) onChangeDeviceMode(view);
  };

  const handleOpenFirebase = () => {
    if (onOpenFirebaseModal) onOpenFirebaseModal();
    if (onOpenFirebaseConfig) onOpenFirebaseConfig();
  };

  const pendingVerificationOrders = orders.filter((o) => o.status === 'verifying_payment').length;

  return (
    <header id="app-main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Top micro bar for environment & quick switch */}
      <div className="bg-stone-900 text-stone-300 text-xs px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            id="btn-firebase-status-indicator"
            onClick={handleOpenFirebase}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
            title="คลิกเพื่อตั้งค่า Firebase"
          >
            {isFirebaseLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-medium text-emerald-300">Firebase เชื่อมต่อแล้ว</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-[11px] font-medium text-amber-300">Local Storage (พร้อมเชื่อมต่อ Firebase)</span>
              </>
            )}
          </button>
        </div>

        {/* Device preview mode toggle & Role Switcher */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-stone-800 rounded-lg p-0.5 text-stone-400">
            <button
              onClick={() => handleDeviceChange('mobile')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] transition-colors ${
                currentDevice === 'mobile' ? 'bg-orange-500 text-white font-medium' : 'hover:text-white'
              }`}
              title="iPhone View (390px)"
            >
              <Smartphone className="w-3 h-3" />
              <span>iPhone</span>
            </button>
            <button
              onClick={() => handleDeviceChange('tablet')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] transition-colors ${
                currentDevice === 'tablet' ? 'bg-orange-500 text-white font-medium' : 'hover:text-white'
              }`}
              title="iPad View (768px)"
            >
              <Tablet className="w-3 h-3" />
              <span>iPad</span>
            </button>
            <button
              onClick={() => handleDeviceChange('responsive')}
              className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] transition-colors ${
                currentDevice === 'responsive' ? 'bg-orange-500 text-white font-medium' : 'hover:text-white'
              }`}
              title="Full Width"
            >
              <Maximize2 className="w-3 h-3" />
              <span>เต็มจอ</span>
            </button>
          </div>

          {/* Quick Role Switcher */}
          <div className="flex items-center bg-stone-800 rounded-lg p-0.5">
            <button
              id="btn-switch-to-customer"
              onClick={() => switchRole('customer')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                role === 'customer'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              🛒 ฝั่งลูกค้า
            </button>
            <button
              id="btn-switch-to-owner"
              onClick={() => switchRole('owner')}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                role === 'owner'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              👑 เจ้าของร้าน
              {pendingVerificationOrders > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main branding & navigation bar */}
      <div className="px-4 py-2.5 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-stone-900 leading-tight">
                {shopSettings.name}
              </h1>
              {shopSettings.isOpen ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  เปิดร้าน
                </span>
              ) : (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
                  ปิดร้านชั่วคราว
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 truncate max-w-[200px] sm:max-w-md">
              {role === 'owner' ? 'โหมดเจ้าของร้าน (Admin Panel)' : shopSettings.announcement}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-stone-800 truncate max-w-[120px]">
                  {currentUser.nickname}
                </span>
                <span className="text-[10px] text-stone-500">
                  {role === 'owner' ? 'เจ้าของร้าน' : `อายุ ${currentUser.age} ปี`}
                </span>
              </div>
              <div className="relative">
                <img
                  src={currentUser.facePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={currentUser.nickname}
                  className="w-9 h-9 rounded-full object-cover border-2 border-orange-500/30 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                {isOwner && (
                  <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] rounded-full p-0.5 text-stone-950 shadow-xs">
                    👑
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              id="btn-header-login"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium transition-colors shadow-sm shadow-orange-600/20"
            >
              <User className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ / สมัคร</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
