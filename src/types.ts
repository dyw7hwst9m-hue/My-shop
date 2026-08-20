export type UserRole = 'owner' | 'customer';

export type OrderStatus =
  | 'pending_payment'       // รอชำระเงิน
  | 'verifying_payment'     // รอตรวจสอบการชำระเงิน (แนบสลิปแล้ว)
  | 'paid'                  // ชำระเงินแล้ว (เจ้าของร้านกดยืนยัน)
  | 'preparing'             // กำลังเตรียมสินค้า
  | 'ready'                 // พร้อมรับสินค้า
  | 'completed'             // สำเร็จ
  | 'cancelled';            // ยกเลิก

export interface CustomerProfile {
  id: string;
  email: string;
  nickname: string;
  age: number;
  birthDate?: string;
  facePhotoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  totalSpent: number;
  status: 'active' | 'suspended';
  phone?: string;
  address?: string;
  roles?: UserRole[]; // ['customer'], ['owner'], or ['customer', 'owner']
  isOwner?: boolean;  // มีสิทธิ์เจ้าของร้าน
}

export type Customer = CustomerProfile;

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl: string;
  category?: string; // หมวดหมู่ตามโจทย์
  categoryId?: string;
  categoryName?: string;
  isAvailable?: boolean; // สถานะเปิด/ปิดขาย (true = เปิด, false = ปิด)
  status?: 'active' | 'inactive'; // สำหรับ backward-compatible
  stockCount?: number;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  productCount?: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  categoryName?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerNickname: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'promptpay' | 'cash';
  slipUrl?: string;
  slipUploadedAt?: string;
  paymentConfirmedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  hasReviewed?: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  customerId: string;
  customerNickname: string;
  customerPhotoUrl?: string;
  rating: number; // 1 - 5
  comment: string;
  createdAt: string;
  ownerReply?: string;
  repliedAt?: string;
}

export interface ShopSettings {
  name: string;
  ownerEmail: string;
  promptPayNumber: string;
  promptPayName: string;
  qrCodeUrl?: string;
  announcement: string;
  isOpen: boolean;
  phone: string;
  address: string;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface AgeGroupStat {
  range: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DashboardStats {
  todaySales: number;
  totalSales: number;
  orderCount: number;
  customerCount: number;
  activeProductsCount: number;
  inactiveProductsCount: number;
  salesByDay: { date: string; label: string; amount: number; orderCount: number }[];
  ageGroupStats: AgeGroupStat[];
}
