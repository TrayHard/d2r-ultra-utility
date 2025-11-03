import React from "react";

interface SwitcherProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  isDarkTheme?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

const Switcher: React.FC<SwitcherProps> = ({
  checked,
  onChange,
  label,
  isDarkTheme = false,
  disabled = false,
  size = "md",
}) => {
  const sizeClasses = {
    sm: {
      track: "w-8 h-4",
      thumb: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      track: "w-10 h-5",
      thumb: "w-4 h-4",
      translate: "translate-x-5",
    },
    lg: {
      track: "w-12 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-6",
    },
  };

  const { track, thumb, translate } = sizeClasses[size];

  return (
    <label
      className={`
      flex items-center cursor-pointer select-none
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    `}
    >
      {label && (
        <span
          className={`
          mr-3 text-sm font-medium
          ${isDarkTheme ? "text-gray-200" : "text-gray-800"}
          ${disabled ? "text-opacity-50" : ""}
        `}
        >
          {label}
        </span>
      )}

      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />

        {/* Track */}
        <div
          className={`
          ${track} rounded-full transition-all duration-300 ease-in-out
          ${
            checked
              ? isDarkTheme
                ? "bg-yellow-400 shadow-yellow-400/30"
                : "bg-yellow-500 shadow-yellow-500/30"
              : isDarkTheme
                ? "bg-gray-600 shadow-gray-600/20"
                : "bg-gray-300 shadow-gray-300/20"
          }
          ${!disabled && "shadow-lg"}
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
        />

        {/* Thumb */}
        <div
          className={`
          ${thumb} bg-white rounded-full shadow-lg absolute top-0.5 left-0.5
          transition-all duration-300 ease-in-out
          ${checked ? translate : "translate-x-0"}
          ${!disabled && "shadow-md"}
        `}
        >
          {/* Inner glow effect */}
          <div
            className={`
            w-full h-full rounded-full transition-all duration-300
            ${
              checked
                ? isDarkTheme
                  ? "shadow-inner shadow-yellow-200/20"
                  : "shadow-inner shadow-yellow-300/20"
                : ""
            }
          `}
          />
        </div>
      </div>
    </label>
  );
};

export default Switcher;
