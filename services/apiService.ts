
import { Product, Order, OrderItem, OrderStatus, UserRole, AuthenticatedSession, TableConfiguration, ThemeSettings, User, LogEntry, LogActionType } from '../types';
import { DEFAULT_ROLE_PASSWORD, ROLE_DISPLAY_NAMES, DEV_ADMIN_PASSWORD, MASTER_OVERRIDE_PASSWORD, DEFAULT_TABLE_NAMES, DEFAULT_IMAGE_URL, BASE_BACKUP_LOCALSTORAGE_KEYS, LOGS_KEY_PREFIX, LogActionTypeStrings } from '../constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- START: Data Source Configuration ---
interface ApiConfig {
  dataSource: 'localStorage' | 'postgresql';
  backendApiUrl?: string;
}

let apiConfig: ApiConfig = { // Default to localStorage
  dataSource: 'localStorage',
  backendApiUrl: ''
};

try {
  const storedThemeSettings = localStorage.getItem('themeSettings');
  if (storedThemeSettings) {
    const parsedSettings = JSON.parse(storedThemeSettings) as Partial<ThemeSettings>;
    if (parsedSettings.dataSource === 'postgresql' && parsedSettings.backendApiUrl) {
      apiConfig.dataSource = 'postgresql';
      apiConfig.backendApiUrl = parsedSettings.backendApiUrl.trim();
      console.info("API Service: Data source configured to PostgreSQL. Backend API URL (or Connection String for direct use - NOT RECOMMENDED FOR FRONTEND):", apiConfig.backendApiUrl);
    } else {
      console.info("API Service: Data source configured to localStorage.");
    }
  }
} catch (e) {
  console.error("API Service: Error reading themeSettings for data source, defaulting to localStorage.", e);
}
// --- END: Data Source Configuration ---


// Helper function for generating unique IDs
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Helper function to get data from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Error parsing ${key} from localStorage`, e);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Helper function to set data to localStorage
const setToStorage = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Helper function to safely get ADMIN_PASSWORD from environment
const getEnvAdminPassword = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env && typeof process.env.ADMIN_PASSWORD === 'string') {
    const pass = process.env.ADMIN_PASSWORD.trim();
    return pass.length > 0 ? pass : undefined;
  }
  return undefined;
};

const getIsPasswordProtectionActiveFromStorage = (): boolean => {
  const storedSettings = localStorage.getItem('themeSettings');
  if (storedSettings) {
    try {
      const parsedSettings = JSON.parse(storedSettings) as Partial<ThemeSettings>;
      if (typeof parsedSettings.passwordProtectionActive === 'boolean') {
        return parsedSettings.passwordProtectionActive;
      }
      return false; 
    } catch (e) {
      console.error("Failed to parse themeSettings for password protection status, defaulting to OFF.", e);
      return false; 
    }
  }
  return false; 
};


const PRODUCTS_KEY = 'cafe_products';
const ORDERS_KEY = 'cafe_orders';
const USERS_KEY = 'cafe_users'; 
const TABLE_CONFIG_KEY = 'cafe_table_configuration';
const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key'; 

const HASH_PREFIX = "hashed_"; 

const pseudoHashPassword = (password: string): string => `${HASH_PREFIX}${password}`;
const pseudoVerifyPassword = (plain: string, hashed: string): boolean => hashed === `${HASH_PREFIX}${plain}`;

let ai: GoogleGenAI | null = null;
let currentStoredApiKey: string | null = null; 

// --- LOGGING SYSTEM ---
const _getCurrentUserForLog = (): Partial<Pick<LogEntry, 'userId' | 'userFullName' | 'userRole'>> => {
    const storedSession = localStorage.getItem('currentSession');
    if (storedSession) {
        try {
            const session = JSON.parse(storedSession) as AuthenticatedSession;
            return {
                userId: session.userId,
                userFullName: session.fullName,
                userRole: session.role,
            };
        } catch (e) {
            // Error parsing session, return system/unknown user
        }
    }
    return { userFullName: 'Sistem/Bilinmeyen', userRole: undefined, userId: 'system' };
};

const addLogEntry = async (action: LogActionType, details: string, targetId?: string, userIdOverride?: string, userFullNameOverride?: string, userRoleOverride?: UserRole): Promise<void> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logKey = `${LOGS_KEY_PREFIX}${today}`;
    
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: fetch(`${apiConfig.backendApiUrl}/logs`, { method: 'POST', body: JSON.stringify(newEntry), headers: {'Content-Type': 'application/json'} });
        console.warn(`API Service (addLogEntry): PostgreSQL data source selected with API URL, but actual backend call for logging is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (addLogEntry): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }

    let logsToday = getFromStorage<LogEntry[]>(logKey, []);

    const currentUserInfo = _getCurrentUserForLog();

    const newEntry: LogEntry = {
        id: generateId(),
        timestamp: Date.now(),
        userId: userIdOverride || currentUserInfo.userId,
        userFullName: userFullNameOverride || currentUserInfo.userFullName,
        userRole: userRoleOverride || currentUserInfo.userRole,
        action,
        details,
        targetId,
    };
    logsToday.unshift(newEntry); 
    setToStorage(logKey, logsToday);
};


