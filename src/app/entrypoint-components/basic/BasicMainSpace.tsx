import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../../shared/components/Message/MessageProvider.tsx";
import { useTextWorker } from "../../../shared/hooks/useTextWorker.ts";
import { useCommonItemsWorker } from "../../../shared/hooks/useCommonItemsWorker.ts";
import { useGemsWorker } from "../../../shared/hooks/useGemsWorker.ts";
import { useItemsWorker } from "../../../shared/hooks/useItemsWorker.ts";
import basesData from "../../../pages/items/bases.json";
import type { AppSettings } from "../../providers/SettingsContext.tsx";
import Icon from "@mdi/react";
import { mdiDelete } from "@mdi/js";
import Modal from "../../../shared/components/Modal.tsx";
import Button from "../../../shared/components/Button.tsx";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readTextFile as tauriReadTextFile } from "@tauri-apps/plugin-fs";
import { Tooltip } from "antd";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BasicMainSpaceProps {
  isDarkTheme: boolean;
}

interface SortableProfileItemProps {
  profile: { id: string; name: string };
  isDarkTheme: boolean;
  isEditing: boolean;
  editingName: string;
  itemClasses: string;
  nameClasses: string;
  deleteBtnClasses: string;
  applyBtnClasses: string;
  onStartEditing: (id: string, name: string) => void;
  onEditingNameChange: (name: string) => void;
  onCommitEditing: () => void;
  onCancelEditing: () => void;
  onDelete: (id: string) => void;
  onApply: (id: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  t: (key: string) => string;
}

const SortableProfileItem: React.FC<SortableProfileItemProps> = ({
  profile,
  isDarkTheme,
  isEditing,
  editingName,
  itemClasses,
  nameClasses,
  deleteBtnClasses,
  applyBtnClasses,
  onStartEditing,
  onEditingNameChange,
  onCommitEditing,
  onCancelEditing,
  onDelete,
  onApply,
  inputRef,
  t,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: profile.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${itemClasses} ${
        isDragging ? "shadow-lg opacity-90 z-10" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="mr-2 cursor-move text-gray-400 select-none"
      >
        ⋮⋮
      </div>
      <button
        className={deleteBtnClasses}
        onClick={() => onDelete(profile.id)}
        aria-label="Удалить профиль"
      >
        <Icon path={mdiDelete} size={0.6} />
      </button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          onBlur={onCommitEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitEditing();
            if (e.key === "Escape") onCancelEditing();
          }}
          className={`${nameClasses} text-left bg-transparent focus:outline-none border-0 p-0 mr-2`}
        />
      ) : (
        <div className="flex items-center justify-start flex-1">
          <Tooltip
            title={t("basicMainSpace.tooltips.clickToRename")}
            placement="top"
            mouseEnterDelay={0}
          >
            <span
              className={`truncate ${
                isDarkTheme ? "text-gray-200" : "text-gray-800"
              }`}
              onClick={() => onStartEditing(profile.id, profile.name)}
            >
              {profile.name}
            </span>
          </Tooltip>
        </div>
      )}
      <div className="flex items-center">
        <button className={applyBtnClasses} onClick={() => onApply(profile.id)}>
          ✓ {t("basicMainSpace.buttons.apply")}
        </button>
      </div>
    </li>
  );
};

