"use client";

import { useState, ChangeEvent } from "react";

type InputProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function Input({ label, type = "text", value, onChange }: InputProps) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1">{label}</span>
      <input
        className="border px-3 py-2 rounded"
        type={type}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}


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

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Prijavi se
        </button>
      </div>
    </main>
  );
}
