import React from "react";
// icons are used inside FileOperationsBlock; keep i18n import only here
import ProfileManager from "./ProfileManager.tsx";
import FileOperationsBlock from "./FileOperationsBlock";

interface AppToolbarProps {
  isDarkTheme: boolean;
  settings: any;
  profiles: any;
  immutableProfiles: any;
  activeProfileId: string | null;
  isLoading: boolean;
  onProfileSelect: (id: string) => void;
  onProfileCreate: (name: string, settings: any) => void;
  onProfileSave: (profileId: string, settings: any) => void;
  onProfileRename: (id: string, name: string) => void;
  onProfileDelete: (id: string) => void;
  onProfileDuplicate: (id: string) => void;
  onProfileExport: (id: string) => void;
  onProfileImport: (data: any) => void;
  onReadAll: () => void;
  onApplyAll: () => void;
}

const AppToolbar: React.FC<AppToolbarProps> = ({
  isDarkTheme,
  settings,
  profiles,
  immutableProfiles,
  activeProfileId,
  isLoading,
  onProfileSelect,
  onProfileCreate,
  onProfileSave,
  onProfileRename,
  onProfileDelete,
  onProfileDuplicate,
  onProfileExport,
  onProfileImport,
  onReadAll,
  onApplyAll,
}) => {
  

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
          immutableProfiles={immutableProfiles}
          activeProfileId={activeProfileId}
          onProfileSelect={onProfileSelect}
          onProfileCreate={handleProfileCreate}
          onProfileSave={handleProfileSave}
          onProfileRename={onProfileRename}
          onProfileDelete={onProfileDelete}
          onProfileDuplicate={onProfileDuplicate}
          onProfileExport={onProfileExport}
          onProfileImport={onProfileImport}
        />

        {/* Кнопки управления файлами */}
        <FileOperationsBlock
          isDarkTheme={isDarkTheme}
          isLoading={isLoading}
          onReadAll={onReadAll}
          onApplyAll={onApplyAll}
        />
      </div>
    </div>
  );
};

export default AppToolbar;
