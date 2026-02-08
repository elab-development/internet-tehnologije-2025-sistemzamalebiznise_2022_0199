"use client";
import { useEffect, useState } from "react";
import { useRouter, use } from "next/navigation";
import Input from "@/app/components/Input";
import Button from "@/app/components/Button";
import { ApiService } from "@/lib/api";

interface Product {
  id_proizvod: number;
  naziv: string;
  opis?: string;
  sifra?: string;
  cena_nabavke: number;
  cena_prodaje: number;
  kolicina_na_lageru: number;
  minimalna_kolicina: number;
  kategorija?: string;
  dobavljac?: string;
}

export default function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<Partial<Product>>({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await ApiService.getProduct(parseInt(id));
        setProduct(data);
        setForm(data);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        cena_nabavke: parseFloat(form.cena_nabavke as any),
        cena_prodaje: parseFloat(form.cena_prodaje as any),
        kolicina_na_lageru: parseInt(form.kolicina_na_lageru as any),
        minimalna_kolicina: parseInt(form.minimalna_kolicina as any),
      };
      await ApiService.updateProduct(product!.id_proizvod, payload);
      const updated = await ApiService.getProduct(product!.id_proizvod);
      setProduct(updated);
      setForm(updated);
      setEditing(false);
    } catch (err: any) {
      alert("Greška: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Obrisati proizvod?")) {
      try {
        await ApiService.deleteProduct(product!.id_proizvod);
        router.push("/proizvodi");
      } catch (err: any) {
        alert("Greška: " + err.message);
      }
    }
  };

  const stockStatus = (product?.kolicina_na_lageru || 0) < (product?.minimalna_kolicina || 0);

  if (loading) return <div className="p-8">Učitavanje...</div>;
  if (error) return <div className="p-8 text-red-600">Greška: {error}</div>;
  if (!product) return <div className="p-8">Proizvod nije pronađen</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{product.naziv}</h1>
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          ← Nazad
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {!editing ? (
        <>
          {/* Display Mode */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Šifra</p>
              <p className="text-lg font-bold">{product.sifra || '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Kategorija</p>
              <p className="text-lg font-bold">{product.kategorija || '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Cena nabavke</p>
              <p className="text-lg font-bold">{product.cena_nabavke.toFixed(2)} дин.</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Cena prodaje</p>
              <p className="text-lg font-bold">{product.cena_prodaje.toFixed(2)} дин.</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${stockStatus ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
              <p className="text-sm text-gray-600">Količina na lageru</p>
              <p className={`text-lg font-bold ${stockStatus ? 'text-red-600' : 'text-green-600'}`}>
                {product.kolicina_na_lageru}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Minimalna količina</p>
              <p className="text-lg font-bold">{product.minimalna_kolicina}</p>
            </div>
          </div>

          {product.opis && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <p className="text-sm text-gray-600 mb-2">Opis:</p>
              <p className="text-gray-700">{product.opis}</p>
            </div>
          )}

          {product.dobavljac && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <p className="text-sm text-gray-600">Dobavljač:</p>
              <p className="text-lg font-bold">{product.dobavljac}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button label="Uredi" onClick={() => setEditing(true)} />
            <Button label="Obriši" onClick={handleDelete} variant="danger" />
          </div>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <Input
              label="Naziv"
              type="text"
              placeholder="Naziv..."
              name="naziv"
              value={form.naziv || ""}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Opis</label>
              <textarea
                name="opis"
                placeholder="Opis..."
                value={form.opis || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
                rows={3}
              />
            </div>

            <Input
              label="Šifra"
              type="text"
              placeholder="Šifra..."
              name="sifra"
              value={form.sifra || ""}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cena nabavke"
                type="number"
                placeholder="0.00"
                name="cena_nabavke"
                value={form.cena_nabavke || ""}
                onChange={handleChange}
                step="0.01"
              />
              <Input
                label="Cena prodaje"
                type="number"
                placeholder="0.00"
                name="cena_prodaje"
                value={form.cena_prodaje || ""}
                onChange={handleChange}
                step="0.01"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Količina na lageru"
                type="number"
                placeholder="0"
                name="kolicina_na_lageru"
                value={form.kolicina_na_lageru || ""}
                onChange={handleChange}
              />
              <Input
                label="Minimalna količina"
                type="number"
                placeholder="0"
                name="minimalna_kolicina"
                value={form.minimalna_kolicina || ""}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button label={submitting ? "Čuvanje..." : "Sačuvaj"} type="submit" disabled={submitting} />
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition"
              >
                Otkaži
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
