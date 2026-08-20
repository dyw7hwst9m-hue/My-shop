import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { initFirebase } from './config';
import {
  Category,
  CustomerProfile,
  Order,
  OrderStatus,
  Product,
  Review,
  ShopSettings,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SHOP_SETTINGS,
} from './seedData';

// Local storage keys for fallback persistence
const LS_PRODUCTS = 'my_shop_products_data';
const LS_CATEGORIES = 'my_shop_categories_data';
const LS_CUSTOMERS = 'my_shop_customers_data';
const LS_ORDERS = 'my_shop_orders_data';
const LS_REVIEWS = 'my_shop_reviews_data';
const LS_SETTINGS = 'my_shop_settings_data';
const LS_CURRENT_USER = 'my_shop_auth_session';

// Helper to get local data
function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Clean undefined fields recursively so Firestore setDoc does not throw errors
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// ----------------------------------------------------
// Product Normalizer & Services (Collection: 'products')
// ----------------------------------------------------
export function normalizeProduct(raw: any, id: string): Product {
  const isAvail =
    typeof raw.isAvailable === 'boolean'
      ? raw.isAvailable
      : raw.status === 'inactive'
      ? false
      : true;

  const categoryVal = raw.category || raw.categoryName || 'ทั่วไป';

  return {
    id,
    name: raw.name || '',
    price: Number(raw.price) || 0,
    originalPrice: raw.originalPrice ? Number(raw.originalPrice) : undefined,
    description: raw.description || '',
    imageUrl: raw.imageUrl || 'https://images.unsplash.com/photo-1558857563-b37cf00632b8?w=500',
    category: categoryVal,
    categoryName: categoryVal,
    categoryId: raw.categoryId || 'cat-general',
    isAvailable: isAvail,
    status: isAvail ? 'active' : 'inactive',
    stockCount: typeof raw.stockCount === 'number' ? raw.stockCount : 50,
    rating: typeof raw.rating === 'number' ? raw.rating : 5.0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export async function getProductsService(): Promise<Product[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        return snap.docs.map((d) => normalizeProduct(d.data(), d.id));
      }
    } catch (e) {
      console.warn('Firestore fetch products failed, using local store:', e);
    }
  }
  const localList = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  if (!localList || localList.length === 0) {
    setLocal(LS_PRODUCTS, INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS.map((p) => normalizeProduct(p, p.id));
  }
  return localList.map((p) => normalizeProduct(p, p.id));
}

export function subscribeProductsService(callback: (products: Product[]) => void): () => void {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'products'),
        (snap) => {
          if (!snap.empty) {
            const prods = snap.docs.map((d) => normalizeProduct(d.data(), d.id));
            setLocal(LS_PRODUCTS, prods);
            callback(prods);
          } else {
            // When firestore collection is empty, preserve INITIAL_PRODUCTS so demo items aren't lost
            const local = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
            const prods = (local && local.length > 0 ? local : INITIAL_PRODUCTS).map((p) =>
              normalizeProduct(p, p.id)
            );
            callback(prods);
          }
        },
        (err) => {
          console.warn('Firestore onSnapshot error:', err);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Firestore subscribe error:', e);
    }
  }
  return () => {};
}

export async function seedSampleProductsService(): Promise<Product[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await saveProductService(prod);
      }
      for (const cat of INITIAL_CATEGORIES) {
        await saveCategoryService(cat);
      }
    } catch (e) {
      console.error('Error seeding sample products to Firestore:', e);
    }
  }
  setLocal(LS_PRODUCTS, INITIAL_PRODUCTS);
  setLocal(LS_CATEGORIES, INITIAL_CATEGORIES);
  return INITIAL_PRODUCTS.map((p) => normalizeProduct(p, p.id));
}

export async function saveProductService(product: Product): Promise<void> {
  const normalized = normalizeProduct(product, product.id);
  const { db, isConfigured } = initFirebase();
  
  // Clean payload matching Firestore requirement: name, price, category, imageUrl, isAvailable + metadata
  const firestorePayload = {
    name: normalized.name,
    price: normalized.price,
    category: normalized.category,
    categoryName: normalized.categoryName,
    categoryId: normalized.categoryId,
    imageUrl: normalized.imageUrl,
    isAvailable: normalized.isAvailable,
    status: normalized.status,
    description: normalized.description,
    originalPrice: normalized.originalPrice || null,
    stockCount: normalized.stockCount,
    rating: normalized.rating,
    reviewCount: normalized.reviewCount,
    updatedAt: new Date().toISOString(),
    createdAt: normalized.createdAt,
  };

  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'products', product.id), firestorePayload, { merge: true });
    } catch (e) {
      console.error('Firestore save product error:', e);
    }
  }

  const products = getLocal<Product[]>(LS_PRODUCTS, []);
  const index = products.findIndex((p) => p.id === product.id);
  if (index >= 0) {
    products[index] = normalized;
  } else {
    products.unshift(normalized);
  }
  setLocal(LS_PRODUCTS, products);
}

export async function deleteProductService(productId: string): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (e) {
      console.error('Firestore delete product error:', e);
    }
  }
  const products = getLocal<Product[]>(LS_PRODUCTS, []);
  setLocal(
    LS_PRODUCTS,
    products.filter((p) => p.id !== productId)
  );
}

