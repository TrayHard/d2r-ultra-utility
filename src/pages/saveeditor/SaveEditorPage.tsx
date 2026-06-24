import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Empty, Popconfirm, Space, Spin, Tag } from "antd";
import { useSaveEditor } from "../../shared/saveeditor/SaveEditorContext";
import CharacterPanel from "./components/CharacterPanel";
import SharedStashPanel from "./components/SharedStashPanel";

interface SaveEditorPageProps {
  isDarkTheme: boolean;
}

const SaveEditorPage: React.FC<SaveEditorPageProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const {
    character,
    stash,
    loading,
    busy,
    error,
    dirtyChar,
    dirtyStash,
    openCharacter,
    openStash,
    saveCharacter,
    saveStash,
    restoreCharacter,
    restoreStash,
    clearError,
  } = useSaveEditor();

  return (
    <div className="px-4 pb-8 flex flex-col gap-3 max-w-[1180px] mx-auto w-full">
      <Alert
        type="warning"
        showIcon
        message={t("saveEditor.beta.title")}
        description={t("saveEditor.beta.description")}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Space wrap>
          <Button onClick={openCharacter} loading={loading}>
            {t("saveEditor.toolbar.openCharacter")}
          </Button>
          <Button onClick={openStash} loading={loading}>
            {t("saveEditor.toolbar.openStash")}
          </Button>
        </Space>
        <div className="flex-1" />
        <Space wrap>
          <Button
            type="primary"
            disabled={!character || !dirtyChar || busy}
            loading={busy}
            onClick={saveCharacter}
          >
            {t("saveEditor.toolbar.saveCharacter")}
          </Button>
          <Button
            type="primary"
            disabled={!stash || !dirtyStash || busy}
            loading={busy}
            onClick={saveStash}
          >
            {t("saveEditor.toolbar.saveStash")}
          </Button>
          <Popconfirm
            title={t("saveEditor.restoreConfirm")}
            onConfirm={restoreCharacter}
            disabled={!character || busy}
          >
            <Button danger disabled={!character || busy}>
              {t("saveEditor.toolbar.restoreCharacter")}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t("saveEditor.restoreConfirm")}
            onConfirm={restoreStash}
            disabled={!stash || busy}
          >
            <Button danger disabled={!stash || busy}>
              {t("saveEditor.toolbar.restoreStash")}
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {error && (
        <Alert type="error" showIcon closable onClose={clearError} message={error} />
      )}

      <Spin spinning={busy} tip={t("saveEditor.busy")}>
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Character column */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {t("saveEditor.character.title")}
              </h2>
              {character && <Tag>{character.fileName}</Tag>}
              {dirtyChar && <Tag color="orange">{t("saveEditor.unsaved")}</Tag>}
            </div>
            {character ? (
              <CharacterPanel character={character} isDarkTheme={isDarkTheme} />
            ) : (
              <Empty description={t("saveEditor.empty.character")} />
            )}
            {character?.result.warnings?.length ? (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message={t("saveEditor.warnings")}
                description={character.result.warnings.join("\n")}
              />
            ) : null}
          </div>

          {/* Shared stash column */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold">
                {t("saveEditor.stash.title")}
              </h2>
              {stash && <Tag>{stash.fileName}</Tag>}
              {dirtyStash && <Tag color="orange">{t("saveEditor.unsaved")}</Tag>}
            </div>
            {stash ? (
              <SharedStashPanel stash={stash} isDarkTheme={isDarkTheme} />
            ) : (
              <Empty description={t("saveEditor.empty.stash")} />
            )}
            {stash?.result.warnings?.length ? (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message={t("saveEditor.warnings")}
                description={stash.result.warnings.join("\n")}
              />
            ) : null}
          </div>
        </div>
      </Spin>
    </div>
  );
};

export default SaveEditorPage;
