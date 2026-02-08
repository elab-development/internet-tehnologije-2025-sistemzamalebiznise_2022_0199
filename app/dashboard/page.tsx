"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import Link from "next/link";

interface DashboardData {
  lowStockAlerts: any[];
  inventoryValue: any;
  orderStats: any;
  productStats: any;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await ApiService.getDashboard();
        setData(dashboardData);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  if (loading) return <div className="p-8">Učitavanje...</div>;
  if (error) return <div className="p-8 text-red-600">Greška: {error}</div>;
  if (!data) return <div className="p-8">Nema podataka</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Kontrolna tabla</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <p className="text-gray-600 text-sm">Ukupno proizvoda</p>
          <p className="text-3xl font-bold text-blue-600">{data.productStats?.total_products || 0}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <p className="text-gray-600 text-sm">Primljenih narudžbina</p>
          <p className="text-3xl font-bold text-green-600">{data.orderStats?.received_orders || 0}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <p className="text-gray-600 text-sm">Poslanih narudžbina</p>
          <p className="text-3xl font-bold text-yellow-600">{data.orderStats?.sent_orders || 0}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <p className="text-gray-600 text-sm">Vrednost lagera (nabavka)</p>
          <p className="text-2xl font-bold text-purple-600">
            {(data.inventoryValue?.ukupna_vrednost_nabavke || 0).toFixed(2)} дин.
          </p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Nisko stanje lagera</h2>
          <Link href="/proizvodi" className="text-blue-600 hover:underline text-sm">
            Upravljaj proizvodima →
          </Link>
        </div>

        {data.lowStockAlerts.length === 0 ? (
          <p className="text-gray-600">Svi proizvodi su sa dobrim nivoom lagera ✓</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2">Proizvod</th>
                  <th className="px-4 py-2">Šifra</th>
                  <th className="px-4 py-2">Trenutno</th>
                  <th className="px-4 py-2">Minimum</th>
                  <th className="px-4 py-2">Nedostaje</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockAlerts.map((product) => (
                  <tr key={product.id_proizvod} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{product.naziv}</td>
                    <td className="px-4 py-2">{product.sifra}</td>
                    <td className="px-4 py-2">
                      <span className="text-red-600 font-semibold">{product.kolicina_na_lageru}</span>
                    </td>
                    <td className="px-4 py-2">{product.minimalna_kolicina}</td>
                    <td className="px-4 py-2">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                        +{product.nedostaje}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/proizvodi/novo" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition">
          <h3 className="font-bold mb-2">+ Dodaj proizvod</h3>
          <p className="text-sm opacity-90">Unesi novi proizvod u bazu</p>
        </Link>
        <Link href="/narudzbenice/nova" className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition">
          <h3 className="font-bold mb-2">+ Nova narudžbenica</h3>
          <p className="text-sm opacity-90">Kreiraj novu narudžbenicu</p>
        </Link>
        <Link href="/dobavljaci" className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition">
          <h3 className="font-bold mb-2">Dobavljači</h3>
          <p className="text-sm opacity-90">Upravljaj dobavljačima</p>
        </Link>
      </div>
    </div>
  );
}
