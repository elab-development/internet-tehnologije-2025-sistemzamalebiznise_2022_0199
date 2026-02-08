const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

export class ApiService {
  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Ako proslediš dodatne headere u options, ubaci ih
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    // (opciono) Bearer token iz localStorage – ako ga koristiš na frontu
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      // bitno za cookie auth (ako se oslanjaš na cookie "token")
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || err.message || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  static login(email: string, lozinka: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, lozinka }),
    });
  }

  static register(data: {
    ime: string;
    prezime: string;
    email: string;
    lozinka: string;
    uloga: "VLASNIK" | "RADNIK" | "DOSTAVLJAC";
  }) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static getCurrentUser() {
    return this.request("/auth/me");
  }

  static logout() {
    // ako koristiš cookie logout endpoint
    return this.request("/auth/logout", { method: "POST" });
  }

  // Proizvodi
  static getProducts() {
    return this.request("/proizvodi");
  }
  static createProduct(product: any) {
    return this.request("/proizvodi", { method: "POST", body: JSON.stringify(product) });
  }
  static deleteProduct(id: number) {
    return this.request(`/proizvodi/${id}`, { method: "DELETE" });
  }

  // Dobavljači
  static getSuppliers() {
    return this.request("/dobavljaci");
  }

  // Narudžbenice
  static getOrders(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/narudzbenice${q}`);
  }

  static createOrder(order: any) {
    return this.request("/narudzbenice", { method: "POST", body: JSON.stringify(order) });
  }

  static updateOrderStatus(id: number, status: string) {
    return this.request(`/narudzbenice/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }
}
