import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Customer } from '../../types';
import {
  Users,
  Search,
  ShieldCheck,
  Eye,
  Calendar,
  Phone,
  Mail,
  ShoppingBag,
  TrendingUp,
  X,
  PieChart,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const OwnerCustomers: React.FC = () => {
  const { customers, dashboardStats, orders } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  const filteredCustomers = customers.filter((c) => {
    return (
      c.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    );
  });

  return (
    <div id="owner-customers-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-stone-900">ลูกค้าร้านค้า (ยืนยันตัวตน)</h2>
        <p className="text-xs text-stone-500">
          ทั้งหมด {customers.length} คน พร้อมภาพถ่ายใบหน้ายืนยันตัวตนและข้อมูลช่วงอายุ
        </p>
      </div>

      {/* Age Demographics Summary Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              สถิติลูกค้าแบ่งตามช่วงอายุ (Age Groups)
            </h3>
          </div>
          <span className="text-[10px] text-stone-400 font-medium">
            เฉลี่ย 26.5 ปี
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {dashboardStats.ageGroupStats.map((item) => (
            <div
              key={item.range}
              className="p-2.5 bg-stone-50 rounded-2xl border border-stone-100 text-center space-y-0.5"
            >
              <div className="text-[10px] text-stone-500 font-semibold">{item.label}</div>
              <div className="text-sm font-black text-stone-900">{item.count} คน</div>
              <div className="text-[10px] text-orange-600 font-medium">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Customer */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
        <input
          type="text"
          placeholder="ค้นหาชื่อเล่น, อีเมล, หรือเบอร์โทรลูกค้า..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-hidden focus:border-orange-500 shadow-xs"
        />
      </div>

      {/* Customers List */}
      <div className="space-y-3">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((cust) => {
            const customerOrders = orders.filter((o) => o.customerId === cust.id);
            const totalSpent = customerOrders
              .filter((o) => o.status !== 'cancelled')
              .reduce((s, o) => s + o.totalAmount, 0);

            const joinDateFormatted = new Date(cust.createdAt).toLocaleDateString('th-TH', {
              dateStyle: 'medium',
            });

            return (
              <div
                key={cust.id}
                id={`customer-item-${cust.id}`}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3"
              >
                {/* Top: Photo, Nickname, Age, Verified badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={() => setInspectPhotoUrl(cust.facePhotoUrl)}>
                      <img
                        src={cust.facePhotoUrl}
                        alt={cust.nickname}
                        className="w-13 h-13 rounded-2xl object-cover border border-stone-200 shadow-2xs group-hover:opacity-90 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs" title="ยืนยันตัวตนแล้ว">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-stone-900">{cust.nickname}</h3>
                        <span className="text-[10px] bg-orange-100 text-orange-800 font-semibold px-2 py-0.5 rounded-full">
                          อายุ {cust.age} ปี
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">{cust.email}</p>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        วันเกิด: {cust.birthDate || 'ไม่ระบุ'} • สมัครเมื่อ {joinDateFormatted}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectPhotoUrl(cust.facePhotoUrl)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ตรวจรูปหน้า</span>
                  </button>
                </div>

                {/* Bottom: Contact & Order Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400">คำสั่งซื้อทั้งหมด</div>
                    <div className="font-bold text-stone-900 mt-0.5">
                      {customerOrders.length} ออเดอร์
                    </div>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400">ยอดซื้อสะสม</div>
                    <div className="font-bold text-orange-600 mt-0.5">
                      ฿{totalSpent.toLocaleString()}
                    </div>
                  </div>
                </div>

                {cust.phone && (
                  <div className="text-[11px] text-stone-500 flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-stone-400" />
                    <span>{cust.phone}</span>
                    {cust.address && <span className="truncate ml-2 text-stone-400">| {cust.address}</span>}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            ไม่พบข้อมูลลูกค้าที่ค้นหา
          </div>
        )}
      </div>

      {/* Verified Face Photo Inspector Modal */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-5 shadow-2xl border border-stone-100 flex flex-col items-center space-y-3">
            <button
              onClick={() => setInspectPhotoUrl(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>ภาพถ่ายใบหน้ายืนยันตัวตน (Private Identity)</span>
            </div>

            <div className="w-64 h-64 rounded-2xl overflow-hidden border-2 border-stone-200 shadow-md">
              <img
                src={inspectPhotoUrl}
                alt="Customer Face Inspection"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-[11px] text-stone-500 text-center">
              รูปภาพนี้ถูกบันทึกตอนสมัครสมาชิกเพื่อป้องกันการแอบอ้างสิทธิ์และตรวจสอบความถูกต้อง
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
