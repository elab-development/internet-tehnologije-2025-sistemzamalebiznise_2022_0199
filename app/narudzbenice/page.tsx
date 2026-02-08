"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiService } from "@/lib/api";

interface Order {
  id_narudzbenica: number;
  id_dobavljac: number;
  dobavljac_naziv: string;
  status: 'DRAFT' | 'SENT' | 'RECEIVED';
  ukupna_cena: number;
  datum_kreiranja: string;
  datum_slanja?: string;
  datum_prijema?: string;
}

export default function NarudzbenicePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'SENT' | 'RECEIVED'>('ALL');
  const router = useRouter();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const status = filter === 'ALL' ? undefined : filter;
        const data = await ApiService.getOrders(status);
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    loadOrders();
  }, [filter, router]);

  const getStatusBadge = (status: string) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SENT': 'bg-blue-100 text-blue-800',
      'RECEIVED': 'bg-green-100 text-green-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const handleDelete = async (id: number) => {
    if (confirm("Obrisati narudžbenicu?")) {
      try {
        await ApiService.deleteOrder(id);
        setOrders(orders.filter(o => o.id_narudzbenica !== id));
      } catch (err: any) {
        alert("Greška: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-8">Učitavanje...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Narudžbenice</h1>
        <Link href="/narudzbenice/nova" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          + Nova narudžbenica
        </Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="flex gap-2 mb-6">
        {(['ALL', 'DRAFT', 'SENT', 'RECEIVED'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded transition ${
              filter === status
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">ID</th>
              <th className="px-4 py-3 text-left font-semibold">Dobavljač</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Cena</th>
              <th className="px-4 py-3 text-left font-semibold">Kreirano</th>
              <th className="px-4 py-3 text-center font-semibold">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id_narudzbenica} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{order.id_narudzbenica}</td>
                <td className="px-4 py-3">{order.dobavljac_naziv}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{order.ukupna_cena.toFixed(2)} дин.</td>
                <td className="px-4 py-3 text-xs">{new Date(order.datum_kreiranja).toLocaleDateString('sr-RS')}</td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/narudzbenice/${order.id_narudzbenica}`} className="text-blue-600 hover:underline text-xs mr-2">
                    Pregled
                  </Link>
                  {order.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDelete(order.id_narudzbenica)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Obriši
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="p-8 text-center text-gray-500">Nema narudžbenica</div>
        )}
      </div>
    </div>
  );
}
