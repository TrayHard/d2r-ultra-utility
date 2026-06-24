import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfigProvider, theme } from "antd";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { SettingsProvider, useSettings } from "../providers/SettingsContext";
import { MessageProvider } from "../../shared/components/Message/MessageProvider";
import { SaveEditorProvider } from "../../shared/saveeditor/SaveEditorContext";
import { isTauri } from "../../shared/runcounter/hotkeys";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar";
import AppSettingsPage from "../../pages/settings/AppSettingsPage";
import SaveEditorPage from "../../pages/saveeditor/SaveEditorPage";
import "../../shared/assets/antd-theme.css";

interface SaveEditorWorkspaceProps {
  onBackClick: () => void;
  onChangeClick: () => void;
}

const SaveEditorWorkspaceContent: React.FC<SaveEditorWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  const { t } = useTranslation();
  const { getIsDarkTheme, toggleTheme } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const isDarkTheme = getIsDarkTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDarkTheme]);

  // The Save Editor needs room for two item columns — use the wide, resizable
  // layout regardless of how the previous screen sized the window.
  useEffect(() => {
    if (!isTauri()) return;
    const timer = window.setTimeout(async () => {
      try {
        const w = getCurrentWindow();
        await w.setResizable(true);
        await w.setSize(new LogicalSize(1200, 850));
      } catch (e) {
        console.error("SaveEditor window resize failed", e);
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
        <SaveEditorProvider>
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
                  title={t("saveEditor.title")}
                />
                <div className="flex-1 overflow-auto pt-4">
                  <SaveEditorPage isDarkTheme={isDarkTheme} />
                </div>
              </>
            )}
          </div>
        </SaveEditorProvider>
      </MessageProvider>
    </ConfigProvider>
  );
};

const SaveEditorWorkspace: React.FC<SaveEditorWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  return (
    <SettingsProvider>
      <SaveEditorWorkspaceContent onBackClick={onBackClick} onChangeClick={onChangeClick} />
    </SettingsProvider>
  );
};

export default SaveEditorWorkspace;
