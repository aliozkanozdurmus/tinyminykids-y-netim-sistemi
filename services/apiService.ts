import { Product, Order, OrderItem, OrderStatus, UserRole, AuthenticatedSession, TableConfiguration, User, LogEntry, LogActionType } from '../types';
import { ROLE_DISPLAY_NAMES, DEFAULT_TABLE_NAMES, DEFAULT_IMAGE_URL, LOGS_KEY_PREFIX } from '../constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// --- START: Backend API Configuration ---
// The BACKEND_API_URL will be injected by config.js, which is generated by entrypoint.sh in Docker
const BASE_URL = (window as any).BACKEND_API_URL || 'http://localhost:3000/api'; // Fallback for non-Docker dev
// --- END: Backend API Configuration ---


// Helper function for generating unique IDs (still useful for optimistic UI or if backend expects client-generated IDs for some cases)
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Helper function to safely get password protection status from localStorage (themeSettings)
const getIsPasswordProtectionActiveFromStorage = (): boolean => {
  const storedSettings = localStorage.getItem('themeSettings');
  if (storedSettings) {
    try {
      const parsedSettings = JSON.parse(storedSettings) as Partial<{ passwordProtectionActive: boolean }>;
      if (typeof parsedSettings.passwordProtectionActive === 'boolean') {
        return parsedSettings.passwordProtectionActive;
      }
      return true; // Default to true if not specified
    } catch (e) {
      console.error("Failed to parse themeSettings for password protection status, defaulting to ON.", e);
      return true; 
    }
  }
  return true; // Default to true if no settings found
};

