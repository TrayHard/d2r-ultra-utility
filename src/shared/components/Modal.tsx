import React, { useEffect } from "react";
import Icon from "@mdi/react";
import { mdiClose } from "@mdi/js";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  isDarkTheme?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  isDarkTheme = false,
  children,
  size = "md",
}) => {
  // Закрытие по ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full mx-4 ${sizeClasses[size]}
          animate-in zoom-in-95 slide-in-from-bottom-2 duration-200
          ${
            isDarkTheme
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          }
          rounded-xl shadow-2xl
        `}
      >
        {/* Header */}
        {title && (
          <div
            className={`
              flex items-center justify-between p-4 border-b
              ${isDarkTheme ? "border-gray-700" : "border-gray-200"}
            `}
          >
            <h2
              className={`
                text-lg font-semibold
                ${isDarkTheme ? "text-white" : "text-gray-900"}
              `}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`
                p-1.5 rounded-lg transition-all duration-200 hover:scale-105
                ${
                  isDarkTheme
                    ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                    : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                }
              `}
            >
              <Icon path={mdiClose} size={0.8} />
            </button>
          </div>
        )}

        {/* Close button когда нет заголовка */}
        {!title && (
          <button
            onClick={onClose}
            className={`
              absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-all duration-200 hover:scale-105
              ${
                isDarkTheme
                  ? "hover:bg-gray-700 text-gray-300 hover:text-white"
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900"
              }
            `}
          >
            <Icon path={mdiClose} size={0.8} />
          </button>
        )}

        {/* Content */}
        <div className={title ? "p-4" : "p-6"}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
