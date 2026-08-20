import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { isFirebaseConfigured } from '../../firebase/config';
import {
  Store,
  QrCode,
  Bell,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface OwnerSettingsProps {
  onOpenFirebaseModal: () => void;
}

export const OwnerSettings: React.FC<OwnerSettingsProps> = ({ onOpenFirebaseModal }) => {
  const { shopSettings, updateShopSettings } = useShop();
  const { switchRole } = useAuth();

  const [name, setName] = useState(shopSettings.name);
  const [promptPayName, setPromptPayName] = useState(shopSettings.promptPayName);
  const [promptPayNumber, setPromptPayNumber] = useState(shopSettings.promptPayNumber);
  const [qrCodeUrl, setQrCodeUrl] = useState(shopSettings.qrCodeUrl || '');
  const [announcement, setAnnouncement] = useState(shopSettings.announcement || '');
  const [isOpen, setIsOpen] = useState(shopSettings.isOpen);
  const [phone, setPhone] = useState(shopSettings.phone || '');
  const [address, setAddress] = useState(shopSettings.address || '');

  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(shopSettings.qrCodeUrl || null);

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when shopSettings changes (e.g. after initial firestore load)
  React.useEffect(() => {
    if (shopSettings) {
      setName(shopSettings.name || '');
      setPromptPayName(shopSettings.promptPayName || '');
      setPromptPayNumber(shopSettings.promptPayNumber || '');
      setQrCodeUrl(shopSettings.qrCodeUrl || '');
      setAnnouncement(shopSettings.announcement || '');
      setIsOpen(shopSettings.isOpen ?? true);
      setPhone(shopSettings.phone || '');
      setAddress(shopSettings.address || '');
      if (!qrFile) {
        setQrPreview(shopSettings.qrCodeUrl || null);
      }
    }
  }, [shopSettings]);

  const isLiveFirebase = isFirebaseConfigured();

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onload = () => setQrPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      if (!updateShopSettings) {
        throw new Error('ระบบอัปเดตข้อมูลร้านค้าไม่พร้อมใช้งาน');
      }

      await updateShopSettings(
        {
          name: name.trim() || 'ร้านค้าของฉัน',
          promptPayName: promptPayName.trim() || 'พร้อมเพย์',
          promptPayNumber: promptPayNumber.trim() || '080-000-0000',
          qrCodeUrl: qrPreview || qrCodeUrl || '',
          announcement: announcement.trim(),
          isOpen,
          phone: phone.trim(),
          address: address.trim(),
        },
        qrFile || undefined
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save shop settings error:', err);
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="owner-settings-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div>
        <h2 className="text-base font-bold text-stone-900">ตั้งค่าร้านค้า & บัญชี</h2>
        <p className="text-xs text-stone-500">จัดการข้อมูลร้านค้า ช่องทางรับเงิน และระบบฐานข้อมูล</p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">บันทึกข้อมูลร้านค้าเรียบร้อยแล้ว</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* General Shop Info */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600" />
            <span>ข้อมูลทั่วไปร้านค้า</span>
          </h3>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">ชื่อร้านค้า *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              ข้อความประกาศหน้าร้าน (Announcement)
            </label>
            <textarea
              rows={2}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="ยินดีต้อนรับสู่ร้านของเรา เมนูแนะนำวันนี้..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden resize-none"
            />
          </div>

          {/* Store open toggle */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-900">สถานะเปิด-ปิดร้าน</div>
              <div className="text-[11px] text-stone-500">
                {isOpen ? 'ร้านเปิดให้บริการปกติ' : 'ปิดร้านชั่วคราว'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {isOpen ? 'เปิดร้านอยู่' : 'ปิดร้านชั่วคราว'}
            </button>
          </div>
        </div>

        {/* PromptPay & QR Settings */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-orange-600" />
            <span>ช่องทางรับเงิน (พร้อมเพย์)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                ชื่อบัญชีผู้รับเงิน (พร้อมเพย์) *
              </label>
              <input
                type="text"
                required
                value={promptPayName}
                onChange={(e) => setPromptPayName(e.target.value)}
                placeholder="เช่น ร้านของฉัน โดย นายสมชาย"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                เบอร์พร้อมเพย์ หรือเลขประจำตัว *
              </label>
              <input
                type="text"
                required
                value={promptPayNumber}
                onChange={(e) => setPromptPayNumber(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* QR Code Upload */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1.5">
              รูปภาพ PromptPay QR Code
            </label>
            <div className="flex items-center gap-3">
              {qrPreview ? (
                <img
                  src={qrPreview}
                  alt="QR Code"
                  className="w-20 h-20 rounded-2xl object-cover border border-stone-200 p-1 bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer w-fit">
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดรูป QR Code</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="หรือใส่ URL รูปภาพ QR Code..."
                  value={qrCodeUrl}
                  onChange={(e) => {
                    setQrCodeUrl(e.target.value);
                    setQrPreview(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-600" />
            <span>ข้อมูลติดต่อ & ที่อยู่ร้าน</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">เบอร์โทรศัพท์ร้าน</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 02-123-4567"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-semibold mb-1">ที่อยู่ร้าน</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น 123/4 ถ.สุขุมวิท กรุงเทพฯ"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>บันทึกข้อมูลร้านค้า</span>}
        </button>
      </form>

      {/* Firebase Database Status & Runtime Configuration */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-stone-900 text-xs">สถานะฐานข้อมูล (Firebase)</h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isLiveFirebase
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isLiveFirebase ? '● เชื่อมต่อ Firebase สด' : '○ Local Storage โหมด'}
          </span>
        </div>

        <p className="text-[11px] text-stone-500 leading-relaxed">
          {isLiveFirebase
            ? 'แอปพลิเคชันกำลังเชื่อมต่อกับ Cloud Firestore และ Firebase Auth ของคุณ ข้อมูลสินค้าและออเดอร์จะถูกซิงก์แบบเรียลไทม์'
            : 'ปัจจุบันแอปทำงานอย่างสมบูรณ์แบบในโหมด Local Persistence คุณสามารถใส่ Firebase Config เพื่อเชื่อมต่อ Cloud Firestore จริงได้ทุกเมื่อ'}
        </p>

        <button
          type="button"
          onClick={onOpenFirebaseModal}
          className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-orange-600" />
          <span>ตั้งค่าหรือเปลี่ยน Firebase Credentials</span>
        </button>
      </div>

      {/* Switch to Customer shortcut */}
      <div className="p-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl text-white shadow-md shadow-orange-500/20 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-amber-100" />
            <span>สลับเป็นโหมด “ลูกค้า”</span>
          </div>
          <div className="text-[11px] text-orange-100">
            เลือกดูสินค้า ทดลองสั่งซื้อสินค้าของร้านตัวเอง และจัดการตะกร้าสินค้า
          </div>
        </div>
        <button
          id="btn-settings-switch-to-customer"
          type="button"
          onClick={() => switchRole('customer')}
          className="px-4 py-2 bg-white text-stone-900 hover:bg-orange-50 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all shrink-0 active:scale-95 flex items-center gap-1.5"
        >
          <span>สลับเป็นลูกค้า</span>
        </button>
      </div>
    </div>
  );
};
