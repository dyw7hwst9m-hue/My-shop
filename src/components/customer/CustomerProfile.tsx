import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import {
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  LogOut,
  Sparkles,
  Edit3,
  Crown,
  ChevronRight,
  Store,
  CheckCircle2,
  ArrowRightLeft,
  Camera,
  Upload,
  Loader2,
  AlertCircle,
  X,
  Cake,
} from 'lucide-react';

interface CustomerProfileProps {
  onOpenAuth: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ onOpenAuth }) => {
  const { currentUser, role, isOwner, switchRole, grantOwnerPermission, logout, updateProfile } = useAuth();
  const { orders } = useShop();

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [age, setAge] = useState<number | string>(currentUser?.age || 25);
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  
  const [facePhotoFile, setFacePhotoFile] = useState<File | null>(null);
  const [facePhotoPreview, setFacePhotoPreview] = useState<string | null>(
    currentUser?.facePhotoUrl || null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state when currentUser updates or when entering editing mode
  useEffect(() => {
    if (currentUser) {
      setNickname(currentUser.nickname || '');
      setAge(currentUser.age || 25);
      setBirthDate(currentUser.birthDate || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setFacePhotoPreview(currentUser.facePhotoUrl || null);
    }
  }, [currentUser, isEditing]);

  if (!currentUser) {
    return (
      <div
        id="profile-guest-view"
        className="space-y-4 pb-28 text-center p-8 bg-white rounded-3xl border border-stone-200 shadow-xs animate-in fade-in duration-300 mt-4"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">ยังไม่ได้เข้าสู่ระบบ</h3>
          <p className="text-xs text-stone-500 mt-1">
            เข้าสู่ระบบหรือสมัครสมาชิกเพื่อจัดการโปรไฟล์ สะสมยอดซื้อ และเข้าถึงสิทธิ์ร้านค้า
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition-all cursor-pointer"
        >
          เข้าสู่ระบบ / สมัครสมาชิก
        </button>
      </div>
    );
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFacePhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFacePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setStatusFeedback({ type: 'error', text: 'กรุณาระบุชื่อของคุณ' });
      return;
    }

    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 1 || numAge > 120) {
      setStatusFeedback({ type: 'error', text: 'กรุณาระบุอายุที่ถูกต้อง (1 - 120 ปี)' });
      return;
    }

    setIsSaving(true);
    setStatusFeedback(null);
    try {
      await updateProfile(
        {
          nickname: nickname.trim(),
          age: numAge,
          birthDate: birthDate.trim(),
          phone: phone.trim(),
          address: address.trim(),
          ...(facePhotoPreview && !facePhotoFile ? { facePhotoUrl: facePhotoPreview } : {}),
        },
        facePhotoFile || undefined
      );

      setIsEditing(false);
      setFacePhotoFile(null);
      setStatusFeedback({ type: 'success', text: 'บันทึกข้อมูลส่วนตัว (ชื่อ อายุ รูปโปรไฟล์) เรียบร้อยแล้ว' });
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      console.error('Save profile error:', err);
      setStatusFeedback({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleOwnerPermission = async () => {
    const nextState = !isOwner;
    await grantOwnerPermission(nextState);
    setStatusFeedback({
      type: 'success',
      text: nextState ? 'เปิดใช้งานสิทธิ์เจ้าของร้านเรียบร้อย' : 'ปิดสิทธิ์เจ้าของร้านเรียบร้อย',
    });
    setTimeout(() => setStatusFeedback(null), 2500);
  };

  const myOrders = orders.filter((o) => o.customerId === currentUser.id);
  const totalSpent = myOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const formattedJoinDate = new Date(currentUser.createdAt).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div id="customer-profile-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{statusFeedback.text}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs relative overflow-hidden space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <img
              src={currentUser.facePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
              alt={currentUser.nickname}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500/40 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-1 -right-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-1.5 shadow-xs cursor-pointer transition-transform hover:scale-105"
              title="แก้ไขรูปโปรไฟล์"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-stone-900 truncate">
                {currentUser.nickname}
              </h2>
              <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2.5 py-0.5 rounded-full">
                อายุ {currentUser.age} ปี
              </span>
              {isOwner && (
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  👑 สิทธิ์เจ้าของร้าน
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 truncate mt-0.5">{currentUser.email}</p>
            <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>สมาชิกตั้งแต่ {formattedJoinDate}</span>
            </div>
          </div>
        </div>

        {/* Roles & Account Privileges Banner */}
        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-orange-600" />
              <span>สิทธิ์การใช้งานบัญชี</span>
            </div>
            <div className="text-[11px] text-stone-500">
              {isOwner
                ? 'บัญชีนี้มี 2 สิทธิ์: ลูกค้าทั่วไป และ เจ้าของร้าน (1 บัญชีใช้งานได้ครบ)'
                : 'ปัจจุบันเป็น: ลูกค้าทั่วไป (สามารถเปิดสิทธิ์เจ้าของร้านได้)'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleOwnerPermission}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
              isOwner
                ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
            }`}
          >
            {isOwner ? '✓ มีสิทธิ์เจ้าของร้าน' : '+ เปิดสิทธิ์เจ้าของร้าน'}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
            <div className="text-[11px] text-stone-500">คำสั่งซื้อทั้งหมด</div>
            <div className="text-lg font-black text-stone-900 mt-0.5">
              {myOrders.length} ออเดอร์
            </div>
          </div>
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-center">
            <div className="text-[11px] text-stone-500">ยอดซื้อสะสม</div>
            <div className="text-lg font-black text-orange-600 mt-0.5">
              ฿{totalSpent.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Switch to Store Owner Card (if has owner permissions) */}
      {isOwner && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl text-white shadow-md shadow-amber-500/20 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-200" />
              <span>สลับเป็นโหมด “เจ้าของร้าน”</span>
            </div>
            <div className="text-[11px] text-amber-100 leading-tight">
              จัดการสินค้า เพิ่ม/แก้ไขเมนู ตรวจสอบสลิปออเดอร์ และดูรายงานยอดขาย
            </div>
          </div>
          <button
            id="btn-profile-switch-to-owner"
            onClick={() => switchRole('owner')}
            className="px-4 py-2.5 bg-white text-stone-900 hover:bg-amber-50 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
            <span>สลับเป็นเจ้าของร้าน</span>
          </button>
        </div>
      )}

      {/* Identity Verification Status */}
      <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold">สถานะบัญชี: ยืนยันตัวตนเรียบร้อย</div>
          <div className="text-[11px] text-emerald-800 leading-tight">
            รูปถ่ายใบหน้าและข้อมูลส่วนตัวถูกจัดเก็บบน Cloud Firestore อย่างปลอดภัย สามารถใช้สั่งซื้อสินค้าและชำระเงินได้ทันที
          </div>
        </div>
      </div>

      {/* Profile Details & Edit Section */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">ข้อมูลโปรไฟล์ลูกค้า</h3>
            <p className="text-[11px] text-stone-500">
              แก้ไขชื่อ อายุ รูปโปรไฟล์ และที่อยู่จัดส่งได้ที่นี่
            </p>
          </div>
          <button
            id="btn-toggle-edit-profile"
            onClick={() => {
              setIsEditing(!isEditing);
              setFacePhotoFile(null);
            }}
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'ยกเลิกแก้ไข' : 'แก้ไขโปรไฟล์'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            {/* Profile Photo Editor */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 space-y-3">
              <label className="block font-bold text-stone-800 text-xs">
                รูปโปรไฟล์ / รูปถ่ายใบหน้า
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={facePhotoPreview || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'}
                    alt="Preview"
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-orange-500 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  {facePhotoFile && (
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 text-[9px] font-bold">
                      ใหม่
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <label className="px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs w-fit transition-all">
                    <Upload className="w-3.5 h-3.5 text-orange-600" />
                    <span>เปลี่ยนรูปโปรไฟล์</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-stone-500">
                    รองรับไฟล์ JPG, PNG หรือถ่ายรูปสดจากกล้อง
                  </p>
                </div>
              </div>
            </div>

            {/* Name and Age grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  ชื่อ / ชื่อเล่น *
                </label>
                <input
                  id="input-edit-nickname"
                  type="text"
                  required
                  placeholder="เช่น มุกดา, สมชาย"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  อายุ (ปี) *
                </label>
                <input
                  id="input-edit-age"
                  type="number"
                  required
                  min={1}
                  max={120}
                  placeholder="เช่น 25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Birth Date & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5 text-orange-600" />
                  <span>วันเกิด</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>เบอร์โทรศัพท์</span>
                </label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-stone-700 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>ที่อยู่จัดส่งสินค้า</span>
              </label>
              <textarea
                rows={2}
                placeholder="ระบุบ้านเลขที่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden resize-none"
              />
            </div>

            {/* Form action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFacePhotoFile(null);
                }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                ยกเลิก
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกข้อมูลส่วนตัว</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5 text-stone-600">
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">ชื่อ / ชื่อเล่น</span>
              <span className="font-bold text-stone-900">{currentUser.nickname}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">อายุ</span>
              <span className="font-bold text-stone-900">{currentUser.age} ปี</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">อีเมล</span>
              <span className="font-medium text-stone-800">{currentUser.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">เบอร์โทรศัพท์</span>
              <span className="font-medium text-stone-800">
                {currentUser.phone || 'ยังไม่ได้ระบุ'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-stone-100">
              <span className="text-stone-400">วันเกิด</span>
              <span className="font-medium text-stone-800">
                {currentUser.birthDate || 'ยังไม่ได้ระบุ'}
              </span>
            </div>
            <div className="py-1.5">
              <span className="text-stone-400 block mb-1">ที่อยู่จัดส่ง</span>
              <span className="font-medium text-stone-800 bg-stone-50 p-2.5 rounded-xl border border-stone-100 block">
                {currentUser.address || 'ยังไม่ได้ระบุที่อยู่จัดส่ง'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-rose-200"
      >
        <LogOut className="w-4 h-4" />
        <span>ออกจากระบบ</span>
      </button>
    </div>
  );
};
