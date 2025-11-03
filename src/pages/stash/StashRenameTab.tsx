import React, { useMemo } from "react";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import { useUnsavedChanges } from "../../shared/hooks/useUnsavedChanges";
import DebouncedInput from "../../shared/components/DebouncedInput.tsx";
import UnsavedAsterisk from "../../shared/components/UnsavedAsterisk.tsx";
// no local read/apply buttons

interface StashRenameTabProps {
  isDarkTheme: boolean;
}

const StashRenameTab: React.FC<StashRenameTabProps> = ({ isDarkTheme }) => {
  const { getStashRenameSettings, updateStashTab } = useSettings();
  const stash = getStashRenameSettings();
  const { baseline } = useUnsavedChanges();

  const baseTabs: string[] = useMemo(() => {
    return (baseline as any)?.stashRename?.tabs || [
      "@shared",
      "@shared",
      "@shared",
      "@shared",
      "@shared",
      "@shared",
      "@shared",
    ];
  }, [baseline]);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Чтение/применение выполняется глобальными кнопками тулбара */}

      <div className="flex flex-wrap gap-4">
        {stash.tabs.map((value, idx) => {
          const hasChanged = baseTabs[idx] !== value;
          return (
            <div key={idx} className="flex flex-col gap-2">
              <label className={`text-sm ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
                {`Stash${idx + 1}`}
              </label>
              <div className="relative">
                <DebouncedInput
                  type="text"
                  value={value}
                  onChange={(v) => updateStashTab(idx, v)}
                  maxLength={10}
                  className={`
                    w-[130px] px-3 py-2 rounded-md border transition-colors
                    ${isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                    }
                    ${isDarkTheme
                      ? "focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                      : "focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                    }
                  `}
                />
                {hasChanged && (
                  <span className="absolute" style={{ right: -10, top: -10 }}>
                    <UnsavedAsterisk size={0.55} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StashRenameTab;


