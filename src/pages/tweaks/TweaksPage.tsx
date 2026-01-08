import React, { useEffect, useRef, useState } from "react";
import Switcher from "../../shared/components/Switcher.tsx";
import { useTranslation } from "react-i18next";
import { useTweaksWorker } from "../../shared/hooks/useTweaksWorker.ts";
import { TweaksSettings } from "../../app/providers/SettingsContext.tsx";

interface TweaksPageProps {
  isDarkTheme: boolean;
}

const TweaksPage: React.FC<TweaksPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();

  const initialTweaks: TweaksSettings = {
    encyclopediaEnabled: true,
    encyclopediaLanguage: "en",
    skipIntroVideos: false,
  };

  // Текущее состояние tweaks + ref (нужно, чтобы applyChanges всегда видел актуальные значения)
  const currentTweaksRef = useRef<TweaksSettings>(initialTweaks);
  const [currentTweaks, setCurrentTweaks] = useState<TweaksSettings>(initialTweaks);

  // Хук для работы с файлами игры
  const { readFromFiles, applyChanges, isLoading } = useTweaksWorker(
    (newSettings: Partial<TweaksSettings>) => {
      const merged: TweaksSettings = {
        ...currentTweaksRef.current,
        ...newSettings,
      };
      currentTweaksRef.current = merged;
      setCurrentTweaks(merged);
    },
    () => {}, // Сообщения не показываем при автоматической загрузке
    t,
    () => currentTweaksRef.current
  );

  // Автоматически читаем настройки из файлов при монтировании
  useEffect(() => {
    readFromFiles().catch(() => {
      // Игнорируем ошибки при автоматической загрузке
    });
  }, []);

  const updateTweaksAndApply = async (patch: Partial<TweaksSettings>) => {
    const next: TweaksSettings = {
      ...currentTweaksRef.current,
      ...patch,
    };
    currentTweaksRef.current = next;
    setCurrentTweaks(next);
    await applyChanges();
  };

  return (
    <div className="relative p-8 max-w-3xl mx-auto">
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
          </div>
          <Switcher
            checked={currentTweaks.encyclopediaEnabled}
            onChange={(checked) => updateTweaksAndApply({ encyclopediaEnabled: checked })}
            isDarkTheme={isDarkTheme}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label
              className={`text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("tweaksPage.encyclopediaLanguage.label") ||
                "Язык внутриигровой энциклопедии"}
            </label>
          </div>
          <select
            value={currentTweaks.encyclopediaLanguage}
            onChange={(e) =>
              updateTweaksAndApply({
                encyclopediaLanguage: e.target.value as "en" | "ru",
              })
            }
            disabled={!currentTweaks.encyclopediaEnabled || isLoading}
            className={`
              w-[130px] max-w-xs px-3 py-2 rounded-md border transition-colors
              ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }
              ${
                !currentTweaks.encyclopediaEnabled || isLoading
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

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label
              className={`text-sm font-medium ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("tweaksPage.skipIntroVideos.label") ||
                "Выключить вступительные видеоролики"}
            </label>
          </div>
          <Switcher
            checked={currentTweaks.skipIntroVideos}
            onChange={(checked) => updateTweaksAndApply({ skipIntroVideos: checked })}
            isDarkTheme={isDarkTheme}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default TweaksPage;
