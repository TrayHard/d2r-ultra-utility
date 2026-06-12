import React, { useEffect, useRef, useState } from "react";
import Switcher from "../../shared/components/Switcher.tsx";
import { useTranslation } from "react-i18next";
import { useTweaksWorker } from "../../shared/hooks/useTweaksWorker.ts";
import { TweaksSettings } from "../../app/providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider.tsx";

interface TweaksPageProps {
  isDarkTheme: boolean;
}

const TweaksPage: React.FC<TweaksPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { sendMessage } = useGlobalMessage();

  const initialTweaks: TweaksSettings = {
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
    // Успешные сообщения не показываем при автоматической загрузке, но ошибки — обязательно
    (message, opts) => {
      if (opts?.type === "error") sendMessage(message, opts);
    },
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
