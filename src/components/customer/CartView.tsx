import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  QrCode,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';

interface CartViewProps {
  onNavigateHome: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ onNavigateHome, onOrderSuccess }) => {
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal, shopSettings } =
    useShop();
  const { currentUser } = useAuth();

  const [orderNotes, setOrderNotes] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  if (cart.length === 0) {
    return (
      <div id="cart-empty-view" className="space-y-4 pb-24 text-center p-8 bg-white rounded-3xl border border-stone-200 shadow-xs animate-in fade-in duration-300 mt-4">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">ไม่มีสินค้าในตะกร้า</h3>
          <p className="text-xs text-stone-500 mt-1">
            เลือกสินค้าที่คุณชอบแล้วเพิ่มลงในตะกร้าได้เลยครับ
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer"
        >
          ไปเลือกสินค้าเลย
        </button>
      </div>
    );
  }

  return (
    <div id="customer-cart-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900">ตะกร้าสินค้าของฉัน</h2>
          <p className="text-xs text-stone-500">
            {cart.reduce((s, i) => s + i.quantity, 0)} รายการในตะกร้า
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>ล้างตะกร้า</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2.5">
        {cart.map((item) => (
          <div
            key={item.productId}
            className="bg-white rounded-2xl border border-stone-200/90 p-3 shadow-xs flex items-center justify-between gap-3"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
              referrerPolicy="no-referrer"
            />

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-stone-900 truncate leading-snug">
                {item.name}
              </h4>
              <div className="text-xs font-extrabold text-orange-600 mt-0.5">
                ฿{item.price.toLocaleString()}
              </div>
            </div>

            {/* Quantity Modifier */}
            <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1 shrink-0">
              <button
                onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-stone-900">
                {item.quantity}
              </span>
              <button
                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.productId)}
              className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
              title="ลบรายการนี้"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Special Request / Notes */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 space-y-1.5 shadow-xs">
        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-stone-500" />
          <span>หมายเหตุถึงร้านค้า (ถ้ามี)</span>
        </label>
        <input
          type="text"
          placeholder="เช่น หวานน้อย 50%, แยกน้ำแข็ง, ขอซอสเพิ่ม..."
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
        />
      </div>

      {/* Order Summary & Confirmation Box */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
          สรุปรายการคำสั่งซื้อ
        </h3>

        <div className="space-y-1.5 text-xs text-stone-600">
          <div className="flex justify-between">
            <span>รวมค่าสินค้า ({cart.reduce((s, i) => s + i.quantity, 0)} ชิ้น)</span>
            <span className="font-semibold text-stone-900">฿{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>ช่องทางชำระเงิน</span>
            <span className="font-semibold text-orange-600">พร้อมเพย์ QR Code</span>
          </div>
          <div className="flex justify-between">
            <span>ผู้สั่งซื้อ</span>
            <span className="font-semibold text-stone-900">
              {currentUser?.nickname || 'ลูกค้าทั่วไป'}
            </span>
          </div>
        </div>

        <div className="pt-2.5 border-t border-stone-100 flex justify-between items-baseline">
          <span className="text-xs font-bold text-stone-900">ยอดรวมสุทธิ</span>
          <span className="text-xl font-black text-orange-600">฿{cartTotal.toLocaleString()}</span>
        </div>

        {/* Customer Confirmation Notice before submitting */}
        <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            กรุณาตรวจสอบรายการสินค้าและยอดเงินก่อนกดชำระเงิน คุณจะได้รับ QR Code พร้อมเพย์สำหรับสแกนจ่าย
          </span>
        </div>

        {/* Checkout Button */}
        <button
          id="btn-proceed-to-payment"
          onClick={() => setIsPaymentModalOpen(true)}
          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>ยืนยันรายการ & สแกนจ่ายพร้อมเพย์</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={cartTotal}
        orderNotes={orderNotes}
        onSuccess={(orderId) => {
          onOrderSuccess(orderId);
        }}
      />
    </div>
  );
};
