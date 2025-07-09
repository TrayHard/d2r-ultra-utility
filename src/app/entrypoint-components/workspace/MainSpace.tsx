import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import MainSpaceBody, { TabType } from "./MainSpaceBody.tsx";
import Tabs, { TabItem } from "../../../shared/components/Tabs.tsx";
import AppToolbar from "../../../shared/components/AppToolbar.tsx";
import Modal from "../../../shared/components/Modal.tsx";
import Button from "../../../shared/components/Button.tsx";
import { useSettings } from "../../providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../../shared/components/Message/MessageProvider.tsx";
import { useTextWorker } from "../../../shared/hooks/useTextWorker.ts";

interface MainSpaceProps {
  isDarkTheme: boolean;
}

const MainSpace: React.FC<MainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("common");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Хуки для работы с рунами (только когда активен таб рун)
  const {
    updateRuneSettings,
    settings,
    profiles,
    activeProfileId,
    createProfile,
    saveProfile,
    loadProfile,
    renameProfile,
    deleteProfile,
    exportProfile,
    importProfile,
  } = useSettings();

  const { sendMessage } = useGlobalMessage();

  const { isLoading, error, readFromFiles, applyChanges } = useTextWorker(
    updateRuneSettings,
    (message, type, title) => sendMessage(message, { type, title }),
    t,
    () => settings.runes
  );

  const handleApplyClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmApply = () => {
    setShowConfirmModal(false);
    applyChanges();
  };

  const handleCancelApply = () => {
    setShowConfirmModal(false);
  };

  const tabs: TabItem[] = [
    { id: "common", label: t("tabs.common") },
    { id: "items", label: t("tabs.items") },
    { id: "runes", label: t("tabs.runes") },
    { id: "gems", label: t("tabs.gems") },
    { id: "skills", label: t("tabs.skills") },
  ];

  return (
    <div
      className={`flex-1 grid ${
        activeTab === "runes" && error
          ? "grid-rows-[auto_auto_44px_1fr]"
          : "grid-rows-[auto_44px_1fr]"
      } ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* AppToolbar - показывается на всех вкладках */}
      <AppToolbar
        isDarkTheme={isDarkTheme}
        settings={settings}
        profiles={profiles}
        activeProfileId={activeProfileId}
        isLoading={isLoading}
        onProfileSelect={loadProfile}
        onProfileCreate={createProfile}
        onProfileSave={saveProfile}
        onProfileRename={renameProfile}
        onProfileDelete={deleteProfile}
        onProfileExport={exportProfile}
        onProfileImport={importProfile}
        onReadFromFiles={readFromFiles}
        onApplyClick={handleApplyClick}
      />

      {/* Error Display для рун */}
      {activeTab === "runes" && error && (
        <div
          className={`
            mx-4 mt-4 px-4 py-2 rounded-lg border
            ${
              isDarkTheme
                ? "bg-red-900/50 border-red-700 text-red-300"
                : "bg-red-50 border-red-300 text-red-700"
            }
          `}
        >
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        isDarkTheme={isDarkTheme}
      />

      {/* Tab Content */}
      <div className="flex-1">
        <div className={`h-full ${isDarkTheme ? "bg-gray-800" : "bg-white"}`}>
          <MainSpaceBody activeTab={activeTab} isDarkTheme={isDarkTheme} />
        </div>
      </div>

      {/* Модальное окно подтверждения для рун */}
      <Modal
        isOpen={showConfirmModal}
        onClose={handleCancelApply}
        title={t("runePage.confirmModal.title")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("runePage.confirmModal.message")}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCancelApply}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("runePage.confirmModal.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmApply}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("runePage.confirmModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MainSpace;
