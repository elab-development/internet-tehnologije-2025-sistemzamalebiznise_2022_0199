"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Check if we're on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-black text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="font-bold text-2xl hover:text-gray-300">
            📦 Upravljač lagera
          </Link>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-gray-300">{user.username}</span>}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:text-gray-300"
            >
              <span>☰</span>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap gap-4 items-center">
          <Link href="/dashboard" className="hover:text-gray-300 transition">
            Kontrolna tabla
          </Link>
          <Link href="/proizvodi" className="hover:text-gray-300 transition">
            Proizvodi
          </Link>
          <Link href="/dobavljaci" className="hover:text-gray-300 transition">
            Dobavljači
          </Link>
          <Link href="/narudzbenice" className="hover:text-gray-300 transition">
            Narudžbenice
          </Link>

          {showMenu && (
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition ml-auto"
            >
              Odjava
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}