import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product, Category } from '../../types';
import {
  Search,
  Plus,
  Star,
  Flame,
  Sparkles,
  Coffee,
  Cake,
  Utensils,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Check,
} from 'lucide-react';

interface CustomerHomeProps {
  onSelectProduct: (product: Product) => void;
  onNavigateToCategories: () => void;
  onNavigateToCart: () => void;
  initialCategoryId?: string;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectProduct,
  onNavigateToCategories,
  onNavigateToCart,
  initialCategoryId = 'all',
}) => {
  const { products, categories, addToCart, shopSettings, seedSampleProducts } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategoryId === 'all' ||
        p.categoryId === selectedCategoryId ||
        p.category === selectedCategoryId ||
        p.categoryName === selectedCategoryId;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  // Recommended products (highest rated & active)
  const recommendedProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.status === 'active')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);
  }, [products]);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (product.status === 'inactive' || product.stockCount <= 0) return;

    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 800);
  };

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

  return (
    <div id="customer-home-page" className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
        <input
          id="input-customer-search"
          type="text"
          placeholder="ค้นหาเครื่องดื่ม เบเกอรี่ หรืออาหาร..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200/90 rounded-2xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-orange-500 focus:ring-3 focus:ring-orange-500/10 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 bg-stone-100 rounded-full"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* Promotional / Announcement Hero Banner */}
      {!searchQuery && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-5 text-white shadow-lg shadow-orange-500/20">
          <div className="relative z-10 space-y-2 max-w-[80%]">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-orange-50">
              <Sparkles className="w-3 h-3 text-amber-200" />
              ร้านค้าออนไลน์คุณภาพ
            </span>
            <h2 className="text-xl font-extrabold leading-tight tracking-tight">
              {shopSettings.name}
            </h2>
            <p className="text-xs text-orange-100 line-clamp-2">
              {shopSettings.announcement}
            </p>
          </div>

          <div className="absolute right-2 -bottom-4 text-7xl opacity-20 select-none pointer-events-none">
            🛍️
          </div>
        </div>
      )}

      {/* Categories Horizontal Swipe Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            หมวดหมู่สินค้า
          </h3>
          <button
            onClick={onNavigateToCategories}
            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>ดูทั้งหมด</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          <button
            id="cat-chip-all"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/25'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span>✨ ทั้งหมด</span>
            <span className="text-[10px] opacity-80">({products.length})</span>
          </button>

          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-chip-${cat.id}`}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/25'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Section (Only when no search query and 'all' is selected) */}
      {!searchQuery && selectedCategoryId === 'all' && recommendedProducts.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 px-1">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              สินค้าแนะนำยอดนิยม
            </h3>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {recommendedProducts.map((product) => (
              <div
                key={`rec-${product.id}`}
                onClick={() => onSelectProduct(product)}
                className="w-44 shrink-0 bg-white rounded-2xl border border-stone-200/80 p-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <h4 className="text-xs font-bold text-stone-900 truncate leading-tight">
                    {product.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-orange-600">
                        ฿{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-stone-400 line-through ml-1">
                          ฿{product.originalPrice}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="w-7 h-7 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-90 text-white flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    >
                      {justAddedId === product.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main All Products Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            {selectedCategoryId === 'all'
              ? 'สินค้าทั้งหมด'
              : categories.find((c) => c.id === selectedCategoryId)?.name || 'รายการสินค้า'}
            <span className="text-stone-400 font-normal ml-1">
              ({filteredProducts.length} รายการ)
            </span>
          </h3>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isClosed = product.status === 'inactive';
              const isOutOfStock = product.stockCount <= 0;
              const canOrder = !isClosed && !isOutOfStock;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => onSelectProduct(product)}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group ${
                    canOrder
                      ? 'border-stone-200/80 hover:border-orange-300 hover:shadow-md'
                      : 'border-stone-200 opacity-85 bg-stone-50/50'
                  }`}
                >
                  {/* Image with status badge */}
                  <div className="relative w-full h-36 bg-stone-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        canOrder ? 'group-hover:scale-105' : 'grayscale-30'
                      }`}
                      referrerPolicy="no-referrer"
                    />

                    {/* Category pill */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] bg-white/90 backdrop-blur-xs text-stone-700 font-medium px-2 py-0.5 rounded-full shadow-2xs">
                        {product.categoryName}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isClosed ? (
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                          ปิดการขาย
                        </span>
                      ) : isOutOfStock ? (
                        <span className="text-[10px] bg-stone-800 text-white font-bold px-2 py-0.5 rounded-full shadow-xs">
                          หมดชั่วคราว
                        </span>
                      ) : (
                        <span className="text-[10px] bg-black/60 backdrop-blur-xs text-white font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 line-clamp-1 leading-snug group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-tight">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-sm font-extrabold text-stone-950">
                          ฿{product.price.toLocaleString()}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="text-[10px] text-stone-400 line-through">
                            ฿{product.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Add Button */}
                      <button
                        id={`btn-add-product-${product.id}`}
                        onClick={(e) => handleQuickAdd(e, product)}
                        disabled={!canOrder}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          !canOrder
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : justAddedId === product.id
                            ? 'bg-emerald-600 text-white scale-110'
                            : 'bg-orange-600 hover:bg-orange-700 active:scale-90 text-white shadow-xs cursor-pointer'
                        }`}
                        title={canOrder ? 'เพิ่มลงตะกร้า' : 'ไม่สามารถสั่งซื้อได้'}
                      >
                        {justAddedId === product.id ? (
                          <Check className="w-4 h-4" />
                        ) : !canOrder ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-3">
            <div className="text-4xl">🛍️</div>
            <h4 className="text-sm font-bold text-stone-800">ยังไม่มีสินค้าในร้าน</h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              กดปุ่มด้านล่างเพื่อโหลดรายการตัวอย่างสินค้า (เมนูอาหาร เครื่องดื่ม เบเกอรี่) เพื่อทดลองสั่งซื้อได้ทันที
            </p>
            <button
              onClick={async () => {
                setIsRestoring(true);
                try {
                  await seedSampleProducts();
                } finally {
                  setIsRestoring(false);
                }
              }}
              disabled={isRestoring}
              className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
            >
              {isRestoring ? 'กำลังโหลดตัวอย่างสินค้า...' : '✨ โหลดตัวอย่างสินค้าทันที'}
            </button>
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center space-y-2">
            <div className="text-3xl">🔍</div>
            <h4 className="text-xs font-bold text-stone-800">ไม่พบสินค้าที่คุณค้นหา</h4>
            <p className="text-[11px] text-stone-500">
              ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูนะครับ
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
              }}
              className="mt-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              ดูสินค้าทั้งหมด
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
