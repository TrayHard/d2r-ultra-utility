import React, { useState } from "react";
import Icon from "@mdi/react";
import { mdiChevronDown, mdiChevronUp } from "@mdi/js";

interface CollapseProps {
  title: string;
  children: React.ReactNode;
  isDarkTheme: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  className?: string;
  disabled?: boolean;
  icon?: string; // Путь к изображению иконки
  iconClassName?: string; // Доп. классы для иконки
  containerClassName?: string; // Доп. классы для контейнера
  rightAdornment?: React.ReactNode; // Правый верхний адорнмент в шапке
}

const Collapse: React.FC<CollapseProps> = ({
  title,
  children,
  isDarkTheme,
  isOpen: controlledIsOpen,
  onToggle,
  className = "",
  disabled = false,
  icon,
  iconClassName,
  containerClassName,
  rightAdornment,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (disabled) return;

    const newIsOpen = !isOpen;

    if (onToggle) {
      onToggle(newIsOpen);
    } else {
      setInternalIsOpen(newIsOpen);
    }
  };

  return (
    <div
      className={`border rounded-lg ${
        isDarkTheme ? "border-gray-600" : "border-gray-300"
      } ${className}`}
    >
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 flex items-center justify-between text-left
          transition-colors duration-200
          ${
            isDarkTheme
              ? "bg-gray-700 text-gray-200 hover:bg-gray-600 focus:bg-gray-600"
              : "bg-gray-50 text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
          }
          ${isOpen ? "rounded-t-lg rounded-b-none" : "rounded-lg"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${isOpen && isDarkTheme ? "border-b border-gray-600" : ""}
          ${isOpen && !isDarkTheme ? "border-b border-gray-300" : ""}
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${isDarkTheme ? "focus:ring-yellow-400" : "focus:ring-yellow-500"}
        `}
      >
        <div className="flex items-center relative w-full">
          {icon && (
            <img
              src={icon}
              alt=""
              className={`w-6 h-6 mr-2 object-contain flex-shrink-0 ${iconClassName || ""}`}
              draggable={false}
            />
          )}
          <span className="font-medium">{title}</span>
          {rightAdornment && (
            <span className="absolute right-8 top-1 pointer-events-none select-none">
              {rightAdornment}
            </span>
          )}
          <span className="ml-auto"></span>
        </div>
        <Icon
          path={isOpen ? mdiChevronUp : mdiChevronDown}
          size={1}
          className={`
            transition-transform duration-200 flex-shrink-0
            ${isDarkTheme ? "text-gray-400" : "text-gray-500"}
          `}
        />
      </button>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div
          className={`p-4 ${isDarkTheme ? "bg-gray-800" : "bg-white"} ${containerClassName || ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Collapse;
