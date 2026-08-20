import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Category } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Coffee,
  Cake,
  Utensils,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';

export const OwnerCategories: React.FC = () => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useShop();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [loading, setLoading] = useState(false);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setIcon('Coffee');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    if (editingCategory) {
      await updateCategory(editingCategory.id, { name: name.trim(), icon });
    } else {
      await addCategory({ name: name.trim(), icon });
    }
    setLoading(false);
    setIsModalOpen(false);
  };

  const getIconComponent = (iconName: string) => {
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
    <div id="owner-categories-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-900">จัดการหมวดหมู่สินค้า</h2>
          <p className="text-xs text-stone-500">สร้างหรือแก้ไขหมวดหมู่เพื่อจัดระเบียบเมนูสินค้า</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มหมวดหมู่</span>
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-2.5">
        {categories.map((cat) => {
          const Icon = getIconComponent(cat.icon);
          const productCount = products.filter((p) => p.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-stone-900">{cat.name}</h3>
                  <p className="text-[11px] text-stone-500">{productCount} สินค้าในหมวดหมู่นี้</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(cat)}
                  className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="แก้ไข"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="ลบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-stone-100 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เครื่องดื่ม, ของหวาน..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">เลือกไอคอน</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'Coffee', label: 'เครื่องดื่ม', icon: Coffee },
                    { id: 'Cake', label: 'เบเกอรี่', icon: Cake },
                    { id: 'Utensils', label: 'อาหาร', icon: Utensils },
                    { id: 'Sparkles', label: 'พิเศษ', icon: Sparkles },
                  ].map((ic) => {
                    const IconComp = ic.icon;
                    return (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setIcon(ic.id)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          icon === ic.id
                            ? 'border-orange-500 bg-orange-50 text-orange-600 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-600'
                        }`}
                      >
                        <IconComp className="w-5 h-5" />
                        <span className="text-[10px]">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>บันทึก</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