const BasicMainSpace: React.FC<BasicMainSpaceProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    profiles,
    immutableProfiles,
    loadProfile,
    renameProfile,
    reorderUserProfiles,
    deleteProfile,
    importProfile,
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
    getAppMode,
  } = useSettings();

  const { sendMessage, muteTypes, unmute } = useGlobalMessage();

  // Helper: check duplicate profile name
  const isDuplicateProfileName = useCallback(
    (name?: string) => {
      if (!name) return false;
      const target = name.trim().toLowerCase();
      const allNames = [...profiles, ...immutableProfiles].map((p) =>
        (p.name || "").trim().toLowerCase()
      );
      return allNames.includes(target);
    },
    [profiles, immutableProfiles]
  );

  // Генерация уникального имени: "Имя (n)"
  const getUniqueProfileName = useCallback(
    (originalName?: string) => {
      const baseName =
        (originalName && originalName.trim()) || "Безымянный профиль";
      const allNames = new Set(
        [...profiles, ...immutableProfiles].map((p) =>
          (p.name || "").trim().toLowerCase()
        )
      );
      if (!allNames.has(baseName.toLowerCase())) return baseName;
      let counter = 2; // если уже есть точное совпадение, начинаем с (2)
      // Ищем свободный суффикс
      // пример: "Имя (2)", "Имя (3)" и т.д.
      // Останавливаемся, когда найдём первый свободный
      while (true) {
        const candidate = `${baseName} (${counter})`;
        if (!allNames.has(candidate.toLowerCase())) return candidate;
        counter++;
      }
    },
    [profiles, immutableProfiles]
  );

  // workers
  const { applyChanges: applyRunesChanges } = useTextWorker(
    updateRuneSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    () => settings.runes,
    "basic", // разрешенный режим
    getAppMode
  );

  const { applyCommonItemsChanges } = useCommonItemsWorker(
    updateCommonItemSettings,
    updatePotionLevelSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    getCommonSettings,
    "basic", // разрешенный режим
    getAppMode
  );

  const { applyGemsChanges } = useGemsWorker(
    updateGemGroupSettings,
    updateGemLevelSettings,
    (message, type, title) => {
      sendMessage(message, { type, title });
    },
    t,
    getGemSettings,
    "basic", // разрешенный режим
    getAppMode
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
    itemsForWorker,
    "basic", // разрешенный режим
    getAppMode
  );

  // Рефы с актуальными функциями применения (чтобы избежать устаревших замыканий)
  const applyRunesRef = useRef(applyRunesChanges);
  const applyCommonRef = useRef(applyCommonItemsChanges);
  const applyGemsRef = useRef(applyGemsChanges);
  const applyItemsRef = useRef(applyItemsChanges);
  useEffect(() => {
    applyRunesRef.current = applyRunesChanges;
  }, [applyRunesChanges]);
  useEffect(() => {
    applyCommonRef.current = applyCommonItemsChanges;
  }, [applyCommonItemsChanges]);
  useEffect(() => {
    applyGemsRef.current = applyGemsChanges;
  }, [applyGemsChanges]);
  useEffect(() => {
    applyItemsRef.current = applyItemsChanges;
  }, [applyItemsChanges]);

  const [query, setQuery] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    return recommendedProfiles.filter((p) =>
      (p.name || "").toLowerCase().includes(q)
    );
  }, [recommendedProfiles, query]);

  const filteredUserProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [profiles, query]);

  // Фокус на поле при начале редактирования
  useEffect(() => {
    if (editingProfileId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingProfileId]);

  const startEditing = useCallback((profileId: string, currentName: string) => {
    setEditingProfileId(profileId);
    setEditingName(currentName);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingProfileId(null);
    setEditingName("");
  }, []);

  const commitEditing = useCallback(() => {
    if (!editingProfileId) return;
    const newName = editingName.trim();
    if (!newName) {
      cancelEditing();
      return;
    }
    // Проверяем дубли среди всех профилей, кроме текущего
    const lower = newName.toLowerCase();
    const exists = [...profiles, ...immutableProfiles].some(
      (p) =>
        p.id !== editingProfileId &&
        (p.name || "").trim().toLowerCase() === lower
    );
    if (exists) {
      sendMessage(t("basicMainSpace.messages.profileExists"), {
        type: "warning",
      });
      return;
    }
    const target = profiles.find((p) => p.id === editingProfileId);
    if (!target) {
      sendMessage(t("basicMainSpace.messages.cannotRename"), { type: "error" });
      cancelEditing();
      return;
    }
    if (target.name !== newName) {
      renameProfile(editingProfileId, newName);
      sendMessage(t("basicMainSpace.messages.profileRenamed"), {
        type: "success",
      });
    }
    cancelEditing();
  }, [
    editingProfileId,
    editingName,
    profiles,
    immutableProfiles,
    renameProfile,
    sendMessage,
    cancelEditing,
  ]);

  // Сенсоры для drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Обработчик drag and drop с @dnd-kit
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        const oldIndex = filteredUserProfiles.findIndex(
          (p) => p.id === active.id
        );
        const newIndex = filteredUserProfiles.findIndex(
          (p) => p.id === over?.id
        );

        const reorderedProfiles = arrayMove(
          filteredUserProfiles,
          oldIndex,
          newIndex
        );
        const newIds = reorderedProfiles.map((p) => p.id);
        reorderUserProfiles(newIds);
      }
    },
    [filteredUserProfiles, reorderUserProfiles]
  );

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
        sendMessage("Изменения применены", {
          type: "success",
          title: "Сохранено",
        });
      }
    } finally {
      unmute();
    }
  }, [muteTypes, unmute, sendMessage]);

  const activeProfileIdRef = useRef(activeProfileId);
  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

  const waitForProfileLoaded = useCallback(
    async (targetId: string, prevSettings: AppSettings) => {
      const maxAttempts = 80; // ~2s при 25ms шаге
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const idReady = activeProfileIdRef.current === targetId;
        const settingsReady = getAllSettings() !== prevSettings;
        if (idReady && settingsReady) return;
        await new Promise((r) => setTimeout(r, 25));
      }
    },
    [getAllSettings]
  );

  const handleApplyProfile = useCallback(
    async (profileId: string) => {
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
    },
    [
      activeProfileId,
      getAllSettings,
      loadProfile,
      waitForProfileLoaded,
      executeApplyAll,
    ]
  );

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
  }, [
    defaultProfile,
    activeProfileId,
    getAllSettings,
    loadProfile,
    waitForProfileLoaded,
    executeApplyAll,
  ]);

  // Refs для стабильных функций в useEffect
  const importProfileRef = useRef(importProfile);
  const sendMessageRef = useRef(sendMessage);
  const isDuplicateProfileNameRef = useRef(isDuplicateProfileName);
  const getUniqueProfileNameRef = useRef(getUniqueProfileName);

  // Защита от дублирования импорта
  const isImportingRef = useRef(false);

  useEffect(() => {
    importProfileRef.current = importProfile;
  }, [importProfile]);

  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  useEffect(() => {
    isDuplicateProfileNameRef.current = isDuplicateProfileName;
  }, [isDuplicateProfileName]);

  useEffect(() => {
    getUniqueProfileNameRef.current = getUniqueProfileName;
  }, [getUniqueProfileName]);

  // Подписка на drag & drop события через Tauri (глобально по окну)
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    const setup = async () => {
      try {
        const win = getCurrentWebviewWindow();
        const disposer = await win.onDragDropEvent(async (e) => {
          const type = e.payload.type;
          if (type === "enter" || type === "over") {
            setIsDragOver(true);
            return;
          }
          if (type === "leave") {
            setIsDragOver(false);
            return;
          }
          if (type === "drop") {
            setIsDragOver(false);

            // Защита от дублирования импорта
            if (isImportingRef.current) {
              console.log("Import already in progress, skipping...");
              return;
            }
            isImportingRef.current = true;

            try {
              // В Tauri событии приходят пути к файлам (Windows: C:\\...)
              const paths: string[] =
                (e.payload as any)?.paths || (e.payload as any)?.files || [];
              if (!paths || paths.length === 0) return;
              const jsonPath = paths.find((p) =>
                p.toLowerCase().endsWith(".json")
              );
              if (!jsonPath) {
                sendMessageRef.current(
                  t("basicMainSpace.messages.dragFileHint"),
                  { type: "warning" }
                );
                return;
              }

              const content = await tauriReadTextFile(jsonPath);
              const data = JSON.parse(content);

              // Автогенерация уникального имени
              const uniqueName = getUniqueProfileNameRef.current(data?.name);
              const dataWithName = { ...data, name: uniqueName };

              importProfileRef.current(dataWithName);
              sendMessageRef.current(
                t("basicMainSpace.messages.profileImported"),
                {
                  type: "success",
                }
              );
            } catch (err) {
              console.error("Error importing profile via Tauri DnD:", err);
              sendMessageRef.current(t("basicMainSpace.messages.importError"), {
                type: "error",
              });
            } finally {
              // Сбрасываем флаг после небольшой задержки
              setTimeout(() => {
                isImportingRef.current = false;
              }, 100);
            }
          }
        });
        unlisten = disposer;
      } catch (err) {
        console.warn("Failed to initialize Tauri drag & drop listener", err);
      }
    };
    setup();
    return () => {
      if (unlisten) {
        unlisten();
        unlisten = null;
      }
    };
  }, []); // Пустой массив зависимостей - эффект выполняется только один раз

  const handleDeleteProfile = useCallback((profileId: string) => {
    setProfileToDelete(profileId);
  }, []);

  const confirmDeleteProfile = useCallback(() => {
    if (profileToDelete) {
      deleteProfile(profileToDelete);
      setProfileToDelete(null);
    }
  }, [profileToDelete, deleteProfile]);

  const cancelDeleteProfile = useCallback(() => {
    setProfileToDelete(null);
  }, []);

  const handleImportProfile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const fileContent = await file.text();
          const profileData = JSON.parse(fileContent);

          // Автогенерация уникального имени
          const uniqueName = getUniqueProfileName(profileData?.name);
          const dataWithName = { ...profileData, name: uniqueName };

          importProfile(dataWithName);
          sendMessage(t("basicMainSpace.messages.profileImported"), {
            type: "success",
          });
        } catch (error) {
          console.error("Error importing profile:", error);
          sendMessage(t("basicMainSpace.messages.importError"), {
            type: "error",
          });
        }
      }
    };
    input.click();
  }, [importProfile, sendMessage, getUniqueProfileName]);

  const listContainerClasses = `mt-4 border rounded-lg ${
    isDarkTheme ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
  } h-96 overflow-y-auto overflow-x-hidden`;
  const sectionTitleClasses = `px-3 pt-3 text-xs uppercase tracking-wide ${
    isDarkTheme ? "text-gray-400" : "text-gray-500"
  }`;
  const itemClasses = `flex items-center justify-between px-3 py-2 ${
    isDarkTheme ? "hover:bg-gray-700" : "hover:bg-gray-50"
  }`;
  const nameClasses = `truncate flex-1 ${
    isDarkTheme ? "text-gray-200" : "text-gray-800"
  }`;
  const applyBtnClasses = `px-2 py-1 text-xs rounded flex items-center gap-1 ${
    isDarkTheme
      ? "bg-green-600 hover:bg-green-500 text-white"
      : "bg-green-500 hover:bg-green-400 text-white"
  }`;
  const deleteBtnClasses = `mr-2 px-2 py-1 text-xs rounded ${
    isDarkTheme
      ? "bg-red-700 hover:bg-red-600 text-white"
      : "bg-red-600 hover:bg-red-500 text-white"
  }`;

  return (
    <div
      className={`flex-1 relative overflow-y-hidden`}
      onDragOver={(e) => {
        const types = Array.from(e.dataTransfer?.types || []);
        if (types.includes("Files")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        const types = Array.from(e.dataTransfer?.types || []);
        if (types.includes("Files")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div
        className={`h-full ${
          isDarkTheme
            ? "bg-gradient-to-tr from-gray-900/50 via-gray-800 to-gray-900"
            : "bg-gradient-to-br from-gray-50 via-white to-blue-100"
        }`}
      >
        {isApplying && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            style={{
              backgroundColor: isDarkTheme
                ? "rgba(17,24,39,0.6)"
                : "rgba(243,244,246,0.6)",
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-yellow-500 rounded-full animate-spin"></div>
              <div
                className={`text-lg font-medium ${
                  isDarkTheme ? "text-white" : "text-gray-900"
                }`}
              >
                {t("basicMainSpace.applying")}
              </div>
            </div>
          </div>
        )}
        {isDragOver && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            style={{
              backgroundColor: isDarkTheme
                ? "rgba(17,24,39,0.85)"
                : "rgba(243,244,246,0.85)",
            }}
          >
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center max-w-md mx-4 ${
                isDarkTheme
                  ? "border-blue-400 bg-blue-900/20"
                  : "border-blue-500 bg-blue-50"
              }`}
            >
              <div
                className={`text-4xl mb-3 ${
                  isDarkTheme ? "text-blue-400" : "text-blue-600"
                }`}
              >
                📁
              </div>
              <div
                className={`text-xl font-semibold mb-1 ${
                  isDarkTheme ? "text-blue-300" : "text-blue-700"
                }`}
              >
                {t("basicMainSpace.importProfile")}
              </div>
              <div
                className={`${isDarkTheme ? "text-blue-200" : "text-blue-600"}`}
              >
                {t("basicMainSpace.dragAndDropHint")}
              </div>
            </div>
          </div>
        )}
        <div className={`max-w-[600px] px-4 py-8`}>
          <h1
            className={`text-4xl font-bold text-center diablo-font ${
              isDarkTheme ? "text-white" : "text-gray-900"
            }`}
          >
            {t("basicMainSpace.title")}
          </h1>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDarkTheme
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              }`}
            >
              {t("basicMainSpace.buttons.howToUse")}
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("basicMainSpace.searchPlaceholder")}
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
                <div
                  className={`${sectionTitleClasses} ${
                    isDarkTheme
                      ? "border-b border-gray-700 pb-2 bg-gray-600/50"
                      : "border-b border-gray-200 pb-2 bg-gray-50/50"
                  }`}
                >
                  {t("basicMainSpace.sections.recommended")}
                </div>
                <ul className="mt-2">
                  {filteredRecommended.map((p) => (
                    <li key={p.id} className={itemClasses}>
                      <span
                        className={`${nameClasses} cursor-default`}
                        title={p.name}
                      >
                        {p.name}
                      </span>
                      <div className="flex items-center">
                        <button
                          className={applyBtnClasses}
                          onClick={() => handleApplyProfile(p.id)}
                        >
                          ✓ {t("basicMainSpace.buttons.apply")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div
              className={`${sectionTitleClasses} border-t border-b ${
                isDarkTheme
                  ? "border-gray-700 pb-2 bg-gray-600/50"
                  : "border-gray-200 pb-2 bg-gray-50/50"
              } mt-2`}
            >
              {t("basicMainSpace.sections.userProfiles")}
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredUserProfiles.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="mt-2">
                  {filteredUserProfiles.map((p) => (
                    <SortableProfileItem
                      key={p.id}
                      profile={p}
                      isDarkTheme={isDarkTheme}
                      isEditing={editingProfileId === p.id}
                      editingName={editingName}
                      itemClasses={itemClasses}
                      nameClasses={nameClasses}
                      deleteBtnClasses={deleteBtnClasses}
                      applyBtnClasses={applyBtnClasses}
                      onStartEditing={startEditing}
                      onEditingNameChange={setEditingName}
                      onCommitEditing={commitEditing}
                      onCancelEditing={cancelEditing}
                      onDelete={handleDeleteProfile}
                      onApply={handleApplyProfile}
                      inputRef={inputRef}
                      t={t}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              className={`diablo-font px-4 py-2 rounded font-medium ${
                isDarkTheme
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}
              onClick={handleImportProfile}
            >
              {t("basicMainSpace.buttons.addLootFilter")}
            </button>
            <button
              className={`diablo-font px-4 py-2 rounded font-medium ${
                isDarkTheme
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
              onClick={handleDisableLootfilters}
              disabled={!defaultProfile}
            >
              {t("basicMainSpace.buttons.disableLootFilters")}
            </button>
          </div>
        </div>
      </div>

      {/* Модалка помощи */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title={t("basicMainSpace.helpModal.title")}
        isDarkTheme={isDarkTheme}
        size="md"
      >
        <div className="space-y-4">
          <p
            className={`text-sm leading-relaxed ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <p style={{ marginBottom: "10px" }}>
              {t("basicMainSpace.helpModal.content.line1")}
            </p>
            <p style={{ marginBottom: "10px" }}>
              {t("basicMainSpace.helpModal.content.line2")}
            </p>
            <p style={{ marginBottom: "10px" }}>
              {t("basicMainSpace.helpModal.content.line3")}
            </p>
          </p>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setIsHelpModalOpen(false)}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("basicMainSpace.helpModal.close")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модалка подтверждения удаления */}
      <Modal
        isOpen={!!profileToDelete}
        onClose={cancelDeleteProfile}
        title={t("basicMainSpace.confirmDelete.title")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("basicMainSpace.confirmDelete.message")}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={cancelDeleteProfile}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("basicMainSpace.confirmDelete.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteProfile}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("basicMainSpace.confirmDelete.delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BasicMainSpace;
