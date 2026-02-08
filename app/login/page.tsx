"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../components/Input";
import Button from "../components/Button";
import { ApiService } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await ApiService.login(email, lozinka);
      localStorage.setItem("user", JSON.stringify(result.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Greška pri logovanju");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Prijava na sistem</h1>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        
        <Input 
          label="Email adresa" 
          type="email" 
          placeholder="unesite email..." 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        
        <Input 
          label="Lozinka" 
          type="password" 
          placeholder="******" 
          value={lozinka} 
          onChange={(e) => setLozinka(e.target.value)}
          disabled={loading}
        />

        <Button label={loading ? "Učitavanje..." : "Prijavi se"} type="submit" disabled={loading} />
      </form>
    </div>
  );
}