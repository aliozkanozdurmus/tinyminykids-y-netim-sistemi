export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
  KITCHEN = 'kitchen',
  WAITER = 'waiter',
  BARISTA = 'barista',
}

export interface User {
  id: string;
  username: string; // Kullanıcı adı (sistem içinde benzersiz olmalı)
  fullName: string; // Ad Soyad
  title?: string; // Ünvan
  role: UserRole; // Sadece Kasiyer, Mutfak, Garson, Barista olabilir. Adminler ayrı yönetilir.
  hashedPassword?: string; // Şifre koruması aktifse kullanılır
  profilePhotoUrl?: string;
  isActive: boolean; // Kullanıcı aktif mi?
  createdAt: number; // Kullanıcının oluşturulma zamanı
}

export interface AuthenticatedSession {
  userId: string; 
  role: UserRole;
  fullName: string;
  profilePhotoUrl?: string;
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
  waiterId?: string; 
  cashierId?: string; 
}

export type Theme = 'light' | 'dark';

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'SEK' | 'NZD' | 'MXN' | 'SGD' | 'HKD' | 'NOK' | 'KRW' | 'RUB' | 'INR' | 'BRL' | 'ZAR' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'BHD' | 'OMR' | 'EGP' | 'ILS' | 'PLN' | 'CZK';


export interface ThemeSettings {
  selectedTheme: Theme;
  primaryColor: string;
  currency: CurrencyCode;
  appName: string;
  logoUrl: string;
  passwordProtectionActive: boolean;
  // dataSource: 'localStorage' | 'postgresql'; // Removed
  // backendApiUrl?: string; // Removed
}

export interface TableConfiguration {
  tableNames: string[];
}

// Logging System Types
export enum LogActionType {
  // User Actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',

  // Product Actions
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  PRODUCTS_IMPORTED = 'PRODUCTS_IMPORTED',
  PRODUCTS_EXPORTED = 'PRODUCTS_EXPORTED',

  // Order Actions
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // Settings & Configuration
  SETTINGS_UPDATED_THEME = 'SETTINGS_UPDATED_THEME',
  SETTINGS_UPDATED_ACCENT_COLOR = 'SETTINGS_UPDATED_ACCENT_COLOR',
  SETTINGS_UPDATED_CURRENCY = 'SETTINGS_UPDATED_CURRENCY',
  SETTINGS_UPDATED_APP_NAME = 'SETTINGS_UPDATED_APP_NAME',
  SETTINGS_UPDATED_LOGO_URL = 'SETTINGS_UPDATED_LOGO_URL',
  SETTINGS_UPDATED_PASSWORD_PROTECTION = 'SETTINGS_UPDATED_PASSWORD_PROTECTION',
  SETTINGS_UPDATED_GEMINI_API_KEY = 'SETTINGS_UPDATED_GEMINI_API_KEY', // Kept for consistency if backend stores it
  // SETTINGS_UPDATED_DATA_SOURCE = 'SETTINGS_UPDATED_DATA_SOURCE', // Removed
  TABLE_CONFIG_UPDATED = 'TABLE_CONFIG_UPDATED',

  // System Actions
  DATA_BACKUP_CREATED = 'DATA_BACKUP_CREATED', // This might be backend-driven now
  DATA_RESTORED_FROM_BACKUP = 'DATA_RESTORED_FROM_BACKUP', // This might be backend-driven now
  SYSTEM_INITIALIZED = 'SYSTEM_INITIALIZED',
  AI_DESCRIPTION_GENERATED = 'AI_DESCRIPTION_GENERATED',
  AI_DESCRIPTION_FAILED = 'AI_DESCRIPTION_FAILED',
}

export interface LogEntry {
  id: string;
  timestamp: number;
  userId?: string; 
  userFullName?: string; 
  userRole?: UserRole; 
  action: LogActionType; 
  details: string; 
  targetId?: string; 
}