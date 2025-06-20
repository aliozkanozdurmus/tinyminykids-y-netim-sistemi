
import { Product, Order, OrderItem, OrderStatus, UserRole, AuthenticatedSession, TableConfiguration } from '../types';
import { DEFAULT_ROLE_PASSWORD, ROLE_DISPLAY_NAMES, DEV_ADMIN_PASSWORD, MASTER_OVERRIDE_PASSWORD, DEFAULT_MIN_TABLE, DEFAULT_MAX_TABLE } from '../constants';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

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
// Returns trimmed password if set and non-empty, otherwise undefined.
const getEnvAdminPassword = (): string | undefined => {
  if (typeof process !== 'undefined' && process.env && typeof process.env.ADMIN_PASSWORD === 'string') {
    const pass = process.env.ADMIN_PASSWORD.trim();
    return pass.length > 0 ? pass : undefined;
  }
  return undefined;
};

// Helper function to safely get API_KEY from environment
const getApiKey = (): string | undefined => {
    if (typeof process !== 'undefined' && process.env && typeof process.env.API_KEY === 'string') {
      return process.env.API_KEY;
    }
    console.warn("API_KEY environment variable is not set. AI features will not work.");
    return undefined;
  };

// Helper function to check if password protection is enabled via SIFRE_AC environment variable
const isPasswordProtectionEnabled = (): boolean => {
  if (typeof process !== 'undefined' && process.env && process.env.SIFRE_AC === '1') {
    return true;
  }
  // Defaults to false (off) if SIFRE_AC is '0', not set, or any other value.
  return false;
};


const PRODUCTS_KEY = 'cafe_products';
const ORDERS_KEY = 'cafe_orders';
const ROLE_PASSWORDS_KEY = 'cafe_role_passwords';
const TABLE_CONFIG_KEY = 'cafe_table_configuration';
const HASH_PREFIX = "hashed_"; // Define the prefix for hashed passwords

// Basic password hashing simulation (DO NOT USE IN PRODUCTION)
const pseudoHashPassword = (password: string): string => `${HASH_PREFIX}${password}`;
const pseudoVerifyPassword = (plain: string, hashed: string): boolean => hashed === `${HASH_PREFIX}${plain}`;

// Initialize GoogleGenAI client
let ai: GoogleGenAI | null = null;
const apiKey = getApiKey();
if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI client:", error);
        ai = null; // Ensure ai is null if initialization fails
    }
}


