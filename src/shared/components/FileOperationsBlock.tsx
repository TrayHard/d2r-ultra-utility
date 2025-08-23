import React from "react";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { mdiFileDocumentMultiple, mdiCheck, mdiCheckAll } from "@mdi/js";
import Button from "./Button";

interface FileOperationsBlockProps {
  isDarkTheme: boolean;
  isLoading: boolean;
  tabLabel: string;
  onReadAll: () => void;
  onApplyAll: () => void;
  onReadCurrent: () => void;
  onApplyCurrent: () => void;
}

const FileOperationsBlock: React.FC<FileOperationsBlockProps> = ({
  isDarkTheme,
  isLoading,
  tabLabel,
  onReadAll,
  onApplyAll,
  onReadCurrent,
  onApplyCurrent,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full md:w-auto flex flex-col md:items-end gap-1 md:ml-2 mt-2 md:mt-0">
      <div
        className={`text-xs font-semibold uppercase tracking-wide ${isDarkTheme ? "text-gray-300" : "text-gray-700"
          }`}
      >
        {t("profiles.filesSectionTitle")}
      </div>
      <div
        className={`justify-between flex items-stretch gap-3 flex-wrap rounded-md p-2 ${isDarkTheme
          ? "bg-gray-800 border border-gray-700"
          : "bg-gray-100 border border-gray-200"
          }`}
      >
        <div className="flex flex-col gap-1">
          <div
            className={`text-[10px] uppercase tracking-wide ${isDarkTheme ? "text-gray-400" : "text-gray-600"
              }`}
          >
            {t("files.groups.current")}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title={t("runePage.textWorker.readFromFilesFor", { tab: tabLabel })} placement="top">
              <div>
                <Button
                  variant="info"
                  size="sm"
                  onClick={onReadCurrent}
                  isLoading={isLoading}
                  isDarkTheme={isDarkTheme}
                  icon={mdiFileDocumentMultiple}
                >
                  {t("files.read")}
                </Button>
              </div>
            </Tooltip>
            <Tooltip title={t("runePage.textWorker.applyFor", { tab: tabLabel })} placement="top">
              <div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={onApplyCurrent}
                  disabled={isLoading}
                  isDarkTheme={isDarkTheme}
                  icon={mdiCheck}
                >
                  {t("files.apply")}
                </Button>
              </div>
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div
            className={`text-[10px] uppercase tracking-wide ${isDarkTheme ? "text-gray-400" : "text-gray-600"
              }`}
          >
            {t("files.groups.all")}
          </div>
          <div className="flex items-center gap-2">
            <Tooltip title={t("files.readAll")} placement="top">
              <div>
                <Button
                  variant="info"
                  size="sm"
                  onClick={onReadAll}
                  disabled={isLoading}
                  isDarkTheme={isDarkTheme}
                  icon={mdiFileDocumentMultiple}
                >
                  {t("files.readAll")}
                </Button>
              </div>
            </Tooltip>
            <Tooltip title={t("files.applyAll")} placement="top">
              <div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={onApplyAll}
                  disabled={isLoading}
                  isDarkTheme={isDarkTheme}
                  icon={mdiCheckAll}
                >
                  {t("files.applyAll")}
                </Button>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileOperationsBlock;


