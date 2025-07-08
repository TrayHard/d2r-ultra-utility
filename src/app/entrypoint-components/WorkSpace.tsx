import React from "react";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar.tsx";
import MainSpace from "./workspace/MainSpace.tsx";
import {
  SettingsProvider,
  useSettings,
} from "../providers/SettingsContext.tsx";
import { MessageProvider } from "../../shared/components/Message/MessageProvider.tsx";

interface WorkSpaceProps {
  onChangeClick: () => void;
}

const WorkSpaceContent: React.FC<WorkSpaceProps> = ({ onChangeClick }) => {
  const { getIsDarkTheme, toggleTheme } = useSettings();

  const isDarkTheme = getIsDarkTheme();

  const handleLanguageChange = () => {
    // Язык теперь управляется через SettingsContext в LanguageSwitch
    // Коллбек оставляем для совместимости, но ничего не делаем
  };

  return (
    <MessageProvider isDarkTheme={isDarkTheme} position="top">
      <div
        className={`h-full flex flex-col pt-9 ${
          isDarkTheme ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <MainSpaceToolbar
          onLanguageChange={handleLanguageChange}
          onChangePathClick={onChangeClick}
          isDarkTheme={isDarkTheme}
          onThemeChange={toggleTheme}
        />
        <MainSpace isDarkTheme={isDarkTheme} />
      </div>
    </MessageProvider>
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
