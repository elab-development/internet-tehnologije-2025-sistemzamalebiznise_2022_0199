"use client";

type InputProps = {
  label: string;
  type: "text" | "email" | "password" | "number";
  placeholder: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  name?: string;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
};

export default function Input({ 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  name,
  step,
  min,
  max,
  required = false 
}: InputProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="font-semibold text-sm text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        name={name}
        step={step}
        min={min}
        max={max}
        required={required}
        className="px-3 py-2 border border-gray-300 rounded focus:border-black outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}