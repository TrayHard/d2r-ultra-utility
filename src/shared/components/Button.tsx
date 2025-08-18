import React from "react";
import { Tooltip } from "antd";
import Icon from "@mdi/react";
import { mdiLoading } from "@mdi/js";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDarkTheme?: boolean;
  icon?: string;
  iconSize?: number;
  iconPosition?: "left" | "right";
  active?: boolean;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  isLoading = false,
  isDarkTheme = false,
  icon,
  iconSize = 0.8,
  iconPosition = "left",
  active = false,
  children,
  disabled,
  className = "",
  title,
  ...props
}) => {
  const baseClasses =
    "flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-w-0 max-w-full overflow-hidden shrink";

  // Adjust gap based on whether we have both icon and text
  const hasIcon = icon || isLoading;
  const hasText = children;
  const gapClass = hasIcon && hasText ? "gap-2" : "";

  // Size variants
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Color variants
  const getVariantClasses = () => {
    if (isLoading || disabled) {
      return "opacity-50 cursor-not-allowed";
    }

    if (active) {
      return isDarkTheme
        ? "bg-yellow-600 border-yellow-500 text-black hover:bg-yellow-500 focus:ring-yellow-500"
        : "bg-yellow-500 border-yellow-400 text-white hover:bg-yellow-600 focus:ring-yellow-500";
    }

    switch (variant) {
      case "primary":
        return isDarkTheme
          ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 focus:ring-blue-500"
          : "bg-blue-500 border-blue-400 text-white hover:bg-blue-600 focus:ring-blue-500";
      case "success":
        return isDarkTheme
          ? "bg-green-600 border-green-500 text-white hover:bg-green-700 focus:ring-green-500"
          : "bg-green-500 border-green-400 text-white hover:bg-green-600 focus:ring-green-500";
      case "danger":
        return isDarkTheme
          ? "bg-red-600 border-red-500 text-white hover:bg-red-700 focus:ring-red-500"
          : "bg-red-500 border-red-400 text-white hover:bg-red-600 focus:ring-red-500";
      case "info":
        return isDarkTheme
          ? "bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-700 focus:ring-cyan-500"
          : "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-600 focus:ring-cyan-500";
      case "secondary":
      default:
        return isDarkTheme
          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 focus:ring-gray-500"
          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500";
    }
  };

  const iconToShow = isLoading ? mdiLoading : icon;

  const renderIcon = () => {
    if (!iconToShow) return null;
    return (
      <Icon
        path={iconToShow}
        size={iconSize}
        className={`${isLoading ? "animate-spin" : ""} shrink-0`}
      />
    );
  };

  const buttonEl = (
    <button
      className={`
        ${baseClasses}
        ${gapClass}
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {iconPosition === "left" && renderIcon()}
      {hasText ? (
        <span className={`truncate min-w-0 flex-1`}>
          {children}
        </span>
      ) : null}
      {iconPosition === "right" && renderIcon()}
    </button>
  );

  if (title) {
    return (
      <Tooltip title={title} placement="top">
        {buttonEl}
      </Tooltip>
    );
  }

  return buttonEl;
};

export default Button;
