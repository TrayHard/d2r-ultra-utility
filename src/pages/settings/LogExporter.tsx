import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { logger } from "../../shared/utils/logger";
import Button from "../../shared/components/Button";
import { useSettings } from "../../app/providers/SettingsContext";
import Switcher from "../../shared/components/Switcher";

interface LogExporterProps {
  isDarkTheme: boolean;
}

const LogExporter: React.FC<LogExporterProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getDebugMode, updateDebugMode } = useSettings();
  const [isExporting, setIsExporting] = useState(false);
  const [logStats, setLogStats] = useState(() => logger.getLogStats());

  const isDebugMode = getDebugMode();

  // Подписываемся на изменения логов
  const updateStats = useCallback(() => {
    setLogStats(logger.getLogStats());
  }, []);

  useEffect(() => {
    logger.addListener(updateStats);
    return () => {
      logger.removeListener(updateStats);
    };
  }, [updateStats]);

  const exportLogsAsText = () => {
    setIsExporting(true);
    try {
      const logsText = logger.exportLogsAsText();
      const dataUri =
        "data:text/plain;charset=utf-8," + encodeURIComponent(logsText);
      const exportFileDefaultName = `d2r-debug-logs-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-")}.txt`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      logger.info(
        "Logs exported as text",
        { format: "text", filename: exportFileDefaultName },
        "LogExporter",
        "exportLogsAsText"
      );
    } catch (error) {
      logger.error(
        "Failed to export logs as text",
        error as Error,
        undefined,
        "LogExporter",
        "exportLogsAsText"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const clearLogs = () => {
    if (window.confirm(t("logs.confirmClear"))) {
      logger.clearLogs();
      logger.info(
        "Logs cleared by user",
        undefined,
        "LogExporter",
        "clearLogs"
      );
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border ${
        isDarkTheme ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`text-xl font-semibold mb-4 ${
          isDarkTheme ? "text-white" : "text-gray-900"
        }`}
      >
        {t("settings.debugMode")}
      </h3>
      <div className="space-y-4">
        <div>
          <p
            className={`text-sm mb-4 ${
              isDarkTheme ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t("settings.debugModeDescription")}
          </p>

          <Switcher
            checked={isDebugMode}
            onChange={updateDebugMode}
            label={
              isDebugMode
                ? t("settings.debugModeEnabled")
                : t("settings.debugModeDisabled")
            }
            isDarkTheme={isDarkTheme}
            size="md"
          />
        </div>
      </div>

      {isDebugMode && 
        <>
          <div className="my-4">
            <div
              className={`text-sm grid grid-cols-2 gap-2 p-3 rounded ${
                isDarkTheme ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <div>
                <span className={isDarkTheme ? "text-gray-300" : "text-gray-700"}>
                  {t("logs.total")}:
                </span>
                <span
                  className={`ml-1 font-mono ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {logStats.total}
                </span>
              </div>
              <div>
                <span
                  className={`${isDarkTheme ? "text-red-400" : "text-red-600"}`}
                >
                  {t("logs.errors")}:
                </span>
                <span
                  className={`ml-1 font-mono ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {logStats.error}
                </span>
              </div>
              <div>
                <span
                  className={`${
                    isDarkTheme ? "text-yellow-400" : "text-yellow-600"
                  }`}
                >
                  {t("logs.warnings")}:
                </span>
                <span
                  className={`ml-1 font-mono ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {logStats.warn}
                </span>
              </div>
              <div>
                <span
                  className={`${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}
                >
                  {t("logs.info")}:
                </span>
                <span
                  className={`ml-1 font-mono ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  {logStats.info}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки экспорта */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={exportLogsAsText}
                disabled={isExporting || logStats.total === 0}
                variant="primary"
                size="sm"
                className="flex-1"
              >
                {isExporting ? t("logs.exporting") : t("logs.exportText")}
              </Button>
            </div>

            <Button
              onClick={clearLogs}
              disabled={logStats.total === 0}
              variant="danger"
              size="sm"
              className="w-full"
            >
              {t("logs.clearLogs")}
            </Button>
          </div>
        </>
      }

      {/* Описание */}
      <div className="mt-3">
        <p
          className={`text-xs ${
            isDarkTheme ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {t("logs.exportDescription")}
        </p>
      </div>
    </div>
  );
};

export default LogExporter;
