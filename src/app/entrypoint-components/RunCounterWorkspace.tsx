import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfigProvider, theme } from "antd";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { SettingsProvider, useSettings } from "../providers/SettingsContext";
import { MessageProvider } from "../../shared/components/Message/MessageProvider";
import { RunCounterProvider } from "../../shared/runcounter/RunCounterContext";
import { isTauri } from "../../shared/runcounter/hotkeys";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar";
import AppSettingsPage from "../../pages/settings/AppSettingsPage";
import RunCounterPage from "../../pages/runcounter/RunCounterPage";
import "../../shared/assets/antd-theme.css";

interface RunCounterWorkspaceProps {
  onBackClick: () => void;
  onChangeClick: () => void;
}

const RunCounterWorkspaceContent: React.FC<RunCounterWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  const { t } = useTranslation();
  const { getIsDarkTheme, toggleTheme } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const isDarkTheme = getIsDarkTheme();

  // Pin the main window to the fixed Run Counter size, regardless of how the
  // previous screen (e.g. advanced loot-filter mode at 1200px) left it.
  useEffect(() => {
    if (!isTauri()) return;
    const timer = window.setTimeout(async () => {
      try {
        const w = getCurrentWindow();
        await w.setResizable(false);
        await w.setSize(new LogicalSize(600, 790));
      } catch (e) {
        console.error("RunCounter window resize failed", e);
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, []);

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
        <RunCounterProvider defaultTargetName={t("runCounterPage.defaultTarget")}>
          <div className={`h-full flex flex-col pt-9 ${isDarkTheme ? "bg-gray-900" : "bg-gray-100"}`}>
            {showSettings ? (
              <AppSettingsPage
                isDarkTheme={isDarkTheme}
                onBack={() => setShowSettings(false)}
                onChangePathClick={onChangeClick}
              />
            ) : (
              <>
                <MainSpaceToolbar
                  onLanguageChange={() => {}}
                  onSettingsClick={() => setShowSettings(true)}
                  isDarkTheme={isDarkTheme}
                  onThemeChange={toggleTheme}
                  onBackClick={onBackClick}
                />

                <div className="flex-1 overflow-auto">
                  <div className="max-w-[600px] px-4 py-6 mx-auto">
                    <h1
                      className={`text-4xl font-bold text-center diablo-font ${
                        isDarkTheme ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("runCounter")}
                    </h1>
                  </div>
                  <RunCounterPage isDarkTheme={isDarkTheme} />
                </div>
              </>
            )}
          </div>
        </RunCounterProvider>
      </MessageProvider>
    </ConfigProvider>
  );
};

const RunCounterWorkspace: React.FC<RunCounterWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  return (
    <SettingsProvider>
      <RunCounterWorkspaceContent onBackClick={onBackClick} onChangeClick={onChangeClick} />
    </SettingsProvider>
  );
};

export default RunCounterWorkspace;
