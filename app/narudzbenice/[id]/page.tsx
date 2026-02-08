"use client";
import { useEffect, useState } from "react";
import { useRouter, use } from "next/navigation";
import Button from "@/app/components/Button";
import { ApiService } from "@/lib/api";

interface OrderDetail {
  id_narudzbenica: number;
  id_dobavljac: number;
  dobavljac_naziv: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED';
  ukupna_cena: number;
  napomene?: string;
  datum_kreiranja: string;
  datum_slanja?: string;
  datum_prijema?: string;
  stavke: Array<{
    id_stavka: number;
    id_proizvod: number;
    proizvod_naziv: string;
    kolicina: number;
    cena_po_komadu: number;
  }>;
}

export default function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const data = await ApiService.getOrder(parseInt(id));
        setOrder(data);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, router]);

  const handleStatusChange = async (newStatus: 'DRAFT' | 'SENT' | 'RECEIVED') => {
    if (!order) return;
    setUpdating(true);
    try {
      await ApiService.updateOrderStatus(order.id_narudzbenica, newStatus);
      const updated = await ApiService.getOrder(order.id_narudzbenica);
      setOrder(updated);
    } catch (err: any) {
      alert("Greška: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Obrisati narudžbenicu?")) {
      try {
        await ApiService.deleteOrder(order!.id_narudzbenica);
        router.push("/narudzbenice");
      } catch (err: any) {
        alert("Greška: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;
  if (error) return <div className="p-8 text-red-600">Greška: {error}</div>;
  if (!order) return <div className="p-8">Narudžbenica nije pronađena</div>;

  const totalItems = order.stavke.reduce((sum, item) => sum + item.kolicina, 0);

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Narudžbenica #{order.id_narudzbenica}</h1>
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          ← Nazad
        </button>
      </div>

      {/* Header Info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Dobavljač</p>
          <p className="text-lg font-bold">{order.dobavljac_naziv}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-lg font-bold">{order.status}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Kreirano</p>
          <p className="text-lg font-bold">{new Date(order.datum_kreiranja).toLocaleDateString('sr-RS')}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Ukupna cena</p>
          <p className="text-lg font-bold">{order.ukupna_cena.toFixed(2)} дин.</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Proizvod</th>
              <th className="px-4 py-3 text-right font-semibold">Količina</th>
              <th className="px-4 py-3 text-right font-semibold">Cena/kom</th>
              <th className="px-4 py-3 text-right font-semibold">Ukupno</th>
            </tr>
          </thead>
          <tbody>
            {order.stavke.map((item) => (
              <tr key={item.id_stavka} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{item.proizvod_naziv}</td>
                <td className="px-4 py-3 text-right">{item.kolicina}</td>
                <td className="px-4 py-3 text-right">{item.cena_po_komadu.toFixed(2)} дин.</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {(item.kolicina * item.cena_po_komadu).toFixed(2)} дин.
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {order.napomene && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
          <p className="text-sm font-semibold text-gray-700">Napomene:</p>
          <p className="text-gray-700">{order.napomene}</p>
        </div>
      )}

      {/* Status Transitions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h2 className="text-lg font-bold mb-4">Prosledi status</h2>
        <div className="flex flex-wrap gap-2">
          {order.status !== 'SENT' && (
            <Button
              label={updating ? "Ažuriranje..." : "Označi kao poslano"}
              onClick={() => handleStatusChange('SENT')}
              disabled={updating}
              variant="primary"
            />
          )}
          {order.status !== 'RECEIVED' && (
            <Button
              label={updating ? "Ažuriranje..." : "Označi kao primljeno"}
              onClick={() => handleStatusChange('RECEIVED')}
              disabled={updating}
              variant="success"
            />
          )}
          {order.status === 'DRAFT' && (
            <Button
              label="Obriši"
              onClick={handleDelete}
              variant="danger"
              disabled={updating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
