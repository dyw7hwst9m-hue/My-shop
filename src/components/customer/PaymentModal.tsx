import React, { useState, useRef } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  Banknote,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Receipt,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  orderNotes?: string;
  onSuccess: (orderId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  orderNotes,
  onSuccess,
}) => {
  const { shopSettings, cart, createOrder } = useShop();
  const { currentUser } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'cash'>('promptpay');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [copiedPromptPay, setCopiedPromptPay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(shopSettings.promptPayNumber.replace(/[^0-9]/g, ''));
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      setErrorMsg('ไม่มีสินค้าในตะกร้า');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const order = await createOrder({
        items: cart,
        paymentMethod: paymentMethod,
        notes: orderNotes,
        slipFile: paymentMethod === 'promptpay' ? (slipFile || slipPreview || undefined) : undefined,
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }

      setLoading(false);
      onSuccess(order.id);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-100">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white ${
              paymentMethod === 'promptpay' ? 'bg-orange-500' : 'bg-emerald-600'
            }`}>
              {paymentMethod === 'promptpay' ? (
                <QrCode className="w-4 h-4" />
              ) : (
                <Banknote className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">
                {paymentMethod === 'promptpay' ? 'ชำระเงินผ่านพร้อมเพย์' : 'ชำระด้วยเงินสด'}
              </h2>
              <p className="text-[11px] text-stone-500">เลือกวิธีชำระเงินและยืนยันคำสั่งซื้อ</p>
            </div>
          </div>
          <button
            id="btn-close-payment-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount to pay highlight */}
          <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-center shadow-md shadow-orange-500/20">
            <div className="text-[11px] font-medium text-orange-100">ยอดชำระเงินทั้งหมด</div>
            <div className="text-3xl font-black mt-0.5 tracking-tight">
              ฿{totalAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-orange-100 mt-1">
              ({cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น ในคำสั่งซื้อ)
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-1.5">
            <label className="font-bold text-stone-800 text-xs">เลือกรูปแบบการชำระเงิน</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-payment-method-promptpay"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'promptpay'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 shadow-xs ring-1 ring-orange-400'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${paymentMethod === 'promptpay' ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-700'}`}>
                    <QrCode className="w-4 h-4" />
                  </div>
                  {paymentMethod === 'promptpay' && (
                    <Check className="w-4 h-4 text-orange-600 font-bold" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs">โอนเงิน / พร้อมเพย์</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">สแกน QR แล้วแนบสลิป</div>
                </div>
              </button>

              <button
                type="button"
                id="btn-payment-method-cash"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-400'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className={`p-1.5 rounded-lg ${paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'}`}>
                    <Banknote className="w-4 h-4" />
                  </div>
                  {paymentMethod === 'cash' && (
                    <Check className="w-4 h-4 text-emerald-600 font-bold" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-xs">ชำระด้วยเงินสด</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">จ่ายเมื่อรับสินค้าหน้าร้าน</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Content based on Payment Method */}
          {paymentMethod === 'promptpay' ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* PromptPay QR Code Box */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-xs border border-stone-200 flex flex-col items-center justify-center relative overflow-hidden">
                  <img
                    src={
                      shopSettings.qrCodeUrl ||
                      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=500&auto=format&fit=crop&q=80'
                    }
                    alt="PromptPay QR Code"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 bg-white/95 px-2 py-0.5 rounded-full text-[9px] font-bold text-stone-700 shadow-2xs border border-stone-200">
                    PROMPTPAY QR
                  </div>
                </div>

                <div className="space-y-1 w-full">
                  <div className="font-bold text-stone-900 text-xs">{shopSettings.promptPayName}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-stone-700 font-semibold bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                      {shopSettings.promptPayNumber}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPromptPay}
                      className="px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedPromptPay ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attach Slip Section */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <span>แนบหลักฐานสลิปโอนเงิน</span>
                  </label>
                  <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full font-medium">
                    {slipPreview ? 'แนบแล้ว' : 'แนบตอนนี้หรือภายหลังได้'}
                  </span>
                </div>

                {slipPreview ? (
                  <div className="relative flex flex-col items-center bg-white p-2.5 rounded-xl border border-blue-200">
                    <img
                      src={slipPreview}
                      alt="Payment slip preview"
                      className="max-h-48 rounded-lg object-contain shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSlipPreview(null);
                        setSlipFile(null);
                      }}
                      className="mt-2 text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                    >
                      ลบและเปลี่ยนรูปสลิป
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white/80 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-blue-500 mb-1" />
                    <span className="font-semibold text-blue-900 text-xs">คลิกเพื่ออัปโหลดรูปสลิปโอนเงิน</span>
                    <span className="text-[10px] text-stone-500 mt-0.5">รองรับไฟล์ JPG, PNG</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="p-2.5 bg-stone-100 rounded-xl flex items-start gap-2 text-stone-600 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  เมื่อส่งคำสั่งซื้อ เจ้าของร้านจะตรวจสอบสลิปและกดยืนยันการชำระเงินให้คุณ
                </span>
              </div>
            </div>
          ) : (
            /* Cash Payment Mode */
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                  <Banknote className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">ชำระเงินสดเมื่อได้รับสินค้า</h3>
                  <p className="text-[11px] text-emerald-800 mt-1 max-w-xs mx-auto leading-relaxed">
                    ไม่ต้องโอนเงินหรือแนบสลิป เพียงกดยืนยันการสั่งซื้อด้านล่าง และเตรียมเงินสดชำระที่หน้าร้านหรือกับพนักงาน
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200/80 text-left space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>ยอดที่ต้องเตรียมจ่าย:</span>
                    <span className="font-extrabold text-stone-900 text-sm">
                      ฿{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>จำนวนสินค้า:</span>
                    <span className="font-semibold text-stone-800">
                      {cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น
                    </span>
                  </div>
                  {orderNotes && (
                    <div className="pt-1.5 border-t border-stone-100 text-[11px] text-stone-500">
                      <span className="font-medium text-stone-700">หมายเหตุ:</span> {orderNotes}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-stone-100 rounded-xl flex items-start gap-2 text-stone-600 text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  กดยืนยันการสั่งซื้อได้ทันที ทางร้านจะเริ่มเตรียมสินค้าให้คุณทันที
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            ย้อนกลับ
          </button>

          <button
            id="btn-confirm-order-payment"
            type="button"
            onClick={handleSubmitOrder}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-white ${
              paymentMethod === 'promptpay'
                ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20 active:scale-98'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-98'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {paymentMethod === 'promptpay'
                    ? `ยืนยันการสั่งซื้อ (โอนเงิน) • ฿${totalAmount.toLocaleString()}`
                    : `ยืนยันการสั่งซื้อ (ชำระเงินสด) • ฿${totalAmount.toLocaleString()}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
