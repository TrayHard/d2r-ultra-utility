import React, { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiDownload, mdiLoading } from "@mdi/js";

interface UpdateButtonProps {
  isDarkTheme: boolean;
}

const UpdateButton: React.FC<UpdateButtonProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Проверка обновлений при монтировании компонента
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      setUpdateAvailable(Boolean(update?.available));
    } catch (error) {
      console.error("Error checking for updates:", error);
      setUpdateAvailable(false);
    }
  };

  const handleUpdate = async () => {
    if (isUpdating) return;
    try {
      setIsUpdating(true);
      const update = await check();
      if (update?.available) {
        await update.download();
        await update.install();
        await relaunch();
      }
    } catch (error) {
      console.error("Error during update:", error);
      setIsUpdating(false);
    }
  };

  // Показываем всегда: два состояния — есть обновление (зелёная иконка) или нет (серая иконка)
  const tooltipTitle = isUpdating
    ? t("update.downloading", "Downloading update...")
    : updateAvailable
    ? t("update.available", "Update available - Click to install")
    : t("update.upToDate", "Up to date");

  return (
    <Tooltip title={tooltipTitle} placement="bottom">
      <button
        onClick={handleUpdate}
        disabled={!updateAvailable || isUpdating}
        className={`p-1 rounded-full transition-all duration-200 ${
          updateAvailable ? "hover:scale-110" : ""
        } ${
          isUpdating ? "opacity-75 cursor-not-allowed" : ""
        } bg-transparent`}
        aria-label={tooltipTitle}
      >
        {isUpdating ? (
          <Icon
            path={mdiLoading}
            size={0.9}
            spin
            className={isDarkTheme ? "text-gray-400" : "text-gray-500"}
          />
        ) : (
          <Icon
            path={mdiDownload}
            size={0.9}
            className={
              `${updateAvailable ? 'animate-bounce' : ''} ` +
              (updateAvailable
                ? (isDarkTheme ? 'text-green-500' : 'text-green-600')
                : (isDarkTheme ? 'text-gray-400' : 'text-gray-500'))
            }
          />
        )}
      </button>
    </Tooltip>
  );
};

export default UpdateButton;
