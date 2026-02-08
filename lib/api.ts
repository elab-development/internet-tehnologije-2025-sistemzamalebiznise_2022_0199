// ApiService.ts

// Očekuje NEXT_PUBLIC_API_BASE u formi: https://your-backend.com/api
// Lokalno fallback: http://localhost:3000/api
const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000/api";

// Normalizuj: ukloni trailing slash da URL ne bude dupliran
const API_BASE = RAW_BASE.endsWith("/") ? RAW_BASE.slice(0, -1) : RAW_BASE;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // endpoint obavezno počinje sa "/"
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${path}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Spoji custom headers ako postoje
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    const res = await fetch(url, {
      ...options,
      headers,
      // KLJUČNO: cookie auth (HTTP-only token)
      credentials: "include",
    });

    // Pokušaj da parsiraš JSON i kad je error
    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      // backend vraća { error: "..." }
      const msg =
        (data as any)?.error ||
        (data as any)?.message ||
        `HTTP ${res.status} ${res.statusText}`;
      throw new Error(msg);
    }

    return data as T;
  }

  // --------------------
  // AUTH
  // --------------------
  static login(email: string, lozinka: string) {
    return this.request<{ message?: string; user?: any }>("/auth/login", {
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
    return this.request<{ message?: string; user?: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static getCurrentUser() {
    return this.request<{ user: any }>("/auth/me", { method: "GET" });
  }

  static logout() {
    return this.request<{ message?: string }>("/auth/logout", {
      method: "POST",
    });
  }

  // --------------------
  // DASHBOARD
  // --------------------
  static getDashboard() {
    return this.request<any>("/dashboard", { method: "GET" });
  }

  // --------------------
  // PROIZVODI
  // --------------------
  static getProducts() {
    return this.request<any[]>("/proizvodi", { method: "GET" });
  }

  static getProductById(id: number) {
    return this.request<any>(`/proizvodi/${id}`, { method: "GET" });
  }

  static createProduct(product: {
    naziv: string;
    sifra: string;
    cena: number;
    kolicina_na_lageru: number;
    jedinica_mere: string;
  }) {
    return this.request<any>("/proizvodi", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  static updateProduct(id: number, product: Partial<{
    naziv: string;
    sifra: string;
    cena: number;
    kolicina_na_lageru: number;
    jedinica_mere: string;
  }>) {
    return this.request<any>(`/proizvodi/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  static deleteProduct(id: number) {
    return this.request<{ message?: string }>(`/proizvodi/${id}`, {
      method: "DELETE",
    });
  }

  // --------------------
  // DOBAVLJAČI
  // --------------------
  static getSuppliers() {
    return this.request<any[]>("/dobavljaci", { method: "GET" });
  }

  static createSupplier(data: {
    naziv_firme: string;
    telefon?: string | null;
    email?: string | null;
    adresa?: string | null;
  }) {
    return this.request<any>("/dobavljaci", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --------------------
  // NARUDŽBENICE
  // --------------------
  static getOrders(status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<any[]>(`/narudzbenice${q}`, { method: "GET" });
  }

  static getOrderById(id: number) {
    return this.request<any>(`/narudzbenice/${id}`, { method: "GET" });
  }

  static createOrder(order: {
    tip: "NABAVKA" | "PRODAJA";
    dobavljac_id?: number | null;
    napomena?: string | null;
    stavke: { proizvod_id: number; kolicina: number }[];
  }) {
    return this.request<any>("/narudzbenice", {
      method: "POST",
      body: JSON.stringify(order),
    });
  }

  static updateOrder(id: number, payload: {
    status?: string;
    dostavljac_id?: number | null;
    napomena?: string | null;
  }) {
    return this.request<any>(`/narudzbenice/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  static deleteOrder(id: number) {
    return this.request<{ message?: string }>(`/narudzbenice/${id}`, {
      method: "DELETE",
    });
  }

  // --------------------
  // KORISNICI (samo vlasnik)
  // --------------------
  static getUsers() {
    return this.request<any[]>("/korisnici", { method: "GET" });
  }

  static updateUserRole(id: number, uloga: "VLASNIK" | "RADNIK" | "DOSTAVLJAC") {
    return this.request<any>(`/korisnici/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ uloga }),
    });
  }
}
