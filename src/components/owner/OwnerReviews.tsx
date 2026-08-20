import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';

export const OwnerReviews: React.FC = () => {
  const { reviews } = useShop();

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <div id="owner-reviews-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div>
        <h2 className="text-base font-bold text-stone-900">รีวิวและความคิดเห็นจากลูกค้า</h2>
        <p className="text-xs text-stone-500">
          ทั้งหมด {reviews.length} รีวิว • คะแนนเฉลี่ย {averageRating} / 5.0 ⭐️
        </p>
      </div>

      {/* Average Score Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-4 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-stone-900">คะแนนความพึงพอใจโดยรวม</div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-stone-900">({averageRating})</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-orange-600">{reviews.length}</div>
          <div className="text-[10px] text-stone-400">ความคิดเห็น</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length > 0 ? (
          reviews.map((rev) => {
            const formattedDate = new Date(rev.createdAt).toLocaleDateString('th-TH', {
              dateStyle: 'medium',
            });

            return (
              <div
                key={rev.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                      {rev.customerNickname.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">{rev.customerNickname}</div>
                      <div className="text-[10px] text-stone-400">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg w-fit">
                  สินค้า: {rev.productName}
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  {rev.comment}
                </p>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            ยังไม่มีรีวิวจากลูกค้า
          </div>
        )}
      </div>
    </div>
  );
};
