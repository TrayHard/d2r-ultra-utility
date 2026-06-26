import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfigProvider, theme } from "antd";
import { getCurrentWindow } from "@tauri-apps/api/window";
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

  // The Save Editor only makes the window resizable so the user can size it for
  // the multi-column layout. It deliberately does NOT force a size — forcing a
  // resolution on entry is jarring (the previous screen's size is kept).
  useEffect(() => {
    if (!isTauri()) return;
    const timer = window.setTimeout(async () => {
      try {
        await getCurrentWindow().setResizable(true);
      } catch (e) {
        console.error("SaveEditor setResizable failed", e);
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
          <div
            className="h-full flex flex-col pt-9"
            style={{
              background:
                "radial-gradient(ellipse at 50% 25%, #17120c 0%, #0b0907 55%, #050403 100%)",
            }}
          >
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
