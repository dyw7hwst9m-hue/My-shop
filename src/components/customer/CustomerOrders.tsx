import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ReviewModal } from './ReviewModal';
import {
  Receipt,
  Upload,
  Star,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  X,
  XCircle,
  Banknote,
  QrCode,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface CustomerOrdersProps {
  onNavigateHome: () => void;
}

export const CustomerOrders: React.FC<CustomerOrdersProps> = ({ onNavigateHome }) => {
  const { orders, attachSlipToOrder, cancelOrder } = useShop();
  const { currentUser } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'cancelled'>('all');
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<Order | null>(null);
  const [viewSlipUrl, setViewSlipUrl] = useState<string | null>(null);

  // Real-time clock for 5-minute cancellation countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cancel order modal state
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('เปลี่ยนใจ / สั่งผิดรายการ');
  const [customReason, setCustomReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Attach slip modal state
  const [slipModalOrderId, setSlipModalOrderId] = useState<string | null>(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [newSlipPreview, setNewSlipPreview] = useState<string | null>(null);
  const [newSlipFile, setNewSlipFile] = useState<File | null>(null);

  // Filter orders for current user or all if guest
  const myOrders = orders.filter(
    (o) => !currentUser || o.customerId === currentUser.id || o.customerId === 'guest'
  );

  const filteredOrders = myOrders.filter((order) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending')
      return order.status === 'pending_payment' || order.status === 'verifying_payment';
    if (activeFilter === 'processing')
      return order.status === 'paid' || order.status === 'preparing' || order.status === 'ready';
    if (activeFilter === 'completed') return order.status === 'completed';
    if (activeFilter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const handleSlipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewSlipFile(file);
      const reader = new FileReader();
      reader.onload = () => setNewSlipPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSlipSubmit = async () => {
    if (!slipModalOrderId || (!newSlipFile && !newSlipPreview)) return;
    setUploadingSlip(true);
    try {
      await attachSlipToOrder(slipModalOrderId, newSlipFile || newSlipPreview!);
      setFeedbackBanner({ type: 'success', text: 'แนบสลิปเรียบร้อยแล้ว ร้านค้าจะตรวจสอบโดยเร็ว' });
      setTimeout(() => setFeedbackBanner(null), 3000);
    } catch (e: any) {
      setFeedbackBanner({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งสลิป' });
      setTimeout(() => setFeedbackBanner(null), 3000);
    } finally {
      setUploadingSlip(false);
      setSlipModalOrderId(null);
      setNewSlipPreview(null);
      setNewSlipFile(null);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;

    // Double check time validity
    const orderTime = new Date(cancellingOrder.createdAt).getTime();
    const remainingMs = 5 * 60 * 1000 - (Date.now() - orderTime);
    if (remainingMs <= 0) {
      setFeedbackBanner({
        type: 'error',
        text: 'ไม่สามารถยกเลิกได้ เนื่องจากเกินกำหนดเวลา 5 นาทีแล้ว',
      });
      setCancellingOrder(null);
      setTimeout(() => setFeedbackBanner(null), 3000);
      return;
    }

    setIsCancelling(true);
    const finalReason =
      cancelReason === 'อื่นๆ' && customReason.trim()
        ? `ลูกค้ายกเลิก (5 นาที): ${customReason.trim()}`
        : `ลูกค้ายกเลิก (5 นาที): ${cancelReason}`;

    try {
      await cancelOrder(cancellingOrder.id, finalReason);
      setFeedbackBanner({
        type: 'success',
        text: `ยกเลิกคำสั่งซื้อ ${cancellingOrder.orderNumber} เรียบร้อยแล้ว`,
      });
      setCancellingOrder(null);
      setTimeout(() => setFeedbackBanner(null), 3500);
    } catch (err: any) {
      setFeedbackBanner({
        type: 'error',
        text: err?.message || 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ',
      });
      setTimeout(() => setFeedbackBanner(null), 3000);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div id="customer-orders-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackBanner.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-stone-900">ประวัติและสถานะออเดอร์</h2>
        <p className="text-xs text-stone-500">
          ติดตามสถานะคำสั่งซื้อของคุณ และสามารถยกเลิกคำสั่งซื้อได้ภายใน 5 นาทีแรก
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {[
          { id: 'all', label: 'ทั้งหมด' },
          { id: 'pending', label: 'รอชำระ/ตรวจสลิป' },
          { id: 'processing', label: 'กำลังเตรียม/พร้อมรับ' },
          { id: 'completed', label: 'สำเร็จ' },
          { id: 'cancelled', label: 'ยกเลิก' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleString('th-TH', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            // 5-Minute cancellation countdown calculation
            const orderTimestamp = new Date(order.createdAt).getTime();
            const elapsedMs = now - orderTimestamp;
            const remainingMs = 5 * 60 * 1000 - elapsedMs;
            const canCancel =
              remainingMs > 0 && order.status !== 'cancelled' && order.status !== 'completed';
            const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
            const mins = Math.floor(remainingSecs / 60);
            const secs = remainingSecs % 60;
            const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            return (
              <div
                key={order.id}
                id={`customer-order-${order.id}`}
                className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs space-y-3"
              >
                {/* Order Top Line */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      <span>{order.orderNumber}</span>
                      {order.paymentMethod === 'cash' ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                          <Banknote className="w-3 h-3" />
                          <span>เงินสด</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                          <QrCode className="w-3 h-3" />
                          <span>พร้อมเพย์</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">{formattedDate}</div>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                </div>

                {/* 5-Minute Cancellation Notice & Timer */}
                {canCancel && (
                  <div className="p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-2 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <div className="truncate">
                        <span>ยกเลิกได้ภายใน </span>
                        <strong className="font-mono text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded-md text-xs">
                          {formattedCountdown}
                        </strong>
                        <span className="text-[11px] text-amber-800 ml-1">(5 นาทีแรก)</span>
                      </div>
                    </div>
                    <button
                      id={`btn-cancel-order-${order.id}`}
                      onClick={() => {
                        setCancellingOrder(order);
                        setCancelReason('เปลี่ยนใจ / สั่งผิดรายการ');
                        setCustomReason('');
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs shrink-0"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>ยกเลิกออเดอร์</span>
                    </button>
                  </div>
                )}

                {/* Items in order */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <div className="font-semibold text-stone-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-stone-500">
                            จำนวน {item.quantity} x ฿{item.price}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-stone-900 shrink-0 ml-2">
                        ฿{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="p-2 bg-stone-50 rounded-xl text-[11px] text-stone-600">
                    <span className="font-semibold">หมายเหตุ:</span> {order.notes}
                  </div>
                )}

                {order.rejectionReason && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>แจ้งจากทางร้าน: {order.rejectionReason}</span>
                  </div>
                )}

                {/* Total & Action Buttons */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] text-stone-400 block">ยอดสุทธิ ({order.paymentMethod === 'cash' ? 'เงินสด' : 'พร้อมเพย์'})</span>
                    <span className="text-sm font-extrabold text-orange-600">
                      ฿{order.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* View Slip if uploaded */}
                    {order.slipUrl && (
                      <button
                        onClick={() => setViewSlipUrl(order.slipUrl!)}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูสลิป</span>
                      </button>
                    )}

                    {/* Attach Slip button if pending and promptpay */}
                    {order.status === 'pending_payment' && order.paymentMethod === 'promptpay' && (
                      <button
                        onClick={() => setSlipModalOrderId(order.id)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>แนบสลิปชำระเงิน</span>
                      </button>
                    )}

                    {/* Review Button if completed */}
                    {order.status === 'completed' && (
                      <button
                        onClick={() => setSelectedReviewOrder(order)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          order.hasReviewed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{order.hasReviewed ? 'รีวิวแล้ว' : 'รีวิวสินค้า'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-800">ไม่มีรายการคำสั่งซื้อ</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              คุณยังไม่มีออเดอร์ในหมวดนี้ เริ่มต้นช้อปปิ้งได้เลย!
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            เลือกดูสินค้า
          </button>
        </div>
      )}

      {/* 5-Minute Cancellation Confirmation Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-stone-100 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">ยืนยันยกเลิกคำสั่งซื้อ</h3>
                  <p className="text-[10px] text-stone-500">
                    {cancellingOrder.orderNumber} • ฿{cancellingOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancellingOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Banner in Modal */}
            {(() => {
              const orderTimestamp = new Date(cancellingOrder.createdAt).getTime();
              const remainingMs = 5 * 60 * 1000 - (now - orderTimestamp);
              const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));
              const mins = Math.floor(remainingSecs / 60);
              const secs = remainingSecs % 60;
              const formattedCountdown = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

              return (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-rose-950">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>เวลาที่เหลือสำหรับยกเลิก: <strong className="font-mono text-rose-700 text-sm">{formattedCountdown}</strong> นาที</span>
                  </div>
                  <div className="text-[11px] text-rose-800 leading-tight">
                    ระบบอนุญาตให้ลูกค้ายกเลิกคำสั่งซื้อได้ภายใน 5 นาทีแรกเท่านั้น
                  </div>
                </div>
              );
            })()}

            {/* Reason selector */}
            <div className="space-y-2">
              <label className="font-bold text-stone-800 block">
                ระบุเหตุผลในการยกเลิกคำสั่งซื้อ
              </label>
              {[
                'เปลี่ยนใจ / สั่งผิดรายการ',
                'ต้องการเปลี่ยนรูปแบบการชำระเงิน',
                'ต้องการเปลี่ยนจำนวนหรือรายการสินค้า',
                'สั่งซื้อซ้ำซ้อน',
                'อื่นๆ',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    cancelReason === reason
                      ? 'border-rose-500 bg-rose-50/60 font-semibold text-rose-950'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {cancelReason === 'อื่นๆ' && (
                <input
                  type="text"
                  placeholder="โปรดระบุเหตุผลเพิ่มเติม..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-hidden focus:border-rose-500 text-xs"
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer text-center"
              >
                ไม่ยกเลิก
              </button>
              <button
                id="btn-confirm-cancel-order-action"
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังยกเลิก...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>ยืนยันยกเลิกออเดอร์</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Slip Modal */}
      {slipModalOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-stone-100 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-sm">แนบสลิปโอนเงิน</h3>
              <button
                onClick={() => setSlipModalOrderId(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {newSlipPreview ? (
              <div className="flex flex-col items-center bg-stone-50 p-2 rounded-xl border">
                <img
                  src={newSlipPreview}
                  alt="New slip preview"
                  className="max-h-48 rounded-lg object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setNewSlipPreview(null)}
                  className="mt-2 text-[11px] text-rose-600 hover:underline cursor-pointer font-medium"
                >
                  เลือกรูปใหม่
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-stone-300 hover:border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50">
                <Upload className="w-7 h-7 text-orange-500 mb-1" />
                <span className="font-bold text-stone-800">คลิกเพื่ออัปโหลดรูปสลิป</span>
                <span className="text-[10px] text-stone-400 mt-0.5">JPG หรือ PNG</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlipFileSelect}
                  className="hidden"
                />
              </label>
            )}

            <button
              onClick={handleUploadSlipSubmit}
              disabled={uploadingSlip || (!newSlipFile && !newSlipPreview)}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {uploadingSlip ? 'กำลังอัปโหลด...' : 'ยืนยันการส่งสลิป'}
            </button>
          </div>
        </div>
      )}

      {/* Slip Image Fullscreen Viewer */}
      {viewSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-4 shadow-2xl border border-stone-100 flex flex-col items-center">
            <button
              onClick={() => setViewSlipUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xs font-bold text-stone-900 mb-3">หลักฐานการโอนเงิน (สลิป)</h3>
            <img
              src={viewSlipUrl}
              alt="Payment Slip Full"
              className="max-h-[70vh] rounded-xl object-contain border border-stone-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!selectedReviewOrder}
        onClose={() => setSelectedReviewOrder(null)}
        order={selectedReviewOrder}
      />
    </div>
  );
};
