type ButtonProps = {
  label: string; 
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "danger" | "success";
  disabled?: boolean;
};

export default function Button({
  label,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false
}: ButtonProps) {
  
  const bgColors = {
    primary: "bg-black hover:bg-gray-800 disabled:bg-gray-400",
    success: "bg-green-600 hover:bg-green-700 disabled:bg-gray-400",
    danger: "bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-2 text-white rounded transition disabled:cursor-not-allowed ${bgColors[variant]}`}
    >
      {label}
    </button>
  );
}