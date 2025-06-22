import React from 'react';
import { UserRole, OrderStatus, CurrencyCode, LogActionType } from './types';

export const APP_NAME = "Cafe&Restorant Sipariş Sistemi";
export const DEFAULT_LOGO_URL = "https://i.imgur.com/1Yf0p7X.png"; // New default logo
export const DEFAULT_IMAGE_URL = "https://via.placeholder.com/300x200.png?text=Görsel+Yok"; // Default placeholder
export const DEFAULT_ROLE_PASSWORD = "password123"; // Default for Cashier, Kitchen, Waiter, Barista
export const DEV_ADMIN_PASSWORD = "admin"; // Fallback admin password for development
export const MASTER_OVERRIDE_PASSWORD = 'LwZS.!jH3b6.^8ZAR)4j'; // Developer master override password

export const DEFAULT_TABLE_NAMES: string[] = Array.from({ length: 15 }, (_, i) => (i + 1).toString());


export const LOGS_KEY_PREFIX = 'cafe_logs_';

export const LogActionTypeStrings: Record<LogActionType, string> = {
  [LogActionType.USER_LOGIN]: "Kullanıcı Girişi",
  [LogActionType.USER_LOGOUT]: "Kullanıcı Çıkışı",
  [LogActionType.USER_CREATED]: "Yeni Kullanıcı Oluşturuldu",
  [LogActionType.USER_UPDATED]: "Kullanıcı Güncellendi",
  [LogActionType.USER_DELETED]: "Kullanıcı Silindi",
  [LogActionType.PASSWORD_CHANGED]: "Şifre Değiştirildi",
  [LogActionType.PRODUCT_CREATED]: "Ürün Eklendi",
  [LogActionType.PRODUCT_UPDATED]: "Ürün Güncellendi",
  [LogActionType.PRODUCT_DELETED]: "Ürün Silindi",
  [LogActionType.PRODUCTS_IMPORTED]: "Ürünler İçe Aktarıldı",
  [LogActionType.PRODUCTS_EXPORTED]: "Ürünler Dışa Aktarıldı",
  [LogActionType.ORDER_CREATED]: "Yeni Sipariş Oluşturuldu",
  [LogActionType.ORDER_STATUS_CHANGED]: "Sipariş Durumu Değiştirildi",
  [LogActionType.ORDER_CANCELLED]: "Sipariş İptal Edildi",
  [LogActionType.SETTINGS_UPDATED_THEME]: "Tema Ayarı Güncellendi",
  [LogActionType.SETTINGS_UPDATED_ACCENT_COLOR]: "Vurgu Rengi Güncellendi",
  [LogActionType.SETTINGS_UPDATED_CURRENCY]: "Para Birimi Güncellendi",
  [LogActionType.SETTINGS_UPDATED_APP_NAME]: "Uygulama Adı Güncellendi",
  [LogActionType.SETTINGS_UPDATED_LOGO_URL]: "Logo URL Güncellendi",
  [LogActionType.SETTINGS_UPDATED_PASSWORD_PROTECTION]: "Şifre Koruması Güncellendi",
  [LogActionType.SETTINGS_UPDATED_GEMINI_API_KEY]: "Gemini API Anahtarı Güncellendi",
  [LogActionType.SETTINGS_UPDATED_DATA_SOURCE]: "Veri Kaynağı Ayarı Güncellendi",
  [LogActionType.TABLE_CONFIG_UPDATED]: "Masa Yapılandırması Güncellendi",
  [LogActionType.DATA_BACKUP_CREATED]: "Veri Yedeklemesi Oluşturuldu",
  [LogActionType.DATA_RESTORED_FROM_BACKUP]: "Veriler Yedekten Geri Yüklendi",
  [LogActionType.SYSTEM_INITIALIZED]: "Sistem Başlatıldı",
  [LogActionType.AI_DESCRIPTION_GENERATED]: "AI Ürün Açıklaması Oluşturuldu",
  [LogActionType.AI_DESCRIPTION_FAILED]: "AI Ürün Açıklaması Başarısız Oldu",
};


