import React, { useState, useEffect } from "react";
import { useSettings, SettingsProvider } from "../providers/SettingsContext";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar";
import AdvancedMainSpace from "./advanced/AdvancedMainSpace";
import BasicMainSpace from "./basic/BasicMainSpace";
import { MessageProvider } from "../../shared/components/Message/MessageProvider";
import AppSettingsPage from "../../pages/settings/AppSettingsPage";
import { ConfigProvider, theme } from "antd";
import "../../shared/assets/antd-theme.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpaceContent: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const { getIsDarkTheme, toggleTheme, isThemeChanging, getAppMode, toggleAppMode } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const isDarkTheme = getIsDarkTheme();
  const appMode = getAppMode();

  // Синхронизируем глобальный класс для Tailwind и любых глобальных стилей
  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkTheme]);

  // Эффект для изменения размеров окна при переключении режимов
  useEffect(() => {
    const updateWindowForMode = async () => {
      try {
        const window = getCurrentWindow();
        
        if (appMode === "basic") {
          // Базовый режим: 600x700, фиксированный размер
          await window.setResizable(false);
          await window.setSize(new LogicalSize(600, 751));
        } else {
          // Продвинутый режим: 1200x900, можно ресайзить
          await window.setResizable(true);
          await window.setSize(new LogicalSize(1200, 900));
        }
      } catch (error) {
        console.error("Failed to update window size for mode change:", error);
      }
    };

    // Добавим небольшую задержку для уверенности, что React успел отрендерить изменения
    const timer = setTimeout(updateWindowForMode, 100);
    return () => clearTimeout(timer);
  }, [appMode]);

  const handleLanguageChange = () => {
    // Язык теперь управляется через SettingsContext в LanguageSwitch
    // Коллбек оставляем для совместимости, но ничего не делаем
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  const handleChangePathClick = () => {
    onChangeClick();
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#eab308",
          colorInfo: "#eab308",
          colorSuccess: "#22c55e",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
        },
      }}
    >
      <MessageProvider isDarkTheme={isDarkTheme} position="top">
        <div
          className={`h-full flex flex-col pt-9 ${
            isDarkTheme ? "bg-gray-900" : "bg-gray-100"
          }`}
        >
          {/* Theme changing loader */}
          {isThemeChanging && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center ${
                isDarkTheme ? "bg-gray-900" : "bg-gray-100"
              }`}
              style={{ backgroundColor: isDarkTheme ? "#111827" : "#f3f4f6" }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-500 rounded-full animate-spin"></div>
                <div
                  className={`text-lg font-medium ${
                    isDarkTheme ? "text-white" : "text-gray-900"
                  }`}
                >
                  Переключение темы...
                </div>
              </div>
            </div>
          )}

          {showSettings ? (
            <AppSettingsPage
              isDarkTheme={isDarkTheme}
              onBack={handleBackFromSettings}
              onChangePathClick={handleChangePathClick}
            />
          ) : (
            <>
              <MainSpaceToolbar
                onLanguageChange={handleLanguageChange}
                onSettingsClick={handleSettingsClick}
                isDarkTheme={isDarkTheme}
                onThemeChange={toggleTheme}
                appMode={appMode}
                onModeToggle={toggleAppMode}
              />
              {appMode === "advanced" ? (
                <AdvancedMainSpace isDarkTheme={isDarkTheme} />
              ) : (
                <BasicMainSpace isDarkTheme={isDarkTheme} />
              )}
            </>
          )}
        </div>
      </MessageProvider>
    </ConfigProvider>
  );
};

const WorkSpace: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  return (
    <SettingsProvider>
      <WorkSpaceContent onChangeClick={onChangeClick} />
    </SettingsProvider>
  );
};

export default WorkSpace;
