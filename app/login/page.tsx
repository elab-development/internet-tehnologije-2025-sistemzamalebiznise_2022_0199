"use client";
import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Podaci za login:", { email, password });
    
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Prijava na sistem</h1>
        
        <Input 
          label="Email adresa" 
          type="email" 
          placeholder="unesite email..." 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        
        <Input 
          label="Lozinka" 
          type="password" 
          placeholder="******" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />

        <Button label="Prijavi se" type="submit" />
      </form>
    </div>
  );
}