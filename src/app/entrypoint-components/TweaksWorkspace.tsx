import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsProvider, useSettings } from "../providers/SettingsContext";
import { MessageProvider } from "../../shared/components/Message/MessageProvider";
import { ConfigProvider, theme } from "antd";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar";
import TweaksPage from "../../pages/tweaks/TweaksPage";
import "../../shared/assets/antd-theme.css";
import AppSettingsPage from "../../pages/settings/AppSettingsPage";

interface TweaksWorkspaceProps {
  onBackClick: () => void;
  onChangeClick: () => void;
}

const TweaksWorkspaceContent: React.FC<TweaksWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  const { t } = useTranslation();
  const { getIsDarkTheme, toggleTheme } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const isDarkTheme = getIsDarkTheme();

  const handleLanguageChange = () => {
    // Язык управляется через SettingsContext в LanguageSwitch
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
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
        <div className={`h-full flex flex-col pt-9 ${isDarkTheme ? "bg-gray-900" : "bg-gray-100"}`}>
          {showSettings ? (
            <AppSettingsPage
              isDarkTheme={isDarkTheme}
              onBack={handleBackFromSettings}
              onChangePathClick={onChangeClick}
            />
          ) : (
            <>
              <MainSpaceToolbar
                onLanguageChange={handleLanguageChange}
                onSettingsClick={handleSettingsClick}
                isDarkTheme={isDarkTheme}
                onThemeChange={toggleTheme}
                onBackClick={onBackClick}
              />

              <div className="flex-1 overflow-auto">
                <div className="max-w-[600px] px-4 py-8 mx-auto">
                  <h1
                    className={`text-4xl font-bold text-center diablo-font ${
                      isDarkTheme ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t("tweaks")}
                  </h1>
                </div>
                <TweaksPage isDarkTheme={isDarkTheme} />
              </div>
            </>
          )}
        </div>
      </MessageProvider>
    </ConfigProvider>
  );
};

const TweaksWorkspace: React.FC<TweaksWorkspaceProps> = ({
  onBackClick,
  onChangeClick,
}) => {
  return (
    <SettingsProvider>
      <TweaksWorkspaceContent onBackClick={onBackClick} onChangeClick={onChangeClick} />
    </SettingsProvider>
  );
};

export default TweaksWorkspace;
