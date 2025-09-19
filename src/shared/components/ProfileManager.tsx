import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  mdiContentSave,
  mdiPlus,
  mdiDelete,
  mdiFileImport,
  mdiFileExport,
  mdiCheck,
  mdiContentDuplicate,
} from "@mdi/js";
import Button from "./Button";
import Dropdown from "./Dropdown";
import Modal from "./Modal";
import { useGlobalMessage } from "./Message/MessageProvider";
import { Profile } from "../../app/providers/SettingsContext";
import { Tooltip } from "antd";

interface ProfileManagerProps {
  isDarkTheme: boolean;
  currentSettings: any;
  profiles: Profile[];
  immutableProfiles: Profile[];
  activeProfileId: string | null;
  onProfileSelect: (profileId: string) => void;
  onProfileCreate: (name: string, settings: any) => void;
  onProfileSave: (profileId: string, settings: any) => void;
  onProfileRename: (profileId: string, newName: string) => void;
  onProfileDelete: (profileId: string) => void;
  onProfileDuplicate: (profileId: string) => void;
  onProfileExport: (profileId: string) => void;
  onProfileImport: (profileData: any) => void;
  hasAnyChanges: boolean;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({
  isDarkTheme,
  currentSettings,
  profiles,
  immutableProfiles,
  activeProfileId,
  onProfileSelect,
  onProfileCreate,
  onProfileSave,
  onProfileRename,
  onProfileDelete,
  onProfileDuplicate,
  onProfileExport,
  onProfileImport,
  hasAnyChanges,
}) => {
  const { t } = useTranslation();
  const { sendMessage } = useGlobalMessage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [renameProfileId, setRenameProfileId] = useState<string | null>(null);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  // Объединяем все профили (обычные и неизменяемые)
  const allProfiles = [...immutableProfiles, ...profiles];
  const activeProfile = allProfiles.find((p) => p.id === activeProfileId);

  const handleCreateProfile = () => {
    if (newProfileName.trim()) {
      onProfileCreate(newProfileName.trim(), currentSettings);
      setNewProfileName("");
      setShowCreateModal(false);
      sendMessage(
        t("profiles.messages.profileCreated", { name: newProfileName }),
        {
          type: "success",
          title: t("profiles.messages.success"),
        }
      );
    }
  };

  const handleRenameProfile = () => {
    if (renameProfileId && newProfileName.trim()) {
      onProfileRename(renameProfileId, newProfileName.trim());
      setNewProfileName("");
      setRenameProfileId(null);
      setShowRenameModal(false);
      sendMessage(
        t("profiles.messages.profileRenamed", { name: newProfileName }),
        {
          type: "success",
          title: t("profiles.messages.success"),
        }
      );
    }
  };

  const handleDeleteProfile = () => {
    if (deleteProfileId) {
      const profile = allProfiles.find((p) => p.id === deleteProfileId);
      onProfileDelete(deleteProfileId);
      setDeleteProfileId(null);
      setShowDeleteModal(false);
      sendMessage(
        t("profiles.messages.profileDeleted", { name: profile?.name }),
        {
          type: "success",
          title: t("profiles.messages.success"),
        }
      );
    }
  };

  const handleExportProfile = () => {
    if (activeProfileId) {
      onProfileExport(activeProfileId);
      sendMessage(t("profiles.messages.profileExported"), {
        type: "success",
        title: t("profiles.messages.success"),
      });
    }
  };

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const profileData = JSON.parse(e.target?.result as string);
          onProfileImport(profileData);
          sendMessage(t("profiles.messages.profileImported"), {
            type: "success",
            title: t("profiles.messages.success"),
          });
        } catch (error) {
          sendMessage(t("profiles.messages.importError"), {
            type: "error",
            title: t("profiles.messages.error"),
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Создаем опции для dropdown с заголовками секций
  const profileOptions = [];

  // Добавляем секцию базовых профилей
  if (immutableProfiles.length > 0) {
    profileOptions.push({
      value: "baseProfilesHeader",
      label: t("profiles.baseProfiles"),
      isSectionHeader: true,
    });

    immutableProfiles.forEach((profile) => {
      profileOptions.push({
        value: profile.id,
        label: `🔒 ${profile.name}`,
        readonly: true,
      });
    });
  }

  // Добавляем секцию пользовательских профилей
  if (profiles.length > 0) {
    profileOptions.push({
      value: "userProfilesHeader",
      label: t("profiles.userProfiles"),
      isSectionHeader: true,
    });

    profiles.forEach((profile) => {
      profileOptions.push({
        value: profile.id,
        label: profile.name,
        readonly: false,
      });
    });
  }

  return (
    <div className="flex flex-col items-start justify-start gap-1">
      <div
        className={`text-xs font-semibold uppercase tracking-wide ${
          isDarkTheme ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {t("profiles.sectionTitle")}
      </div>
      <div
        className={`flex items-center gap-2 flex-wrap rounded-md h-[80px] p-4 ${
          isDarkTheme
            ? "bg-gray-800 border border-gray-700"
            : "bg-gray-100 border border-gray-200"
        }`}
      >
        {/* Create Profile Button */}
        <Button
          variant="success"
          onClick={() => setShowCreateModal(true)}
          isDarkTheme={isDarkTheme}
          icon={mdiPlus}
          size="sm"
          className="h-[38px]"
          title={t("profiles.createProfile")}
        />
        {/* Profile Selector */}
        <Dropdown
          selectedValue={activeProfileId ?? ""}
          onSelect={(value) => {
            if (
              value === "baseProfilesHeader" ||
              value === "userProfilesHeader"
            )
              return;
            onProfileSelect(value);
          }}
          options={profileOptions}
          placeholder={t("profiles.selectProfile")}
          isDarkTheme={isDarkTheme}
          className="min-w-[250px] profileManagerProfileName"
          onOptionRename={(value) => {
            if (
              value === "baseProfilesHeader" ||
              value === "userProfilesHeader"
            )
              return;
            const profile = allProfiles.find((p) => p.id === value);
            if (profile && !profile.isImmutable) {
              setRenameProfileId(profile.id);
              setNewProfileName(profile.name);
              setShowRenameModal(true);
            }
          }}
          onOptionDelete={(value) => {
            if (
              value === "baseProfilesHeader" ||
              value === "userProfilesHeader"
            )
              return;
            const profile = allProfiles.find((p) => p.id === value);
            if (profile && !profile.isImmutable) {
              setDeleteProfileId(profile.id);
              setShowDeleteModal(true);
            }
          }}
          renameTitle={t("profiles.renameProfile")}
          deleteTitle={t("profiles.deleteProfile")}
        />

        <div className="flex items-center gap-2">
          {/* Save Profile Button */}
          <Tooltip
            title={t("profiles.saveProfile")}
            placement="top"
            mouseEnterDelay={0.3}
          >
            <Button
              variant="info"
              onClick={() => activeProfileId && setShowSaveConfirm(true)}
              disabled={
                !activeProfileId || activeProfile?.isImmutable || !hasAnyChanges
              }
              isDarkTheme={isDarkTheme}
              icon={mdiContentSave}
              size="sm"
              className="h-[38px]"
            />
          </Tooltip>

          {/* Duplicate Profile Button */}
          <Tooltip
            title={t("basicMainSpace.tooltips.duplicate")}
            placement="top"
            mouseEnterDelay={0.3}
          >
            <Button
              variant="secondary"
              onClick={() => {
                if (activeProfileId) {
                  onProfileDuplicate(activeProfileId);
                  const duplicated = allProfiles.find(
                    (p) => p.id === activeProfileId
                  );
                  sendMessage(
                    t("profiles.messages.profileDuplicated", {
                      name: duplicated?.name,
                    }) || "Profile duplicated",
                    { type: "success", title: t("profiles.messages.success") }
                  );
                }
              }}
              disabled={!activeProfileId}
              isDarkTheme={isDarkTheme}
              icon={mdiContentDuplicate}
              size="sm"
              className="h-[38px]"
            />
          </Tooltip>
        </div>

        {/* Import Profile Button */}
        <Tooltip
          title={t("profiles.importProfile")}
          placement="top"
          mouseEnterDelay={0.3}
        >
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            isDarkTheme={isDarkTheme}
            icon={mdiFileImport}
            size="sm"
            className="h-[38px]"
          />
        </Tooltip>

        {/* Export Profile Button */}
        <Tooltip
          title={t("profiles.exportProfile")}
          placement="top"
          mouseEnterDelay={0.3}
        >
          <Button
            variant="secondary"
            onClick={handleExportProfile}
            disabled={!activeProfileId}
            isDarkTheme={isDarkTheme}
            icon={mdiFileExport}
            size="sm"
            className="h-[38px]"
          />
        </Tooltip>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportProfile}
          style={{ display: "none" }}
        />
      </div>

      {/* Create Profile Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t("profiles.createProfile")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("profiles.profileName")}
            </label>
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder={t("profiles.enterProfileName")}
              maxLength={30}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              onKeyPress={(e) => e.key === "Enter" && handleCreateProfile()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("profiles.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleCreateProfile}
              disabled={!newProfileName.trim()}
              isDarkTheme={isDarkTheme}
              size="sm"
              icon={mdiCheck}
            >
              {t("profiles.create")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Profile Modal */}
      <Modal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title={t("profiles.renameProfile")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("profiles.profileName")}
            </label>
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder={t("profiles.enterProfileName")}
              maxLength={25}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              onKeyPress={(e) => e.key === "Enter" && handleRenameProfile()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowRenameModal(false)}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("profiles.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={handleRenameProfile}
              disabled={!newProfileName.trim()}
              isDarkTheme={isDarkTheme}
              size="sm"
              icon={mdiCheck}
            >
              {t("profiles.rename")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Profile Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("profiles.deleteProfile")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("profiles.deleteConfirmation", {
              name: allProfiles.find((p) => p.id === deleteProfileId)?.name,
            })}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("profiles.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteProfile}
              isDarkTheme={isDarkTheme}
              size="sm"
              icon={mdiDelete}
            >
              {t("profiles.delete")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        title={t("profiles.saveProfile")}
        isDarkTheme={isDarkTheme}
        size="sm"
      >
        <div className="space-y-4">
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-300" : "text-gray-600"
            }`}
          >
            {t("profiles.saveConfirmation", { name: activeProfile?.name })}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowSaveConfirm(false)}
              isDarkTheme={isDarkTheme}
              size="sm"
            >
              {t("profiles.cancel")}
            </Button>
            <Button
              variant="success"
              onClick={() => {
                try {
                  if (activeProfileId) {
                    onProfileSave(activeProfileId, currentSettings);
                  }
                  sendMessage(
                    t("profiles.messages.profileSaved", {
                      name: activeProfile?.name,
                    }),
                    { type: "success", title: t("profiles.messages.success") }
                  );
                } catch (e) {
                  sendMessage(t("profiles.messages.saveError"), {
                    type: "error",
                    title: t("profiles.messages.error"),
                  });
                } finally {
                  setShowSaveConfirm(false);
                }
              }}
              isDarkTheme={isDarkTheme}
              size="sm"
              icon={mdiCheck}
            >
              {t("profiles.saveProfile")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileManager;
