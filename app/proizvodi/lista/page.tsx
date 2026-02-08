"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiService } from "@/lib/api";
import Link from "next/link";

type Product = {
  id_proizvod: number;
  naziv: string;
  sifra: string;
  cena_nabavke: number;
  cena_prodaje: number;
  kolicina_na_lageru: number;
  minimalna_kolicina: number;
  kategorija: string;
  dobavljac: string;
};

export default function ProizvodiListPage() {
  const [proizvodi, setProizvodi] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await ApiService.getProducts();
        if (Array.isArray(data)) {
          setProizvodi(data);
        } else {
          setProizvodi([]);
        }
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("401")) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [router]);

  const handleDelete = async (id: number) => {
    if (confirm("Siguran/a si da želiš obrisati ovaj proizvod?")) {
      try {
        await ApiService.deleteProduct(id);
        setProizvodi(proizvodi.filter(p => p.id_proizvod !== id));
      } catch (err: any) {
        alert("Greška pri brisanju: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-8">Učitavanje proizvoda...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proizvodi</h1>
        <Link href="/proizvodi/novo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Novi proizvod
        </Link>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Naziv</th>
              <th className="px-4 py-3 text-left font-semibold">Šifra</th>
              <th className="px-4 py-3 text-right font-semibold">Lager</th>
              <th className="px-4 py-3 text-right font-semibold">Nabavka</th>
              <th className="px-4 py-3 text-right font-semibold">Prodaja</th>
              <th className="px-4 py-3 text-center font-semibold">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {proizvodi.map((p) => (
              <tr key={p.id_proizvod} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{p.naziv}</div>
                  {p.kategorija && <div className="text-xs text-gray-500">{p.kategorija}</div>}
                </td>
                <td className="px-4 py-3 text-xs">{p.sifra}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${p.kolicina_na_lageru < p.minimalna_kolicina ? 'text-red-600' : 'text-green-600'}`}>
                    {p.kolicina_na_lageru}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{p.cena_nabavke.toFixed(2)} дин.</td>
                <td className="px-4 py-3 text-right font-medium">{p.cena_prodaje.toFixed(2)} дин.</td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/proizvodi/${p.id_proizvod}`} className="text-blue-600 hover:underline text-xs mr-2">
                    Pregled
                  </Link>
                  <button 
                    onClick={() => handleDelete(p.id_proizvod)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {proizvodi.length === 0 && (
          <div className="p-8 text-center text-gray-500">Nema proizvoda</div>
        )}
      </div>
    </div>
  );
}
