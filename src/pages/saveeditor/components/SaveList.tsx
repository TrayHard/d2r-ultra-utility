import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Tag } from "antd";
import { useSaveEditor } from "../../../shared/saveeditor/SaveEditorContext";
import { CLASS_NAMES } from "../../../shared/saveeditor/constants";

interface SaveListProps {
  isDarkTheme: boolean;
}

const SaveList: React.FC<SaveListProps> = ({ isDarkTheme }) => {
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

  const rowBase =
    "w-full text-left px-2 py-1.5 rounded transition-colors text-sm flex items-center justify-between gap-2";
  const rowActive = isDarkTheme ? "bg-yellow-600/30" : "bg-yellow-500/30";
  const rowIdle = isDarkTheme ? "hover:bg-gray-700/60" : "hover:bg-gray-200";

  return (
    <div className="flex flex-col gap-3 w-60 shrink-0">
      <div className="flex gap-2">
        <Button size="small" onClick={rescan} loading={loading} disabled={busy}>
          {t("saveEditor.list.rescan")}
        </Button>
        <Button size="small" onClick={openExtra} disabled={busy}>
          {t("saveEditor.list.openOther")}
        </Button>
      </div>

      <div>
        <div className="text-xs uppercase opacity-60 mb-1 px-1">
          {t("saveEditor.list.characters")} ({characters.length})
        </div>
        <div className="flex flex-col gap-0.5">
          {characters.length === 0 && (
            <div className="text-xs opacity-50 px-2 py-1">
              {t("saveEditor.list.none")}
            </div>
          )}
          {characters.map((c) => {
            const active = c.path === activeChar?.path;
            return (
              <button
                key={c.path}
                type="button"
                onClick={() => selectChar(c.path)}
                className={`${rowBase} ${active ? rowActive : rowIdle}`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {c.result.profile.name || c.fileName}
                  </span>
                  <span className="block truncate text-[11px] opacity-60">
                    {(CLASS_NAMES[c.result.profile.class] ?? c.result.profile.class)}
                    {" · "}
                    {t("saveEditor.character.level")} {c.result.profile.level}
                  </span>
                </span>
                {isDirty(c.path) && <Tag color="orange">●</Tag>}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase opacity-60 mb-1 px-1">
          {t("saveEditor.list.stashes")} ({stashes.length})
        </div>
        <div className="flex flex-col gap-0.5">
          {stashes.length === 0 && (
            <div className="text-xs opacity-50 px-2 py-1">
              {t("saveEditor.list.none")}
            </div>
          )}
          {stashes.map((s) => {
            const active = s.path === activeStash?.path;
            return (
              <button
                key={s.path}
                type="button"
                onClick={() => selectStash(s.path)}
                className={`${rowBase} ${active ? rowActive : rowIdle}`}
              >
                <span className="truncate">{s.fileName}</span>
                {isDirty(s.path) && <Tag color="orange">●</Tag>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SaveList;
