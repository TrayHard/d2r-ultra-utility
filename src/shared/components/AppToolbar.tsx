import React from "react";
import { useTranslation } from "react-i18next";
// icons are used inside FileOperationsBlock; keep i18n import only here
import ProfileManager from "./ProfileManager.tsx";
import FileOperationsBlock from "./FileOperationsBlock";

interface AppToolbarProps {
  isDarkTheme: boolean;
  settings: any;
  profiles: any;
  activeProfileId: string | null;
  isLoading: boolean;
  activeTab: "common" | "items" | "runes" | "gems";
  onProfileSelect: (id: string) => void;
  onProfileCreate: (name: string, settings: any) => void;
  onProfileSave: (profileId: string, settings: any) => void;
  onProfileRename: (id: string, name: string) => void;
  onProfileDelete: (id: string) => void;
  onProfileExport: (id: string) => void;
  onProfileImport: (data: any) => void;
  onReadAll: () => void;
  onApplyAll: () => void;
  onReadCurrent: () => void;
  onApplyCurrent: () => void;
}

const AppToolbar: React.FC<AppToolbarProps> = ({
  isDarkTheme,
  settings,
  profiles,
  activeProfileId,
  isLoading,
  activeTab,
  onProfileSelect,
  onProfileCreate,
  onProfileSave,
  onProfileRename,
  onProfileDelete,
  onProfileExport,
  onProfileImport,
  onReadAll,
  onApplyAll,
  onReadCurrent,
  onApplyCurrent,
}) => {
  const { t } = useTranslation();
  const tabLabel = t(`tabs.${activeTab}`);

  // Обертки для функций, которые ожидает ProfileManager
  const handleProfileCreate = (name: string) => {
    onProfileCreate(name, settings);
  };

  const handleProfileSave = (profileId: string, settingsParam: any) => {
    onProfileSave(profileId, settingsParam);
  };

  return (
    <div
      className={`
        flex items-center justify-between p-4 border-b
        ${
          isDarkTheme
            ? "bg-gray-800 border-gray-700"
            : "bg-gray-50 border-gray-200"
        }
      `}
    >
      <div className="flex flex-col md:flex-row md:items-left md:justify-between w-full gap-2">
        {/* Менеджер профилей */}
        <ProfileManager
          isDarkTheme={isDarkTheme}
          currentSettings={settings}
          profiles={profiles}
          activeProfileId={activeProfileId}
          onProfileSelect={onProfileSelect}
          onProfileCreate={handleProfileCreate}
          onProfileSave={handleProfileSave}
          onProfileRename={onProfileRename}
          onProfileDelete={onProfileDelete}
          onProfileExport={onProfileExport}
          onProfileImport={onProfileImport}
        />

        {/* Кнопки управления файлами */}
        <FileOperationsBlock
          isDarkTheme={isDarkTheme}
          isLoading={isLoading}
          tabLabel={tabLabel}
          onReadAll={onReadAll}
          onApplyAll={onApplyAll}
          onReadCurrent={onReadCurrent}
          onApplyCurrent={onApplyCurrent}
        />
      </div>
    </div>
  );
};

export default AppToolbar;
