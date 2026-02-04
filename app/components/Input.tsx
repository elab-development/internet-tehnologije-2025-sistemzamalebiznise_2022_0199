"use client";
import { useState } from "react";

type InputProps = {
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({ label, type, placeholder, value, onChange }: InputProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="font-semibold text-sm text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="px-3 py-2 border border-gray-300 rounded focus:border-black outline-none transition"
      />
    </div>
  );
}