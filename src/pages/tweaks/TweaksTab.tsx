import React, { useMemo } from "react";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";
import UnsavedAsterisk from "../../shared/components/UnsavedAsterisk.tsx";
import Switcher from "../../shared/components/Switcher.tsx";
import { useTranslation } from "react-i18next";

interface TweaksTabProps {
  isDarkTheme: boolean;
}

const TweaksTab: React.FC<TweaksTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getTweaksSettings, updateTweaksSettings } = useSettings();
  const tweaks = getTweaksSettings();
  const { baseline } = useUnsavedChanges();

  const baseEncyclopediaEnabled: boolean = useMemo(() => {
    return (baseline as any)?.tweaks?.encyclopediaEnabled ?? true;
  }, [baseline]);

  const baseEncyclopediaLanguage: "en" | "ru" = useMemo(() => {
    return (baseline as any)?.tweaks?.encyclopediaLanguage || "en";
  }, [baseline]);

  const hasEncyclopediaEnabledChanged =
    baseEncyclopediaEnabled !== tweaks.encyclopediaEnabled;

  const hasEncyclopediaLanguageChanged =
    baseEncyclopediaLanguage !== tweaks.encyclopediaLanguage;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Чтение/применение выполняется глобальными кнопками тулбара */}

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label
              className={`text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("tweaksPage.encyclopediaEnabled.label") ||
                "Включить внутриигровую энциклопедию"}
            </label>
            {hasEncyclopediaEnabledChanged && (
              <UnsavedAsterisk size={0.55} />
            )}
          </div>
          <Switcher
            checked={tweaks.encyclopediaEnabled}
            onChange={(checked) =>
              updateTweaksSettings({ encyclopediaEnabled: checked })
            }
            isDarkTheme={isDarkTheme}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            className={`text-sm font-medium ${
              isDarkTheme ? "text-gray-300" : "text-gray-700"
            }`}
          >
            {t("tweaksPage.encyclopediaLanguage.label") ||
              "Язык внутриигровой энциклопедии"}
            {hasEncyclopediaLanguageChanged && (
              <span className="ml-2">
                <UnsavedAsterisk size={0.55} />
              </span>
            )}
          </label>
          <select
            value={tweaks.encyclopediaLanguage}
            onChange={(e) =>
              updateTweaksSettings({
                encyclopediaLanguage: e.target.value as "en" | "ru",
              })
            }
            disabled={!tweaks.encyclopediaEnabled}
            className={`
              w-full max-w-xs px-3 py-2 rounded-md border transition-colors
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }
              ${
                !tweaks.encyclopediaEnabled
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
              ${
                isDarkTheme
                  ? "focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                  : "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
              }
            `}
          >
            <option value="en">
              {t("tweaksPage.encyclopediaLanguage.options.en") || "English"}
            </option>
            <option value="ru">
              {t("tweaksPage.encyclopediaLanguage.options.ru") || "Русский"}
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TweaksTab;

