"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/Input";
import Button from "@/app/components/Button";
import { ApiService } from "@/lib/api";

export default function NoviProizvodPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    naziv: "",
    opis: "",
    sifra: "",
    cena_nabavke: "",
    cena_prodaje: "",
    kolicina_na_lageru: "0",
    minimalna_kolicina: "0",
    id_kategorija: "",
    id_dobavljac: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, sups] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getSuppliers(),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setSuppliers(Array.isArray(sups) ? sups : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        cena_nabavke: parseFloat(form.cena_nabavke),
        cena_prodaje: parseFloat(form.cena_prodaje),
        kolicina_na_lageru: parseInt(form.kolicina_na_lageru),
        minimalna_kolicina: parseInt(form.minimalna_kolicina),
        id_kategorija: form.id_kategorija ? parseInt(form.id_kategorija) : null,
        id_dobavljac: form.id_dobavljac ? parseInt(form.id_dobavljac) : null,
      };

      await ApiService.createProduct(payload);
      router.push("/proizvodi");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Novi proizvod</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <Input
          label="Naziv proizvoda *"
          type="text"
          placeholder="Npr. Laptop HP"
          value={form.naziv}
          onChange={handleChange}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Opis</label>
          <textarea
            name="opis"
            placeholder="Detaljan opis proizvoda"
            value={form.opis}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
            rows={3}
          />
        </div>

        <Input
          label="Šifra"
          type="text"
          placeholder="Npr. LAP-001"
          value={form.sifra}
          onChange={handleChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cena nabavke (дин.) *"
            type="number"
            placeholder="0.00"
            value={form.cena_nabavke}
            onChange={handleChange}
          />
          <Input
            label="Cena prodaje (дин.) *"
            type="number"
            placeholder="0.00"
            value={form.cena_prodaje}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Količina na lageru"
            type="number"
            placeholder="0"
            value={form.kolicina_na_lageru}
            onChange={handleChange}
          />
          <Input
            label="Minimalna količina"
            type="number"
            placeholder="0"
            value={form.minimalna_kolicina}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Kategorija</label>
          <select
            name="id_kategorija"
            value={form.id_kategorija}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
          >
            <option value="">-- Odaberi kategoriju --</option>
            {categories.map((cat: any) => (
              <option key={cat.id_kategorija} value={cat.id_kategorija}>
                {cat.naziv}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Dobavljač</label>
          <select
            name="id_dobavljac"
            value={form.id_dobavljac}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
          >
            <option value="">-- Odaberi dobavljača --</option>
            {suppliers.map((sup: any) => (
              <option key={sup.id_dobavljac} value={sup.id_dobavljac}>
                {sup.naziv}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 pt-4">
          <Button label={submitting ? "Čuvanje..." : "Sačuvaj proizvod"} type="submit" disabled={submitting} />
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
          >
            Otkaži
          </button>
        </div>
      </form>
    </div>
  );
}