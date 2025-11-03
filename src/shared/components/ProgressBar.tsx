import React from "react";
import { useTranslation } from "react-i18next";

interface ProgressBarProps {
  progress: number;
  message: string;
  foundCount: number;
  isActive: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  foundCount,
  isActive,
}) => {
  if (!isActive) return null;
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-2 00">
            {t("progress.searchingTitle")}
          </span>
          <span className="text-sm text-gray-300">{progress}%</span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 mb-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        <div className="text-sm text-gray-300 mb-1">{t(message)}</div>

        {foundCount > 0 && (
          <div className="text-sm font-semibold text-green-400">
            {t("progress.foundFiles", {
              count: foundCount,
              suffix: foundCount !== 1 ? "s" : "",
            })}
          </div>
        )}

        <div className="flex items-center mt-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span className="ml-2 text-xs text-gray-400">
            {t("progress.processing")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
