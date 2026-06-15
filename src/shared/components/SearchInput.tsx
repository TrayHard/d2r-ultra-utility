import React from "react";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isDarkTheme: boolean;
  placeholder?: string;
  className?: string;
}

// Reusable search box (magnifier icon + themed input). Generic placeholder by
// default — do NOT bake domain-specific text in here.
const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  isDarkTheme,
  placeholder,
  className = "",
}) => {
  const { t } = useTranslation();
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute left-3 pointer-events-none"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t("search.placeholderGeneric") ?? "Search..."}
        className={`w-full h-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${
          isDarkTheme
            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        }`}
      />
    </div>
  );
};

export default SearchInput;
