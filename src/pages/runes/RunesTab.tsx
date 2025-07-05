import React, { useState } from "react";
import { useTranslation } from "react-i18next";
// import Icon from "@mdi/react";
import { mdiFileDocumentMultiple, mdiCheck } from "@mdi/js";
import Button from "../../shared/components/Button.tsx";
import Modal from "../../shared/components/Modal.tsx";
import ProfileManager from "../../shared/components/ProfileManager.tsx";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider.tsx";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import { useTextWorker } from "../../shared/hooks/useTextWorker.ts";
// import RunesGeneral from "./RunesGeneral.tsx";
import RunesSpecific from "./RunesSpecific.tsx";

interface RunesTabProps {
  isDarkTheme: boolean;
}

// type TabType = "general" | "runeSpecific";

const RunesTab: React.FC<RunesTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  // const [activeTab, setActiveTab] = useState<TabType>("runeSpecific");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Используем глобальный стейт настроек
  const {
    getRuneSettings,
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

  // Используем глобальный хук для уведомлений
  const { sendMessage } = useGlobalMessage();

  // Используем хук для работы с текстом
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

  return (
    <div className="h-full flex flex-col">
      {/* Верхний контейнер с табами и кнопками */}
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
        {/* Табы */}
        {/* <div className="flex">
          <button
            onClick={() => setActiveTab("general")}
            className={`
              px-4 py-2 text-sm font-medium rounded-l-lg rounded-r-none border-t border-l border-b transition-colors
              ${
                activeTab === "general"
                  ? isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  : isDarkTheme
                  ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900"
              }
            `}
          >
            {t("runePage.tabs.general")}
          </button>
          <button
            onClick={() => setActiveTab("runeSpecific")}
            className={`
              px-4 py-2 text-sm font-medium rounded-r-lg rounded-l-none border-t border-r border-b border-l-0 transition-colors
              ${
                activeTab === "runeSpecific"
                  ? isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                  : isDarkTheme
                  ? "bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200"
                  : "bg-gray-100 border-gray-300 text-gray-600 hover:text-gray-900"
              }
            `}
          >
            {t("runePage.tabs.runeSpecific")}
          </button>
        </div> */}

        {/* Профили и кнопки */}
        <div className="flex justify-between items-center w-full">
          {/* Менеджер профилей */}
          <ProfileManager
            isDarkTheme={isDarkTheme}
            currentSettings={settings}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onProfileSelect={loadProfile}
            onProfileCreate={createProfile}
            onProfileSave={saveProfile}
            onProfileRename={renameProfile}
            onProfileDelete={deleteProfile}
            onProfileExport={exportProfile}
            onProfileImport={importProfile}
          />

          {/* Кнопки управления файлами */}
          <div className="flex gap-2">
            <Button
              variant="info"
              onClick={readFromFiles}
              isLoading={isLoading}
              isDarkTheme={isDarkTheme}
              icon={mdiFileDocumentMultiple}
            >
              {t("runePage.textWorker.readFromFiles")}
            </Button>

            <Button
              variant="success"
              onClick={handleApplyClick}
              disabled={isLoading}
              isDarkTheme={isDarkTheme}
              icon={mdiCheck}
            >
              {t("runePage.textWorker.apply")}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
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

      {/* Контент табов */}
      <div className="flex-1 overflow-hidden">
        {/* {activeTab === "general" && <RunesGeneral isDarkTheme={isDarkTheme} />}
        {activeTab === "runeSpecific" && (
          <RunesSpecific
            isDarkTheme={isDarkTheme}
            getRuneSettings={getRuneSettings}
            updateRuneSettings={updateRuneSettings}
          />
        )} */}
        <RunesSpecific
          isDarkTheme={isDarkTheme}
          getRuneSettings={getRuneSettings}
          updateRuneSettings={updateRuneSettings}
        />
      </div>

      {/* Модальное окно подтверждения */}
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

export default RunesTab;