// ----------------------------------------------------
// Category Services
// ----------------------------------------------------
export async function getCategoriesService(): Promise<Category[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      }
    } catch (e) {
      console.warn('Firestore fetch categories failed, using local:', e);
    }
  }
  return getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
}

export async function saveCategoryService(category: Category): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (e) {
      console.error('Firestore save category error:', e);
    }
  }
  const categories = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  const index = categories.findIndex((c) => c.id === category.id);
  if (index >= 0) {
    categories[index] = category;
  } else {
    categories.push(category);
  }
  setLocal(LS_CATEGORIES, categories);
}

export async function deleteCategoryService(categoryId: string): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (e) {
      console.error('Firestore delete category error:', e);
    }
  }
  const categories = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  setLocal(
    LS_CATEGORIES,
    categories.filter((c) => c.id !== categoryId)
  );
}

// ----------------------------------------------------
// Customer Services
// ----------------------------------------------------
export async function getCustomersService(): Promise<CustomerProfile[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerProfile));
      }
    } catch (e) {
      console.warn('Firestore fetch customers failed, using local:', e);
    }
  }
  return getLocal<CustomerProfile[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function saveCustomerProfileService(profile: CustomerProfile): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'customers', profile.id), sanitizeForFirestore(profile), { merge: true });
    } catch (e) {
      console.error('Firestore save customer error:', e);
    }
  }
  const customers = getLocal<CustomerProfile[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
  const index = customers.findIndex((c) => c.id === profile.id);
  if (index >= 0) {
    customers[index] = profile;
  } else {
    customers.push(profile);
  }
  setLocal(LS_CUSTOMERS, customers);
}

// ----------------------------------------------------
// Order Services
// ----------------------------------------------------
export async function getOrdersService(): Promise<Order[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      }
    } catch (e) {
      console.warn('Firestore fetch orders failed, using local:', e);
    }
  }
  return getLocal<Order[]>(LS_ORDERS, INITIAL_ORDERS);
}

export async function saveOrderService(order: Order): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore(order), { merge: true });
    } catch (e) {
      console.error('Firestore save order error:', e);
    }
  }
  const orders = getLocal<Order[]>(LS_ORDERS, INITIAL_ORDERS);
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }
  setLocal(LS_ORDERS, orders);
}

// ----------------------------------------------------
// Review Services
// ----------------------------------------------------
export async function getReviewsService(): Promise<Review[]> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDocs(collection(db, 'reviews'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      }
    } catch (e) {
      console.warn('Firestore fetch reviews failed, using local:', e);
    }
  }
  return getLocal<Review[]>(LS_REVIEWS, INITIAL_REVIEWS);
}

export async function saveReviewService(review: Review): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'reviews', review.id), sanitizeForFirestore(review), { merge: true });
    } catch (e) {
      console.error('Firestore save review error:', e);
    }
  }
  const reviews = getLocal<Review[]>(LS_REVIEWS, INITIAL_REVIEWS);
  const index = reviews.findIndex((r) => r.id === review.id);
  if (index >= 0) {
    reviews[index] = review;
  } else {
    reviews.unshift(review);
  }
  setLocal(LS_REVIEWS, reviews);
}

export async function deleteReviewService(reviewId: string): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (e) {
      console.error('Firestore delete review error:', e);
    }
  }
  const reviews = getLocal<Review[]>(LS_REVIEWS, INITIAL_REVIEWS);
  setLocal(
    LS_REVIEWS,
    reviews.filter((r) => r.id !== reviewId)
  );
}

// ----------------------------------------------------
// Shop Settings Services
// ----------------------------------------------------
export async function getShopSettingsService(): Promise<ShopSettings> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      const snap = await getDoc(doc(db, 'shop', 'settings'));
      if (snap.exists()) {
        return snap.data() as ShopSettings;
      }
    } catch (e) {
      console.warn('Firestore fetch settings failed, using local:', e);
    }
  }
  return getLocal<ShopSettings>(LS_SETTINGS, INITIAL_SHOP_SETTINGS);
}

export async function saveShopSettingsService(settings: ShopSettings): Promise<void> {
  const { db, isConfigured } = initFirebase();
  if (isConfigured && db) {
    try {
      await setDoc(doc(db, 'shop', 'settings'), sanitizeForFirestore(settings), { merge: true });
    } catch (e) {
      console.error('Firestore save settings error:', e);
    }
  }
  setLocal(LS_SETTINGS, settings);
}

// ----------------------------------------------------
// Image Upload Helper (Storage with Base64 fallback)
// ----------------------------------------------------
export async function uploadImageService(
  fileOrBase64: File | string,
  path: string
): Promise<string> {
  const { storage, isConfigured } = initFirebase();
  if (isConfigured && storage) {
    try {
      const storageRef = ref(storage, path);
      if (typeof fileOrBase64 === 'string') {
        const snap = await uploadString(storageRef, fileOrBase64, 'data_url');
        return await getDownloadURL(snap.ref);
      } else {
        const snap = await uploadBytes(storageRef, fileOrBase64);
        return await getDownloadURL(snap.ref);
      }
    } catch (e) {
      console.warn('Storage upload error, using inline representation:', e);
    }
  }

  // Fallback to Base64 Data URL
  if (typeof fileOrBase64 === 'string') {
    return fileOrBase64;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve('https://images.unsplash.com/photo-1558857563-b37cf00632b8?w=500');
    reader.readAsDataURL(fileOrBase64);
  });
}
