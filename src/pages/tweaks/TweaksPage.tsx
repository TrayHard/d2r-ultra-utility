import React, { useEffect, useRef } from "react";
import Switcher from "../../shared/components/Switcher.tsx";
import Button from "../../shared/components/Button.tsx";
import { useTranslation } from "react-i18next";
import { useTweaksWorker } from "../../shared/hooks/useTweaksWorker.ts";
import {
  TweaksSettings,
  useSettings,
} from "../../app/providers/SettingsContext.tsx";
import { useGlobalMessage } from "../../shared/components/Message/MessageProvider.tsx";

interface TweaksPageProps {
  isDarkTheme: boolean;
}

const TweaksPage: React.FC<TweaksPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { sendMessage } = useGlobalMessage();
  const { getTweaksSettings, updateTweaksSettings } = useSettings();

  // Source of truth for the UI is SettingsContext (persisted to localStorage),
  // so the switchers render the correct state on first paint instead of
  // flashing false while readFromFiles awaits stat() calls.
  const tweaks = getTweaksSettings();
  const tweaksRef = useRef<TweaksSettings>(tweaks);
  tweaksRef.current = tweaks;

  const { readFromFiles, applyChanges, setAllItemLevels, isLoading } =
    useTweaksWorker(
      (newSettings: Partial<TweaksSettings>) => {
        // readFromFiles result feeds straight into the context store.
        updateTweaksSettings(newSettings);
      },
      (message, opts) => sendMessage(message, opts),
      t,
      () => tweaksRef.current
    );

  useEffect(() => {
    readFromFiles().catch(() => {
      // Silent on auto-load failure — sendMessage already fired inside the
      // hook if the disk read genuinely failed.
    });
  }, []);

  const updateTweaksAndApply = async (patch: Partial<TweaksSettings>) => {
    // Roll back ONLY the keys this call touched. applyChanges() is chained,
    // so a sibling click may have already mutated other keys between our
    // snapshot and our potential rollback — restoring a full snapshot here
    // would clobber that sibling's state.
    const rollback: Partial<TweaksSettings> = {};
    for (const k of Object.keys(patch) as (keyof TweaksSettings)[]) {
      (rollback as Record<string, unknown>)[k] = tweaksRef.current[k];
    }
    // Optimistic UI: flip the switch immediately, then attempt the on-disk
    // change. If applyChanges rejects we put just our keys back so the UI
    // doesn't lie about disk reality for what THIS call attempted.
    updateTweaksSettings(patch);
    tweaksRef.current = { ...tweaksRef.current, ...patch };
    try {
      await applyChanges();
    } catch {
      updateTweaksSettings(rollback);
      tweaksRef.current = { ...tweaksRef.current, ...rollback };
    }
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
            checked={tweaks.skipIntroVideos}
            onChange={(checked) =>
              updateTweaksAndApply({ skipIntroVideos: checked })
            }
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
              {t("tweaksPage.npcHeadIcons.label") || "Иконки над NPC"}
            </label>
          </div>
          <Switcher
            checked={tweaks.npcHeadIcons}
            onChange={(checked) =>
              updateTweaksAndApply({ npcHeadIcons: checked })
            }
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
              {t("tweaksPage.quickDifficultySelector.label") ||
                "Быстрый выбор сложности"}
            </label>
          </div>
          <Switcher
            checked={tweaks.quickDifficultySelector}
            onChange={(checked) =>
              updateTweaksAndApply({ quickDifficultySelector: checked })
            }
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
              {t("tweaksPage.allItemLevels.label") ||
                "All item lvl indicators"}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              isDarkTheme={isDarkTheme}
              disabled={isLoading}
              onClick={() => setAllItemLevels(true)}
            >
              {t("tweaksPage.allItemLevels.show") || "Show"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              isDarkTheme={isDarkTheme}
              disabled={isLoading}
              onClick={() => setAllItemLevels(false)}
            >
              {t("tweaksPage.allItemLevels.hide") || "Hide"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TweaksPage;
