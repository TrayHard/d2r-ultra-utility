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

  const baseSkipIntro: boolean = useMemo(() => {
    return (baseline as any)?.tweaks?.skipIntroVideos ?? false;
  }, [baseline]);
  const hasSkipIntroChanged = baseSkipIntro !== tweaks.skipIntroVideos;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Чтение/применение выполняется глобальными кнопками тулбара */}

      <div className="space-y-6">
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
            {hasSkipIntroChanged && <UnsavedAsterisk size={0.55} />}
          </div>
          <Switcher
            checked={tweaks.skipIntroVideos}
            onChange={(checked) =>
              updateTweaksSettings({ skipIntroVideos: checked })
            }
            isDarkTheme={isDarkTheme}
          />
        </div>
      </div>
    </div>
  );
};

export default TweaksTab;

