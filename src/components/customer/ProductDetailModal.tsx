import React, { useState } from 'react';
import { Product, Review } from '../../types';
import { useShop } from '../../context/ShopContext';
import {
  X,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  Check,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCart?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCart,
}) => {
  const { addToCart, reviews } = useShop();
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!product) return null;

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const isAvailable = product.status === 'active' && product.stockCount > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
      if (onOpenCart) onOpenCart();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-100">
        {/* Product Image Banner */}
        <div className="relative h-64 sm:h-72 w-full bg-stone-100 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

          {/* Close button */}
          <button
            id="btn-close-product-detail"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status badge on image */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-stone-800 backdrop-blur-md shadow-xs">
              {product.categoryName}
            </span>
            {product.status === 'inactive' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                ปิดการขายชั่วคราว
              </span>
            ) : product.stockCount <= 0 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-700 text-white shadow-xs">
                สินค้าหมด
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-xs">
                เปิดขาย
              </span>
            )}
          </div>

          {/* Price & Name overlay at bottom of image */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-orange-400">
                ฿{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm line-through text-stone-300">
                  ฿{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-4 text-stone-700 text-xs">
          {/* Rating Summary */}
          <div className="flex items-center justify-between p-3 bg-orange-50/60 border border-orange-100 rounded-2xl">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-stone-900">{product.rating}</span>
              <span className="text-[11px] text-stone-500">
                ({productReviews.length || product.reviewCount} รีวิว)
              </span>
            </div>
            <div className="text-[11px] text-stone-500">
              คงเหลือ <span className="font-semibold text-stone-800">{product.stockCount}</span> ชิ้น
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold text-stone-900 text-xs mb-1">รายละเอียดสินค้า</h3>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">
              {product.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
            </p>
          </div>

          {/* Customer Reviews for this item */}
          <div className="pt-2 border-t border-stone-100 space-y-2.5">
            <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
              <span>รีวิวจากลูกค้า ({productReviews.length})</span>
            </h3>

            {productReviews.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {productReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-800 text-[11px]">
                        {rev.customerNickname}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-stone-600 text-[11px]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-stone-50 rounded-xl text-center text-stone-400 text-[11px]">
                ยังไม่มีรีวิวสำหรับสินค้านี้ สั่งซื้อเป็นคนแรกเลย!
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/70 flex items-center justify-between gap-3">
          {/* Quantity selector */}
          <div className="flex items-center bg-white border border-stone-200 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={!isAvailable || quantity <= 1}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center font-bold text-xs text-stone-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
              disabled={!isAvailable || quantity >= product.stockCount}
              className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart button */}
          <button
            id="btn-add-to-cart-modal"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              !isAvailable
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : addedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 active:scale-98 text-white shadow-orange-600/25 cursor-pointer'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>เพิ่มลงตะกร้าแล้ว!</span>
              </>
            ) : !isAvailable ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>ไม่สามารถสั่งซื้อได้</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>เพิ่มลงตะกร้า • ฿{(product.price * quantity).toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
