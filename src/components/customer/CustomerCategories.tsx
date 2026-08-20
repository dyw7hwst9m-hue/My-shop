import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types';
import {
  Coffee,
  Cake,
  Utensils,
  Sparkles,
  ShoppingBag,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

interface CustomerCategoriesProps {
  onSelectCategoryFilter: (categoryId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const CustomerCategories: React.FC<CustomerCategoriesProps> = ({
  onSelectCategoryFilter,
  onSelectProduct,
}) => {
  const { categories, products } = useShop();

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return Coffee;
      case 'Cake':
        return Cake;
      case 'Utensils':
        return Utensils;
      default:
        return Sparkles;
    }
  };

  const getCategoryBg = (index: number) => {
    const colors = [
      'from-amber-500 to-orange-500',
      'from-pink-500 to-rose-500',
      'from-emerald-500 to-teal-500',
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div id="customer-categories-page" className="space-y-4 pb-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900">หมวดหมู่สินค้า</h2>
          <p className="text-xs text-stone-500">เลือกชมสินค้าตามประเภทที่ต้องการ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat, idx) => {
          const Icon = getCategoryIcon(cat.icon);
          const catProducts = products.filter((p) => p.categoryId === cat.id);
          const activeCount = catProducts.filter((p) => p.status === 'active').length;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategoryFilter(cat.id)}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getCategoryBg(
                    idx
                  )} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-stone-900 group-hover:text-orange-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {catProducts.length} สินค้า • เปิดขาย {activeCount} รายการ
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-orange-100 group-hover:text-orange-600 flex items-center justify-center text-stone-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