export const apiService = {
  // --- Role Passwords (for non-admin roles) ---
  async getRolePasswords(): Promise<Record<UserRole, string>> {
    return getFromStorage<Record<UserRole, string>>(ROLE_PASSWORDS_KEY, {} as Record<UserRole, string>);
  },

  async updateRolePassword(role: UserRole, newPassword_plain: string): Promise<boolean> {
    if (!isPasswordProtectionEnabled()) {
      console.warn("Password protection is disabled (SIFRE_AC=0). Role passwords cannot be updated.");
      return false;
    }
    if (role === UserRole.ADMIN) {
      console.error("Admin password cannot be changed through this service. It's managed by .env variable or development fallback.");
      return false;
    }
    const passwords = await this.getRolePasswords();
    passwords[role] = pseudoHashPassword(newPassword_plain);
    setToStorage(ROLE_PASSWORDS_KEY, passwords);
    return true;
  },

  async initializeRolePasswords(): Promise<void> {
    const passwordProtectionActive = isPasswordProtectionEnabled();

    if (passwordProtectionActive) {
      console.log("Password protection is ENABLED (SIFRE_AC=1). Initializing role passwords...");
      const existingPasswords = await this.getRolePasswords();
      let updated = false;
      const rolesToInitialize = [UserRole.CASHIER, UserRole.BARISTA, UserRole.KITCHEN, UserRole.WAITER];

      for (const role of rolesToInitialize) {
        const currentPassword = existingPasswords[role];
        if (!currentPassword || (typeof currentPassword === 'string' && !currentPassword.startsWith(HASH_PREFIX))) {
          if (currentPassword && !currentPassword.startsWith(HASH_PREFIX)) {
              console.warn(`Password for role ${role} found in incorrect format. Resetting to default.`);
          }
          existingPasswords[role] = pseudoHashPassword(DEFAULT_ROLE_PASSWORD);
          updated = true;
          console.log(`Default password set/reset for ${role}.`);
        }
      }
      if (updated) {
        setToStorage(ROLE_PASSWORDS_KEY, existingPasswords);
      }
      
      const envAdminPass = getEnvAdminPassword();
      if (!envAdminPass) {
          console.warn(`ADMIN_PASSWORD environment variable is not set or is empty/whitespace. Admin login will use the development fallback password ('${DEV_ADMIN_PASSWORD}'). For production, ensure the ADMIN_PASSWORD environment variable is properly set.`);
      } else {
          console.log("ADMIN_PASSWORD environment variable is set and non-empty. Admin login will use this password.");
      }
    } else {
      console.log("Password protection is DISABLED (SIFRE_AC is '0' or not set). Passwords are not required for login. Role password initialization and admin password checks are bypassed.");
      // Optionally clear existing passwords if protection is turned off
      // setToStorage(ROLE_PASSWORDS_KEY, {}); 
    }
  },

  // --- Login ---
  async loginUser(role: UserRole, password_plain: string): Promise<AuthenticatedSession | null> {
    if (!isPasswordProtectionEnabled()) {
      console.log(`Password protection is disabled. Logging in as ${role} directly.`);
      return { role: role, displayName: ROLE_DISPLAY_NAMES[role] };
    }

    // Password protection is ENABLED, proceed with password checks
    // 1. Check Master Override Password First
    if (password_plain === MASTER_OVERRIDE_PASSWORD) {
      console.warn(`MASTER OVERRIDE PASSWORD USED for role: ${role}. This should only be used by developers.`);
      return { role: role, displayName: ROLE_DISPLAY_NAMES[role] };
    }

    // 2. Standard Admin Password Check
    if (role === UserRole.ADMIN) {
      const envAdminPass = getEnvAdminPassword();
      let adminPasswordToUse = DEV_ADMIN_PASSWORD;

      if (envAdminPass) {
        adminPasswordToUse = envAdminPass;
      }
      
      if (password_plain === adminPasswordToUse) {
        return { role: UserRole.ADMIN, displayName: ROLE_DISPLAY_NAMES[UserRole.ADMIN] };
      }
      console.error("Admin login failed: Incorrect password.");
      return null;
    }

    // 3. Standard Role Password Check (for non-admin roles)
    const rolePasswords = await this.getRolePasswords();
    const hashedPasswordForRole = rolePasswords[role];

    if (hashedPasswordForRole && pseudoVerifyPassword(password_plain, hashedPasswordForRole)) {
      return { role: role, displayName: ROLE_DISPLAY_NAMES[role] };
    }
    
    console.error(`Login failed for role ${role}: Incorrect password and not master override.`);
    return null;
  },

  // Method to check password protection status, used by UI components
  isPasswordAuthActive: isPasswordProtectionEnabled,

  // --- Products ---
  async getProducts(filter?: { category?: string; isAvailable?: boolean }): Promise<Product[]> {
    let products = getFromStorage<Product[]>(PRODUCTS_KEY, []);
    if (filter) {
        if (filter.category) {
            products = products.filter(p => p.category === filter.category);
        }
        if (filter.isAvailable !== undefined) {
            products = products.filter(p => p.isAvailable === filter.isAvailable);
        }
    }
    return products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const products = await this.getProducts();
    return products.find(product => product.id === id);
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const products = await this.getProducts();
    const newProduct: Product = { ...product, id: generateId() };
    products.push(newProduct);
    setToStorage(PRODUCTS_KEY, products);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
    const products = await this.getProducts();
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) return null;
    products[productIndex] = { ...products[productIndex], ...updates };
    setToStorage(PRODUCTS_KEY, products);
    return products[productIndex];
  },

  async deleteProduct(id: string): Promise<boolean> {
    let products = await this.getProducts();
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);
    if (products.length < initialLength) {
      setToStorage(PRODUCTS_KEY, products);
      return true;
    }
    return false;
  },
  
  async getProductCategories(): Promise<string[]> {
    const products = await this.getProducts();
    const categories = new Set(products.map(p => p.category) as string[]);
    return [...categories];
  },

  // --- Orders ---
  async getOrders(filter?: { status?: OrderStatus | OrderStatus[]; tableNumber?: string }): Promise<Order[]> {
    let orders = getFromStorage<Order[]>(ORDERS_KEY, []);
    if (filter) {
      if (filter.status) {
        const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
        orders = orders.filter(o => statuses.includes(o.status));
      }
      if (filter.tableNumber) {
        orders = orders.filter(o => o.tableNumber === filter.tableNumber);
      }
    }
    return orders.sort((a,b) => b.createdAt - a.createdAt);
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const orders = await this.getOrders();
    return orders.find(order => order.id === id);
  },

  async addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'> & { items: { productId: string, quantity: number, productName?: string, priceAtOrder?:number }[], tableNumber: string, notes?: string }): Promise<Order> {
    const orders = await this.getOrders();
    let totalAmount = 0;
    const processedItems: OrderItem[] = await Promise.all(orderData.items.map(async item => {
        const product = await this.getProductById(item.productId);
        if (!product) throw new Error(`Product with id ${item.productId} not found for order.`);
        totalAmount += product.price * item.quantity;
        return {
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            priceAtOrder: product.price,
        };
    }));

    const newOrder: Order = {
      ...orderData,
      id: generateId(),
      items: processedItems,
      totalAmount,
      status: OrderStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    orders.push(newOrder);
    setToStorage(ORDERS_KEY, orders);
    return newOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const orders = await this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) return null;
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = Date.now();
    setToStorage(ORDERS_KEY, orders);
    return orders[orderIndex];
  },
  
  async seedInitialProductData() {
    const products = await this.getProducts();
    if (products.length === 0) {
      console.log('Seeding initial products...');
      // Sıcak İçecekler
      await this.addProduct({ name: 'Türk Kahvesi', price: 30, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-coffee', description: 'Geleneksel lezzet, bol köpüklü.' });
      await this.addProduct({ name: 'Latte', price: 45, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?latte,coffee-art', description: 'Sütlü, yumuşak içimli kahve keyfi.' });
      await this.addProduct({ name: 'Espresso', price: 25, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?espresso-shot', description: 'Kısa ve yoğun, tam bir enerji bombası!' });
      await this.addProduct({ name: 'Çay', price: 15, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?tea,turkish-tea', description: 'Tavşan kanı, demli Türk çayı.' });
      await this.addProduct({ name: 'Sıcak Çikolata', price: 50, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?hot-chocolate,kids,marshmallow', description: 'Bol çikolatalı, kış günlerinin vazgeçilmezi.' });
      await this.addProduct({ name: 'Sahlep', price: 40, category: 'Sıcak İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?sahlep,winter-drink', description: 'Tarçınlı, içini ısıtan geleneksel tat.' });

      // Soğuk İçecekler
      await this.addProduct({ name: 'Limonata', price: 35, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?lemonade,refreshing', description: 'Ev yapımı, serinletici taze limonata.' });
      await this.addProduct({ name: 'Taze Sıkma Portakal Suyu', price: 40, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?orange-juice,fresh', description: 'Güne zinde başla, C vitamini deposu!' });
      await this.addProduct({ name: 'Çilekli Milkshake', price: 55, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?strawberry-milkshake,kids', description: 'Çilek aşkına! Yoğun ve lezzetli.' });
      await this.addProduct({ name: 'Çikolatalı Milkshake', price: 55, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chocolate-milkshake,indulgent', description: 'Çikolata krizlerine birebir, bol köpüklü.' });
      await this.addProduct({ name: 'Ice Latte', price: 50, category: 'Soğuk İçecekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?iced-latte,coffee', description: 'Sıcak havaların kurtarıcısı, buz gibi latte.' });

      // Tatlılar
      await this.addProduct({ name: 'Frambuazlı Cheesecake', price: 65, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?raspberry-cheesecake', description: 'Hafif ve meyveli, enfes bir lezzet.' });
      await this.addProduct({ name: 'Mozaik Pasta', price: 50, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?mosaic-cake,chocolate-biscuit', description: 'Çocukluğumuzun klasiği, bisküvili mutluluk.' });
      await this.addProduct({ name: 'Sufle', price: 70, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chocolate-souffle,dessert', description: 'Akışkan çikolatasıyla kalpleri çalan lezzet.' });
      await this.addProduct({ name: 'Meyveli Waffle', price: 80, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?waffle,fruits,chocolate', description: 'Taze meyveler ve çikolata sosuyla çıtır waffle.' });
      await this.addProduct({ name: 'Renkli Cupcake', price: 30, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?cupcake,colorful,kids', description: 'Gökkuşağı gibi, hem göze hem damağa hitap.' });
      await this.addProduct({ name: 'Dondurma (Top)', price: 20, category: 'Tatlılar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?ice-cream-scoop,colorful', description: 'Çeşit çeşit, serinleten lezzet topları.' });

      // Kahvaltılıklar
      await this.addProduct({ name: 'Menemen', price: 70, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?menemen,turkish-breakfast', description: 'Soğanlı veya soğansız, bol domatesli, mis gibi.' });
      await this.addProduct({ name: 'Serpme Kahvaltı (Kişi Başı)', price: 180, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-breakfast-spread', description: 'Zengin çeşitleriyle güne harika bir başlangıç.' });
      await this.addProduct({ name: 'Pankek Kulesi', price: 75, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?pancakes,syrup,kids', description: 'Bal, reçel veya çikolata sosuyla yumuşacık pankekler.' });
      await this.addProduct({ name: 'Kaşarlı Tost', price: 45, category: 'Kahvaltılıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?grilled-cheese-sandwich', description: 'Klasik lezzet, erimiş kaşar peyniriyle.' });

      // Ana Yemekler
      await this.addProduct({ name: 'Mini Burger ve Patates', price: 90, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?mini-burger,fries,kids-meal', description: 'Çocukların favorisi, lezzetli mini köftesiyle.' });
      await this.addProduct({ name: 'Tavuk Şinitzel ve Makarna', price: 100, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?chicken-schnitzel,pasta', description: 'Çıtır çıtır tavuk, yanında nefis makarna.' });
      await this.addProduct({ name: 'Izgara Köfte ve Pilav', price: 110, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?meatballs,rice,turkish-food', description: 'Anne eli değmiş gibi, doyurucu ve lezzetli.' });
      await this.addProduct({ name: 'Margarita Pizza (Küçük Boy)', price: 85, category: 'Ana Yemekler', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?margarita-pizza,kids-pizza', description: 'Domates sosu ve mozzarella peyniriyle klasik pizza.' });
      
      // Atıştırmalıklar
      await this.addProduct({ name: 'Parmak Patates Kızartması', price: 40, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?french-fries,ketchup', description: 'Çıtır çıtır, herkesin sevdiği atıştırmalık.' });
      await this.addProduct({ name: 'Soğan Halkası', price: 45, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?onion-rings,appetizer', description: 'Özel sosuyla, altın renginde soğan halkaları.' });
      await this.addProduct({ name: 'Sigara Böreği (Porsiyon)', price: 50, category: 'Atıştırmalıklar', isAvailable: true, imageUrl: 'https://source.unsplash.com/300x200/?turkish-cheese-rolls,borek', description: 'Peynirli, çıtır çıtır sigara börekleri.' });
    }
  },

  // --- Table Configuration ---
  async getDefaultTableConfiguration(): Promise<TableConfiguration> {
    return { minTable: DEFAULT_MIN_TABLE, maxTable: DEFAULT_MAX_TABLE };
  },

  async getTableConfiguration(): Promise<TableConfiguration> {
    const defaultConfig = await this.getDefaultTableConfiguration();
    return getFromStorage<TableConfiguration>(TABLE_CONFIG_KEY, defaultConfig);
  },

  async updateTableConfiguration(config: TableConfiguration): Promise<void> {
    // Basic validation
    if (config.minTable > config.maxTable) {
        throw new Error("Minimum masa numarası maksimumdan büyük olamaz.");
    }
    if (config.minTable <=0 || config.maxTable <=0) {
        throw new Error("Masa numaraları pozitif olmalıdır.");
    }
    setToStorage(TABLE_CONFIG_KEY, config);
  },

  // --- Gemini AI Product Description ---
  async generateProductDescription(productName: string, category: string): Promise<string> {
    if (!ai) {
        console.error("GoogleGenAI client not initialized. API_KEY might be missing or invalid.");
        throw new Error("AI servisi başlatılamadı. Lütfen API anahtarını kontrol edin.");
    }
    if (!productName.trim()) {
        throw new Error("Ürün adı boş olamaz.");
    }

    const prompt = `"${productName}" isimli ve "${category || 'Genel'}" kategorisindeki bir ürün için çocuklara hitap eden, eğlenceli ve iştah açıcı bir menü açıklaması oluştur. Açıklama en fazla 30 kelime olsun ve ürünün temel özelliklerini vurgulasın. Örneğin, bir "Çikolatalı Pasta" için "Bol çikolatalı, yumuşacık ve çok lezzetli bir dilim mutluluk!" gibi. Cevabını sadece oluşturduğun açıklama metni olarak ver, başka bir şey ekleme.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
        });
        
        const text = response.text;
        if (!text) {
            throw new Error("AI'dan boş bir yanıt alındı.");
        }
        return text.trim();
    } catch (error) {
        console.error("Error generating product description with Gemini:", error);
        if (error instanceof Error && error.message.includes("API key not valid")) {
             throw new Error("API anahtarı geçersiz. Lütfen yönetici ile iletişime geçin.");
        }
        throw new Error("AI açıklaması oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  },
};
// Check if this file ends with a blank line
// If not, add one
