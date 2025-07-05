import React, { useState, useRef, useEffect } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isDarkTheme?: boolean;
  className?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  isDarkTheme = false,
  className = "",
  placeholder = "Select an option",
  size = "md",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Определяем направление открытия дропдауна
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const maxDropdownHeight = 200; // максимальная высота списка опций
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Если снизу места меньше чем нужно, а сверху больше, то открываем сверху
      setOpenUpward(spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          button: "px-2 py-1 text-xs",
          option: "px-2 py-1 text-xs",
        };
      case "lg":
        return {
          button: "px-6 py-3 text-base",
          option: "px-6 py-3 text-base",
        };
      default:
        return {
          button: "px-4 py-2 text-sm",
          option: "px-4 py-2 text-sm",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div className={`relative`} ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full ${
          sizeClasses.button
        } text-left border transition-all duration-200 flex items-center justify-between ${className} ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : isDarkTheme
            ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        } ${!disabled && isOpen ? "ring-2 ring-blue-500" : ""} ${
          isDarkTheme
            ? "bg-gray-700 border-gray-600 text-gray-200"
            : "bg-white border-gray-300 text-gray-700"
        }`}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute z-50 w-full border shadow-lg rounded-md ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          } ${
            isDarkTheme
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-300"
          }`}
          style={{
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full ${
                  sizeClasses.option
                } text-left hover:bg-opacity-80 transition-colors duration-150 ${
                  option.value === selectedValue
                    ? isDarkTheme
                      ? "bg-gray-500 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkTheme
                    ? "text-gray-200 hover:bg-gray-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
