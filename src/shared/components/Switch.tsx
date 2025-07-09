import React from "react";

interface SwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  isDarkTheme?: boolean;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  enabled,
  onChange,
  isDarkTheme = true,
  disabled = false,
  className = "",
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 p-1
        ${
          enabled ? "bg-green-600" : isDarkTheme ? "bg-gray-600" : "bg-gray-300"
        }
        ${
          enabled
            ? isDarkTheme
              ? "focus:ring-green-500 focus:ring-offset-gray-800"
              : "focus:ring-green-500 focus:ring-offset-white"
            : isDarkTheme
            ? "focus:ring-gray-500 focus:ring-offset-gray-800"
            : "focus:ring-gray-300 focus:ring-offset-white"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg 
          transition duration-200 ease-in-out
          ${enabled ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
};

export default Switch;
