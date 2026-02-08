"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      router.push('/dashboard');
    }
  }, [router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 to-blue-900 text-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl font-bold">📦 Upravljač lagera</h1>
        <p className="text-xl text-blue-100">
          Kompletan sistem za upravljanje izveštajima i lagera za male biznise
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto my-8">
          <div className="bg-blue-800 p-4 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-bold mb-2">Kontrolna tabla</h3>
            <p className="text-sm text-blue-100">Pregled sve statistike i upozorenja</p>
          </div>
          <div className="bg-blue-800 p-4 rounded-lg">
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-bold mb-2">Upravljanje lagera</h3>
            <p className="text-sm text-blue-100">Prati količine i vrednost proizvoda</p>
          </div>
          <div className="bg-blue-800 p-4 rounded-lg">
            <div className="text-2xl mb-2">🚚</div>
            <h3 className="font-bold mb-2">Narudžbenice</h3>
            <p className="text-sm text-blue-100">Upravljaj nabavkama i dobavljačima</p>
          </div>
        </div>

        <Link 
          href="/login" 
          className="inline-block bg-white text-blue-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-100 transition transform hover:scale-105"
        >
          Prijavite se →
        </Link>

        <div className="text-sm text-blue-200 mt-8">
          <p>Test kredencijali:</p>
          <p className="font-mono text-blue-100">Email: admin@example.com | Lozinka: lozinka123</p>
        </div>
      </div>
    </div>
  );
}
