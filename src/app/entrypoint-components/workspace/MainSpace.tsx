import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import MainSpaceBody, { TabType } from "./MainSpaceBody.tsx";
import Tabs, { TabItem } from "../../../shared/components/Tabs.tsx";
import AppToolbar from "../../../shared/components/AppToolbar.tsx";
import Modal from "../../../shared/components/Modal.tsx";
import Button from "../../../shared/components/Button.tsx";
import Checkbox from "../../../shared/components/Checkbox.tsx";
import { useSettings } from "../../providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../../shared/components/Message/MessageProvider.tsx";
import { useTextWorker } from "../../../shared/hooks/useTextWorker.ts";
import { useCommonItemsWorker } from "../../../shared/hooks/useCommonItemsWorker.ts";
import { useGemsWorker } from "../../../shared/hooks/useGemsWorker.ts";
import { useItemsWorker } from "../../../shared/hooks/useItemsWorker.ts";
import basesData from "../../../pages/items/bases.json";
import { loadSavedSettings } from "../../../shared/utils/commonUtils.ts";

interface MainSpaceProps {
  isDarkTheme: boolean;
}

const MainSpace: React.FC<MainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("common");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInitialLoadModal, setShowInitialLoadModal] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Хуки для работы с настройками
  const {
    updateRuneSettings,
    updateCommonItemSettings,
    updatePotionLevelSettings,
    updateGemGroupSettings,
    updateGemLevelSettings,
    updateItemsLevelSettings,
    updateItemSettings,
    getCommonSettings,
    getGemSettings,
    getItemsSettings,
    getSelectedLocales,
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

  const { sendMessage, muteTypes, unmute } = useGlobalMessage();

  // Хук для рун
  const {
    isLoading: isRunesLoading,
    error: runesError,
    readFromFiles: readRunesFromFiles,
    applyChanges: applyRunesChanges,
  } = useTextWorker(
    updateRuneSettings,
    (
      message: string,
      type?: "success" | "error" | "warning" | "info",
      title?: string
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    () => settings.runes
  );

  // Хук для обычных предметов
  const {
    isLoading: isCommonItemsLoading,
    error: commonItemsError,
    readFromFiles: readCommonItemsFromFiles,
    applyCommonItemsChanges,
  } = useCommonItemsWorker(
    updateCommonItemSettings,
    updatePotionLevelSettings,
    (
      message: string,
      type?: "success" | "error" | "warning" | "info",
      title?: string
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getCommonSettings
  );

  // Хук для драгоценных камней
  const {
    isLoading: isGemsLoading,
    error: gemsError,
    readFromFiles: readGemsFromFiles,
    applyGemsChanges,
  } = useGemsWorker(
    updateGemGroupSettings,
    updateGemLevelSettings,
    (
      message: string,
      type?: "success" | "error" | "warning" | "info",
      title?: string
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getGemSettings
  );

  // Подготавливаем данные для хука предметов
  const itemsForWorker = useMemo(() => {
    // Фильтруем дубли по id
    const uniqueItems = (basesData as any[]).filter(
      (item, index, arr) => arr.findIndex((i) => i.id === item.id) === index
    );
    return uniqueItems.map((item) => ({
      key: item.key,
      id: item.id,
    }));
  }, []);

  // Хук для предметов
  const {
    isLoading: isItemsLoading,
    error: itemsError,
    readFromFiles: readItemsFromFiles,
    applyChanges: applyItemsChanges,
  } = useItemsWorker(
    updateItemsLevelSettings,
    updateItemSettings,
    (
      message: string,
      type?: "success" | "error" | "warning" | "info",
      title?: string
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getItemsSettings,
    getSelectedLocales,
    itemsForWorker
  );

  // Определяем, какой хук использовать в зависимости от активного таба
  const isLoading =
    activeTab === "runes"
      ? isRunesLoading
      : activeTab === "common"
      ? isCommonItemsLoading
      : activeTab === "gems"
      ? isGemsLoading
      : activeTab === "items"
      ? isItemsLoading
      : false;
  const error =
    activeTab === "runes"
      ? runesError
      : activeTab === "common"
      ? commonItemsError
      : activeTab === "gems"
      ? gemsError
      : activeTab === "items"
      ? itemsError
      : null;
  const readFromFiles =
    activeTab === "runes"
      ? readRunesFromFiles
      : activeTab === "common"
      ? readCommonItemsFromFiles
      : activeTab === "gems"
      ? readGemsFromFiles
      : activeTab === "items"
      ? readItemsFromFiles
      : () => {};
  const applyChanges =
    activeTab === "runes"
      ? applyRunesChanges
      : activeTab === "common"
      ? applyCommonItemsChanges
      : activeTab === "gems"
      ? applyGemsChanges
      : activeTab === "items"
      ? applyItemsChanges
      : () => {};

  // Показать модалку предложения загрузки при старте, если путь известен
  useEffect(() => {
    const saved = loadSavedSettings();
    const suppressed = localStorage.getItem("d2r-startup-load-dont-ask") === "true";
    if (saved?.homeDirectory && !suppressed) {
      setShowInitialLoadModal(true);
    }
  }, []);

  const handleConfirmInitialLoad = async () => {
    setShowInitialLoadModal(false);
    setIsBulkLoading(true);
    muteTypes(["success"]);
    if (dontAskAgain) {
      localStorage.setItem("d2r-startup-load-dont-ask", "true");
    }
    const results = await Promise.allSettled([
      readCommonItemsFromFiles(),
      readItemsFromFiles(),
      readRunesFromFiles(),
      readGemsFromFiles(),
    ]);
    setIsBulkLoading(false);
    unmute();
    const hasError = results.some((r) => r.status === "rejected");
    if (!hasError) {
      sendMessage(
        t("messages.success.allLoaded") || "All settings loaded successfully",
        { type: "success", title: t("messages.success.filesLoaded") }
      );
    }
  };

  const handleCancelInitialLoad = () => {
    setShowInitialLoadModal(false);
    if (dontAskAgain) {
      localStorage.setItem("d2r-startup-load-dont-ask", "true");
    }
  };

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
  ];

  return (
    <div
      className={`flex-1 grid ${
        error ? "grid-rows-[auto_auto_44px_1fr]" : "grid-rows-[auto_44px_1fr]"
      } ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* AppToolbar - показывается на всех вкладках */}
      <AppToolbar
        isDarkTheme={isDarkTheme}
        settings={settings}
        profiles={profiles}
        activeProfileId={activeProfileId}
        isLoading={isLoading}
        activeTab={activeTab}
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

      {/* Error Display для всех табов */}
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
          <MainSpaceBody
            activeTab={activeTab}
            isDarkTheme={isDarkTheme}
            onReadFromFiles={readFromFiles}
            onApplyChanges={applyChanges}
          />
        </div>
      </div>

      {/* Модальное окно подтверждения для всех табов */}
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

      {/* Модалка при запуске для загрузки всех настроек из файлов */}
      <Modal
        isOpen={showInitialLoadModal}
        onClose={handleCancelInitialLoad}
        title={t("startupLoadModal.title")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("startupLoadModal.message")}
          </p>
          <div className="pt-1">
            <Checkbox
              checked={dontAskAgain}
              onChange={setDontAskAgain}
              isDarkTheme={isDarkTheme}
              size="md"
              label={t("startupLoadModal.dontAsk")}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCancelInitialLoad}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("startupLoadModal.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmInitialLoad}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("startupLoadModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MainSpace;