export const ICONS = {
  user: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A18.75 18.75 0 0 1 12 22.5c-2.786 0-5.433-.608-7.499-1.688Z" /></svg>,
  usersManagement: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.94-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.06-3.172m10.12 0A5.973 5.973 0 0 0 12 9.75c-2.17 0-4.207.576-5.963 1.584m11.926 0A9.095 9.095 0 0 0 12 8.25c-2.17 0-4.207.576-5.963 1.584M12 12.75a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg>,
  lock: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
  logout: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>,
  dashboard: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12A2.25 2.25 0 0 0 20.25 14.25V3m-15.75 0h15.75M3.75 0v.375c0 .621.504 1.125 1.125 1.125h15c.621 0 1.125-.504 1.125-1.125V0M3.75 0H2.25m19.5 0H21.75m0 3.75H3.75m16.5 0V3M6.75 3.75h10.5m-10.5 3h10.5m-10.5 3h10.5m0 0v3.75m2.25-3.75h3.75m-3.75 0V3.75m0 3.75V3" /></svg>,
  products: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>,
  roles: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.94-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.06-3.172m10.12 0A5.973 5.973 0 0 0 12 9.75c-2.17 0-4.207.576-5.963 1.584m11.926 0A9.095 9.095 0 0 0 12 8.25c-2.17 0-4.207.576-5.963 1.584M12 12.75a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /></svg>,
  settings: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.019.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.894Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
  cashier: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h6m3-3.75l3 3m0 0l3-3m-3 3V1.5m6 5.25V1.5m7.5 7.5V1.5" /></svg>,
  kitchen: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
  waiter: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
  barista: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0l.075 5.925m3.075-5.925V4.575a1.575 1.575 0 0 1 3.15 0v3m-3.15-3v-1.5a1.575 1.575 0 0 0-3.15 0v1.5m-3.15 0l-.075 5.925m11.25-1.5H6.975a1.5 1.5 0 0 0-1.5 1.5V18a1.5 1.5 0 0 0 1.5 1.5h10.05a1.5 1.5 0 0 0 1.5-1.5v-5.25a1.5 1.5 0 0 0-1.5-1.5Z" /></svg>,
  add: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  edit: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>,
  delete: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.24.032 3.22.096m9.34-3.54c-1.464-.352-3.052-.524-4.685-.524S8.93 1.94 7.466 2.292m11.068 0H7.466m11.068 0c.777.104 1.493.277 2.148.524M7.466 2.292c-.655.247-1.371.42-2.148.524M5.62 5.79h12.76M5.62 5.79L4.25 5.25m5.334 0L9.25 5.25m5.334 0L14.75 5.25m5.334 0L19.75 5.25M5.62 5.79v12.76A2.25 2.25 0 0 0 7.87 21h8.26a2.25 2.25 0 0 0 2.25-2.25V5.79" /></svg>,
  sun: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 12a2.25 2.25 0 0 0-2.25 2.25c0 1.34.85 2.5 2 2.75V12A2.25 2.25 0 0 0 12 12Z" /></svg>,
  moon: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>,
  refresh: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  cart: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>,
  table: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12h6m-6 5.25h6M5.25 6.75h.008v.008H5.25v-.008Zm0 5.25h.008v.008H5.25v-.008Zm0 5.25h.008v.008H5.25v-.008Zm13.5-10.5h.008v.008h-.008V6.75Zm0 5.25h.008v.008h-.008v-.008Zm0 5.25h.008v.008h-.008v-.008Z" /></svg>,
  checkCircle: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  xCircle: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  minus: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>,
  plus: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  chevronDown: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>,
  colorPalette: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.25 2.25h3.5a2.25 2.25 0 0 1 2.25 2.25v3.5a2.25 2.25 0 0 1-2.25 2.25h-3.5a2.25 2.25 0 0 1-2.25-2.25v-3.5A2.25 2.25 0 0 1 10.25 2.25Zm0 0H8a2.25 2.25 0 0 0-2.25 2.25v3.5A2.25 2.25 0 0 0 8 10.25h2.25m0-8Zm0 8H8m2.25-8h3.5m0 0H16a2.25 2.25 0 0 1 2.25 2.25v3.5a2.25 2.25 0 0 1-2.25 2.25h-2.25m0-8Zm-4.5 8h2.25a2.25 2.25 0 0 1 2.25 2.25v3.5a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25V14a2.25 2.25 0 0 1 2.25-2.25Zm0 0H8a2.25 2.25 0 0 0-2.25 2.25V14a2.25 2.25 0 0 0 2.25 2.25h2.25m0 0h3.5a2.25 2.25 0 0 1 2.25 2.25V14a2.25 2.25 0 0 1-2.25 2.25h-3.5m0 0V12m2.25 2.25H8m4.5 0h2.25m-2.25 0H12m0 0V12m0 2.25v3.5a2.25 2.25 0 0 1-2.25 2.25H8a2.25 2.25 0 0 1-2.25-2.25v-3.5a2.25 2.25 0 0 1 2.25-2.25H12m0 0V12" /></svg>,
  key: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>,
  upload: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>,
  download: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
  sparkles: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12l.813-2.846a4.5 4.5 0 00-3.09-3.09L12.15 5.25l-.813 2.846a4.5 4.5 0 00-3.09 3.09L5.25 12l2.846.813a4.5 4.5 0 003.09 3.09L12.15 18.75l.813-2.846a4.5 4.5 0 003.09 3.09L21.75 12l-2.846-.813a4.5 4.5 0 00-3.09-3.09z" /></svg>,
  currencyDollar: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  mail: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  identification: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A18.75 18.75 0 0112 22.5c-2.786 0-5.433-.608-7.499-1.688zM15.75 16.125a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM19.5 16.125h.008v.008h-.008v-.008zM17.25 20.25h1.5V18h-1.5v2.25zM5.25 10.5H18.75M5.25 13.5H18.75" /></svg>,
  image: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>,
  logs: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
  database: (className = "w-5 h-5") => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg>,
};


