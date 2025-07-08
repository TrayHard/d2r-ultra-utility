import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal.tsx";
import Button from "./Button.tsx";
import Dropdown from "./Dropdown.tsx";
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

  const colorOptions = [
    { value: "", label: t("runePage.massEdit.noChange") },
    { value: "white", label: t("runePage.controls.colors.white") },
    { value: "gray", label: t("runePage.controls.colors.gray") },
    { value: "black", label: t("runePage.controls.colors.black") },
    { value: "beige", label: t("runePage.controls.colors.beige") },
    { value: "lightred", label: t("runePage.controls.colors.lightred") },
    { value: "red", label: t("runePage.controls.colors.red") },
    { value: "dimred", label: t("runePage.controls.colors.dimred") },
    { value: "orange", label: t("runePage.controls.colors.orange") },
    { value: "lightgold", label: t("runePage.controls.colors.lightgold") },
    { value: "yellow", label: t("runePage.controls.colors.yellow") },
    { value: "lightyellow", label: t("runePage.controls.colors.lightyellow") },
    { value: "green", label: t("runePage.controls.colors.green") },
    { value: "dimgreen", label: t("runePage.controls.colors.dimgreen") },
    { value: "darkgreen", label: t("runePage.controls.colors.darkgreen") },
    { value: "indigo", label: t("runePage.controls.colors.indigo") },
    { value: "lightindigo", label: t("runePage.controls.colors.lightindigo") },
    { value: "turquoise", label: t("runePage.controls.colors.turquoise") },
    { value: "lightblue", label: t("runePage.controls.colors.lightblue") },
    { value: "pink", label: t("runePage.controls.colors.pink") },
    { value: "purple", label: t("runePage.controls.colors.purple") },
  ];

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

    if (boxSize !== "") {
      filteredSettings.boxSize = parseInt(boxSize);
    }

    if (color !== "") {
      filteredSettings.color = color;
    }

    if (boxLimiters !== "") {
      filteredSettings.boxLimiters = boxLimiters;
    }

    if (boxLimitersColor !== "") {
      filteredSettings.boxLimitersColor = boxLimitersColor;
    }

    // Настройки нумерации применяем только те поля, которые изменились
    if (
      showRuneNumber !== null ||
      dividerType !== "" ||
      dividerColor !== "" ||
      numberColor !== ""
    ) {
      const numberingChanges: any = {};

      if (showRuneNumber !== null) {
        numberingChanges.show = showRuneNumber;
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

      filteredSettings.numbering = numberingChanges;
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

            {/* Box Size Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.boxSize")}
              </label>
              <Dropdown
                options={sizeOptions}
                selectedValue={boxSize}
                onSelect={setBoxSize}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
            </div>

            {/* Color Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.color")}
              </label>
              <Dropdown
                options={colorOptions}
                selectedValue={color}
                onSelect={setColor}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
            </div>

            {/* Box Limiters Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Box limiters
              </label>
              <Dropdown
                options={boxLimitersOptions}
                selectedValue={boxLimiters}
                onSelect={setBoxLimiters}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
            </div>

            {/* Box Limiters Color Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Box limiters color
              </label>
              <Dropdown
                options={colorOptions}
                selectedValue={boxLimitersColor}
                onSelect={setBoxLimitersColor}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
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

            {/* Divider Type Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.divider")}
              </label>
              <Dropdown
                options={dividerOptions}
                selectedValue={dividerType}
                onSelect={setDividerType}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
            </div>

            {/* Divider Color Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.dividerColor")}
              </label>
              <Dropdown
                options={colorOptions}
                selectedValue={dividerColor}
                onSelect={setDividerColor}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
            </div>

            {/* Number Color Dropdown */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {t("runePage.controls.numberColor")}
              </label>
              <Dropdown
                options={colorOptions}
                selectedValue={numberColor}
                onSelect={setNumberColor}
                isDarkTheme={isDarkTheme}
                size="md"
                placeholder={t("runePage.massEdit.noChange")}
              />
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
