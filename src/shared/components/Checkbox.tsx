import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDarkTheme: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  isDarkTheme,
  size = "md",
  disabled = false,
  label,
  className = "",
  id,
  onClick,
}) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const checkboxElement = (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} rounded transition-all duration-200 flex-shrink-0
        ${
          isDarkTheme
            ? "text-yellow-400 bg-gray-700 border-gray-600 focus:ring-yellow-400 focus:ring-1"
            : "text-yellow-500 bg-white border-gray-300 focus:ring-yellow-500 focus:ring-1"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    />
  );

  if (label) {
    return (
      <label
        className={`
          flex items-center gap-2 cursor-pointer
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {checkboxElement}
        <span
          className={`
            text-sm font-medium transition-colors select-none
            ${isDarkTheme ? "text-gray-200" : "text-gray-800"}
          `}
        >
          {label}
        </span>
      </label>
    );
  }

  return checkboxElement;
};

export default Checkbox;
