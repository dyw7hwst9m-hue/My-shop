import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Order, OrderItem } from '../../types';
import { X, Star, Sparkles, MessageSquare, Check, RefreshCw } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, order }) => {
  const { submitReview } = useShop();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen || !order) return null;

  // Default select first item
  const currentProductId = selectedProductId || order.items[0]?.productId || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProductId || !comment.trim()) return;

    setLoading(true);
    await submitReview(order.id, currentProductId, rating, comment);
    setLoading(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-tight">รีวิวและให้คะแนนสินค้า</h2>
              <p className="text-[11px] text-stone-500">ออเดอร์ {order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Select Product from this order if multiple items */}
          {order.items.length > 1 && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1.5">
                เลือกสินค้าที่ต้องการรีวิว
              </label>
              <div className="grid grid-cols-2 gap-2">
                {order.items.map((item) => (
                  <button
                    key={item.productId}
                    type="button"
                    onClick={() => setSelectedProductId(item.productId)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      currentProductId === item.productId
                        ? 'border-orange-500 bg-orange-50/80 text-orange-950 font-semibold'
                        : 'border-stone-200 bg-stone-50 text-stone-700'
                    }`}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] truncate flex-1">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Star Rating Select */}
          <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center">
            <span className="text-stone-700 font-semibold text-xs">ให้คะแนนความพึงพอใจ</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-bold text-orange-800">
              {rating === 5
                ? '⭐️⭐️⭐️⭐️⭐️ ยอดเยี่ยมมาก ประทับใจสุดๆ'
                : rating === 4
                ? '⭐️⭐️⭐️⭐️ ดีมาก คุ้มค่า'
                : rating === 3
                ? '⭐️⭐️⭐️ ปานกลาง พอใช้ได้'
                : rating === 2
                ? '⭐️⭐️ ควรปรับปรุง'
                : '⭐️ ไม่พอใจ'}
            </span>
          </div>

          {/* Comment text */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              ข้อความรีวิวและความคิดเห็น *
            </label>
            <textarea
              rows={3}
              required
              placeholder="รสชาติเป็นอย่างไรบ้าง บรรจุภัณฑ์ และการบริการ..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:bg-white focus:border-orange-500 outline-hidden resize-none"
            />
          </div>

          <button
            id="btn-submit-review"
            type="submit"
            disabled={loading || !comment.trim()}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              submitted
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20 cursor-pointer disabled:opacity-50'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : submitted ? (
              <>
                <Check className="w-4 h-4" />
                <span>ส่งรีวิวเรียบร้อยแล้ว ขอบคุณครับ!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ส่งรีวิวสินค้า</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
