import React from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  PackageCheck,
  PackageX,
  Clock,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Calendar,
  AlertCircle,
  Plus,
  Receipt,
  FileCheck,
  ArrowRightLeft,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface OwnerDashboardProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
  onNavigateToCustomers: () => void;
  onOpenAddProduct: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  onNavigateToProducts,
  onNavigateToOrders,
  onNavigateToCustomers,
  onOpenAddProduct,
}) => {
  const { dashboardStats, orders, products } = useShop();
  const { switchRole } = useAuth();

  const pendingVerificationOrders = orders.filter((o) => o.status === 'verifying_payment');
  const recentOrders = orders.slice(0, 5);

  // Maximum amount for sales chart bar scaling
  const maxDayAmount = Math.max(
    ...dashboardStats.salesByDay.map((d) => d.amount),
    500
  );

  return (
    <div id="owner-dashboard-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Welcome & Alert for pending slips */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <span>แดชบอร์ดสรุปยอดร้านค้า</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
              เจ้าของร้าน
            </span>
          </h2>
          <p className="text-xs text-stone-500">ข้อมูลสถิติยอดขาย ลูกค้า และออเดอร์แบบเรียลไทม์</p>
        </div>

        <button
          onClick={onOpenAddProduct}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm shadow-orange-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสินค้า</span>
        </button>
      </div>

      {/* Pending verification alert banner */}
      {pendingVerificationOrders.length > 0 && (
        <div
          onClick={onNavigateToOrders}
          className="p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/20 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold">
                มี {pendingVerificationOrders.length} ออเดอร์ แนบสลิปแล้วรอตรวจสอบ!
              </div>
              <div className="text-[11px] text-blue-100">
                คลิกเพื่อตรวจสอบสลิปและกดยืนยันการชำระเงิน
              </div>
            </div>
          </div>
          <span className="text-xs bg-white text-blue-900 font-bold px-2.5 py-1 rounded-xl shadow-xs">
            ตรวจสลิป →
          </span>
        </div>
      )}

      {/* Top 4 Key Metrics Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">ยอดขายวันนี้</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900">
            ฿{dashboardStats.todaySales.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>คำนวณจากออเดอร์ของวันนี้</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">ยอดขายทั้งหมด</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600">
            ฿{dashboardStats.totalSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-400">จากออเดอร์ที่สำเร็จและกำลังจัดส่ง</div>
        </div>

        {/* Orders Count */}
        <div
          onClick={onNavigateToOrders}
          className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-1 cursor-pointer hover:border-orange-300 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">จำนวนออเดอร์</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900">
            {dashboardStats.orderCount} ออเดอร์
          </div>
          <div className="text-[10px] text-orange-600 font-medium flex items-center gap-0.5">
            <span>ดูรายการออเดอร์ →</span>
          </div>
        </div>

        {/* Customers Count */}
        <div
          onClick={onNavigateToCustomers}
          className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-1 cursor-pointer hover:border-orange-300 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-medium">จำนวนลูกค้า</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-stone-900">
            {dashboardStats.customerCount} คน
          </div>
          <div className="text-[10px] text-purple-600 font-medium flex items-center gap-0.5">
            <span>ดูข้อมูลลูกค้ายืนยันตัวตน →</span>
          </div>
        </div>
      </div>

      {/* Product Availability Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={onNavigateToProducts}
          className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">สินค้าที่เปิดขาย</div>
              <div className="text-[10px] text-emerald-700">พร้อมให้ลูกค้าสั่งซื้อ</div>
            </div>
          </div>
          <span className="text-lg font-black text-emerald-700">
            {dashboardStats.activeProductsCount}
          </span>
        </div>

        <div
          onClick={onNavigateToProducts}
          className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-rose-100/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center">
              <PackageX className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-950">สินค้าที่ปิดขาย</div>
              <div className="text-[10px] text-rose-700">ลูกค้าสั่งซื้อไม่ได้</div>
            </div>
          </div>
          <span className="text-lg font-black text-rose-700">
            {dashboardStats.inactiveProductsCount}
          </span>
        </div>
      </div>

      {/* Sales Trend Chart (7 Days) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              กราฟสรุปยอดขายรายวัน (7 วันล่าสุด)
            </h3>
          </div>
          <span className="text-[10px] text-stone-400">หน่วย: บาท (THB)</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-1">
          <div className="flex items-end justify-between gap-2 h-36 border-b border-stone-100 pb-2">
            {dashboardStats.salesByDay.map((day, idx) => {
              const heightPercent =
                maxDayAmount > 0 ? Math.max(12, Math.round((day.amount / maxDayAmount) * 100)) : 12;
              const isToday = idx === dashboardStats.salesByDay.length - 1;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
                  {/* Tooltip value */}
                  <span className="text-[9px] font-bold text-stone-600 opacity-90 group-hover:scale-110 transition-transform">
                    {day.amount > 0 ? `฿${day.amount}` : '-'}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-stone-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-28">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isToday
                          ? 'bg-gradient-to-t from-orange-600 to-amber-400'
                          : day.amount > 0
                          ? 'bg-gradient-to-t from-orange-400 to-orange-300'
                          : 'bg-stone-200'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] whitespace-nowrap ${
                      isToday ? 'font-bold text-orange-600' : 'text-stone-400 font-medium'
                    }`}
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Demographics By Age (13-17, 18-24, 25-34, 35-44, 45+) */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              สถิติลูกค้าแบ่งตามช่วงอายุ (Age Demographics)
            </h3>
          </div>
          <span className="text-[10px] text-stone-400">
            รวม {dashboardStats.customerCount} บัญชี
          </span>
        </div>

        <p className="text-[11px] text-stone-500">
          วิเคราะห์กลุ่มอายุของลูกค้าที่ลงทะเบียนเพื่อวางแผนโปรโมชันและสินค้าที่ตรงกลุ่มเป้าหมาย
        </p>

        {/* Age breakdown bars */}
        <div className="space-y-2.5 pt-1">
          {dashboardStats.ageGroupStats.map((stat, idx) => {
            const barColors = [
              'bg-blue-500',
              'bg-emerald-500',
              'bg-orange-500',
              'bg-purple-500',
              'bg-rose-500',
            ];
            const color = barColors[idx % barColors.length];

            return (
              <div key={stat.range} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                    <span>{stat.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{stat.count} คน</span>
                    <span className="text-[11px] text-stone-400 font-medium w-9 text-right">
                      {stat.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(stat.percentage > 0 ? 5 : 0, stat.percentage)}%` }}
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            ออเดอร์ล่าสุด
          </h3>
          <button
            onClick={onNavigateToOrders}
            className="text-[11px] font-semibold text-orange-600 hover:underline"
          >
            ดูทั้งหมด ({orders.length}) →
          </button>
        </div>

        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div
              key={order.id}
              onClick={onNavigateToOrders}
              className="p-3 bg-stone-50 hover:bg-stone-100 rounded-2xl border border-stone-100 flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-900">{order.orderNumber}</span>
                  <span className="text-[11px] text-stone-500 truncate">
                    โดย {order.customerNickname}
                  </span>
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5">
                  {order.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs font-bold text-stone-900">
                  ฿{order.totalAmount.toLocaleString()}
                </span>
                <StatusBadge status={order.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Switch to Customer View button */}
      <div className="p-4 bg-stone-900 rounded-3xl text-stone-200 flex items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
            <span>สลับเป็นโหมดลูกค้า</span>
          </div>
          <div className="text-[11px] text-stone-400">
            ดูหน้าร้าน ทดลองสั่งซื้อสินค้าด้วยบัญชีนี้
          </div>
        </div>
        <button
          type="button"
          onClick={() => switchRole('customer')}
          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>สลับเป็นลูกค้า</span>
        </button>
      </div>
    </div>
  );
};
