import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Empty, Popconfirm, Space, Spin, Tag } from "antd";
import { useSaveEditor } from "../../shared/saveeditor/SaveEditorContext";
import CharacterPanel from "./components/CharacterPanel";
import SharedStashPanel from "./components/SharedStashPanel";
import SaveList from "./components/SaveList";

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
      <Alert
        type="warning"
        showIcon
        message={t("saveEditor.beta.title")}
        description={t("saveEditor.beta.description")}
      />

      {/* Action toolbar (operates on the active files) */}
      <div className="flex flex-wrap items-center gap-2">
        <Space wrap>
          <Button
            type="primary"
            disabled={!activeChar || !charDirty || busy}
            loading={busy}
            onClick={saveActiveChar}
          >
            {t("saveEditor.toolbar.saveCharacter")}
          </Button>
          <Button
            type="primary"
            disabled={!activeStash || !stashDirty || busy}
            loading={busy}
            onClick={saveActiveStash}
          >
            {t("saveEditor.toolbar.saveStash")}
          </Button>
          <Popconfirm
            title={t("saveEditor.restoreConfirm")}
            onConfirm={restoreActiveChar}
            disabled={!activeChar || busy}
          >
            <Button danger disabled={!activeChar || busy}>
              {t("saveEditor.toolbar.restoreCharacter")}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t("saveEditor.restoreConfirm")}
            onConfirm={restoreActiveStash}
            disabled={!activeStash || busy}
          >
            <Button danger disabled={!activeStash || busy}>
              {t("saveEditor.toolbar.restoreStash")}
            </Button>
          </Popconfirm>
        </Space>
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

          {/* Shared stash column */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {t("saveEditor.stash.title")}
              </h2>
              {activeStash && <Tag>{activeStash.fileName}</Tag>}
              {stashDirty && <Tag color="orange">{t("saveEditor.unsaved")}</Tag>}
            </div>
            {activeStash ? (
              <SharedStashPanel stash={activeStash} isDarkTheme={isDarkTheme} />
            ) : (
              <Empty description={t("saveEditor.empty.stash")} />
            )}
            {activeStash?.result.warnings?.length ? (
              <Alert
                className="mt-2"
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
