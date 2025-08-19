import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal.tsx";
import Button from "./Button.tsx";
import { Select } from "antd";
import ColorPallet from "./ColorPallet.tsx";
import TriStateSwitch, { TriState } from "./TriStateSwitch.tsx";
import { RuneSettings } from "../../app/providers/SettingsContext.tsx";
import { ERune } from "../../pages/runes/constants/runes.ts";

interface MassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRunes: Set<ERune>;
  onApply: (settings: Partial<RuneSettings>) => void;
  isDarkTheme: boolean;
}

const MassEditModal: React.FC<MassEditModalProps> = ({
  isOpen,
  onClose,
  selectedRunes,
  onApply,
  isDarkTheme,
}) => {
  const { t } = useTranslation();

  // Состояние для настроек с TriState
  const [isHighlighted, setIsHighlighted] = useState<TriState>(null);
  const [boxSize, setBoxSize] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [boxLimiters, setBoxLimiters] = useState<string>("");
  const [boxLimitersColor, setBoxLimitersColor] = useState<string>("");
  const [showRuneNumber, setShowRuneNumber] = useState<TriState>(null);
  const [dividerType, setDividerType] = useState<string>("");
  const [dividerColor, setDividerColor] = useState<string>("");
  const [numberColor, setNumberColor] = useState<string>("");

  // Сбрасываем настройки при открытии модалки
  useEffect(() => {
    if (isOpen) {
      setIsHighlighted(null);
      setBoxSize("");
      setColor("");
      setBoxLimiters("");
      setBoxLimitersColor("");
      setShowRuneNumber(null);
      setDividerType("");
      setDividerColor("");
      setNumberColor("");
    }
  }, [isOpen]);

  // Опции для дропдаунов
  const sizeOptions = [
    { value: "", label: t("runePage.massEdit.noChange") },
    { value: "0", label: t("runePage.controls.sizes.Normal") },
    { value: "1", label: t("runePage.controls.sizes.Medium") },
    { value: "2", label: t("runePage.controls.sizes.Large") },
  ];

  // (цветовые опции не нужны — используем ColorPallet)

  const dividerOptions = [
    { value: "", label: t("runePage.massEdit.noChange") },
    {
      value: "parentheses",
      label: t("runePage.controls.dividerTypes.parentheses"),
    },
    { value: "brackets", label: t("runePage.controls.dividerTypes.brackets") },
    { value: "pipe", label: t("runePage.controls.dividerTypes.pipe") },
  ];

  const boxLimitersOptions = [
    { value: "", label: t("runePage.massEdit.noChange") },
    { value: "spaces", label: t("runePage.controls.boxLimitersTypes.spaces") },
    { value: "~", label: "~" },
    { value: "-", label: "-" },
    { value: "_", label: "_" },
    { value: "|", label: "|" },
    { value: ".", label: "." },
  ];

  const handleApply = () => {
    const filteredSettings: Partial<RuneSettings> = {};

    // Применяем только те настройки, которые не null и не ""
    if (isHighlighted !== null) {
      filteredSettings.isHighlighted = isHighlighted;
    }

    const autoChanges: Partial<RuneSettings["autoSettings"]> = {};

    if (boxSize !== "") {
      autoChanges.boxSize = parseInt(boxSize);
    }

    if (color !== "") {
      autoChanges.color = color;
    }

    if (boxLimiters !== "") {
      autoChanges.boxLimiters = boxLimiters;
    }

    if (boxLimitersColor !== "") {
      autoChanges.boxLimitersColor = boxLimitersColor;
    }

    // Настройки нумерации применяем только те поля, которые изменились
    if (
      showRuneNumber !== null ||
      dividerType !== "" ||
      dividerColor !== "" ||
      numberColor !== ""
    ) {
      const numberingChanges: Partial<RuneSettings["autoSettings"]["numbering"]> = {};

      if (showRuneNumber !== null) {
        numberingChanges.show = showRuneNumber as boolean;
      }

      if (dividerType !== "") {
        numberingChanges.dividerType = dividerType;
      }

      if (dividerColor !== "") {
        numberingChanges.dividerColor = dividerColor;
      }

      if (numberColor !== "") {
        numberingChanges.numberColor = numberColor;
      }

      autoChanges.numbering = numberingChanges as RuneSettings["autoSettings"]["numbering"];
    }

    if (Object.keys(autoChanges).length > 0) {
      filteredSettings.autoSettings = autoChanges as RuneSettings["autoSettings"];
    }

    onApply(filteredSettings);
    onClose();
  };

  // Проверяем, есть ли изменения для применения
  const hasChanges =
    isHighlighted !== null ||
    boxSize !== "" ||
    color !== "" ||
    boxLimiters !== "" ||
    boxLimitersColor !== "" ||
    showRuneNumber !== null ||
    dividerType !== "" ||
    dividerColor !== "" ||
    numberColor !== "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} isDarkTheme={isDarkTheme}>
      <div className="p-2 space-y-6">
        {/* Заголовок */}
        <div>
          <h2
            className={`text-xl font-semibold ${
              isDarkTheme ? "text-white" : "text-gray-900"
            }`}
          >
            {t("runePage.massEdit.modalTitle")}
          </h2>
          <p
            className={`text-sm mt-1 ${
              isDarkTheme ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {selectedRunes.size} {t("runePage.massEdit.selected")}
          </p>
        </div>

        {/* Контроллы */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Левый столбец */}
          <div className="space-y-4">
            <h3
              className={`text-lg font-medium ${
                isDarkTheme ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {t("runePage.massEdit.basicSettings")}
            </h3>

            {/* Highlight Rune */}
            <div
              className={`p-3 rounded-lg ${
                isDarkTheme ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("runePage.controls.highlightRune")}
                </span>
                <TriStateSwitch
                  value={isHighlighted}
                  onChange={setIsHighlighted}
                  isDarkTheme={isDarkTheme}
                  size="md"
                />
              </div>
            </div>

            {/* Box Size Select */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.boxSize")}
              </label>
              <Select
                options={sizeOptions}
                value={boxSize}
                onChange={(v) => setBoxSize(String(v))}
                size="middle"
                style={{ width: "100%" }}
              />
            </div>

            {/* Color Picker */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.color")}
              </label>
              <div className="flex items-center gap-2">
                <ColorPallet
                  isDarkTheme={isDarkTheme}
                  value={color || "white"}
                  onChange={(name) => setColor(name)}
                  size="sm"
                />
                {color === "" ? (
                  <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"} text-xs`}>
                    {t("runePage.massEdit.noChange")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setColor("")}
                    className={`text-xs underline ${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {t("runePage.massEdit.noChange")}
                  </button>
                )}
              </div>
            </div>

            {/* Box Limiters Select */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Box limiters
              </label>
              <Select
                options={boxLimitersOptions}
                value={boxLimiters}
                onChange={(v) => setBoxLimiters(String(v))}
                size="middle"
                style={{ width: "100%" }}
              />
            </div>

            {/* Box Limiters Color Picker */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Box limiters color
              </label>
              <div className="flex items-center gap-2">
                <ColorPallet
                  isDarkTheme={isDarkTheme}
                  value={boxLimitersColor || "white"}
                  onChange={(name) => setBoxLimitersColor(name)}
                  size="sm"
                  disabled={boxSize === "0"}
                />
                {boxLimitersColor === "" ? (
                  <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"} text-xs`}>
                    {t("runePage.massEdit.noChange")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBoxLimitersColor("")}
                    className={`text-xs underline ${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {t("runePage.massEdit.noChange")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Правый столбец */}
          <div className="space-y-4">
            <h3
              className={`text-lg font-medium ${
                isDarkTheme ? "text-gray-200" : "text-gray-800"
              }`}
            >
              {t("runePage.massEdit.numberingSettings")}
            </h3>

            {/* Show Rune Number */}
            <div
              className={`p-3 rounded-lg ${
                isDarkTheme ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {t("runePage.controls.showRuneNumber")}
                </span>
                <TriStateSwitch
                  value={showRuneNumber}
                  onChange={setShowRuneNumber}
                  isDarkTheme={isDarkTheme}
                  size="md"
                />
              </div>
            </div>

            {/* Divider Type Select */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.divider")}
              </label>
              <Select
                options={dividerOptions}
                value={dividerType}
                onChange={(v) => setDividerType(String(v))}
                size="middle"
                style={{ width: "100%" }}
                disabled={showRuneNumber === false}
              />
            </div>

            {/* Divider Color Picker */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.dividerColor")}
              </label>
              <div className="flex items-center gap-2">
                <ColorPallet
                  isDarkTheme={isDarkTheme}
                  value={dividerColor || "white"}
                  onChange={(name) => setDividerColor(name)}
                  size="sm"
                  disabled={showRuneNumber === false}
                />
                {dividerColor === "" ? (
                  <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"} text-xs`}>
                    {t("runePage.massEdit.noChange")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDividerColor("")}
                    className={`text-xs underline ${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {t("runePage.massEdit.noChange")}
                  </button>
                )}
              </div>
            </div>

            {/* Number Color Picker */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.numberColor")}
              </label>
              <div className="flex items-center gap-2">
                <ColorPallet
                  isDarkTheme={isDarkTheme}
                  value={numberColor || "white"}
                  onChange={(name) => setNumberColor(name)}
                  size="sm"
                  disabled={showRuneNumber === false}
                />
                {numberColor === "" ? (
                  <span className={`${isDarkTheme ? "text-gray-400" : "text-gray-500"} text-xs`}>
                    {t("runePage.massEdit.noChange")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setNumberColor("")}
                    className={`text-xs underline ${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {t("runePage.massEdit.noChange")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-300 dark:border-gray-600">
          <Button
            variant="secondary"
            onClick={onClose}
            isDarkTheme={isDarkTheme}
          >
            {t("runePage.massEdit.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            isDarkTheme={isDarkTheme}
            disabled={!hasChanges}
          >
            {t("runePage.massEdit.applyToRunes", { count: selectedRunes.size })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MassEditModal;
