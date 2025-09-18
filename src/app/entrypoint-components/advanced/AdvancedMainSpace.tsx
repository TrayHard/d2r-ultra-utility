import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLogger } from "../../../shared/utils/logger.ts";
import AdvancedMainSpaceBody, { TabType } from "./AdvancedMainSpaceBody.tsx";
import Tabs, { TabItem } from "../../../shared/components/Tabs.tsx";
import AppToolbar from "../../../shared/components/AppToolbar.tsx";
import Modal from "../../../shared/components/Modal.tsx";
import Button from "../../../shared/components/Button.tsx";
import { useSettings } from "../../providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../../shared/components/Message/MessageProvider.tsx";
import { useTextWorker } from "../../../shared/hooks/useTextWorker.ts";
import { useCommonItemsWorker } from "../../../shared/hooks/useCommonItemsWorker.ts";
import { useGemsWorker } from "../../../shared/hooks/useGemsWorker.ts";
import { useItemsWorker } from "../../../shared/hooks/useItemsWorker.ts";
import { useApplyAllWorker } from "../../../shared/hooks/useApplyAllWorker.ts";
import basesData from "../../../pages/items/bases.json";
// no storage keys needed here anymore

interface MainSpaceProps {
  isDarkTheme: boolean;
}

const AdvancedMainSpace: React.FC<MainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const logger = useLogger("MainSpace");
  const [activeTab, setActiveTab] = useState<TabType>("common");
  const [confirmAction, setConfirmAction] = useState<
    null | "readAll" | "applyAll" | "readCurrent" | "applyCurrent"
  >(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

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
    getAllSettings,
    getSelectedLocales,
    settings,
    profiles,
    immutableProfiles,
    activeProfileId,
    createProfile,
    saveProfile,
    loadProfile,
    renameProfile,
    deleteProfile,
    duplicateProfile,
    exportProfile,
    importProfile,
    getAppMode,
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
      title?: string,
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    () => settings.runes,
    "advanced", // разрешенный режим
    getAppMode,
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
      title?: string,
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getCommonSettings,
    "advanced", // разрешенный режим
    getAppMode,
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
      title?: string,
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getGemSettings,
    "advanced", // разрешенный режим
    getAppMode,
  );

  // Подготавливаем данные для хука предметов
  const itemsForWorker = useMemo(() => {
    // Фильтруем дубли по id
    const uniqueItems = (basesData as any[]).filter(
      (item, index, arr) => arr.findIndex((i) => i.id === item.id) === index,
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
      title?: string,
    ) => {
      if (isBulkLoading && type === "success") return;
      sendMessage(message, { type, title });
    },
    t,
    getItemsSettings,
    getSelectedLocales,
    itemsForWorker,
    "advanced", // разрешенный режим
    getAppMode,
  );

  // Единый агрегатор записи
  const { applyAllChanges } = useApplyAllWorker(
    (message, opts) => {
      if (isBulkLoading && opts?.type === "success") return;
      sendMessage(message, { type: opts?.type, title: opts?.title });
    },
    t,
    getAllSettings,
    getSelectedLocales,
    "advanced",
    getAppMode,
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

  const executeReadAll = useCallback(async () => {
    logger.info(
      "Starting bulk read operation for all file types",
      undefined,
      "executeReadAll",
    );
    setIsBulkLoading(true);
    muteTypes(["success"]);
    const results = await Promise.allSettled([
      readCommonItemsFromFiles(),
      readItemsFromFiles(),
      readRunesFromFiles(),
      readGemsFromFiles(),
    ]);
    setIsBulkLoading(false);
    unmute();
    const hasError = results.some((r) => r.status === "rejected");
    if (hasError) {
      const details = results.map((r, idx) => {
        if (r.status === "rejected") {
          return {
            index: idx,
            error:
              r.reason instanceof Error ? r.reason.message : String(r.reason),
          };
        }
        return { index: idx, value: "ok" };
      });
      logger.error(
        "One or more read operations failed",
        new Error("Bulk read failure"),
        { details },
        "executeReadAll",
      );
    }

    logger.info(
      "Completed bulk read operation",
      { hasError, resultCount: results.length },
      "executeReadAll",
    );

    if (!hasError) {
      sendMessage(
        t("messages.success.allLoaded") || "All settings loaded successfully",
        { type: "success", title: t("messages.success.filesLoaded") },
      );
    }
  }, [
    muteTypes,
    readCommonItemsFromFiles,
    readItemsFromFiles,
    readRunesFromFiles,
    readGemsFromFiles,
    unmute,
    sendMessage,
    t,
  ]);

  const executeApplyAll = useCallback(async () => {
    logger.info(
      "Starting aggregated apply operation",
      undefined,
      "executeApplyAll",
    );
    await applyAllChanges();
    logger.info(
      "Completed aggregated apply operation",
      undefined,
      "executeApplyAll",
    );
  }, [applyAllChanges, logger]);

  const handleConfirm = () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "readAll") executeReadAll();
    else if (action === "applyAll") executeApplyAll();
    else if (action === "readCurrent") readFromFiles();
    else if (action === "applyCurrent") applyChanges();
  };

  const handleCancel = () => setConfirmAction(null);

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
        immutableProfiles={immutableProfiles}
        activeProfileId={activeProfileId}
        isLoading={isLoading}
        onProfileSelect={loadProfile}
        onProfileCreate={createProfile}
        onProfileSave={saveProfile}
        onProfileRename={renameProfile}
        onProfileDelete={deleteProfile}
        onProfileDuplicate={duplicateProfile}
        onProfileExport={exportProfile}
        onProfileImport={importProfile}
        onReadAll={() => setConfirmAction("readAll")}
        onApplyAll={() => setConfirmAction("applyAll")}
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
          <AdvancedMainSpaceBody
            activeTab={activeTab}
            isDarkTheme={isDarkTheme}
            onReadFromFiles={readFromFiles}
            onApplyChanges={applyChanges}
          />
        </div>
      </div>

      {/* Универсальное модальное окно подтверждения */}
      <Modal
        isOpen={!!confirmAction}
        onClose={handleCancel}
        title={
          confirmAction === "readAll" || confirmAction === "readCurrent"
            ? t("runePage.textWorker.readFromFiles")
            : t("runePage.confirmModal.title")
        }
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {confirmAction === "readAll" || confirmAction === "readCurrent"
              ? t("runePage.textWorker.readConfirmMessage") ||
                "Вы уверены, что хотите прочитать настройки из файлов? Текущие несохраненные изменения в настройках могут быть перезаписаны."
              : t("runePage.confirmModal.message")}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleCancel}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("runePage.confirmModal.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleConfirm}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {confirmAction === "readAll" || confirmAction === "readCurrent"
                ? t("runePage.textWorker.readFromFiles") || "Прочитать"
                : t("runePage.confirmModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdvancedMainSpace;
