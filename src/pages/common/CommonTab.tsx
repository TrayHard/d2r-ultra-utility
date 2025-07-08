import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../app/providers/SettingsContext";
import { localeOptions } from "../../shared/constants";

interface CommonTabProps {
  isDarkTheme: boolean;
}

const CommonTab: React.FC<CommonTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const { getSelectedLocales, updateSelectedLocales } = useSettings();

  const selectedLocales = getSelectedLocales();

  const handleLocaleToggle = (localeCode: string) => {
    if (localeCode === "enUS") {
      // Английская локаль всегда должна быть выбрана
      return;
    }

    let newLocales: string[];
    if (selectedLocales.includes(localeCode)) {
      newLocales = selectedLocales.filter((code) => code !== localeCode);
    } else {
      newLocales = [...selectedLocales, localeCode];
    }

    // Всегда включаем английскую локаль
    if (!newLocales.includes("enUS")) {
      newLocales = [...newLocales, "enUS"];
    }

    updateSelectedLocales(newLocales);
  };

  return (
    <div className="p-8 h-full">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Настройка языков */}
          <div
            className={`p-6 rounded-lg border ${
              isDarkTheme
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h3
              className={`text-xl font-semibold mb-4 ${
                isDarkTheme ? "text-white" : "text-gray-900"
              }`}
            >
              {t("common.languageSettings")}
            </h3>
            <div className="space-y-4">
              <div>
                <p
                  className={`text-sm mb-4 ${
                    isDarkTheme ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {t("common.languageSettingsDescription")}
                </p>

                <div className="flex flex-wrap gap-2">
                  {localeOptions.map((locale) => {
                    const isSelected = selectedLocales.includes(locale.value);
                    const isRequired = locale.value === "enUS";

                    return (
                      <button
                        key={locale.value}
                        onClick={() => handleLocaleToggle(locale.value)}
                        disabled={isRequired}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? isRequired
                              ? isDarkTheme
                                ? "bg-blue-600 text-white cursor-not-allowed"
                                : "bg-blue-500 text-white cursor-not-allowed"
                              : isDarkTheme
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-green-500 text-white hover:bg-green-600"
                            : isDarkTheme
                            ? "bg-gray-600 text-gray-200 hover:bg-gray-500"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        } ${isRequired ? "opacity-90" : "cursor-pointer"}`}
                      >
                        {locale.label}
                        {isRequired && (
                          <span className="ml-1 text-xs opacity-75">
                            ({t("common.required")})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedLocales.length === 0 && (
                  <p
                    className={`text-sm mt-3 ${
                      isDarkTheme ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t("common.noLanguagesSelected")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommonTab;
