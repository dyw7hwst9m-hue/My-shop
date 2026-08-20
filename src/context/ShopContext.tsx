import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  AgeGroupStat,
  Category,
  CustomerProfile,
  DashboardStats,
  FirebaseConfig,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Review,
  ShopSettings,
} from '../types';
import {
  getCategoriesService,
  getCustomersService,
  getOrdersService,
  getProductsService,
  subscribeProductsService,
  seedSampleProductsService,
  getReviewsService,
  getShopSettingsService,
  saveCategoryService,
  deleteCategoryService,
  saveCustomerProfileService,
  saveOrderService,
  saveProductService,
  deleteProductService,
  saveReviewService,
  saveShopSettingsService,
  uploadImageService,
} from '../firebase/services';
import {
  clearStoredFirebaseConfig,
  getStoredFirebaseConfig,
  initFirebase,
  saveStoredFirebaseConfig,
} from '../firebase/config';
import { useAuth } from './AuthContext';

interface CartItem extends OrderItem {}

interface ShopContextType {
  // State
  products: Product[];
  categories: Category[];
  orders: Order[];
  reviews: Review[];
  customers: CustomerProfile[];
  shopSettings: ShopSettings;
  cart: CartItem[];
  isLoading: boolean;
  isFirebaseLive: boolean;
  activeFirebaseConfig: FirebaseConfig | null;

  // Cart operations
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;

