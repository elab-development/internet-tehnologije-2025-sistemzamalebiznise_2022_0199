"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../components/Input";
import Button from "../components/Button";
import { ApiService } from "@/lib/api";

interface Supplier {
  id_dobavljac: number;
  naziv_firme: string;
  email?: string | null;
  telefon?: string | null;
  adresa?: string | null;
  // datum_kreiranja nije u tvojoj šemi; ako backend ipak vraća, ostaje opciono
  datum_kreiranja?: string;
}

export default function DobavljaciPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI form (namerno držimo "naziv" radi UX-a)
  const [form, setForm] = useState({
    naziv: "",
    email: "",
    telefon: "",
    adresa: "",
  });

  const router = useRouter();

  const loadSuppliers = async () => {
    setError("");
    try {
      const data = await ApiService.getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err?.message || "Greška pri učitavanju dobavljača";
      setError(msg);
      if (msg.includes("401")) router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.naziv.trim()) {
      setError("Naziv dobavljača je obavezan");
      return;
    }

    setSubmitting(true);
    try {
      // MAPIRANJE NA BACKEND POLJA (naziv_firme!)
      await ApiService.createSupplier({
        naziv_firme: form.naziv.trim(),
        email: form.email.trim() || undefined,
        telefon: form.telefon.trim() || undefined,
        adresa: form.adresa.trim() || undefined,
      });

      await loadSuppliers();

      setForm({ naziv: "", email: "", telefon: "", adresa: "" });
      setShowForm(false);
    } catch (err: any) {
      setError(err?.message || "Greška pri čuvanju dobavljača");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dobavljači</h1>
        <button
          onClick={() => {
            setError("");
            setShowForm((s) => !s);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Otkaži" : "+ Novi dobavljač"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-xl font-bold mb-4">Dodaj novog dobavljača</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Naziv dobavljača *"
              type="text"
              placeholder="Naziv..."
              value={form.naziv}
              onChange={handleChange}
              name="naziv"
            />

            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handleChange}
              name="email"
            />

            <Input
              label="Telefon"
              type="text"
              placeholder="+381..."
              value={form.telefon}
              onChange={handleChange}
              name="telefon"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Adresa
              </label>
              <textarea
                name="adresa"
                placeholder="Adresa dobavljača..."
                value={form.adresa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <Button
                label={submitting ? "Čuvanje..." : "Sačuvaj dobavljača"}
                type="submit"
                disabled={submitting}
              />
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id_dobavljac}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
          >
            <h3 className="text-lg font-bold mb-2">
              {supplier.naziv_firme}
            </h3>

            {supplier.email && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Email:</span> {supplier.email}
              </p>
            )}

            {supplier.telefon && (
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-semibold">Telefon:</span>{" "}
                {supplier.telefon}
              </p>
            )}

            {supplier.adresa && (
              <p className="text-sm text-gray-600 mb-3">
                <span className="font-semibold">Adresa:</span> {supplier.adresa}
              </p>
            )}

            {supplier.datum_kreiranja && (
              <p className="text-xs text-gray-400">
                Kreirano:{" "}
                {new Date(supplier.datum_kreiranja).toLocaleDateString("sr-RS")}
              </p>
            )}
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="p-8 text-center text-gray-500">Nema dobavljača</div>
      )}
    </div>
  );
}
