"use client";
import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

type Proizvod = {
  id_proizvod: number;
  naziv: string;
  sifra: string;
  cena: number;
  kolicina_na_lageru: number;
};

export default function ProizvodiPage() {
  const [proizvodi, setProizvodi] = useState<Proizvod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/proizvodi")
      .then((res) => res.json())
      .then((data) => {
        
        if (Array.isArray(data)) {
          setProizvodi(data);
        } else {
          console.error("API nije vratio niz:", data);
          setProizvodi([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Greška pri učitavanju:", err);
        setProizvodi([]); 
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-10 text-black">Učitavanje proizvoda...</p>;

  return (
    <main className="p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Katalog Proizvoda</h1>
        <a
          href="/proizvodi/novo"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Dodaj novi proizvod
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proizvodi.map((p) => (
          <ProductCard 
            key={p.id_proizvod} 
            naziv={p.naziv} 
            cena={p.cena} 
            sifra={p.sifra} 
          />
        ))}
      </div>
      
      {proizvodi.length === 0 && (
        <p className="text-gray-500 mt-10 text-center">Trenutno nema proizvoda u bazi.</p>
      )}
    </main>
  );
}