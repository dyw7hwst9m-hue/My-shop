import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  AlertCircle,
  PackageCheck,
  PackageX,
  Star,
  RefreshCw,
} from 'lucide-react';

export const OwnerProducts: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    seedSampleProducts,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(60);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [stockCount, setStockCount] = useState<number>(30);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered product list
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setPrice(70);
    setOriginalPrice(undefined);
    setCategoryId(categories[0]?.id || 'cat-drinks');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    setStatus('active');
    setStockCount(30);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setOriginalPrice(product.originalPrice);
    setCategoryId(product.categoryId);
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setStatus(product.status);
    setStockCount(product.stockCount);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณาระบุชื่อสินค้า');
      return;
    }
    if (price <= 0) {
      setErrorMsg('ราคาสินค้าต้องมากกว่า 0 บาท');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCategory?.name || 'ทั่วไป';

    setLoading(true);
    setErrorMsg(null);

    try {
      const isAvailable = status === 'active';

      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          {
            name: name.trim(),
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            category: categoryName,
            categoryName,
            categoryId,
            description: description.trim(),
            status,
            isAvailable,
            stockCount: Number(stockCount) || 0,
            imageUrl: imagePreview || imageUrl || editingProduct.imageUrl,
          },
          imageFile || undefined
        );
      } else {
        await addProduct(
          {
            name: name.trim(),
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            category: categoryName,
            categoryName,
            categoryId,
            description: description.trim(),
            imageUrl: imagePreview || imageUrl || 'https://images.unsplash.com/photo-1558857563-b37cf00632b8?w=500',
            status,
            isAvailable,
            stockCount: Number(stockCount) || 0,
          },
          imageFile || undefined
        );
      }

      setLoading(false);
      setIsModalOpen(false);
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'บันทึกสินค้าไม่สำเร็จ');
    }
  };

  const handleDelete = async (productId: string) => {
    await deleteProduct(productId);
    setDeleteConfirmId(null);
  };

  const handleRestoreDemoProducts = async () => {
    setIsSeeding(true);
    try {
      await seedSampleProducts();
      setFeedbackBanner('โหลดตัวอย่างสินค้าเริ่มต้นทั้งหมดสำเร็จแล้ว!');
      setTimeout(() => setFeedbackBanner(null), 3000);
    } catch (e: any) {
      setFeedbackBanner('เกิดข้อผิดพลาดในการโหลดสินค้าตัวอย่าง');
      setTimeout(() => setFeedbackBanner(null), 3000);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div id="owner-products-page" className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackBanner}</span>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-stone-900">จัดการสินค้า</h2>
          <p className="text-xs text-stone-500">
            ทั้งหมด {products.length} รายการ (เปิดขาย {products.filter((p) => p.status === 'active').length})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-owner-restore-samples"
            onClick={handleRestoreDemoProducts}
            disabled={isSeeding}
            title="กู้คืนรายการสินค้าตัวอย่างเริ่มต้น"
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all border border-stone-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'กำลังโหลด...' : 'กู้คืนสินค้าตัวอย่าง'}</span>
          </button>

          <button
            id="btn-owner-add-product"
            onClick={openAddModal}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อสินค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-hidden focus:border-orange-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Status filter tabs */}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            เปิดขาย ({products.filter((p) => p.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              statusFilter === 'inactive'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            ปิดขาย ({products.filter((p) => p.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-2.5">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isActive = product.status === 'active';

            return (
              <div
                key={product.id}
                id={`owner-prod-item-${product.id}`}
                className={`bg-white rounded-2xl border p-3.5 shadow-xs flex items-center justify-between gap-3 transition-all ${
                  isActive ? 'border-stone-200/90' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                {/* Product Thumbnail & basic info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute -top-1.5 -left-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full text-white shadow-2xs ${
                        isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      {isActive ? 'เปิด' : 'ปิด'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                        {product.categoryName}
                      </span>
                      <span className="text-[10px] text-stone-400">คงเหลือ {product.stockCount}</span>
                    </div>
                    <h3 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs font-extrabold text-orange-600">
                        ฿{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] text-stone-400 line-through">
                          ฿{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Instant Status Toggle Switch + Edit + Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Instant Toggle Switch */}
                  <button
                    id={`btn-toggle-status-${product.id}`}
                    onClick={() => toggleProductStatus(product.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                    title="คลิกเพื่อเปิด/ปิดขายทันที"
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>เปิดขาย</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-500" />
                        <span>ปิดขาย</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(product)}
                    className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                    title="แก้ไขสินค้า"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(product.id)}
                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="ลบสินค้า"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-stone-200 text-center text-xs text-stone-500">
            ไม่พบสินค้าตามเงื่อนไขที่เลือก
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl p-5 shadow-2xl border border-stone-100 space-y-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900">ยืนยันการลบสินค้านี้?</h3>
            <p className="text-xs text-stone-500">
              สินค้านี้จะถูกลบออกจากร้านค้าและไม่สามารถกู้คืนได้
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-100">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Product Photo Upload / Preview */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  รูปถ่ายสินค้า (อัปโหลดไฟล์หรือวาง URL)
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-18 h-18 rounded-2xl object-cover border border-stone-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-2xl bg-stone-100 border border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-medium flex items-center gap-1.5 cursor-pointer w-fit">
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์รูปจากเครื่อง</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="หรือวาง URL รูปภาพ..."
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ชาไทยพรีเมียม, ครัวซองต์เนยสด"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                />
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    ราคาขายจริง (฿) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    ราคาเต็ม (ถ้ามีส่วนลด)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="เช่น 80"
                    value={originalPrice || ''}
                    onChange={(e) =>
                      setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Category & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">หมวดหมู่</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">จำนวนสต็อก</label>
                  <input
                    type="number"
                    min="0"
                    value={stockCount}
                    onChange={(e) => setStockCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">รายละเอียดสินค้า</label>
                <textarea
                  rows={3}
                  placeholder="รสชาติ วัตถุดิบ ความพิเศษของเมนูนี้..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:bg-white focus:border-orange-500 outline-hidden resize-none"
                />
              </div>

              {/* Product Status (เปิดขาย / ปิดขาย) */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">สถานะการขาย</div>
                  <div className="text-[11px] text-stone-500">
                    {status === 'active' ? 'เปิดให้ลูกค้าสั่งซื้อได้' : 'ปิดการขายชั่วคราว ลูกค้าจะกดสั่งไม่ได้'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      status === 'active'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    เปิดขาย
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inactive')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      status === 'inactive'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    ปิดขาย
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>บันทึกสินค้า</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
