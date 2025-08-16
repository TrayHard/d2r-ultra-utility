import React from "react";
import { useTranslation } from "react-i18next";
import { mdiFileDocumentMultiple, mdiCheck } from "@mdi/js";
import Button from "./Button.tsx";
import ProfileManager from "./ProfileManager.tsx";

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
  onReadFromFiles: () => void;
  onApplyClick: () => void;
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
  onReadFromFiles,
  onApplyClick,
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
      <div className="flex justify-between items-center w-full">
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
        <div className="flex gap-2">
          <Button
            variant="info"
            onClick={onReadFromFiles}
            isLoading={isLoading}
            isDarkTheme={isDarkTheme}
            icon={mdiFileDocumentMultiple}
          >
            {t("runePage.textWorker.readFromFilesFor", { tab: tabLabel })}
          </Button>

          <Button
            variant="success"
            onClick={onApplyClick}
            disabled={isLoading}
            isDarkTheme={isDarkTheme}
            icon={mdiCheck}
          >
            {t("runePage.textWorker.applyFor", { tab: tabLabel })}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppToolbar;
