"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/Input";
import Button from "@/app/components/Button";
import { ApiService } from "@/lib/api";

interface Product {
  id_proizvod: number;
  naziv: string;
  cena_nabavke: number;
}

interface OrderItem {
  id_proizvod: number;
  proizvod_naziv: string;
  kolicina: number;
  cena_po_komadu: number;
}

export default function NovaNarudzbenicaPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [id_dobavljac, setIdDobavljac] = useState("");
  const [napomene, setNapomene] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemPrice, setItemPrice] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sups, prods] = await Promise.all([
          ApiService.getSuppliers(),
          ApiService.getProducts(),
        ]);
        setSuppliers(Array.isArray(sups) ? sups : []);
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAddItem = () => {
    if (!selectedProduct || !itemQuantity || !itemPrice) {
      alert("Molim popuni sve podatke");
      return;
    }

    const product = products.find(p => p.id_proizvod === parseInt(selectedProduct));
    if (!product) return;

    const item: OrderItem = {
      id_proizvod: product.id_proizvod,
      proizvod_naziv: product.naziv,
      kolicina: parseInt(itemQuantity),
      cena_po_komadu: parseFloat(itemPrice),
    };

    setItems([...items, item]);
    setSelectedProduct("");
    setItemQuantity("1");
    setItemPrice("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.kolicina * item.cena_po_komadu, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_dobavljac || items.length === 0) {
      setError("Odaberi dobavljača i dodaj stavke");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const payload = {
        id_dobavljac: parseInt(id_dobavljac),
        stavke: items,
        ukupna_cena: getTotalPrice(),
        napomene: napomene || null,
      };

      await ApiService.createOrder(payload);
      router.push("/narudzbenice");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Nova narudžbenica</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dobavljač *</label>
          <select
            value={id_dobavljac}
            onChange={(e) => setIdDobavljac(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
            required
          >
            <option value="">-- Odaberi dobavljača --</option>
            {suppliers.map((sup: any) => (
              <option key={sup.id_dobavljac} value={sup.id_dobavljac}>
                {sup.naziv}
              </option>
            ))}
          </select>
        </div>

        {/* Add Items */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4">Dodaj stavke</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Proizvod</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="">Odaberi...</option>
                {products.map(p => (
                  <option key={p.id_proizvod} value={p.id_proizvod}>
                    {p.naziv}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Količina</label>
              <input
                type="number"
                min="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Cena/kom</label>
              <input
                type="number"
                step="0.01"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
              >
                Dodaj
              </button>
            </div>
          </div>

          {/* Items List */}
          {items.length > 0 && (
            <table className="w-full text-sm border-t">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">Proizvod</th>
                  <th className="px-3 py-2 text-right">Količina</th>
                  <th className="px-3 py-2 text-right">Cena</th>
                  <th className="px-3 py-2 text-right">Ukupno</th>
                  <th className="px-3 py-2 text-center">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{item.proizvod_naziv}</td>
                    <td className="px-3 py-2 text-right">{item.kolicina}</td>
                    <td className="px-3 py-2 text-right">{item.cena_po_komadu.toFixed(2)} дин.</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {(item.kolicina * item.cena_po_komadu).toFixed(2)} дин.
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Obriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex justify-between items-center">
            <span className="font-bold">Ukupna cena:</span>
            <span className="text-2xl font-bold text-blue-600">{getTotalPrice().toFixed(2)} дин.</span>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Napomene</label>
          <textarea
            value={napomene}
            onChange={(e) => setNapomene(e.target.value)}
            placeholder="Dodatne napomene..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-black outline-none"
            rows={3}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button label={submitting ? "Kreiranje..." : "Kreiraj narudžbenicu"} type="submit" disabled={submitting} />
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