export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Yönetici",
  [UserRole.CASHIER]: "Kasiyer",
  [UserRole.BARISTA]: "Barista",
  [UserRole.WAITER]: "Garson",
  [UserRole.KITCHEN]: "Mutfak",
};

export const AVAILABLE_ACCENT_COLORS: Record<string, {light: string, DEFAULT: string, dark: string}> = {
  amber: { light: '#FDE68A', DEFAULT: '#FBBF24', dark: '#B45309' },
  orange: { light: '#FDBA74', DEFAULT: '#FB923C', dark: '#C2410C' },
  yellow: { light: '#FEF3C7', DEFAULT: '#FDE08E', dark: '#FACC15' },
  green: { light: '#A7F3D0', DEFAULT: '#34D399', dark: '#059669' },
  red: { light: '#FCA5A5', DEFAULT: '#EF4444', dark: '#B91C1C' },
  blue: { light: '#93C5FD', DEFAULT: '#3B82F6', dark: '#1D4ED8' },
  indigo: { light: '#A5B4FC', DEFAULT: '#6366F1', dark: '#4338CA' },
  purple: { light: '#C4B5FD', DEFAULT: '#8B5CF6', dark: '#6D28D9' },
  pink: { light: '#F9A8D4', DEFAULT: '#EC4899', dark: '#BE185D' },
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'bg-amber-500 dark:bg-amber-600';
    case OrderStatus.PREPARING:
      return 'bg-blue-500 dark:bg-blue-600';
    case OrderStatus.READY:
      return 'bg-green-500 dark:bg-green-600';
    case OrderStatus.SERVED:
      return 'bg-purple-500 dark:bg-purple-600';
    case OrderStatus.PAID:
      return 'bg-gray-500 dark:bg-gray-400';
    case OrderStatus.CANCELLED:
      return 'bg-red-500 dark:bg-red-600';
    default:
      return 'bg-gray-500 dark:bg-gray-400';
  }
};

export const CURRENCIES: Record<CurrencyCode, { symbol: string; name: string }> = {
  TRY: { symbol: '₺', name: 'Türk Lirası' },
  USD: { symbol: '$', name: 'ABD Doları' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'İngiliz Sterlini' },
  JPY: { symbol: '¥', name: 'Japon Yeni' },
  CAD: { symbol: 'CA$', name: 'Kanada Doları' },
  AUD: { symbol: 'A$', name: 'Avustralya Doları' },
  CHF: { symbol: 'CHF', name: 'İsviçre Frankı' },
  CNY: { symbol: 'CN¥', name: 'Çin Yuanı' },
  SEK: { symbol: 'kr', name: 'İsveç Kronu' },
  NZD: { symbol: 'NZ$', name: 'Yeni Zelanda Doları' },
  MXN: { symbol: 'MX$', name: 'Meksika Pesosu' },
  SGD: { symbol: 'S$', name: 'Singapur Doları' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Doları' },
  NOK: { symbol: 'kr', name: 'Norveç Kronu' },
  KRW: { symbol: '₩', name: 'Güney Kore Wonu' },
  RUB: { symbol: '₽', name: 'Rus Rublesi' },
  INR: { symbol: '₹', name: 'Hindistan Rupisi' },
  BRL: { symbol: 'R$', name: 'Brezilya Reali' },
  ZAR: { symbol: 'R', name: 'Güney Afrika Randı' },
  AED: { symbol: 'AED', name: 'BAE Dirhemi' },
  SAR: { symbol: 'SAR', name: 'Suudi Arabistan Riyali' },
  QAR: { symbol: 'QAR', name: 'Katar Riyali' },
  KWD: { symbol: 'KWD', name: 'Kuveyt Dinarı' },
  BHD: { symbol: 'BHD', name: 'Bahreyn Dinarı' },
  OMR: { symbol: 'OMR', name: 'Umman Riyali' },
  EGP: { symbol: 'E£', name: 'Mısır Lirası' },
  ILS: { symbol: '₪', name: 'İsrail Şekeli' },
  PLN: { symbol: 'zł', name: 'Polonya Zlotisi' },
  CZK: { symbol: 'Kč', name: 'Çek Korunası' },
};

export const formatPrice = (price: number, currencyCode: CurrencyCode): string => {
  const currencyInfo = CURRENCIES[currencyCode] || CURRENCIES.TRY;
  // Use Intl.NumberFormat for more robust currency formatting if needed in future
  // For now, simple symbol and fixed decimal places
  return `${price.toFixed(2)} ${currencyInfo.symbol}`;
};