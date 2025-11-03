import { useCallback, useEffect, useRef, useState } from "react";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useLogger } from "../utils/logger";
import { ensureWritable } from "../utils/fsUtils";
import {
  GAME_PATHS as COMMON_GAME_PATHS,
  loadSavedSettings,
  LocaleItem as CommonLocaleItem,
  generateFinalItemName,
  generateFinalPotionName,
  generateFinalGemName,
  generateKeyHighlightData,
} from "../utils/commonUtils";
import {
  GAME_PATHS as RUNES_GAME_PATHS,
  generateFinalRuneName,
  generateRuneHighlightData,
  SUPPORTED_LOCALES as RUNES_SUPPORTED_LOCALES,
} from "../utils/runeUtils";
import { idToRuneMapper, ERune } from "../../pages/runes/constants/runes";
import {
  gemToIdMapper,
  settingsKeyToGemMapper,
  EGem,
} from "../../pages/gems/constants/gems";
import {
  settingsKeyToCommonItemMapper,
  commonItemToIdMapper,
  commonItemFileMapper,
  ECommonItem,
} from "../../pages/common/constants/commonItems";
import type {
  AppSettings,
  ItemsSettings,
  ItemSettings,
  PotionLevelSettings,
  PotionGroupSettings,
} from "../../app/providers/SettingsContext";

type SendMessage = (
  message: string,
  options?: { type?: "success" | "error" | "warning" | "info"; title?: string }
) => void;

