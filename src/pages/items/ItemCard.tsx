import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiEye } from "@mdi/js";

interface BaseItem {
  key: string;
  imgName: string;
  baseTypes: string[];
  limitedToClass: string | null;
  maxSockets: number;
  difficultyClass: "normal" | "exceptional" | "elite";
  reqLvl: number;
  reqStrength: number;
  reqDexterity: number;
  weight: "light" | "medium" | "heavy";
  id: number;
}

interface ItemCardProps {
  isDarkTheme: boolean;
  selectedItem: BaseItem | null;
}

const ItemCard: React.FC<ItemCardProps> = ({ isDarkTheme, selectedItem }) => {
  const { t } = useTranslation();

  if (!selectedItem) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${
          isDarkTheme ? "text-gray-400" : "text-gray-600"
        }`}
      >
        <div className="text-center">
          <Icon path={mdiEye} size={3} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">
            {t("itemsPage.selectItem") ?? "Select an item to edit its settings"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
            <img
              src={`/img/bases/${selectedItem.imgName}.png`}
              alt={selectedItem.key}
              className="w-12 h-12 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
          <h3
            className={`text-xl font-semibold mb-2 ${
              isDarkTheme ? "text-white" : "text-gray-900"
            }`}
          >
            {t(`itemsPage.bases.${selectedItem.key}`) || selectedItem.key}
          </h3>
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {t(`itemsPage.filters.${selectedItem.difficultyClass}`)}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("itemsPage.filters.difficultyClass")}
            </label>
            <select
              value={selectedItem.difficultyClass}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            >
              <option value="normal">{t("itemsPage.filters.normal")}</option>
              <option value="exceptional">
                {t("itemsPage.filters.exceptional")}
              </option>
              <option value="elite">{t("itemsPage.filters.elite")}</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("itemsPage.filters.reqLevel")}
            </label>
            <input
              type="number"
              value={selectedItem.reqLvl}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("itemsPage.filters.reqStrength")}
            </label>
            <input
              type="number"
              value={selectedItem.reqStrength}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("itemsPage.filters.reqDexterity")}
            </label>
            <input
              type="number"
              value={selectedItem.reqDexterity}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("itemsPage.filters.weight")}
            </label>
            <select
              value={selectedItem.weight}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            >
              <option value="light">{t("itemsPage.filters.light")}</option>
              <option value="medium">{t("itemsPage.filters.medium")}</option>
              <option value="heavy">{t("itemsPage.filters.heavy")}</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              Max Sockets
            </label>
            <input
              type="number"
              value={selectedItem.maxSockets}
              onChange={() => {}}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }
              `}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              Base Types
            </label>
            <div className="space-y-1">
              {selectedItem.baseTypes.map((baseType, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 text-sm rounded border ${
                    isDarkTheme
                      ? "bg-gray-700 border-gray-600 text-gray-300"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  {t(`itemsPage.baseTypes.${baseType}`) || baseType}
                </div>
              ))}
            </div>
          </div>

          {selectedItem.limitedToClass && (
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkTheme ? "text-white" : "text-gray-900"
                }`}
              >
                {t("itemsPage.filters.limitedToClass")}
              </label>
              <div
                className={`px-3 py-2 text-sm rounded border ${
                  isDarkTheme
                    ? "bg-gray-700 border-gray-600 text-gray-300"
                    : "bg-gray-50 border-gray-200 text-gray-700"
                }`}
              >
                {t(selectedItem.limitedToClass) || selectedItem.limitedToClass}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
