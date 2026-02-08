// API Service for all endpoints
interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';

export class ApiService {
  static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  static async login(email: string, lozinka: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, lozinka }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  }

  static async register(username: string, email: string, lozinka: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, lozinka }),
    });
  }

  static async getCurrentUser() {
    return this.request('/auth/me');
  }

  static logout() {
    localStorage.removeItem('token');
  }

  // Products
  static async getProducts() {
    return this.request('/proizvodi');
  }

  static async getProduct(id: number) {
    return this.request(`/proizvodi/${id}`);
  }

  static async createProduct(product: any) {
    return this.request('/proizvodi', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  static async updateProduct(id: number, product: any) {
    return this.request(`/proizvodi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  static async deleteProduct(id: number) {
    return this.request(`/proizvodi/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  static async getCategories() {
    return this.request('/kategorije');
  }

  static async createCategory(category: any) {
    return this.request('/kategorije', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  // Suppliers
  static async getSuppliers() {
    return this.request('/dobavljaci');
  }

  static async createSupplier(supplier: any) {
    return this.request('/dobavljaci', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  }

  // Orders
  static async getOrders(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/narudzbenice${query}`);
  }

  static async getOrder(id: number) {
    return this.request(`/narudzbenice/${id}`);
  }

  static async createOrder(order: any) {
    return this.request('/narudzbenice', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  static async updateOrderStatus(id: number, status: string) {
    return this.request(`/narudzbenice/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async deleteOrder(id: number) {
    return this.request(`/narudzbenice/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  static async getDashboard() {
    return this.request('/dashboard');
  }
}
