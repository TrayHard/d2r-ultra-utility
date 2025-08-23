import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../../shared/components/Message/MessageProvider.tsx";
import { useTextWorker } from "../../../shared/hooks/useTextWorker.ts";
import { useCommonItemsWorker } from "../../../shared/hooks/useCommonItemsWorker.ts";
import { useGemsWorker } from "../../../shared/hooks/useGemsWorker.ts";
import { useItemsWorker } from "../../../shared/hooks/useItemsWorker.ts";
import basesData from "../../../pages/items/bases.json";
import type { AppSettings } from "../../providers/SettingsContext.tsx";

interface BasicMainSpaceProps {
  isDarkTheme: boolean;
}

const BasicMainSpace: React.FC<BasicMainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    profiles,
    immutableProfiles,
    loadProfile,
    deleteProfile,
    getAllSettings,
    activeProfileId,
    // workers deps
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
  } = useSettings();

  const { sendMessage, muteTypes, unmute } = useGlobalMessage();

  // workers
  const {
    applyChanges: applyRunesChanges,
  } = useTextWorker(
    updateRuneSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    () => settings.runes
  );

  const { applyCommonItemsChanges } = useCommonItemsWorker(
    updateCommonItemSettings,
    updatePotionLevelSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    getCommonSettings
  );

  const { applyGemsChanges } = useGemsWorker(
    updateGemGroupSettings,
    updateGemLevelSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    getGemSettings
  );

  // Подготовка списка предметов как в Advanced
  const itemsForWorker = useMemo(() => {
    const uniqueItems = (basesData as any[]).filter(
      (item, index, arr) => arr.findIndex((i) => i.id === item.id) === index
    );
    return uniqueItems.map((item) => ({ key: item.key, id: item.id }));
  }, []);

  const { applyChanges: applyItemsChanges } = useItemsWorker(
    updateItemsLevelSettings,
    updateItemSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    getItemsSettings,
    getSelectedLocales,
    itemsForWorker
  );

  // Рефы с актуальными функциями применения (чтобы избежать устаревших замыканий)
  const applyRunesRef = useRef(applyRunesChanges);
  const applyCommonRef = useRef(applyCommonItemsChanges);
  const applyGemsRef = useRef(applyGemsChanges);
  const applyItemsRef = useRef(applyItemsChanges);
  useEffect(() => { applyRunesRef.current = applyRunesChanges; }, [applyRunesChanges]);
  useEffect(() => { applyCommonRef.current = applyCommonItemsChanges; }, [applyCommonItemsChanges]);
  useEffect(() => { applyGemsRef.current = applyGemsChanges; }, [applyGemsChanges]);
  useEffect(() => { applyItemsRef.current = applyItemsChanges; }, [applyItemsChanges]);

  const [query, setQuery] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const defaultProfile = useMemo(
    () => immutableProfiles.find((p) => p.isDefault),
    [immutableProfiles]
  );

  const recommendedProfiles = useMemo(
    () => immutableProfiles.filter((p) => !p.isDefault),
    [immutableProfiles]
  );

  const filteredRecommended = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recommendedProfiles;
    return recommendedProfiles.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [recommendedProfiles, query]);

  const filteredUserProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [profiles, query]);

  const executeApplyAll = useCallback(async () => {
    muteTypes(["success"]);
    try {
      const results = await Promise.allSettled([
        applyCommonRef.current?.(),
        applyItemsRef.current?.(),
        applyRunesRef.current?.(),
        applyGemsRef.current?.(),
      ]);
      const hasError = results.some((r) => r && r.status === "rejected");
      if (!hasError) {
        sendMessage("Изменения применены", { type: "success", title: "Сохранено" });
      }
    } finally {
      unmute();
    }
  }, [muteTypes, unmute, sendMessage]);

  const activeProfileIdRef = useRef(activeProfileId);
  useEffect(() => { activeProfileIdRef.current = activeProfileId; }, [activeProfileId]);

  const waitForProfileLoaded = useCallback(async (targetId: string, prevSettings: AppSettings) => {
    const maxAttempts = 80; // ~2s при 25ms шаге
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const idReady = activeProfileIdRef.current === targetId;
      const settingsReady = getAllSettings() !== prevSettings;
      if (idReady && settingsReady) return;
      await new Promise((r) => setTimeout(r, 25));
    }
  }, [getAllSettings]);

  const handleApplyProfile = useCallback(async (profileId: string) => {
    setIsApplying(true);
    try {
      if (activeProfileId === profileId) {
        await executeApplyAll();
        return;
      }
      const prevSettings = getAllSettings();
      loadProfile(profileId);
      await waitForProfileLoaded(profileId, prevSettings);
      await executeApplyAll();
    } finally {
      setIsApplying(false);
    }
  }, [activeProfileId, getAllSettings, loadProfile, waitForProfileLoaded, executeApplyAll]);

  const handleDisableLootfilters = useCallback(async () => {
    if (defaultProfile) {
      setIsApplying(true);
      try {
        if (activeProfileId !== defaultProfile.id) {
          const prevSettings = getAllSettings();
          loadProfile(defaultProfile.id);
          await waitForProfileLoaded(defaultProfile.id, prevSettings);
        }
        await executeApplyAll();
      } finally {
        setIsApplying(false);
      }
    }
  }, [defaultProfile, activeProfileId, getAllSettings, loadProfile, waitForProfileLoaded, executeApplyAll]);

  const listContainerClasses = `mt-4 border rounded-lg ${isDarkTheme ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"} h-96 overflow-y-auto`;
  const sectionTitleClasses = `px-3 pt-3 text-xs uppercase tracking-wide ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`;
  const itemClasses = `flex items-center justify-between px-3 py-2 ${isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-50"}`;
  const nameClasses = `truncate max-w-[60%] ${isDarkTheme ? "text-gray-200" : "text-gray-800"}`;
  const applyBtnClasses = `px-2 py-1 text-xs rounded ${isDarkTheme ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-yellow-500 hover:bg-yellow-400 text-white"}`;
  const deleteBtnClasses = `ml-2 px-2 py-1 text-xs rounded ${isDarkTheme ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"}`;

  return (
    <div className={`flex-1 ${isDarkTheme ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`h-full ${isDarkTheme ? "bg-gray-800" : "bg-white"}`}>
        {isApplying && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: isDarkTheme ? "rgba(17,24,39,0.6)" : "rgba(243,244,246,0.6)" }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-500 rounded-full animate-spin"></div>
              <div className={`text-lg font-medium ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Применяем...</div>
            </div>
          </div>
        )}
        <div className="max-w-xl mx-auto px-4 py-8">
          <h1 className={`text-2xl font-bold text-center ${isDarkTheme ? "text-white" : "text-gray-900"}`}>Лутфильтры</h1>
          <div className="mt-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск профилей..."
              className={`w-full px-3 py-2 rounded border focus:outline-none ${
                isDarkTheme
                  ? "bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-yellow-600"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-yellow-500"
              }`}
            />
          </div>

          <div className={listContainerClasses}>
            {filteredRecommended.length > 0 && (
              <>
                <div className={sectionTitleClasses}>Рекомендованные</div>
                <ul>
                  {filteredRecommended.map((p) => (
                    <li key={p.id} className={itemClasses}>
                      <span className={nameClasses} title={p.name}>{p.name}</span>
                      <div className="flex items-center">
                        <button className={applyBtnClasses} onClick={() => handleApplyProfile(p.id)}>Применить</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className={sectionTitleClasses}>Пользовательские</div>
            <ul>
              {filteredUserProfiles.map((p) => (
                <li key={p.id} className={itemClasses}>
                  <span className={nameClasses} title={p.name}>{p.name}</span>
                  <div className="flex items-center">
                    <button className={applyBtnClasses} onClick={() => handleApplyProfile(p.id)}>Применить</button>
                    <button className={deleteBtnClasses} onClick={() => deleteProfile(p.id)} aria-label="Удалить профиль">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              className={`px-4 py-2 rounded font-medium ${
                isDarkTheme ? "bg-gray-700 hover:bg-gray-600 text-gray-100" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              onClick={handleDisableLootfilters}
              disabled={!defaultProfile}
            >
              Выключить лутфильтры
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicMainSpace;

