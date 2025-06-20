export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
  BARISTA = 'barista', // Yeni rol eklendi
}

export interface AuthenticatedSession {
  role: UserRole;
  displayName: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
  description?: string;
  stock?: number;
  isAvailable: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtOrder: number;
}

export enum OrderStatus {
  PENDING = 'Beklemede',
  PREPARING = 'Hazırlanıyor',
  READY = 'Hazır',
  SERVED = 'Servis Edildi',
  PAID = 'Ödendi',
  CANCELLED = 'İptal Edildi',
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

export type Theme = 'light' | 'dark';

export interface ThemeSettings {
  selectedTheme: Theme;
  primaryColor: string;
}

export interface TableConfiguration {
  minTable: number;
  maxTable: number;
}