import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Receipt,
  Eye,
  Phone,
  User,
  AlertCircle,
  Package,
  Sparkles,
  ArrowRight,
  X,
  FileCheck,
  ChevronDown,
  Banknote,
  QrCode,
} from 'lucide-react';

export const OwnerOrders: React.FC = () => {
  const { orders, verifyPaymentSlip, updateOrderStatus } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);

  // Reject slip modal state
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('ยอดเงินไม่ตรง หรือสลิปไม่ชัดเจน');

  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerNickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);

    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleConfirmSlip = async (orderId: string) => {
    setProcessingOrderId(orderId);
    setFeedbackMsg(null);
    try {
      await verifyPaymentSlip(orderId, true);
      setFeedbackMsg({ type: 'success', text: `ยืนยันสลิปคำสั่งซื้อเรียบร้อยแล้ว (สถานะ: ชำระแล้ว)` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      console.error('Confirm slip error:', err);
      setFeedbackMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาดในการยืนยันสลิป' });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectSlipSubmit = async () => {
    if (!rejectOrderId) return;
    setProcessingOrderId(rejectOrderId);
    setFeedbackMsg(null);
    try {
      await verifyPaymentSlip(rejectOrderId, false, rejectReason);
      setFeedbackMsg({ type: 'success', text: `ปฏิเสธสลิปเรียบร้อยแล้ว (แจ้งให้ลูกค้าแนบสลิปใหม่)` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      console.error('Reject slip error:', err);
      setFeedbackMsg({ type: 'error', text: err?.message || 'เกิดข้อผิดพลาดในการปฏิเสธสลิป' });
    } finally {
      setProcessingOrderId(null);
      setRejectOrderId(null);
    }
  };

  return (
    <div id="owner-orders-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-stone-900">จัดการคำสั่งซื้อ</h2>
        <p className="text-xs text-stone-500">
          ทั้งหมด {orders.length} ออเดอร์ (รอตรวจสลิป {orders.filter((o) => o.status === 'verifying_payment').length})
        </p>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ออเดอร์, ชื่อลูกค้า หรือเบอร์โทร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-hidden focus:border-orange-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'verifying_payment', label: 'รอตรวจสลิป 🔔' },
            { id: 'pending_payment', label: 'รอชำระเงิน' },
            { id: 'paid', label: 'ชำระแล้ว' },
            { id: 'preparing', label: 'กำลังเตรียม' },
            { id: 'ready', label: 'พร้อมรับ' },
            { id: 'completed', label: 'สำเร็จ' },
            { id: 'cancelled', label: 'ยกเลิก' },
          ].map((tab) => {
            const count =
              tab.id === 'all'
                ? orders.length
                : orders.filter((o) => o.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  statusFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] ml-1 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleString('th-TH', {
              dateStyle: 'short',
              timeStyle: 'short',
            });

            return (
              <div
                key={order.id}
                id={`owner-order-${order.id}`}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-3"
              >
                {/* Header line */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        {order.orderNumber}
                      </span>
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
                      <span className="text-[11px] text-stone-500 font-medium">
                        โดย {order.customerNickname}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{formattedDate}</div>
                  </div>
                  <StatusBadge status={order.status} size="sm" />
                </div>

                {/* Customer Contact info */}
                <div className="flex items-center gap-3 text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-stone-400" />
                    <span>{order.customerNickname}</span>
                  </div>
                  {order.customerPhone && (
                    <div className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{order.customerPhone}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="text-stone-500 truncate ml-auto">
                      หมายเหตุ: {order.notes}
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-7 h-7 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-stone-800 font-medium">{item.name}</span>
                        <span className="text-stone-400 text-[11px]">x {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-stone-900">
                        ฿{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Payment Slip Inspection Area */}
                {order.slipUrl && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-950 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-blue-600" />
                        <span>สลิปการโอนเงินของลูกค้า</span>
                      </span>
                      <button
                        onClick={() => setSelectedSlipUrl(order.slipUrl!)}
                        className="text-[11px] font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ขยายรูปสลิป</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={order.slipUrl}
                        alt="Slip"
                        onClick={() => setSelectedSlipUrl(order.slipUrl!)}
                        className="w-16 h-16 rounded-xl object-cover border border-blue-200 cursor-pointer hover:opacity-90 transition-opacity"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 text-[11px] text-blue-900">
                        <div>ยอดที่ต้องชำระ: <span className="font-bold">฿{order.totalAmount.toLocaleString()}</span></div>
                        <div className="text-[10px] text-blue-600 mt-0.5">
                          กรุณาตรวจความถูกต้องของยอดเงินและเวลาในสลิป
                        </div>
                      </div>
                    </div>

                    {/* Owner Confirm / Reject buttons for verifying slip */}
                    {order.status === 'verifying_payment' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          id={`btn-confirm-slip-${order.id}`}
                          onClick={() => handleConfirmSlip(order.id)}
                          disabled={processingOrderId === order.id}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{processingOrderId === order.id ? 'กำลังบันทึก...' : 'ยืนยันสลิปถูกต้อง (รับยอด)'}</span>
                        </button>
                        <button
                          onClick={() => setRejectOrderId(order.id)}
                          disabled={processingOrderId === order.id}
                          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>ปฏิเสธสลิป</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {order.rejectionReason && (
                  <div className={`p-2 rounded-xl text-[11px] flex items-start gap-1.5 ${
                    order.status === 'cancelled'
                      ? 'bg-rose-50 border border-rose-200 text-rose-700'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>เหตุผล: {order.rejectionReason}</span>
                  </div>
                )}

                {/* Footer: Total & Status Flow Transition Controls */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-stone-400 block">ยอดรวมทั้งสิ้น</span>
                    <span className="text-sm font-black text-orange-600">
                      ฿{order.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Stage transition buttons */}
                  <div className="flex items-center gap-1.5">
                    {order.status === 'pending_payment' && order.paymentMethod === 'cash' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>รับออเดอร์เงินสด (เริ่มเตรียม) →</span>
                      </button>
                    )}

                    {order.status === 'paid' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        เริ่มเตรียมสินค้า →
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        สินค้าพร้อมรับแล้ว →
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        จัดส่ง/รับเรียบร้อย (สำเร็จ) ✓
                      </button>
                    )}

                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            ไม่พบออเดอร์ตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>

      {/* Fullscreen Slip Image Viewer */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-3xl p-4 shadow-2xl border border-stone-100 flex flex-col items-center">
            <button
              onClick={() => setSelectedSlipUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xs font-bold text-stone-900 mb-3">ตรวจสอบสลิปโอนเงิน</h3>
            <img
              src={selectedSlipUrl}
              alt="Slip Large"
              className="max-h-[72vh] rounded-xl object-contain border border-stone-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* Reject Slip Modal */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-stone-100 space-y-3 text-xs">
            <h3 className="font-bold text-stone-900 text-sm">ปฏิเสธสลิปการโอนเงิน</h3>
            <p className="text-stone-500 text-[11px]">
              ระบุเหตุผลเพื่อให้ลูกค้าทราบและแนบสลิปใหม่ที่ถูกต้อง
            </p>

            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-rose-500 outline-hidden resize-none"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setRejectOrderId(null)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRejectSlipSubmit}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
