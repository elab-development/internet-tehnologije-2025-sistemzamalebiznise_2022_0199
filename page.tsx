"use client";

import { useState } from "react";
import Button from "./components/Button";
import Input from "./components/Input";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [lozinka, setLozinka] = useState("");

  function handleSubmit() {
    alert(`Email: ${email}\nLozinka: ${lozinka}`);
  }

  return (
    <main className="p-8 max-w-sm">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>

      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Lozinka"
          type="password"
          value={lozinka}
          onChange={(e) => setLozinka(e.target.value)}
        />

        <Button onClick={handleSubmit}>Prijavi se</Button>
      </div>
    </main>
  );
}
