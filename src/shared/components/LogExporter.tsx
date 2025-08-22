import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';
import Button from './Button';
import { useSettings } from '../../app/providers/SettingsContext';

interface LogExporterProps {
  isDarkTheme: boolean;
}

const LogExporter: React.FC<LogExporterProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getDebugMode } = useSettings();
  const [isExporting, setIsExporting] = useState(false);

  const isDebugMode = getDebugMode();
  const logStats = logger.getLogStats();

  const exportLogsAsJson = () => {
    setIsExporting(true);
    try {
      const logsData = logger.exportLogs();
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(logsData);
      const exportFileDefaultName = `d2r-debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      logger.info('Logs exported as JSON', { format: 'json', filename: exportFileDefaultName }, 'LogExporter', 'exportLogsAsJson');
    } catch (error) {
      logger.error('Failed to export logs as JSON', error as Error, undefined, 'LogExporter', 'exportLogsAsJson');
    } finally {
      setIsExporting(false);
    }
  };

  const exportLogsAsText = () => {
    setIsExporting(true);
    try {
      const logsText = logger.exportLogsAsText();
      const dataUri = "data:text/plain;charset=utf-8," + encodeURIComponent(logsText);
      const exportFileDefaultName = `d2r-debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      logger.info('Logs exported as text', { format: 'text', filename: exportFileDefaultName }, 'LogExporter', 'exportLogsAsText');
    } catch (error) {
      logger.error('Failed to export logs as text', error as Error, undefined, 'LogExporter', 'exportLogsAsText');
    } finally {
      setIsExporting(false);
    }
  };

  const clearLogs = () => {
    if (window.confirm(t('logs.confirmClear'))) {
      logger.clearLogs();
      logger.info('Logs cleared by user', undefined, 'LogExporter', 'clearLogs');
    }
  };

  if (!isDebugMode) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg border ${
        isDarkTheme
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      <h4
        className={`text-lg font-semibold mb-3 ${
          isDarkTheme ? "text-white" : "text-gray-900"
        }`}
      >
        {t("logs.title")}
      </h4>

      {/* Статистика логов */}
      <div className="mb-4">
        <div
          className={`text-sm grid grid-cols-2 gap-2 p-3 rounded ${
            isDarkTheme ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <div>
            <span className={isDarkTheme ? "text-gray-300" : "text-gray-700"}>
              {t("logs.total")}:
            </span>
            <span className={`ml-1 font-mono ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              {logStats.total}
            </span>
          </div>
          <div>
            <span className={`${isDarkTheme ? "text-red-400" : "text-red-600"}`}>
              {t("logs.errors")}:
            </span>
            <span className={`ml-1 font-mono ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              {logStats.error}
            </span>
          </div>
          <div>
            <span className={`${isDarkTheme ? "text-yellow-400" : "text-yellow-600"}`}>
              {t("logs.warnings")}:
            </span>
            <span className={`ml-1 font-mono ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              {logStats.warn}
            </span>
          </div>
          <div>
            <span className={`${isDarkTheme ? "text-blue-400" : "text-blue-600"}`}>
              {t("logs.info")}:
            </span>
            <span className={`ml-1 font-mono ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              {logStats.info}
            </span>
          </div>
        </div>
      </div>

      {/* Кнопки экспорта */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={exportLogsAsJson}
            disabled={isExporting || logStats.total === 0}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            {isExporting ? t("logs.exporting") : t("logs.exportJson")}
          </Button>
          <Button
            onClick={exportLogsAsText}
            disabled={isExporting || logStats.total === 0}
            variant="secondary"
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