let ai: GoogleGenAI | null = null;

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
    const currentUserInfo = _getCurrentUserForLog();
    const newEntry: Omit<LogEntry, 'id'> = { // Backend will assign ID
        timestamp: Date.now(),
        userId: userIdOverride || currentUserInfo.userId,
        userFullName: userFullNameOverride || currentUserInfo.userFullName,
        userRole: userRoleOverride || currentUserInfo.userRole,
        action,
        details,
        targetId,
    };
    try {
        const response = await fetch(`${BASE_URL}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry),
        });
        if (!response.ok) {
            console.error('Failed to add log entry to backend:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending log entry to backend:', error);
    }
};


export const apiService = {
  addLogEntry,

  async getLogsByDate(dateString: string): Promise<LogEntry[]> { 
    try {
        const response = await fetch(`${BASE_URL}/logs?date=${dateString}`);
        if (!response.ok) throw new Error(`Failed to fetch logs for date ${dateString}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching logs for date ${dateString}:`, error);
        return [];
    }
  },

  async getAvailableLogDates(): Promise<string[]> {
    try {
        const response = await fetch(`${BASE_URL}/logs/dates`);
        if (!response.ok) throw new Error('Failed to fetch available log dates');
        return await response.json();
    } catch (error) {
        console.error('Error fetching available log dates:', error);
        return [];
    }
  },

  // Gemini API Key is now sourced from process.env.API_KEY directly in _getOrInitializeAiClient
  // getGeminiApiKey and updateGeminiApiKey are removed.

  async _getOrInitializeAiClient(): Promise<GoogleGenAI | null> {
    // API_KEY is expected to be in process.env.API_KEY as per guidelines
    // The execution environment (e.g., platform running the code) must make this available.
    const apiKeyFromEnv = process.env.API_KEY;

    if (apiKeyFromEnv) {
      if (ai) return ai; // Return existing client if already initialized
      try {
        ai = new GoogleGenAI({ apiKey: apiKeyFromEnv });
        return ai;
      } catch (error) {
        console.error("Failed to initialize GoogleGenAI client with API key from environment:", error);
        ai = null; 
        return null;
      }
    } else {
      console.warn("Google GenAI API Key not found in process.env.API_KEY. AI features will be disabled.");
      ai = null;
      return null;
    }
  },

  async getUsers(filter?: { role?: UserRole, isActive?: boolean }): Promise<User[]> {
    try {
        const queryParams = new URLSearchParams(filter as any).toString();
        const response = await fetch(`${BASE_URL}/users?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const users: User[] = await response.json();
        return users.sort((a,b) => a.fullName.localeCompare(b.fullName));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
  },

  async getUserById(userId: string): Promise<User | undefined> {
     try {
        const response = await fetch(`${BASE_URL}/users/${userId}`);
        if (!response.ok) {
            if (response.status === 404) return undefined;
            throw new Error(`Failed to fetch user ${userId}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
    }
  },

  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'hashedPassword'> & { password_plain?: string }): Promise<User> {
    try {
        const response = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) throw new Error(await response.text() || 'Failed to add user');
        const newUser:User = await response.json();
        await addLogEntry(LogActionType.USER_CREATED, `Yeni kullanıcı: ${newUser.fullName} (${newUser.username}), Rol: ${ROLE_DISPLAY_NAMES[newUser.role]}`, newUser.id);
        return newUser;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
  },

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'username' | 'role'>> & { password_plain?: string }): Promise<User | null> {
    try {
        const response = await fetch(`${BASE_URL}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error(await response.text() || `Failed to update user ${userId}`);
        const updatedUser: User = await response.json();
        await addLogEntry(LogActionType.USER_UPDATED, `Kullanıcı güncellendi: ${updatedUser.fullName}. Şifre değişti: ${updates.password_plain ? 'Evet' : 'Hayır'}.`, userId);
        return updatedUser;
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        throw error;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
        const userToDelete = await this.getUserById(userId); // For logging name before deletion
        const response = await fetch(`${BASE_URL}/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete user ${userId}`);
        if (userToDelete) {
          await addLogEntry(LogActionType.USER_DELETED, `Kullanıcı silindi: ${userToDelete.fullName} (${userToDelete.username})`, userId);
        } else {
          await addLogEntry(LogActionType.USER_DELETED, `Kullanıcı silindi: ID ${userId}`, userId);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
  },
  
  // initializeDefaultUsers is removed. Backend should handle this.

  async loginUser(userIdOrRole: string, password_plain: string): Promise<AuthenticatedSession | null> {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userIdOrRole, password: password_plain }),
        });
        if (!response.ok) {
             if (response.status === 401) { // Unauthorized
                console.error("Login failed: Invalid credentials");
                return null;
            }
            throw new Error(await response.text() || 'Login request failed');
        }
        const sessionData: AuthenticatedSession = await response.json();
        // Log successful login (consider if backend should do this to avoid double logging if it also logs)
        await addLogEntry(LogActionType.USER_LOGIN, `${sessionData.fullName} (${sessionData.role}) giriş yaptı.`, sessionData.userId, sessionData.userId, sessionData.fullName, sessionData.role);
        return sessionData;
    } catch (error) {
        console.error('Error during login:', error);
        return null; // Or rethrow if higher level component should handle
    }
  },
  
  // updateRolePassword is removed. This logic is now part of individual user password updates via updateUser.

  async getProducts(filter?: { category?: string; isAvailable?: boolean }): Promise<Product[]> {
    try {
        const queryParams = new URLSearchParams(filter as any).toString();
        const response = await fetch(`${BASE_URL}/products?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
  },

  async getProductById(id: string): Promise<Product | undefined> {
    try {
        const response = await fetch(`${BASE_URL}/products/${id}`);
        if (!response.ok) {
            if (response.status === 404) return undefined;
            throw new Error(`Failed to fetch product ${id}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw error;
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error(await response.text() || 'Failed to add product');
        const newProduct:Product = await response.json();
        await addLogEntry(LogActionType.PRODUCT_CREATED, `Yeni ürün eklendi: ${newProduct.name}, Kategori: ${newProduct.category}, Fiyat: ${newProduct.price}`, newProduct.id);
        return newProduct;
    } catch (error) {
        console.error('Error adding product:', error);
        throw error;
    }
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    try {
        const response = await fetch(`${BASE_URL}/products/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error(await response.text() || `Failed to update product ${id}`);
        const updatedProduct: Product = await response.json();
        await addLogEntry(LogActionType.PRODUCT_UPDATED, `Ürün güncellendi: ${updatedProduct.name}.`, id);
        return updatedProduct;
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);
        throw error;
    }
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
        const productToDelete = await this.getProductById(id);
        const response = await fetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`Failed to delete product ${id}`);
        if (productToDelete) {
            await addLogEntry(LogActionType.PRODUCT_DELETED, `Ürün silindi: ${productToDelete.name}`, id);
        } else {
            await addLogEntry(LogActionType.PRODUCT_DELETED, `Ürün silindi: ID ${id}`, id);
        }
        return true;
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);
        throw error;
    }
  },
  
  async getProductCategories(): Promise<string[]> {
    try {
        const response = await fetch(`${BASE_URL}/products/categories`);
        if (!response.ok) throw new Error('Failed to fetch product categories');
        return await response.json();
    } catch (error) {
        console.error('Error fetching product categories:', error);
        throw error;
    }
  },

  async getOrders(filter?: { status?: OrderStatus | OrderStatus[]; tableNumber?: string }): Promise<Order[]> {
    try {
        const queryParams = new URLSearchParams(filter as any).toString();
        const response = await fetch(`${BASE_URL}/orders?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders: Order[] = await response.json();
        return orders.sort((a,b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
  },

  async getOrderById(id: string): Promise<Order | undefined> {
     try {
        const response = await fetch(`${BASE_URL}/orders/${id}`);
        if (!response.ok) {
            if (response.status === 404) return undefined;
            throw new Error(`Failed to fetch order ${id}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching order ${id}:`, error);
        throw error;
    }
  },

  async addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'> & { items: { productId: string, quantity: number, productName?: string, priceAtOrder?:number }[], tableNumber: string, notes?: string }): Promise<Order> {
    // Backend should calculate totalAmount and fetch product names/prices if not provided fully by client.
    // For simplicity, client might still prepare OrderItem with name/price, but backend should verify.
    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });
        if (!response.ok) throw new Error(await response.text() || 'Failed to add order');
        const newOrder: Order = await response.json();
        const itemSummary = newOrder.items.map(item => `${item.productName} (x${item.quantity})`).join(', ');
        await addLogEntry(LogActionType.ORDER_CREATED, `Yeni sipariş oluşturuldu: Masa ${newOrder.tableNumber}, Tutar: ${newOrder.totalAmount.toFixed(2)}, Ürünler: ${itemSummary}. Not: ${newOrder.notes || 'Yok'}`, newOrder.id);
        return newOrder;
    } catch (error) {
        console.error('Error adding order:', error);
        throw error;
    }
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    try {
        const response = await fetch(`${BASE_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({status}),
        });
        if (!response.ok) throw new Error(`Failed to update order status for ${id}`);
        const updatedOrder:Order =  await response.json();
        await addLogEntry(LogActionType.ORDER_STATUS_CHANGED, `Sipariş durumu güncellendi: Masa ${updatedOrder.tableNumber}. Yeni Durum: ${status}`, id);
        return updatedOrder;
    } catch (error) {
        console.error(`Error updating order status for ${id}:`, error);
        throw error;
    }
  },
  
  // seedInitialProductData is removed. Backend should handle this.

  async getDefaultTableConfiguration(): Promise<TableConfiguration> {
    // This might be fetched from backend if backend provides a default, or keep client-side default.
    return { tableNames: DEFAULT_TABLE_NAMES };
  },

  async getTableConfiguration(): Promise<TableConfiguration> {
    try {
        const response = await fetch(`${BASE_URL}/tables/configuration`);
        if (!response.ok) throw new Error('Failed to fetch table configuration');
        return await response.json();
    } catch (error) {
        console.error('Error fetching table configuration:', error);
        // Fallback to default if backend fails or has no config
        const defaultConfig = await this.getDefaultTableConfiguration();
        return defaultConfig;
    }
  },

  async updateTableConfiguration(config: TableConfiguration): Promise<void> {
    try {
        const response = await fetch(`${BASE_URL}/tables/configuration`, {
            method: 'POST', // Or PUT, depending on backend API design
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!response.ok) throw new Error('Failed to update table configuration');
        await addLogEntry(LogActionType.TABLE_CONFIG_UPDATED, `Masa yapılandırması güncellendi. Yeni masalar: ${config.tableNames.join(', ')}.`);
    } catch (error) {
        console.error('Error updating table configuration:', error);
        throw error;
    }
  },

  async generateProductDescription(productName: string, category: string): Promise<string> {
    const localAiClient = await this._getOrInitializeAiClient();
    if (!localAiClient) {
        await addLogEntry(LogActionType.AI_DESCRIPTION_FAILED, `Ürün: ${productName}. Sebep: Gemini API anahtarı ayarlanmamış veya geçersiz.`);
        throw new Error("AI servisi için API anahtarı ayarlanmamış veya geçersiz. Lütfen ortam değişkenlerini kontrol edin.");
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
                 reason = "API anahtarı geçersiz veya yetersiz. Lütfen ortam değişkenlerini kontrol edin.";
            } else { reason = error.message; }
        }
        await addLogEntry(LogActionType.AI_DESCRIPTION_FAILED, `Ürün: ${productName}. Sebep: ${reason}`);
        throw new Error(reason);
    }
  },

  // exportAllData and importAllData based on localStorage are removed.
  // These operations should be handled by the backend API with database dumps/restores.
};