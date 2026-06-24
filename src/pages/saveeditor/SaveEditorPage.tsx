import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Empty, Popconfirm, Spin, Tag } from "antd";
import { useSaveEditor } from "../../shared/saveeditor/SaveEditorContext";
import CharacterPanel from "./components/CharacterPanel";
import StashPanel from "./components/StashPanel";
import SaveList from "./components/SaveList";
import GameButton from "./components/GameButton";

interface SaveEditorPageProps {
  isDarkTheme: boolean;
}

const SaveEditorPage: React.FC<SaveEditorPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    scanned,
    scanDir,
    scanExists,
    loadWarnings,
    activeChar,
    activeStash,
    loading,
    busy,
    error,
    saveActiveChar,
    saveActiveStash,
    restoreActiveChar,
    restoreActiveStash,
    isDirty,
    clearError,
  } = useSaveEditor();

  const charDirty = isDirty(activeChar?.path);
  const stashDirty = isDirty(activeStash?.path);

  return (
    <div className="px-4 pb-8 flex flex-col gap-3 w-full">
      {/* Action toolbar (operates on the active files) */}
      <div className="flex flex-wrap items-center gap-2">
        <GameButton
          disabled={!activeChar || !charDirty || busy}
          onClick={saveActiveChar}
        >
          {t("saveEditor.toolbar.saveCharacter")}
        </GameButton>
        <GameButton
          disabled={!activeStash || !stashDirty || busy}
          onClick={saveActiveStash}
        >
          {t("saveEditor.toolbar.saveStash")}
        </GameButton>
        <Popconfirm
          title={t("saveEditor.restoreConfirm")}
          onConfirm={restoreActiveChar}
          disabled={!activeChar || busy}
        >
          <GameButton danger disabled={!activeChar || busy}>
            {t("saveEditor.toolbar.restoreCharacter")}
          </GameButton>
        </Popconfirm>
        <Popconfirm
          title={t("saveEditor.restoreConfirm")}
          onConfirm={restoreActiveStash}
          disabled={!activeStash || busy}
        >
          <GameButton danger disabled={!activeStash || busy}>
            {t("saveEditor.toolbar.restoreStash")}
          </GameButton>
        </Popconfirm>
      </div>

      {scanDir && (
        <div className="text-xs opacity-60 font-mono break-all">{scanDir}</div>
      )}

      {scanned && !scanExists && (
        <Alert
          type="info"
          showIcon
          message={t("saveEditor.scan.notFoundTitle")}
          description={t("saveEditor.scan.notFoundDesc")}
        />
      )}

      {error && (
        <Alert type="error" showIcon closable onClose={clearError} message={error} />
      )}

      {loadWarnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={t("saveEditor.scan.loadWarnings")}
          description={loadWarnings.join("\n")}
        />
      )}

      <Spin spinning={loading || busy} tip={loading ? t("saveEditor.scanning") : t("saveEditor.busy")}>
        <div className="flex flex-col lg:flex-row gap-4 items-start min-h-[200px]">
          <SaveList isDarkTheme={isDarkTheme} />

          {/* Character column */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {t("saveEditor.character.title")}
              </h2>
              {activeChar && <Tag>{activeChar.fileName}</Tag>}
              {charDirty && <Tag color="orange">{t("saveEditor.unsaved")}</Tag>}
            </div>
            {activeChar ? (
              <CharacterPanel character={activeChar} isDarkTheme={isDarkTheme} />
            ) : (
              <Empty description={t("saveEditor.empty.character")} />
            )}
            {activeChar?.result.warnings?.length ? (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message={t("saveEditor.warnings")}
                description={activeChar.result.warnings.join("\n")}
              />
            ) : null}
          </div>

          {/* Stash column (Personal / Shared / Materials) */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {t("saveEditor.stash.title")}
              </h2>
              {activeStash && <Tag>{activeStash.fileName}</Tag>}
              {(charDirty || stashDirty) && (
                <Tag color="orange">{t("saveEditor.unsaved")}</Tag>
              )}
            </div>
            <StashPanel isDarkTheme={isDarkTheme} />
            {activeStash?.result.warnings?.length ? (
              <Alert
                className="mt-2 max-w-[440px]"
                type="info"
                showIcon
                message={t("saveEditor.warnings")}
                description={activeStash.result.warnings.join("\n")}
              />
            ) : null}
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default SaveEditorPage;