export const apiService = {
  addLogEntry,

  async getLogsByDate(dateString: string): Promise<LogEntry[]> { 
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/logs?date=${dateString}`).then(res => res.json());
        console.warn(`API Service (getLogsByDate): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getLogsByDate): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const logKey = `${LOGS_KEY_PREFIX}${dateString}`;
    return getFromStorage<LogEntry[]>(logKey, []);
  },

  async getAvailableLogDates(): Promise<string[]> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/logs/dates`).then(res => res.json());
        console.warn(`API Service (getAvailableLogDates): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getAvailableLogDates): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOGS_KEY_PREFIX)) {
        dates.push(key.substring(LOGS_KEY_PREFIX.length));
      }
    }
    return dates.sort((a, b) => b.localeCompare(a)); 
  },

  async getGeminiApiKey(): Promise<string | null> {
    const key = getFromStorage<string | null>(GEMINI_API_KEY_STORAGE_KEY, null);
    return key ? key.trim() : null;
  },

  async updateGeminiApiKey(apiKey: string): Promise<void> {
    const previousKey = await this.getGeminiApiKey();
    if (apiKey && apiKey.trim()) {
        setToStorage(GEMINI_API_KEY_STORAGE_KEY, apiKey.trim());
    } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY); 
    }
    await addLogEntry(LogActionType.SETTINGS_UPDATED_GEMINI_API_KEY, `Gemini API anahtarı ${apiKey ? 'güncellendi' : 'kaldırıldı'}. Önceki anahtar: ${previousKey ? '***' : 'Yok'}`);
    ai = null;
    currentStoredApiKey = null;
  },

  async _getOrInitializeAiClient(): Promise<GoogleGenAI | null> {
    const storedKey = await this.getGeminiApiKey();
    if (storedKey) {
      if (ai && storedKey === currentStoredApiKey) return ai; 
      try {
        ai = new GoogleGenAI({ apiKey: storedKey });
        currentStoredApiKey = storedKey;
        return ai;
      } catch (error) {
        console.error("Failed to initialize GoogleGenAI client with stored API key:", error);
        ai = null; currentStoredApiKey = null; return null;
      }
    } else {
      if (ai) { ai = null; currentStoredApiKey = null; }
      return null;
    }
  },

  async getUsers(filter?: { role?: UserRole, isActive?: boolean }): Promise<User[]> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: const queryParams = new URLSearchParams(filter as any).toString();
        // Example: return fetch(`${apiConfig.backendApiUrl}/users?${queryParams}`).then(res => res.json());
        console.warn(`API Service (getUsers): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getUsers): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    let users = getFromStorage<User[]>(USERS_KEY, []);
    if (filter) {
        if (filter.role) users = users.filter(u => u.role === filter.role);
        if (filter.isActive !== undefined) users = users.filter(u => u.isActive === filter.isActive);
    }
    return users.sort((a,b) => a.fullName.localeCompare(b.fullName));
  },

  async getUserById(userId: string): Promise<User | undefined> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/users/${userId}`).then(res => res.ok ? res.json() : undefined);
        console.warn(`API Service (getUserById for ${userId}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getUserById for ${userId}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const users = await this.getUsers();
    return users.find(user => user.id === userId);
  },

  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'hashedPassword'> & { password_plain?: string }): Promise<User> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/users`, { method: 'POST', body: JSON.stringify(userData), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (addUser): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (addUser): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const users = await this.getUsers();
    if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) throw new Error(`Kullanıcı adı "${userData.username}" zaten mevcut.`);
    if (userData.role === UserRole.ADMIN) throw new Error("Admin rolü bu arayüzden atanamaz.");
    const newUser: User = { ...userData, id: generateId(), hashedPassword: userData.password_plain ? pseudoHashPassword(userData.password_plain) : undefined, createdAt: Date.now(), isActive: userData.isActive !== undefined ? userData.isActive : true, };
    users.push(newUser);
    setToStorage(USERS_KEY, users);
    await addLogEntry(LogActionType.USER_CREATED, `Yeni kullanıcı: ${newUser.fullName} (${newUser.username}), Rol: ${ROLE_DISPLAY_NAMES[newUser.role]}`, newUser.id);
    return newUser;
  },

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'username' | 'role'>> & { password_plain?: string }): Promise<User | null> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/users/${userId}`, { method: 'PATCH', body: JSON.stringify(updates), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (updateUser for ${userId}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (updateUser for ${userId}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const users = await this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    const oldUserData = JSON.stringify(users[userIndex]);
    const { password_plain, ...otherUpdates } = updates;
    users[userIndex] = { ...users[userIndex], ...otherUpdates };
    let passwordChanged = false;
    if (password_plain) { users[userIndex].hashedPassword = pseudoHashPassword(password_plain); passwordChanged = true; }
    setToStorage(USERS_KEY, users);
    await addLogEntry(LogActionType.USER_UPDATED, `Kullanıcı güncellendi: ${users[userIndex].fullName} (${users[userIndex].username}). Şifre değişti: ${passwordChanged ? 'Evet' : 'Hayır'}. Eski Veri: ${oldUserData}`, userId);
    return users[userIndex];
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/users/${userId}`, { method: 'DELETE' }).then(res => res.ok);
        console.warn(`API Service (deleteUser for ${userId}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (deleteUser for ${userId}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    let users = await this.getUsers();
    const userToDelete = users.find(u => u.id === userId);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    if (users.length < initialLength && userToDelete) {
      setToStorage(USERS_KEY, users);
      await addLogEntry(LogActionType.USER_DELETED, `Kullanıcı silindi: ${userToDelete.fullName} (${userToDelete.username})`, userId);
      return true;
    }
    return false;
  },
  
  async initializeDefaultUsers(): Promise<void> {
    if (apiConfig.dataSource === 'postgresql') {
      console.info("API Service (initializeDefaultUsers): PostgreSQL data source selected. Default user seeding is assumed to be handled by your backend or manually. Skipping frontend seeding.");
      return;
    }
    const users = await this.getUsers();
    if (users.filter(u => u.role !== UserRole.ADMIN).length === 0) { 
      await addLogEntry(LogActionType.SYSTEM_INITIALIZED, 'Varsayılan kullanıcılar oluşturuluyor.');
      const defaultUsersData: Array<Omit<User, 'id' | 'createdAt' | 'hashedPassword'> & { password_plain: string }> = [
        { username: 'kasiyer01', fullName: 'Ayşe Kasa', role: UserRole.CASHIER, title: 'Kasiyer', password_plain: DEFAULT_ROLE_PASSWORD, isActive: true, profilePhotoUrl: 'https://source.unsplash.com/100x100/?woman,portrait,cashier' },
        { username: 'barista01', fullName: 'Mehmet Barista', role: UserRole.BARISTA, title: 'Baş Barista', password_plain: DEFAULT_ROLE_PASSWORD, isActive: true, profilePhotoUrl: 'https://source.unsplash.com/100x100/?man,portrait,barista' },
        { username: 'garson01', fullName: 'Zeynep Servis', role: UserRole.WAITER, title: 'Garson', password_plain: DEFAULT_ROLE_PASSWORD, isActive: true, profilePhotoUrl: 'https://source.unsplash.com/100x100/?woman,portrait,waiter' },
        { username: 'mutfak01', fullName: 'Ali Şef', role: UserRole.KITCHEN, title: 'Mutfak Şefi', password_plain: DEFAULT_ROLE_PASSWORD, isActive: true, profilePhotoUrl: 'https://source.unsplash.com/100x100/?man,portrait,chef' },
      ];
      for (const userData of defaultUsersData) {
        try { await this.addUser(userData); } 
        catch (error) { console.warn(`Varsayılan kullanıcı oluşturulurken hata (${userData.username}): ${error}`); }
      }
    }
  },

  async loginUser(userIdOrRole: string, password_plain: string): Promise<AuthenticatedSession | null> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/auth/login`, { method: 'POST', body: JSON.stringify({userIdOrRole, password_plain}), headers: {'Content-Type': 'application/json'} }).then(res => res.ok ? res.json() : null).catch(() => null);
        console.warn(`API Service (loginUser): PostgreSQL data source selected with API URL, but actual backend call for login is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (loginUser): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const passwordProtectionActive = getIsPasswordProtectionActiveFromStorage();
    if (userIdOrRole.toLowerCase() === UserRole.ADMIN) {
        const role = UserRole.ADMIN;
        if (!passwordProtectionActive && password_plain === "__SIFRE_AC_DISABLED_VIA_ADMIN_PANEL__") {
          await addLogEntry(LogActionType.USER_LOGIN, `Yönetici girişi (şifre koruması kapalı).`, 'admin_user_special_id', 'admin_user_special_id', ROLE_DISPLAY_NAMES[role], role);
          return { userId: 'admin_user_special_id', role, fullName: ROLE_DISPLAY_NAMES[role] };
        }
        if (password_plain === MASTER_OVERRIDE_PASSWORD) {
            await addLogEntry(LogActionType.USER_LOGIN, `Yönetici girişi (MASTER ŞİFRE KULLANILDI).`, 'admin_user_special_id', 'admin_user_special_id', ROLE_DISPLAY_NAMES[role], role);
            return { userId: 'admin_user_special_id', role, fullName: ROLE_DISPLAY_NAMES[role] };
        }
        const envAdminPass = getEnvAdminPassword();
        const adminPasswordToUse = envAdminPass || DEV_ADMIN_PASSWORD;
        if (password_plain === adminPasswordToUse) {
            await addLogEntry(LogActionType.USER_LOGIN, `Yönetici girişi başarılı.`, 'admin_user_special_id', 'admin_user_special_id', ROLE_DISPLAY_NAMES[role], role);
            return { userId: 'admin_user_special_id', role, fullName: ROLE_DISPLAY_NAMES[role] };
        }
        console.error("Admin login failed: Incorrect password.");
        return null;
    }
    const user = await this.getUserById(userIdOrRole);
    if (!user) { console.error(`Kullanıcı bulunamadı: ${userIdOrRole}`); return null; }
    if (!passwordProtectionActive && password_plain === "__SIFRE_AC_DISABLED_VIA_ADMIN_PANEL__") {
      await addLogEntry(LogActionType.USER_LOGIN, `${user.fullName} (${user.username}) giriş yaptı (şifre koruması kapalı).`, user.id, user.id, user.fullName, user.role);
      return { userId: user.id, role: user.role, fullName: user.fullName, profilePhotoUrl: user.profilePhotoUrl };
    }
    if (password_plain === MASTER_OVERRIDE_PASSWORD) {
        await addLogEntry(LogActionType.USER_LOGIN, `${user.fullName} (${user.username}) giriş yaptı (MASTER ŞİFRE KULLANILDI).`, user.id, user.id, user.fullName, user.role);
        return { userId: user.id, role: user.role, fullName: user.fullName, profilePhotoUrl: user.profilePhotoUrl };
    }
    if (user.hashedPassword && pseudoVerifyPassword(password_plain, user.hashedPassword)) {
      await addLogEntry(LogActionType.USER_LOGIN, `${user.fullName} (${user.username}) giriş yaptı.`, user.id, user.id, user.fullName, user.role);
      return { userId: user.id, role: user.role, fullName: user.fullName, profilePhotoUrl: user.profilePhotoUrl };
    }
    console.error(`Giriş başarısız ${user.username}: Hatalı şifre.`);
    return null;
  },
  
  async updateRolePassword(role: UserRole, newPassword_plain: string): Promise<boolean> {
    if (role === UserRole.ADMIN) { console.error("Admin password cannot be changed through this method."); throw new Error("Admin şifresi bu yöntemle değiştirilemez."); }
    const passwordProtectionActive = getIsPasswordProtectionActiveFromStorage();
    if (!passwordProtectionActive) { console.warn("Password protection is disabled. Role passwords will not be updated."); return false;  }
    
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/users/roles/${role}/password`, { method: 'PATCH', body: JSON.stringify({newPassword_plain}), headers: {'Content-Type': 'application/json'} }).then(res => res.ok);
        console.warn(`API Service (updateRolePassword for ${role}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (updateRolePassword for ${role}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }

    const users = await this.getUsers({ role });
    let usersUpdatedCount = 0;
    for (const user of users) {
        await this.updateUser(user.id, { password_plain: newPassword_plain });
        usersUpdatedCount++;
    }
    if (usersUpdatedCount > 0) {
        await addLogEntry(LogActionType.PASSWORD_CHANGED, `${ROLE_DISPLAY_NAMES[role]} rolündeki ${usersUpdatedCount} kullanıcının şifresi güncellendi.`);
        return true;
    }
    return false;
  },

  async getProducts(filter?: { category?: string; isAvailable?: boolean }): Promise<Product[]> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products?${new URLSearchParams(filter as any)}`).then(res => res.json());
        console.warn(`API Service (getProducts): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getProducts): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    let products = getFromStorage<Product[]>(PRODUCTS_KEY, []);
    if (filter) {
        if (filter.category) products = products.filter(p => p.category === filter.category);
        if (filter.isAvailable !== undefined) products = products.filter(p => p.isAvailable === filter.isAvailable);
    }
    return products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products/${id}`).then(res => res.ok ? res.json() : undefined);
        console.warn(`API Service (getProductById for ${id}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getProductById for ${id}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const products = await this.getProducts();
    return products.find(product => product.id === id);
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products`, { method: 'POST', body: JSON.stringify(product), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (addProduct): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (addProduct): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const products = await this.getProducts();
    const newProduct: Product = { ...product, id: generateId() };
    products.push(newProduct);
    setToStorage(PRODUCTS_KEY, products);
    await addLogEntry(LogActionType.PRODUCT_CREATED, `Yeni ürün eklendi: ${newProduct.name}, Kategori: ${newProduct.category}, Fiyat: ${newProduct.price}`, newProduct.id);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products/${id}`, { method: 'PATCH', body: JSON.stringify(updates), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (updateProduct for ${id}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (updateProduct for ${id}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const products = await this.getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return null;
    const oldProductData = JSON.stringify(products[productIndex]);
    products[productIndex] = { ...products[productIndex], ...updates };
    setToStorage(PRODUCTS_KEY, products);
    await addLogEntry(LogActionType.PRODUCT_UPDATED, `Ürün güncellendi: ${products[productIndex].name}. Eski Veri: ${oldProductData}`, id);
    return products[productIndex];
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products/${id}`, { method: 'DELETE' }).then(res => res.ok);
        console.warn(`API Service (deleteProduct for ${id}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (deleteProduct for ${id}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    let products = await this.getProducts();
    const productToDelete = products.find(p => p.id === id);
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length < initialLength && productToDelete) {
      setToStorage(PRODUCTS_KEY, products);
      await addLogEntry(LogActionType.PRODUCT_DELETED, `Ürün silindi: ${productToDelete.name}`, id);
      return true;
    }
    return false;
  },
  
  async getProductCategories(): Promise<string[]> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/products/categories`).then(res => res.json());
        console.warn(`API Service (getProductCategories): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getProductCategories): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const products = await this.getProducts();
    const categories = new Set(products.map(p => p.category) as string[]);
    return [...categories];
  },

  async getOrders(filter?: { status?: OrderStatus | OrderStatus[]; tableNumber?: string }): Promise<Order[]> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/orders?${new URLSearchParams(filter as any)}`).then(res => res.json());
        console.warn(`API Service (getOrders): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getOrders): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    let orders = getFromStorage<Order[]>(ORDERS_KEY, []);
    if (filter) {
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        orders = orders.filter(o => statuses.includes(o.status));
      }
      if (filter.tableNumber) orders = orders.filter(o => o.tableNumber === filter.tableNumber);
    }
    return orders.sort((a,b) => b.createdAt - a.createdAt);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/orders/${id}`).then(res => res.ok ? res.json() : undefined);
        console.warn(`API Service (getOrderById for ${id}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getOrderById for ${id}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const orders = await this.getOrders();
    return orders.find(order => order.id === id);
  },

  async addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'> & { items: { productId: string, quantity: number, productName?: string, priceAtOrder?:number }[], tableNumber: string, notes?: string }): Promise<Order> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl. 
        // Backend should handle calculating totalAmount and fetching product names/prices.
        // Example: return fetch(`${apiConfig.backendApiUrl}/orders`, { method: 'POST', body: JSON.stringify(orderData), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (addOrder): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (addOrder): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const orders = await this.getOrders();
    let totalAmount = 0;
    const processedItems: OrderItem[] = await Promise.all(orderData.items.map(async item => {
        const product = await this.getProductById(item.productId);
        if (!product) throw new Error(`Product with id ${item.productId} not found for order.`);
        totalAmount += product.price * item.quantity;
        return { productId: item.productId, productName: product.name, quantity: item.quantity, priceAtOrder: product.price, };
    }));
    const newOrder: Order = { ...orderData, id: generateId(), items: processedItems, totalAmount, status: OrderStatus.PENDING, createdAt: Date.now(), updatedAt: Date.now(), };
    orders.push(newOrder);
    setToStorage(ORDERS_KEY, orders);
    const itemSummary = processedItems.map(item => `${item.productName} (x${item.quantity})`).join(', ');
    await addLogEntry(LogActionType.ORDER_CREATED, `Yeni sipariş oluşturuldu: Masa ${newOrder.tableNumber}, Tutar: ${newOrder.totalAmount.toFixed(2)}, Ürünler: ${itemSummary}. Not: ${newOrder.notes || 'Yok'}`, newOrder.id);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({status}), headers: {'Content-Type': 'application/json'} }).then(res => res.json());
        console.warn(`API Service (updateOrderStatus for ${id}): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (updateOrderStatus for ${id}): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return null;
    const oldStatus = orders[orderIndex].status;
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = Date.now();
    setToStorage(ORDERS_KEY, orders);
    await addLogEntry(LogActionType.ORDER_STATUS_CHANGED, `Sipariş durumu güncellendi: Masa ${orders[orderIndex].tableNumber}. Eski Durum: ${oldStatus}, Yeni Durum: ${status}`, id);
    return orders[orderIndex];
  },
  
   async seedInitialProductData() {
    if (apiConfig.dataSource === 'postgresql') {
      console.info("API Service (seedInitialProductData): PostgreSQL data source selected. Product seeding is assumed to be handled by your backend or manually. Skipping frontend seeding.");
      return;
    }
    const products = await this.getProducts();
    if (products.length === 0) {
      await addLogEntry(LogActionType.SYSTEM_INITIALIZED, 'Varsayılan ürünler veritabanına ekleniyor.');
      // ... (existing product data)
      await this.addProduct({ name: 'Türk Kahvesi', price: 30, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-coffee', description: 'Geleneksel lezzet, bol köpüklü.' });
      await this.addProduct({ name: 'Latte', price: 45, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?latte,coffee-art', description: 'Sütlü, yumuşak içimli kahve keyfi.' });
      await this.addProduct({ name: 'Espresso', price: 25, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?espresso-shot', description: 'Kısa ve yoğun, tam bir enerji bombası!' });
      await this.addProduct({ name: 'Çay', price: 15, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?tea,turkish-tea', description: 'Tavşan kanı, demli Türk çayı.' });
      await this.addProduct({ name: 'Sıcak Çikolata', price: 50, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?hot-chocolate,kids,marshmallow', description: 'Bol çikolatalı, kış günlerinin vazgeçilmezi.' });
      await this.addProduct({ name: 'Sahlep', price: 40, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?sahlep,winter-drink', description: 'Tarçınlı, içini ısıtan geleneksel tat.' });
      await this.addProduct({ name: 'Limonata', price: 35, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?lemonade,refreshing', description: 'Ev yapımı, serinletici taze limonata.' });
      await this.addProduct({ name: 'Taze Sıkma Portakal Suyu', price: 40, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?orange-juice,fresh', description: 'Güne zinde başla, C vitamini deposu!' });
      await this.addProduct({ name: 'Çilekli Milkshake', price: 55, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?strawberry-milkshake,kids', description: 'Çilek aşkına! Yoğun ve lezzetli.' });
      await this.addProduct({ name: 'Çikolatalı Milkshake', price: 55, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chocolate-milkshake,indulgent', description: 'Çikolata krizlerine birebir, bol köpüklü.' });
      await this.addProduct({ name: 'Ice Latte', price: 50, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?iced-latte,coffee', description: 'Sıcak havaların kurtarıcısı, buz gibi latte.' });
      await this.addProduct({ name: 'Frambuazlı Cheesecake', price: 65, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?raspberry-cheesecake', description: 'Hafif ve meyveli, enfes bir lezzet.' });
      await this.addProduct({ name: 'Mozaik Pasta', price: 50, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?mosaic-cake,chocolate-biscuit', description: 'Çocukluğumuzun klasiği, bisküvili mutluluk.' });
      await this.addProduct({ name: 'Sufle', price: 70, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chocolate-souffle,dessert', description: 'Akışkan çikolatasıyla kalpleri çalan lezzet.' });
      await this.addProduct({ name: 'Meyveli Waffle', price: 80, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?waffle,fruits,chocolate', description: 'Taze meyveler ve çikolata sosuyla çıtır waffle.' });
      await this.addProduct({ name: 'Renkli Cupcake', price: 30, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?cupcake,colorful,kids', description: 'Gökkuşağı gibi, hem göze hem damağa hitap.' });
      await this.addProduct({ name: 'Dondurma (Top)', price: 20, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?ice-cream-scoop,colorful', description: 'Çeşit çeşit, serinleten lezzet topları.' });
      await this.addProduct({ name: 'Menemen', price: 70, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?menemen,turkish-breakfast', description: 'Soğanlı veya soğansız, bol domatesli, mis gibi.' });
      await this.addProduct({ name: 'Serpme Kahvaltı (Kişi Başı)', price: 180, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-breakfast-spread', description: 'Zengin çeşitleriyle güne harika bir başlangıç.' });
      await this.addProduct({ name: 'Pankek Kulesi', price: 75, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?pancakes,syrup,kids', description: 'Bal, reçel veya çikolata sosuyla yumuşacık pankekler.' });
      await this.addProduct({ name: 'Kaşarlı Tost', price: 45, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?grilled-cheese-sandwich', description: 'Klasik lezzet, erimiş kaşar peyniriyle.' });
      await this.addProduct({ name: 'Mini Burger ve Patates', price: 90, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?mini-burger,fries,kids-meal', description: 'Çocukların favorisi, lezzetli mini köftesiyle.' });
      await this.addProduct({ name: 'Tavuk Şinitzel ve Makarna', price: 100, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chicken-schnitzel,pasta', description: 'Çıtır çıtır tavuk, yanında nefis makarna.' });
      await this.addProduct({ name: 'Izgara Köfte ve Pilav', price: 110, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?meatballs,rice,turkish-food', description: 'Anne eli değmiş gibi, doyurucu ve lezzetli.' });
      await this.addProduct({ name: 'Margarita Pizza (Küçük Boy)', price: 85, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?margarita-pizza,kids-pizza', description: 'Domates sosu ve mozzarella peyniriyle klasik pizza.' });
      await this.addProduct({ name: 'Parmak Patates Kızartması', price: 40, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?french-fries,ketchup', description: 'Çıtır çıtır, herkesin sevdiği atıştırmalık.' });
      await this.addProduct({ name: 'Soğan Halkası', price: 45, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?onion-rings,appetizer', description: 'Özel sosuyla, altın renginde soğan halkaları.' });
      await this.addProduct({ name: 'Sigara Böreği (Porsiyon)', price: 50, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-cheese-rolls,borek', description: 'Peynirli, çıtır çıtır sigara börekleri.' });
    }
  },

  async getDefaultTableConfiguration(): Promise<TableConfiguration> {
    return { tableNames: DEFAULT_TABLE_NAMES };
  },

  async getTableConfiguration(): Promise<TableConfiguration> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/tables/configuration`).then(res => res.json());
        console.warn(`API Service (getTableConfiguration): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (getTableConfiguration): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const item = localStorage.getItem(TABLE_CONFIG_KEY);
    if (item) {
      try { return JSON.parse(item) as TableConfiguration; } 
      catch (e) { console.error(`Error parsing ${TABLE_CONFIG_KEY} from localStorage, using defaults and saving.`, e); }
    }
    const defaultConfig = await this.getDefaultTableConfiguration();
    setToStorage(TABLE_CONFIG_KEY, defaultConfig); 
    return defaultConfig;
  },

  async updateTableConfiguration(config: TableConfiguration): Promise<void> {
    if (apiConfig.dataSource === 'postgresql') {
      if (apiConfig.backendApiUrl) {
        // TODO: Implement fetch to your backend API here using apiConfig.backendApiUrl
        // Example: return fetch(`${apiConfig.backendApiUrl}/tables/configuration`, { method: 'POST', body: JSON.stringify(config), headers: {'Content-Type': 'application/json'} }).then(() => {});
        console.warn(`API Service (updateTableConfiguration): PostgreSQL data source selected with API URL, but actual backend call is NOT IMPLEMENTED. Falling back to localStorage. You must implement the fetch call to your backend at: ${apiConfig.backendApiUrl}`);
      } else {
        console.warn(`API Service (updateTableConfiguration): PostgreSQL data source selected, but NO Backend API URL is configured. Falling back to localStorage.`);
      }
    }
    const oldConfig = await this.getTableConfiguration();
    setToStorage(TABLE_CONFIG_KEY, config);
    await addLogEntry(LogActionType.TABLE_CONFIG_UPDATED, `Masa yapılandırması güncellendi. Yeni masalar: ${config.tableNames.join(', ')}. Eski masalar: ${oldConfig.tableNames.join(', ')}`);
  },

  async generateProductDescription(productName: string, category: string): Promise<string> {
    const localAiClient = await this._getOrInitializeAiClient();
    if (!localAiClient) {
        await addLogEntry(LogActionType.AI_DESCRIPTION_FAILED, `Ürün: ${productName}. Sebep: Gemini API anahtarı ayarlanmamış veya geçersiz.`);
        throw new Error("AI servisi için API anahtarı ayarlanmamış veya geçersiz. Lütfen yönetici panelinden API anahtarını ayarlayın.");
    }
    if (!productName.trim()) throw new Error("Ürün adı boş olamaz.");
    const prompt = `"${productName}" isimli ve "${category || 'Genel'}" kategorisindeki bir ürün için çocuklara hitap eden, eğlenceli ve iştah açıcı bir menü açıklaması oluştur. Açıklama en fazla 30 kelime olsun ve ürünün temel özelliklerini vurgulasın. Örneğin, bir "Çikolatalı Pasta" için "Bol çikolatalı, yumuşacık ve çok lezzetli bir dilim mutluluk!" gibi. Cevabını sadece oluşturduğun açıklama metni olarak ver, başka bir şey ekleme.`;
    try {
        const response: GenerateContentResponse = await localAiClient.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt });
        const text = response.text;
        if (!text) { await addLogEntry(LogActionType.AI_DESCRIPTION_FAILED, `Ürün: ${productName}. Sebep: AI'dan boş yanıt alındı.`); throw new Error("AI'dan boş bir yanıt alındı."); }
        await addLogEntry(LogActionType.AI_DESCRIPTION_GENERATED, `Ürün: ${productName}. Oluşturulan açıklama: ${text.trim()}`);
        return text.trim();
    } catch (error) {
        console.error("Error generating product description with Gemini:", error);
        let reason = "AI açıklaması oluşturulurken bir hata oluştu.";
        if (error instanceof Error) {
            if (error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("invalid api key") || error.message.toLowerCase().includes("permission denied") || error.message.toLowerCase().includes("api_key_invalid")) {
                 reason = "API anahtarı geçersiz veya yetersiz. Lütfen yönetici panelindeki anahtarı kontrol edin.";
            } else { reason = error.message; }
        }
        await addLogEntry(LogActionType.AI_DESCRIPTION_FAILED, `Ürün: ${productName}. Sebep: ${reason}`);
        throw new Error(reason);
    }
  },

  async exportAllData(): Promise<string> {
    const dataToExport: Record<string, any> = {};
    const allKeys = [...BASE_BACKUP_LOCALSTORAGE_KEYS];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(LOGS_KEY_PREFIX) && !allKeys.includes(key)) allKeys.push(key);
    }
    allKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item !== null) {
        try { dataToExport[key] = JSON.parse(item); } 
        catch (e) { dataToExport[key] = item; }
      }
    });
    await addLogEntry(LogActionType.DATA_BACKUP_CREATED, `Tüm uygulama verileri yedeklendi.`);
    return JSON.stringify(dataToExport, null, 2);
  },

  async importAllData(jsonData: string): Promise<void> {
    try {
      const dataToImport = JSON.parse(jsonData);
      if (typeof dataToImport !== 'object' || dataToImport === null) throw new Error("Geçersiz yedekleme dosyası formatı.");
      const allKeysFromBackup = Object.keys(dataToImport);
      const validAppKeys = [...BASE_BACKUP_LOCALSTORAGE_KEYS]; 
      allKeysFromBackup.forEach(key => { if (key.startsWith(LOGS_KEY_PREFIX) && !validAppKeys.includes(key)) validAppKeys.push(key); });
      for (const key in dataToImport) {
        if (validAppKeys.includes(key)) { 
          const value = dataToImport[key];
          if (typeof value === 'object' || Array.isArray(value)) localStorage.setItem(key, JSON.stringify(value));
          else localStorage.setItem(key, String(value));
        }
      }
      await addLogEntry(LogActionType.DATA_RESTORED_FROM_BACKUP, `Uygulama verileri yedekten geri yüklendi. Yüklenen anahtarlar: ${Object.keys(dataToImport).join(', ')}`);
    } catch (error) {
      console.error("Veri geri yüklenirken hata:", error);
      await addLogEntry(LogActionType.DATA_RESTORED_FROM_BACKUP, `Yedekten geri yükleme BAŞARISIZ OLDU. Hata: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Yedekleme dosyası işlenirken hata oluştu: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};
