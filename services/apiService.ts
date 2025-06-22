import { AuthenticatedSession, ThemeSettings, User, Product, Order, TableConfiguration, LogEntry, LogActionType, UserRole } from '../types';

const API_URL: string = ((import.meta as any).env?.VITE_BACKEND_API_URL as string) || '';

let authToken: string | null = null;

async function fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const apiService = {
  setAuthToken(token: string | null) {
    authToken = token;
  },

  async loginUser(userIdOrRole: string, password: string): Promise<AuthenticatedSession> {
    const session = await fetchJson<AuthenticatedSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ userIdOrRole, password }),
    });
    authToken = session.token;
    return session;
  },

  async logoutUser(): Promise<void> {
    await fetchJson<void>('/sessions', { method: 'DELETE' });
    authToken = null;
  },

  async getCurrentSession(): Promise<AuthenticatedSession> {
    return fetchJson<AuthenticatedSession>('/sessions/current');
  },

  async getThemeSettings(): Promise<ThemeSettings> {
    return fetchJson<ThemeSettings>('/theme_settings');
  },

  async updateThemeSettings(settings: ThemeSettings): Promise<ThemeSettings> {
    return fetchJson<ThemeSettings>('/theme_settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getUsers(): Promise<User[]> {
    return fetchJson<User[]>('/users');
  },

  async getUserById(userId: string): Promise<User> {
    return fetchJson<User>(`/users/${userId}`);
  },

  async addUser(userData: Partial<User>): Promise<User> {
    return fetchJson<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return fetchJson<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteUser(userId: string): Promise<void> {
    return fetchJson<void>(`/users/${userId}`, { method: 'DELETE' });
  },

  async getProducts(): Promise<Product[]> {
    return fetchJson<Product[]>('/products');
  },

  async getProductById(productId: string): Promise<Product> {
    return fetchJson<Product>(`/products/${productId}`);
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    return fetchJson<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
    return fetchJson<Product>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteProduct(productId: string): Promise<void> {
    return fetchJson<void>(`/products/${productId}`, { method: 'DELETE' });
  },

  async getOrders(): Promise<Order[]> {
    return fetchJson<Order[]>('/orders');
  },

  async getOrderById(orderId: string): Promise<Order> {
    return fetchJson<Order>(`/orders/${orderId}`);
  },

  async addOrder(orderData: any): Promise<Order> {
    return fetchJson<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return fetchJson<Order>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getTableConfiguration(): Promise<TableConfiguration> {
    return fetchJson<TableConfiguration>('/table_configuration');
  },

  async updateTableConfiguration(config: TableConfiguration): Promise<TableConfiguration> {
    return fetchJson<TableConfiguration>('/table_configuration', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async getLogs(): Promise<LogEntry[]> {
    return fetchJson<LogEntry[]>('/logs');
  },

  async getLogById(id: string): Promise<LogEntry> {
    return fetchJson<LogEntry>(`/logs/${id}`);
  },

  async addLogEntry(action: LogActionType, details: string, targetId?: string, userId?: string, userFullName?: string, userRole?: UserRole): Promise<LogEntry> {
    return fetchJson<LogEntry>('/logs', {
      method: 'POST',
      body: JSON.stringify({ action, details, targetId, userId, userFullName, userRole }),
    });
  },

  async initializeDefaultUsers(): Promise<void> {
    await fetchJson<void>('/initialize_default_users', { method: 'POST' });
  },

  async seedInitialProductData(): Promise<void> {
    await fetchJson<void>('/seed_initial_product_data', { method: 'POST' });
  },

  // Export and import all data via backend
  async exportAllData(): Promise<string> {
    return fetchJson<string>('/exportAllData');
  },

  async importAllData(jsonData: string): Promise<void> {
    return fetchJson<void>('/importAllData', {
      method: 'POST',
      body: jsonData
    });
  },

  // Gemini API key persistence
  async getGeminiApiKey(): Promise<string> {
    return fetchJson<string>('/gemini_api_key');
  },

  async updateGeminiApiKey(key: string): Promise<void> {
    return fetchJson<void>('/gemini_api_key', {
      method: 'PUT',
      body: JSON.stringify({ key })
    });
  },

  // Log dates and filtered logs
  async getAvailableLogDates(): Promise<string[]> {
    return fetchJson<string[]>('/logs/dates');
  },

  async getLogsByDate(date: string): Promise<LogEntry[]> {
    return fetchJson<LogEntry[]>(`/logs?date=${encodeURIComponent(date)}`);
  },
};