export const useApplyAllWorker = (
  sendMessage?: SendMessage,
  t?: (key: string, options?: any) => string,
  getAllSettings?: () => AppSettings,
  getSelectedLocales?: () => string[],
  allowedMode?: "basic" | "advanced" | null,
  getCurrentMode?: () => "basic" | "advanced"
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logger = useLogger("ApplyAllWorker");

  // Always-fresh refs to avoid stale closures when parent doesn't re-render
  const getAllSettingsRef = useRef(getAllSettings);
  const getSelectedLocalesRef = useRef(getSelectedLocales);
  const getCurrentModeRef = useRef(getCurrentMode);
  const sendMessageRef = useRef(sendMessage);
  const tRef = useRef(t);

  useEffect(() => {
    getAllSettingsRef.current = getAllSettings;
  }, [getAllSettings]);
  useEffect(() => {
    getSelectedLocalesRef.current = getSelectedLocales;
  }, [getSelectedLocales]);
  useEffect(() => {
    getCurrentModeRef.current = getCurrentMode;
  }, [getCurrentMode]);
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const writeFileWithRetry = useCallback(
    async (path: string, content: string) => {
      const maxAttempts = 10;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          await writeTextFile(path, content);
          return;
        } catch (err) {
          const isLast = attempt === maxAttempts - 1;
          logger.warn(
            "Write attempt failed, will retry",
            {
              path,
              attempt: attempt + 1,
              maxAttempts,
              error: err instanceof Error ? err.message : String(err),
            },
            "writeFileWithRetry"
          );
          if (isLast) {
            try {
              const results = await ensureWritable([path]);
              const r = results[0];
              logger.warn(
                "Attempted to ensure writable",
                { path, result: r },
                "writeFileWithRetry"
              );
            } catch (e) {
              logger.warn(
                "ensureWritable invocation failed",
                { path, error: e instanceof Error ? e.message : String(e) },
                "writeFileWithRetry"
              );
            }
            try {
              await writeTextFile(path, content);
              return;
            } catch (finalErr) {
              const suggestion =
                tRef.current?.("messages.error.writePermissionSuggestion") ||
                "Could not write the file. Try running the app as Administrator or move the game to a folder where you have write permissions.";
              const msg =
                (finalErr instanceof Error
                  ? finalErr.message
                  : String(finalErr)) + `\n${suggestion}`;
              throw new Error(msg);
            }
          }
          const backoffMs = Math.min(1000, 100 * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }
    },
    [logger]
  );

  const applyAllChanges = useCallback(async () => {
    // Проверка режима
    if (allowedMode && getCurrentModeRef.current) {
      const current = getCurrentModeRef.current();
      if (current !== allowedMode) {
        logger.warn(
          "Skipping apply all - wrong mode",
          { current, allowedMode },
          "applyAllChanges"
        );
        return;
      }
    }

    if (!getAllSettingsRef.current || !getSelectedLocalesRef.current) {
      logger.error(
        "Missing dependencies for applyAllChanges",
        new Error("Missing getters")
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Пути
      const saved = loadSavedSettings();
      if (!saved?.homeDirectory) {
        const msg =
          t?.("messages.error.pathNotFound") ??
          "Путь к игре не найден в настройках";
        throw new Error(msg);
      }
      let homeDir = saved.homeDirectory.replace(/[\/\\]+$/, "");
      if (homeDir.endsWith(".exe")) {
        homeDir = homeDir.substring(0, homeDir.lastIndexOf("\\"));
      }

      const itemNamesPath = `${homeDir}\\${COMMON_GAME_PATHS.LOCALES}\\${COMMON_GAME_PATHS.ITEMS_FILE}`;
      const nameAffixesPath = `${homeDir}\\${COMMON_GAME_PATHS.LOCALES}\\${COMMON_GAME_PATHS.NAMEAFFIXES_FILE}`;
      const modifiersPath = `${homeDir}\\${COMMON_GAME_PATHS.LOCALES}\\item-modifiers.json`;
      const runesPath = `${homeDir}\\${RUNES_GAME_PATHS.LOCALES}\\${RUNES_GAME_PATHS.RUNES_FILE}`;
      const runeHighlightDir = `${homeDir}\\${RUNES_GAME_PATHS.RUNE_HIGHLIGHT}`;
      const keysHighlightDir = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\hd\\items\\misc\\key`;

      logger.info(
        "Reading source files (aggregate)",
        { itemNamesPath, nameAffixesPath, modifiersPath, runesPath },
        "applyAllChanges"
      );

      // Читаем исходные файлы
      const [
        itemNamesContent,
        nameAffixesContent,
        modifiersContent,
        runesContent,
      ] = await Promise.all([
        readTextFile(itemNamesPath),
        readTextFile(nameAffixesPath),
        (async () => {
          try {
            return await readTextFile(modifiersPath);
          } catch {
            return "[]";
          }
        })(),
        (async () => {
          try {
            return await readTextFile(runesPath);
          } catch {
            return "[]";
          }
        })(),
      ]);

      let itemNamesData: CommonLocaleItem[] = JSON.parse(itemNamesContent);
      let nameAffixesData: CommonLocaleItem[] = JSON.parse(nameAffixesContent);
      let modifiersData: CommonLocaleItem[] = JSON.parse(
        modifiersContent || "[]"
      );
      let runesData: Array<
        { id: number; Key: string } & Record<string, string>
      > = JSON.parse(runesContent || "[]");

      // Готовим копии для обновления
      const updatedItemNames = [...itemNamesData];
      const updatedNameAffixes = [...nameAffixesData];
      const updatedModifiers = [...modifiersData];
      const updatedRunes = [...runesData];

      const selectedLocales = getSelectedLocalesRef.current?.() || [];
      const settings = getAllSettingsRef.current?.();
      if (!settings) {
        throw new Error("Settings are not available");
      }

      // ===== COMMON =====
      const applyCommonGroup = (
        groupSettings: PotionGroupSettings,
        mapper: ECommonItem[]
      ) => {
        mapper.forEach((potionItem, level) => {
          const potionId = commonItemToIdMapper[potionItem];
          const levelSettings = groupSettings.levels[level];
          const targetFile = commonItemFileMapper[potionItem as ECommonItem];
          const targetArray =
            targetFile === "item-nameaffixes"
              ? updatedNameAffixes
              : targetFile === "item-modifiers"
                ? updatedModifiers
                : updatedItemNames;
          if (!potionId || !levelSettings) return;
          const idx = targetArray.findIndex((d) => d.id === potionId);
          if (idx !== -1) {
            selectedLocales.forEach((loc) => {
              const k = loc as keyof CommonLocaleItem;
              if (levelSettings.enabled) {
                const v = generateFinalPotionName(levelSettings, k as any);
                (targetArray[idx] as any)[k] = v;
              } else {
                (targetArray[idx] as any)[k] = "";
              }
            });
          } else {
            const newItem: CommonLocaleItem = {
              id: potionId,
              Key: String(potionItem),
              enUS: "",
              ruRU: "",
              zhTW: "",
              deDE: "",
              esES: "",
              frFR: "",
              itIT: "",
              koKR: "",
              plPL: "",
              esMX: "",
              jaJP: "",
              ptBR: "",
              zhCN: "",
            };
            selectedLocales.forEach((loc) => {
              const k = loc as keyof CommonLocaleItem;
              if (levelSettings.enabled) {
                const v = generateFinalPotionName(levelSettings, k as any);
                (newItem as any)[k] = v;
              } else {
                (newItem as any)[k] = "";
              }
            });
            targetArray.push(newItem);
          }
        });
      };

      // Простые common элементы
      Object.entries(settingsKeyToCommonItemMapper).forEach(
        ([settingsKey, mapped]) => {
          if (Array.isArray(mapped)) return; // группы обрабатываем ниже
          const simple = mapped as ECommonItem;
          const itemId = commonItemToIdMapper[simple];
          const itemSettings = (settings.common as any)[settingsKey] as {
            enabled: boolean;
            locales: Record<string, string>;
          };
          const targetFile = commonItemFileMapper[simple];
          const targetArray =
            targetFile === "item-nameaffixes"
              ? updatedNameAffixes
              : targetFile === "item-modifiers"
                ? updatedModifiers
                : updatedItemNames;
          if (!itemId || !itemSettings) return;
          const idx = targetArray.findIndex((d) => d.id === itemId);
          if (idx !== -1) {
            selectedLocales.forEach((loc) => {
              const k = loc as keyof CommonLocaleItem;
              if (itemSettings.enabled) {
                const v = generateFinalItemName(itemSettings as any, k as any);
                (targetArray[idx] as any)[k] = v;
              } else {
                (targetArray[idx] as any)[k] = "";
              }
            });
          } else {
            const newItem: CommonLocaleItem = {
              id: itemId,
              Key: String(simple),
              enUS: "",
              ruRU: "",
              zhTW: "",
              deDE: "",
              esES: "",
              frFR: "",
              itIT: "",
              koKR: "",
              plPL: "",
              esMX: "",
              jaJP: "",
              ptBR: "",
              zhCN: "",
            };
            selectedLocales.forEach((loc) => {
              const k = loc as keyof CommonLocaleItem;
              if (itemSettings.enabled) {
                const v = generateFinalItemName(itemSettings as any, k as any);
                (newItem as any)[k] = v;
              } else {
                (newItem as any)[k] = "";
              }
            });
            targetArray.push(newItem);
          }
        }
      );

      // Группы зелий и пр. в common
      Object.entries(settingsKeyToCommonItemMapper).forEach(
        ([settingsKey, mapped]) => {
          if (!Array.isArray(mapped)) return;
          const group = (settings.common as any)[
            settingsKey
          ] as PotionGroupSettings;
          if (!group) return;
          applyCommonGroup(group, mapped as ECommonItem[]);
        }
      );

      // ===== GEMS =====
      Object.entries(settingsKeyToGemMapper).forEach(
        ([settingsKey, gemList]) => {
          const group = (settings.gems as any)[
            settingsKey
          ] as PotionGroupSettings;
          if (!group) return;
          (gemList as EGem[]).forEach((gemKey: EGem, levelIndex: number) => {
            const info = gemToIdMapper[gemKey];
            const levelSettings = group.levels[levelIndex];
            if (!info || !levelSettings) return;
            const targetArray =
              info.file === "item-names"
                ? updatedItemNames
                : updatedNameAffixes;
            const idx = targetArray.findIndex((d) => d.id === info.id);
            if (idx !== -1) {
              selectedLocales.forEach((loc) => {
                const k = loc as keyof CommonLocaleItem;
                if (levelSettings.enabled) {
                  const v = generateFinalGemName(levelSettings, k as any);
                  (targetArray[idx] as any)[k] = v;
                } else {
                  (targetArray[idx] as any)[k] = "";
                }
              });
            } else {
              const newItem: CommonLocaleItem = {
                id: info.id,
                Key: String(gemKey),
                enUS: "",
                ruRU: "",
                zhTW: "",
                deDE: "",
                esES: "",
                frFR: "",
                itIT: "",
                koKR: "",
                plPL: "",
                esMX: "",
                jaJP: "",
                ptBR: "",
                zhCN: "",
              };
              selectedLocales.forEach((loc) => {
                const k = loc as keyof CommonLocaleItem;
                if (levelSettings.enabled) {
                  const v = generateFinalGemName(levelSettings, k as any);
                  (newItem as any)[k] = v;
                } else {
                  (newItem as any)[k] = "";
                }
              });
              targetArray.push(newItem);
            }
          });
        }
      );

      // ===== ITEMS =====
      const itemsSettings: ItemsSettings = settings.items;
      const bases = (await import("../../pages/items/bases.json"))
        .default as Array<{
        id: number;
        key: string;
        difficultyClass?: string;
      }>;
      const keyToId = new Map(bases.map((b) => [b.key, b.id] as const));

      // Обновляем отдельные предметы (item-names)
      Object.entries(itemsSettings.items || {}).forEach(
        ([key, itemSettings]) => {
          const id = keyToId.get(key);
          if (!id) return;
          const idx = updatedItemNames.findIndex((d) => d.id === id);
          if (idx === -1) return;

          const base = bases.find((b) => b.id === id);
          const difficultyLevel =
            base?.difficultyClass === "normal"
              ? 0
              : base?.difficultyClass === "exceptional"
                ? 1
                : 2;
          const markerLevel =
            itemsSettings.difficultyClassMarkers.levels[difficultyLevel];

          selectedLocales.forEach((loc) => {
            const k = loc as keyof CommonLocaleItem;
            const sk = loc as keyof ItemSettings["locales"];

            // Если предмет выключен — очищаем строки для выбранных локалей
            if (!(itemSettings as ItemSettings).enabled) {
              (updatedItemNames[idx] as any)[k] = "";
              return;
            }

            const currentValue = ((updatedItemNames[idx] as any)[k] ??
              "") as string;
            const customName = (itemSettings as ItemSettings).locales[sk] ?? "";

            // Подготовим список всех возможных маркеров для этой локали,
            // чтобы уметь удалять ранее добавленные маркеры и избегать дубликатов
            const allLocaleMarkers = itemsSettings.difficultyClassMarkers.levels
              .map((lvl) => lvl?.locales[sk])
              .filter((s): s is string => !!s && !!s.trim());

            const stripMarker = (value: string): string => {
              let result = value;
              allLocaleMarkers.forEach((m) => {
                const suffix = ` ${m}`;
                if (result.endsWith(suffix)) {
                  result = result.slice(0, -suffix.length);
                }
              });
              return result;
            };

            // Базовое имя: приоритет кастомному, иначе текущее из файла
            let baseName = (
              customName.trim() ? customName : currentValue
            ) as string;
            baseName = stripMarker(baseName);

            // Добавляем маркер класса сложности при необходимости
            if (
              (itemSettings as ItemSettings).showDifficultyClassMarker &&
              markerLevel
            ) {
              const m = markerLevel.locales[sk];
              if (m && m.trim()) {
                const markerSuffix = ` ${m}`;
                if (!baseName.endsWith(markerSuffix)) {
                  baseName = `${baseName}${markerSuffix}`;
                }
              }
            }

            (updatedItemNames[idx] as any)[k] = baseName;
          });
        }
      );

      // Quality Prefixes (item-nameaffixes)
      const superior = itemsSettings.qualityPrefixes.levels[1];
      const low = itemsSettings.qualityPrefixes.levels[0];
      const superiorLocale = updatedNameAffixes.find((d) => d.id === 1727);
      if (superiorLocale) {
        if (superior?.enabled) {
          selectedLocales.forEach((loc) => {
            const k = loc as keyof CommonLocaleItem;
            const sk = loc as keyof PotionLevelSettings["locales"];
            const v = superior.locales[sk];
            if (v && v.trim()) (superiorLocale as any)[k] = v;
          });
        } else {
          selectedLocales.forEach((loc) => {
            (superiorLocale as any)[loc as keyof CommonLocaleItem] = "";
          });
        }
      }
      const lowIds = [1723, 1724, 1725, 20910];
      if (low?.enabled) {
        const hasNonEmpty = selectedLocales.some((loc) => {
          const sk = loc as keyof PotionLevelSettings["locales"];
          const v = low.locales[sk];
          return v && v.trim();
        });
        if (hasNonEmpty) {
          lowIds.forEach((id) => {
            const row = updatedNameAffixes.find((d) => d.id === id);
            if (!row) return;
            selectedLocales.forEach((loc) => {
              const k = loc as keyof CommonLocaleItem;
              const sk = loc as keyof PotionLevelSettings["locales"];
              const v = low.locales[sk];
              if (v && v.trim()) (row as any)[k] = v;
            });
          });
        }
      } else {
        lowIds.forEach((id) => {
          const row = updatedNameAffixes.find((d) => d.id === id);
          if (!row) return;
          selectedLocales.forEach((loc) => {
            (row as any)[loc as keyof CommonLocaleItem] = "";
          });
        });
      }

      // ===== RUNES (localization) =====
      const runeToId: Partial<Record<ERune, number>> = {};
      Object.entries(idToRuneMapper).forEach(([id, rune]) => {
        runeToId[rune as ERune] = parseInt(id);
      });
      Object.entries(settings.runes).forEach(([runeKey, runeSettings]) => {
        const rune = runeKey as ERune;
        const id = runeToId[rune];
        if (!id) return;
        const idx = updatedRunes.findIndex((r) => r.id === id);
        const updateLocales = (target: any) => {
          RUNES_SUPPORTED_LOCALES.forEach((loc) => {
            if (!selectedLocales.includes(loc)) return;
            let finalName: string;
            if (runeSettings.mode === "manual") {
              const manualText =
                runeSettings.manualSettings.locales[
                  loc as keyof typeof runeSettings.manualSettings.locales
                ] || runeSettings.manualSettings.locales.enUS;
              finalName = manualText.split(/\r?\n/).reverse().join("\n");
            } else {
              finalName = generateFinalRuneName(rune, runeSettings, loc);
            }
            (target as any)[loc] = finalName;
          });
        };
        if (idx !== -1) {
          updateLocales(updatedRunes[idx]);
        } else {
          const newRow: any = { id, Key: `rune${rune}` };
          updateLocales(newRow);
          updatedRunes.push(newRow);
        }
      });

      // ===== WRITE FILES ONCE =====
      logger.info(
        "Writing aggregated files",
        { itemNamesPath, nameAffixesPath, modifiersPath, runesPath },
        "applyAllChanges"
      );
      await writeFileWithRetry(
        itemNamesPath,
        JSON.stringify(updatedItemNames, null, 2)
      );
      await writeFileWithRetry(
        nameAffixesPath,
        JSON.stringify(updatedNameAffixes, null, 2)
      );
      await writeFileWithRetry(
        modifiersPath,
        JSON.stringify(updatedModifiers, null, 2)
      );
      await writeFileWithRetry(
        runesPath,
        JSON.stringify(updatedRunes, null, 2)
      );

      // ===== BANK LAYOUT (stash rename) =====
      try {
        const primaryBankPath = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\global\\ui\\layouts\\bankexpansionlayouthd.json`;
        const fallbackBankPath = `${homeDir}\\${COMMON_GAME_PATHS.LOCALES}\\..\\..\\..\\ui\\layouts\\bankexpansionlayouthd.json`;
        let pathToWrite = primaryBankPath;
        let bankContent = "";
        try {
          bankContent = await readTextFile(primaryBankPath);
        } catch {
          bankContent = await readTextFile(fallbackBankPath);
          pathToWrite = fallbackBankPath;
        }
        const sanitizeJson = (text: string) =>
          text.replace(/(^|\s)\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1");
        const bankJson = JSON.parse(sanitizeJson(bankContent));
        const tabs = settings.stashRename?.tabs || [
          "@shared",
          "@shared",
          "@shared",
          "@shared",
          "@shared",
          "@shared",
          "@shared",
        ];
        const applyTabs = (arr: any[]) => {
          for (const node of arr) {
            if (node?.type === "TabBarWidget" && node?.fields?.textStrings) {
              const ts = node.fields.textStrings as any[];
              if (
                Array.isArray(ts) &&
                ts.length === 8 &&
                ts[0] === "@personal"
              ) {
                node.fields.textStrings = ["@personal", ...tabs];
              } else if (Array.isArray(ts) && ts.length === 7) {
                node.fields.textStrings = [...tabs];
              }
            }
            if (Array.isArray(node?.children)) applyTabs(node.children);
          }
        };
        if (Array.isArray(bankJson?.children)) applyTabs(bankJson.children);
        await writeFileWithRetry(
          pathToWrite,
          JSON.stringify(bankJson, null, 4)
        );
      } catch (e) {
        logger.warn(
          "Failed to update bankexpansionlayouthd.json",
          { error: e instanceof Error ? e.message : String(e) },
          "applyAllChanges"
        );
      }

      // ===== TWEAKS - HUD PANEL HD =====
      try {
        const primaryHudPanelPath = `${homeDir}\\mods\\D2RBlizzless\\D2RBlizzless.mpq\\data\\global\\ui\\layouts\\hudpanelhd.json`;
        const fallbackHudPanelPath = `${homeDir}\\data\\global\\ui\\layouts\\hudpanelhd.json`;
        let pathToWrite = primaryHudPanelPath;
        let hudPanelContent = "";
        try {
          hudPanelContent = await readTextFile(primaryHudPanelPath);
        } catch {
          hudPanelContent = await readTextFile(fallbackHudPanelPath);
          pathToWrite = fallbackHudPanelPath;
        }
        const sanitizeJson = (text: string) =>
          text.replace(/(^|\s)\/\/.*$/gm, "").replace(/,\s*([}\]])/g, "$1");
        const hudPanelJson = JSON.parse(sanitizeJson(hudPanelContent));

        const tweaksSettings = settings.tweaks || {
          encyclopediaEnabled: true,
          encyclopediaLanguage: "en",
        };
        const targetLanguage = tweaksSettings.encyclopediaLanguage || "en";
        const targetSuffix = targetLanguage === "ru" ? "ru" : "en";

        // Шаблон объекта энциклопедии
        const encyclopediaObject = {
          type: "ButtonWidget",
          name: "BlizzlessEncyclopediaButRu",
          fields: {
            rect: {
              x: 630,
              y: 305,
              scale: 0.2,
            },
            filename: "BlizzlessEncyclopedia\\scroll_enc",
            hoveredFrame: 1,
            pressedFrame: 2,
            tooltipString: "@dictEnc",
            onClickMessage: `PanelManager:OpenPanel:BlizzlessEncyclopediabut${targetSuffix}`,
          },
        };

        // Ищем массив children и обрабатываем
        const findAndProcessChildren = (obj: any): any => {
          if (Array.isArray(obj)) {
            // Удаляем существующий объект энциклопедии, если есть
            const filtered = obj.filter(
              (item) => item?.name !== "BlizzlessEncyclopediaButRu"
            );

            if (tweaksSettings.encyclopediaEnabled) {
              // Ищем RunButtonWidget и вставляем после него
              const runButtonIndex = filtered.findIndex(
                (item) => item?.type === "RunButtonWidget"
              );
              if (runButtonIndex !== -1) {
                filtered.splice(runButtonIndex + 1, 0, encyclopediaObject);
              } else {
                // Если RunButtonWidget не найден, добавляем в конец
                filtered.push(encyclopediaObject);
              }
            }

            return filtered;
          } else if (obj && typeof obj === "object") {
            const result: any = {};
            for (const key in obj) {
              if (key === "children" && Array.isArray(obj[key])) {
                result[key] = findAndProcessChildren(obj[key]);
              } else {
                result[key] = findAndProcessChildren(obj[key]);
              }
            }
            return result;
          }
          return obj;
        };

        const updatedHudPanelJson = findAndProcessChildren(hudPanelJson);
        await writeFileWithRetry(
          pathToWrite,
          JSON.stringify(updatedHudPanelJson, null, 2)
        );
      } catch (e) {
        logger.warn(
          "Failed to update hudpanelhd.json",
          { error: e instanceof Error ? e.message : String(e) },
          "applyAllChanges"
        );
      }

      // ===== RUNES HIGHLIGHT FILES =====
      for (const [runeKey, runeSettings] of Object.entries(settings.runes)) {
        const rune = runeKey as ERune;
        const filePath = `${runeHighlightDir}\\${rune}_rune.json`;
        try {
          const data = await generateRuneHighlightData(rune, runeSettings);
          await writeFileWithRetry(filePath, JSON.stringify(data, null, 2));
        } catch (e) {
          logger.warn(
            "Failed to write rune highlight file",
            { rune, error: e instanceof Error ? e.message : String(e) },
            "applyAllChanges"
          );
        }
      }

      // ===== UBER KEYS HIGHLIGHT FILES =====
      try {
        const uber = settings.common.uberKeys;
        if (uber && Array.isArray(uber.levels) && uber.levels.length >= 3) {
          const keyMapping = [
            { keyName: "mephisto_key3", fileName: "mephisto_key3.json" }, // Key of Terror (0)
            { keyName: "mephisto_key2", fileName: "mephisto_key2.json" }, // Key of Hate (1)
            { keyName: "mephisto_key", fileName: "mephisto_key.json" }, // Key of Destruction (2)
          ];

          for (let i = 0; i < 3; i++) {
            const level = uber.levels[i];
            const { keyName, fileName } = keyMapping[i];
            const isHighlighted = Boolean(level?.highlight);
            try {
              const keyData = generateKeyHighlightData(keyName, isHighlighted);
              const targetPath = `${keysHighlightDir}\\${fileName}`;
              await writeFileWithRetry(
                targetPath,
                JSON.stringify(keyData, null, 2)
              );
            } catch (e) {
              logger.warn(
                "Failed to write uber key highlight file",
                {
                  fileName,
                  keyName,
                  error: e instanceof Error ? e.message : String(e),
                },
                "applyAllChanges"
              );
            }
          }
        }
      } catch (e) {
        logger.warn(
          "Unexpected error while applying uber key highlight templates",
          { error: e instanceof Error ? e.message : String(e) },
          "applyAllChanges"
        );
      }

      const successMessage =
        tRef.current?.("messages.success.changesAppliedText") ||
        "Changes applied successfully";
      sendMessageRef.current?.(successMessage, { type: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      logger.error(
        "Failed to apply all changes (aggregate)",
        e as Error,
        { error: msg },
        "applyAllChanges"
      );
      sendMessageRef.current?.(msg, {
        type: "error",
        title:
          tRef.current?.("messages.error.applyError") ||
          "Ошибка применения изменений",
      });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [allowedMode, logger, writeFileWithRetry]);

  return { isLoading, error, applyAllChanges };
};
