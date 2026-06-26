import React from "react";
import { useTranslation } from "react-i18next";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import { CLASS_NAMES } from "../../../shared/saveeditor/constants";
import GameButton from "./GameButton";

interface SaveListProps {
  isDarkTheme: boolean;
}

/** Character class code → portrait icon file (copied to /panel/class_<code>.png). */
const CLASS_ICON: Record<string, string> = {
  ama: "class_ama",
  sor: "class_sor",
  nec: "class_nec",
  pal: "class_pal",
  bar: "class_bar",
  dru: "class_dru",
  ass: "class_ass",
  war: "class_war",
};

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="text-[11px] uppercase tracking-wider mb-1 px-1"
    style={{ fontFamily: '"Diablo", serif', color: "#b9975b", textShadow: "0 1px 1px #000" }}
  >
    {children}
  </div>
);

const SaveList: React.FC<SaveListProps> = () => {
  const { t } = useTranslation();
  const {
    characters,
    stashes,
    activeChar,
    activeStash,
    selectChar,
    selectStash,
    openExtra,
    rescan,
    isDirty,
    busy,
    loading,
  } = useSaveEditor();

  const rowStyle = (active: boolean): React.CSSProperties => ({
    border: active ? "1px solid rgba(220,180,90,0.85)" : "1px solid rgba(150,120,60,0.30)",
    background: active
      ? "linear-gradient(180deg, rgba(70,55,25,0.95), rgba(35,27,14,0.95))"
      : "linear-gradient(180deg, rgba(28,25,20,0.85), rgba(14,12,9,0.85))",
    boxShadow: active ? "inset 0 0 10px rgba(180,140,60,0.25)" : "inset 0 0 6px rgba(0,0,0,0.6)",
  });

  return (
    <div
      className="flex flex-col gap-3 w-64 shrink-0 p-2 rounded"
      style={{
        background: "linear-gradient(180deg, rgba(20,17,12,0.9), rgba(10,8,6,0.9))",
        border: "1px solid rgba(150,120,60,0.35)",
        boxShadow: "inset 0 0 16px rgba(0,0,0,0.7)",
      }}
    >
      <div className="flex gap-2">
        <GameButton size="sm" onClick={rescan} disabled={busy || loading}>
          {t("saveEditor.list.rescan")}
        </GameButton>
        <GameButton size="sm" onClick={openExtra} disabled={busy}>
          {t("saveEditor.list.openOther")}
        </GameButton>
      </div>

      <div>
        <SectionHeader>
          {t("saveEditor.list.characters")} ({characters.length})
        </SectionHeader>
        <div className="flex flex-col gap-1">
          {characters.length === 0 && (
            <div className="text-xs opacity-50 px-2 py-1">{t("saveEditor.list.none")}</div>
          )}
          {characters.map((c) => {
            const active = c.path === activeChar?.path;
            const cls = c.result.profile.class;
            const icon = CLASS_ICON[cls];
            return (
              <button
                key={c.path}
                type="button"
                onClick={() => selectChar(c.path)}
                className="w-full text-left rounded px-1.5 py-1.5 flex items-center gap-2 transition-[filter] hover:brightness-125"
                style={rowStyle(active)}
              >
                {/* Class portrait — always the first cell of the row. */}
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-sm overflow-hidden"
                  style={{
                    width: 34,
                    height: 34,
                    border: "1px solid rgba(120,95,45,0.5)",
                    background: "rgba(0,0,0,0.5)",
                  }}
                >
                  {icon ? (
                    <img
                      src={`/saveeditor-assets/panel/${icon}.png`}
                      alt={cls}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] opacity-60">{cls}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate"
                    style={{
                      fontFamily: '"Diablo", serif',
                      color: active ? "#f5d77a" : "#d8c79a",
                      fontSize: 13,
                      textShadow: "0 1px 1px #000",
                    }}
                  >
                    {c.result.profile.name || c.fileName}
                  </span>
                  <span className="block truncate text-[11px]" style={{ color: "#9a8a66" }}>
                    {CLASS_NAMES[cls] ?? cls} · {t("saveEditor.character.level")}{" "}
                    {c.result.profile.level}
                  </span>
                </span>
                {isDirty(c.path) && (
                  <span className="flex-shrink-0 text-amber-400" title={t("saveEditor.unsaved")}>
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionHeader>
          {t("saveEditor.list.stashes")} ({stashes.length})
        </SectionHeader>
        <div className="flex flex-col gap-1">
          {stashes.length === 0 && (
            <div className="text-xs opacity-50 px-2 py-1">{t("saveEditor.list.none")}</div>
          )}
          {stashes.map((s) => {
            const active = s.path === activeStash?.path;
            return (
              <button
                key={s.path}
                type="button"
                onClick={() => selectStash(s.path)}
                className="w-full text-left rounded px-2 py-1.5 flex items-center gap-2 transition-[filter] hover:brightness-125"
                style={rowStyle(active)}
              >
                <span
                  className="truncate flex-1"
                  style={{
                    fontFamily: '"Diablo", serif',
                    color: active ? "#f5d77a" : "#d8c79a",
                    fontSize: 12,
                    textShadow: "0 1px 1px #000",
                  }}
                >
                  {s.fileName}
                </span>
                {isDirty(s.path) && (
                  <span className="flex-shrink-0 text-amber-400" title={t("saveEditor.unsaved")}>
                    ●
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SaveList;
