import React from "react";
import { useSettings } from "../../app/providers/SettingsContext.tsx";
import DebouncedInput from "../../shared/components/DebouncedInput.tsx";
// no local read/apply buttons

interface StashRenameTabProps {
  isDarkTheme: boolean;
}

const StashRenameTab: React.FC<StashRenameTabProps> = ({ isDarkTheme }) => {
  const { getStashRenameSettings, updateStashTab } = useSettings();
  const stash = getStashRenameSettings();

  const slotsCount = 7;
  const slotWidthPercent = 100 / slotsCount;

  return (
    <div className="p-8 max-w-5xl mx-auto flex justify-center">
      {/* Фон с отсеками и прозрачные инпуты поверх */}
      <div className="relative inline-block select-none">
        <img
          src="/img/stash_bg.png"
          alt="Stash tabs background"
          draggable={false}
        />

        {/* Overlay контейнер */}
        <div className="absolute inset-0">
          {(stash.tabs || []).slice(0, slotsCount).map((value: string, idx: number) => {
            const leftPercent = idx * slotWidthPercent;
            return (
              <div
                key={idx}
                className="absolute top-0 h-full"
                style={{ left: `${leftPercent}%`, width: `${slotWidthPercent}%` }}
              >
                <DebouncedInput
                  type="text"
                  value={value}
                  onChange={(v) => updateStashTab(idx, v)}
                  maxLength={10}
                  className={`
                    w-full h-full px-2 pt-[12px] text-center text-[12px] bg-transparent border-0 outline-none
                    ${isDarkTheme ? "text-white placeholder-gray-400" : "text-white placeholder-gray-300"}
                  `}
                  style={{
                    // убираем нативные стили фокуса в разных браузерах
                    WebkitAppearance: "none",
                    MozAppearance: "textfield",
                  }}
                />
              </div>
            );
          })}
          {/* Если вкладок меньше 7, дорисуем пустые поля */}
          {Array.from({ length: Math.max(0, slotsCount - (stash.tabs?.length || 0)) }).map((_, extraIdx) => {
            const idx = (stash.tabs?.length || 0) + extraIdx;
            const leftPercent = idx * slotWidthPercent;
            return (
              <div
                key={`extra-${idx}`}
                className="absolute top-0 h-full"
                style={{ left: `${leftPercent}%`, width: `${slotWidthPercent}%` }}
              >
                <DebouncedInput
                  type="text"
                  value=""
                  onChange={(v) => updateStashTab(idx, v)}
                  maxLength={10}
                  className={`w-full h-full px-2 pt-[12px] text-center text-[15px] bg-transparent border-0 outline-none ${isDarkTheme ? "text-white placeholder-gray-500" : "text-white placeholder-gray-400"}`}
                  style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StashRenameTab;


