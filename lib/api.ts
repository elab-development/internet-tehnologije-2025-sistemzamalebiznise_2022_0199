const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

export class ApiService {
  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
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
  static async getDashboard() {
  const res = await fetch(`/api/dashboard`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || "Greška pri učitavanju dashboard-a");
  }

  return data;
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

  static getOrder(id: number) {
    return this.request(`/narudzbenice/${id}`);
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

  static deleteOrder(id: number) {
    return this.request(`/narudzbenice/${id}`, { method: "DELETE" });
  }
}