  // Product operations (Owner)
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>, imageFile?: File) => Promise<Product>;
  updateProduct: (productId: string, productData: Partial<Product>, newImageFile?: File) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductStatus: (productId: string) => Promise<void>;

  // Category operations (Owner)
  addCategory: (name: string, icon?: string) => Promise<Category>;
  updateCategory: (categoryId: string, name: string, icon?: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Order operations
  createOrder: (orderData: {
    items: OrderItem[];
    paymentMethod: 'promptpay' | 'cash';
    notes?: string;
    slipFile?: File | string;
  }) => Promise<Order>;
  attachSlipToOrder: (orderId: string, slipFile: File | string) => Promise<void>;
  confirmPayment: (orderId: string) => Promise<void>;
  rejectPayment: (orderId: string, reason?: string) => Promise<void>;
  verifyPaymentSlip: (orderId: string, approved: boolean, reason?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;

  // Review operations
  submitReview: (orderId: string, productId: string, rating: number, comment: string) => Promise<void>;

  // Customer operations
  refreshCustomers: () => Promise<void>;

  // Shop Settings
  updateShopSettings: (settings: Partial<ShopSettings>, qrFile?: File) => Promise<void>;
  updateSettings?: (settings: Partial<ShopSettings>, qrFile?: File) => Promise<void>;

  // Seed sample products
  seedSampleProducts: () => Promise<void>;

  // Firebase Config
  updateFirebaseConfig: (config: FirebaseConfig) => void;
  removeFirebaseConfig: () => void;

  // Dashboard Stats
  dashboardStats: DashboardStats;
}

const CART_STORAGE_KEY = 'my_shop_cart_items';

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isOwner } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    name: 'ร้านของฉัน',
    ownerEmail: 'thitapornmukji@gmail.com',
    promptPayNumber: '089-123-4567',
    promptPayName: 'ร้านของฉัน',
    announcement: 'ยินดีต้อนรับสู่ร้านของฉัน! สินค้าคุณภาพ ช้อปง่าย สบายใจ',
    isOpen: true,
    phone: '089-123-4567',
    address: 'กรุงเทพมหานคร',
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [activeFirebaseConfig, setActiveFirebaseConfig] = useState<FirebaseConfig | null>(null);

  // Load initial data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const fb = initFirebase();
      setIsFirebaseLive(fb.isConfigured);
      setActiveFirebaseConfig(getStoredFirebaseConfig());

      const [prods, cats, ords, revs, custs, settings] = await Promise.all([
        getProductsService(),
        getCategoriesService(),
        getOrdersService(),
        getReviewsService(),
        getCustomersService(),
        getShopSettingsService(),
      ]);

      if (prods.length === 0) {
        const seeded = await seedSampleProductsService();
        setProducts(seeded);
      } else {
        setProducts(prods);
      }
      setCategories(cats);
      setOrders(ords);
      setReviews(revs);
      setCustomers(custs);
      setShopSettings(settings);

      // Load cart from local storage
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart', e);
        }
      }
    } catch (err) {
      console.error('Error loading shop data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    // Subscribe to real-time changes on products collection
    const unsubscribeProducts = subscribeProductsService((liveProducts) => {
      setProducts(liveProducts);
    });
    return () => {
      unsubscribeProducts();
    };
  }, []);

  // Save cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Cart actions
  const addToCart = (product: Product, quantity = 1): boolean => {
    if (product.status === 'inactive' || product.stockCount <= 0) {
      return false;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl,
          categoryName: product.categoryName,
        },
      ];
    });
    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Product Operations
  const addProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>,
    imageFile?: File
  ): Promise<Product> => {
    const id = `prod-${Date.now()}`;
    let imageUrl = productData.imageUrl || 'https://images.unsplash.com/photo-1558857563-b37cf00632b8?w=500';

    if (imageFile) {
      imageUrl = await uploadImageService(imageFile, `products/${id}_${Date.now()}.jpg`);
    }

    const newProduct: Product = {
      ...productData,
      id,
      imageUrl,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveProductService(newProduct);
    setProducts((prev) => [newProduct, ...prev]);

    // Update category count
    updateCategoryCount();
    return newProduct;
  };

  const updateProduct = async (
    productId: string,
    productData: Partial<Product>,
    newImageFile?: File
  ) => {
    let imageUrl = productData.imageUrl;
    if (newImageFile) {
      imageUrl = await uploadImageService(newImageFile, `products/${productId}_${Date.now()}.jpg`);
    }

    const existing = products.find((p) => p.id === productId);
    if (!existing) return;

    const updated: Product = {
      ...existing,
      ...productData,
      ...(imageUrl ? { imageUrl } : {}),
      updatedAt: new Date().toISOString(),
    };

    await saveProductService(updated);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    updateCategoryCount();
  };

  const deleteProduct = async (productId: string) => {
    await deleteProductService(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    removeFromCart(productId);
    updateCategoryCount();
  };

  const toggleProductStatus = async (productId: string) => {
    const existing = products.find((p) => p.id === productId);
    if (!existing) return;

    const newStatus = existing.status === 'active' ? 'inactive' : 'active';
    const updated: Product = {
      ...existing,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await saveProductService(updated);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  // Category Operations
  const addCategory = async (name: string, icon = 'ShoppingBag'): Promise<Category> => {
    const id = `cat-${Date.now()}`;
    const newCat: Category = {
      id,
      name: name.trim(),
      icon,
      sortOrder: categories.length + 1,
      productCount: 0,
    };
    await saveCategoryService(newCat);
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = async (categoryId: string, name: string, icon = 'ShoppingBag') => {
    const existing = categories.find((c) => c.id === categoryId);
    if (!existing) return;

    const updated: Category = {
      ...existing,
      name: name.trim(),
      icon,
    };
    await saveCategoryService(updated);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? updated : c)));

    // Update category name in products
    setProducts((prev) =>
      prev.map((p) => (p.categoryId === categoryId ? { ...p, categoryName: name.trim() } : p))
    );
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteCategoryService(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const updateCategoryCount = () => {
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        productCount: products.filter((p) => p.categoryId === cat.id).length,
      }))
    );
  };

  // Order Operations
  const createOrder = async (orderData: {
    items: OrderItem[];
    paymentMethod: 'promptpay' | 'cash';
    notes?: string;
    slipFile?: File | string;
  }): Promise<Order> => {
    const orderId = `order-${Date.now()}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#TH-${randomSuffix}`;

    let slipUrl: string | undefined = undefined;
    if (orderData.slipFile) {
      slipUrl = await uploadImageService(
        orderData.slipFile,
        `payment_slips/${currentUser?.id || 'guest'}/slip_${orderId}.jpg`
      );
    }

    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const initialStatus: OrderStatus = slipUrl ? 'verifying_payment' : 'pending_payment';

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerId: currentUser?.id || 'guest',
      customerName: currentUser?.nickname || 'ลูกค้าทั่วไป',
      customerNickname: currentUser?.nickname || 'ลูกค้า',
      customerEmail: currentUser?.email || 'customer@example.com',
      customerPhone: currentUser?.phone,
      items: orderData.items,
      totalAmount,
      status: initialStatus,
      paymentMethod: orderData.paymentMethod,
      slipUrl,
      slipUploadedAt: slipUrl ? new Date().toISOString() : undefined,
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveOrderService(newOrder);
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();

    // Update customer spending & order count if logged in
    if (currentUser) {
      const updatedCustomer: CustomerProfile = {
        ...currentUser,
        orderCount: currentUser.orderCount + 1,
        totalSpent: currentUser.totalSpent + totalAmount,
      };
      await saveCustomerProfileService(updatedCustomer);
      setCustomers((prev) =>
        prev.map((c) => (c.id === currentUser.id ? updatedCustomer : c))
      );
    }

    return newOrder;
  };

  const attachSlipToOrder = async (orderId: string, slipFile: File | string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const slipUrl = await uploadImageService(
      slipFile,
      `payment_slips/${existing.customerId}/slip_${orderId}_${Date.now()}.jpg`
    );

    const updated: Order = {
      ...existing,
      slipUrl,
      slipUploadedAt: new Date().toISOString(),
      status: 'verifying_payment',
      updatedAt: new Date().toISOString(),
      rejectionReason: undefined,
    };

    await saveOrderService(updated);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const confirmPayment = async (orderId: string) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const updated: Order = {
      ...existing,
      status: 'paid',
      paymentConfirmedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveOrderService(updated);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const rejectPayment = async (orderId: string, reason = 'ยอดเงินหรือสลิปไม่ถูกต้อง กรุณาแนบสลิปใหม่') => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const updated: Order = {
      ...existing,
      status: 'pending_payment',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    await saveOrderService(updated);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const verifyPaymentSlip = async (
    orderId: string,
    approved: boolean,
    reason = 'ยอดเงินหรือสลิปไม่ถูกต้อง กรุณาแนบสลิปใหม่'
  ) => {
    if (approved) {
      await confirmPayment(orderId);
    } else {
      await rejectPayment(orderId, reason);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const updated: Order = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };

    await saveOrderService(updated);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  const cancelOrder = async (orderId: string, reason = 'ลูกค้ายกเลิกคำสั่งซื้อ (ภายใน 5 นาที)') => {
    const existing = orders.find((o) => o.id === orderId);
    if (!existing) return;

    const updated: Order = {
      ...existing,
      status: 'cancelled',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    await saveOrderService(updated);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));

    // Adjust customer totalSpent & orderCount if applicable
    if (currentUser && currentUser.id === existing.customerId) {
      const updatedCustomer: CustomerProfile = {
        ...currentUser,
        orderCount: Math.max(0, currentUser.orderCount - 1),
        totalSpent: Math.max(0, currentUser.totalSpent - existing.totalAmount),
      };
      await saveCustomerProfileService(updatedCustomer);
      setCustomers((prev) =>
        prev.map((c) => (c.id === currentUser.id ? updatedCustomer : c))
      );
    }
  };

  // Review Operations
  const submitReview = async (
    orderId: string,
    productId: string,
    rating: number,
    comment: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      orderId,
      productId,
      productName: targetProduct?.name || 'สินค้า',
      customerId: currentUser?.id || 'guest',
      customerNickname: currentUser?.nickname || 'ลูกค้า',
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    await saveReviewService(newReview);
    setReviews((prev) => [newReview, ...prev]);

    // Mark order as reviewed
    const existingOrder = orders.find((o) => o.id === orderId);
    if (existingOrder) {
      const updatedOrder = { ...existingOrder, hasReviewed: true };
      await saveOrderService(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    }

    // Update product rating
    if (targetProduct) {
      const productReviews = [...reviews.filter((r) => r.productId === productId), newReview];
      const avgRating =
        productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      await updateProduct(productId, {
        rating: Number(avgRating.toFixed(1)),
        reviewCount: productReviews.length,
      });
    }
  };

  const refreshCustomers = async () => {
    const custs = await getCustomersService();
    setCustomers(custs);
  };

  // Shop Settings
  const updateShopSettings = async (settings: Partial<ShopSettings>, qrFile?: File) => {
    let qrCodeUrl = settings.qrCodeUrl;
    if (qrFile) {
      qrCodeUrl = await uploadImageService(qrFile, `shop/promptpay_qr_${Date.now()}.jpg`);
    }

    const updated: ShopSettings = {
      ...shopSettings,
      ...settings,
      ...(qrCodeUrl ? { qrCodeUrl } : {}),
    };

    await saveShopSettingsService(updated);
    setShopSettings(updated);
  };

  // Firebase Config
  const updateFirebaseConfig = (config: FirebaseConfig) => {
    saveStoredFirebaseConfig(config);
    loadAllData();
  };

  const removeFirebaseConfig = () => {
    clearStoredFirebaseConfig();
    loadAllData();
  };

  // Seed sample products
  const seedSampleProducts = async () => {
    setIsLoading(true);
    try {
      const seeded = await seedSampleProductsService();
      setProducts(seeded);
    } catch (e) {
      console.error('Failed to seed sample products:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Dashboard Demographics & Statistics calculations
  const dashboardStats: DashboardStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today sales (completed, ready, preparing, paid)
    const validOrders = orders.filter((o) => o.status !== 'cancelled');

    const todayOrders = validOrders.filter((o) =>
      o.createdAt.startsWith(todayStr)
    );
    const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const totalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const activeProductsCount = products.filter((p) => p.status === 'active').length;
    const inactiveProductsCount = products.filter((p) => p.status === 'inactive').length;

    // Age distribution
    const ageRanges = [
      { range: '13-17', min: 13, max: 17, label: '13-17 ปี (วัยรุ่น)' },
      { range: '18-24', min: 18, max: 24, label: '18-24 ปี (มหาวิทยาลัย)' },
      { range: '25-34', min: 25, max: 34, label: '25-34 ปี (เริ่มทำงาน)' },
      { range: '35-44', min: 35, max: 44, label: '35-44 ปี (วัยกลางคน)' },
      { range: '45+', min: 45, max: 150, label: '45+ ปี (ผู้ใหญ่)' },
    ];

    const totalCustomers = customers.length || 1;
    const ageGroupStats: AgeGroupStat[] = ageRanges.map((ar) => {
      const matchCount = customers.filter(
        (c) => c.age >= ar.min && c.age <= ar.max
      ).length;
      return {
        range: ar.range,
        label: ar.label,
        count: matchCount,
        percentage: Math.round((matchCount / totalCustomers) * 100),
      };
    });

    // Sales by last 7 days
    const salesByDay = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });

      const dayOrders = validOrders.filter((o) => o.createdAt.startsWith(dateStr));
      const amount = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        date: dateStr,
        label: dayName,
        amount,
        orderCount: dayOrders.length,
      };
    });

    return {
      todaySales,
      totalSales,
      orderCount: orders.length,
      customerCount: customers.length,
      activeProductsCount,
      inactiveProductsCount,
      salesByDay,
      ageGroupStats,
    };
  }, [orders, products, customers]);

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        orders,
        reviews,
        customers,
        shopSettings,
        cart,
        isLoading,
        isFirebaseLive,
        activeFirebaseConfig,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartItemCount,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        createOrder,
        attachSlipToOrder,
        confirmPayment,
        rejectPayment,
        verifyPaymentSlip,
        updateOrderStatus,
        cancelOrder,
        submitReview,
        refreshCustomers,
        updateShopSettings,
        updateSettings: updateShopSettings,
        seedSampleProducts,
        updateFirebaseConfig,
        removeFirebaseConfig,
        dashboardStats,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
