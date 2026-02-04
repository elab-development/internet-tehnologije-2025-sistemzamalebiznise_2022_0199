type ButtonProps = {
  label: string; 
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "danger" | "success"; 
};

export default function Button({
  label,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
    >
      {label}
    </button>
  );
}