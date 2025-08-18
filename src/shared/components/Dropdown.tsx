import React, { useState, useRef, useEffect } from "react";
import { Tooltip } from "antd";
import Icon from "@mdi/react";
import { mdiRename, mdiDelete } from "@mdi/js";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string;
  selectedValues?: string[];
  onSelect?: (value: string) => void;
  onMultiSelect?: (values: string[]) => void;
  isDarkTheme?: boolean;
  className?: string;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  multiple?: boolean;
  mandatoryValues?: string[]; // Значения, которые нельзя отжать
  onOptionRename?: (value: string) => void;
  onOptionDelete?: (value: string) => void;
  renameTitle?: string;
  deleteTitle?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  selectedValues,
  onSelect,
  onMultiSelect,
  isDarkTheme = false,
  className = "",
  placeholder = "Select an option",
  size = "md",
  disabled = false,
  multiple = false,
  mandatoryValues = [],
  onOptionRename,
  onOptionDelete,
  renameTitle = "Rename",
  deleteTitle = "Delete",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = multiple
    ? null
    : options.find((option) => option.value === selectedValue);

  const selectedOptionsMulti = multiple
    ? options.filter((option) => selectedValues?.includes(option.value))
    : [];

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
    if (multiple) {
      if (!selectedValues) return;

      const isSelected = selectedValues.includes(value);
      const isMandatory = mandatoryValues.includes(value);

      // Если элемент обязательный и уже выбран, не позволяем его отжать
      if (isMandatory && isSelected) {
        return;
      }

      let newValues: string[];
      if (isSelected) {
        newValues = selectedValues.filter((v) => v !== value);
      } else {
        newValues = [...selectedValues, value];
      }

      onMultiSelect?.(newValues);
    } else {
      onSelect?.(value);
      setIsOpen(false);
    }
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

  const getDisplayText = () => {
    if (multiple) {
      if (!selectedValues || selectedValues.length === 0) {
        return placeholder;
      }
      if (selectedValues.length === 1) {
        return selectedOptionsMulti[0]?.label ?? "";
      }
      return `${selectedValues.length} selected`;
    }
    return selectedOption?.label ?? placeholder;
  };

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
        <span>{getDisplayText()}</span>
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
            {options.map((option) => {
              const isSelected = multiple
                ? selectedValues?.includes(option.value)
                : option.value === selectedValue;
              const isMandatory = mandatoryValues.includes(option.value);

              const optionDisabled = multiple && isMandatory && isSelected;
              return (
                <div
                  key={option.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!optionDisabled) handleSelect(option.value);
                  }}
                  className={`w-full ${
                    sizeClasses.option
                  } text-left hover:bg-opacity-80 transition-colors duration-150 flex items-center justify-between ${
                    isSelected
                      ? isDarkTheme
                        ? "bg-gray-500 text-white"
                        : "bg-blue-500 text-white"
                      : isDarkTheme
                      ? "text-gray-200 hover:bg-gray-600"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${
                    optionDisabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {multiple && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="pointer-events-none"
                      />
                    )}
                    {option.label}
                  </span>
                  <span className="flex items-center gap-2 ml-2">
                    {multiple && isMandatory && isSelected && (
                      <span className="text-xs opacity-75">(required)</span>
                    )}
                    {/* Option-level actions */}
                    {onOptionRename && (
                      <Tooltip title={renameTitle} placement="top">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onOptionRename(option.value);
                          }}
                          className={`p-1 rounded hover:opacity-90 ${
                            isDarkTheme ? "text-gray-200 hover:bg-gray-500" : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Icon path={mdiRename} size={0.7} />
                        </div>
                      </Tooltip>
                    )}
                    {onOptionDelete && (
                      <Tooltip title={deleteTitle} placement="top">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onOptionDelete(option.value);
                          }}
                          className={`p-1 rounded hover:opacity-90 ${
                            isDarkTheme ? "text-gray-200 hover:bg-gray-500" : "text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <Icon path={mdiDelete} size={0.7} />
                        </div>
                      </Tooltip>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
