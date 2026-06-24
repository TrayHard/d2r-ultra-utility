import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsProvider, useSettings } from "../providers/SettingsContext";
import MainSpaceToolbar from "../../widgets/Toolbar/MainSpaceToolbar";
import AppSettingsPage from "../../pages/settings/AppSettingsPage";

export type AppSection = "lootfilters" | "tweaks" | "runcounter" | "saveeditor";

interface MainMenuWindowProps {
  onSectionSelect: (section: AppSection) => void;
  onSettingsClick: () => void;
  onChangePathClick: () => void;
}

interface MenuCard {
  id: AppSection;
  title: string;
  description: string;
  icon: string;
  disabled?: boolean;
}

const MainMenuWindow: React.FC<MainMenuWindowProps> = ({
  onSectionSelect,
  onSettingsClick,
  onChangePathClick,
}) => {
  // Wrap the main menu in SettingsProvider so toolbar, theme and mode are available here
  return (
    <SettingsProvider>
      <MainMenuWindowInner
        onSectionSelect={onSectionSelect}
        onSettingsClick={onSettingsClick}
        onChangePathClick={onChangePathClick}
      />
    </SettingsProvider>
  );
};

const MainMenuWindowInner: React.FC<MainMenuWindowProps> = ({
  onSectionSelect,
  onSettingsClick,
  onChangePathClick,
}) => {
  const { t } = useTranslation();
  const { getIsDarkTheme, toggleTheme } = useSettings();
  const isDarkTheme = getIsDarkTheme();

  const [showSettings, setShowSettings] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkTheme]);

  const menuCards: MenuCard[] = [
    {
      id: "lootfilters",
      title: t("basicMainSpace.title", "Loot Filters"),
      description: t(
        "mainMenu.descriptions.lootFilters",
        "Настройка фильтров лута: руны, гемы, предметы"
      ),
      icon: "🎯",
    },
    {
      id: "tweaks",
      title: t("tweaks", "Tweaks"),
      description: t(
        "mainMenu.descriptions.tweaks",
        "Настройки игры: вступительные видео"
      ),
      icon: "⚙️",
    },
    {
      id: "runcounter",
      title: t("runCounter", "Run Counter"),
      description: t(
        "mainMenu.descriptions.runCounter",
        "Track your game runs"
      ),
      icon: "📊",
    },
    {
      id: "saveeditor",
      title: t("saveEditor.title", "Save Editor"),
      description: t(
        "mainMenu.descriptions.saveEditor",
        "Edit characters and shared stash"
      ),
      icon: "🎒",
    },
  ];

  const handleSettingsClick = () => {
    setShowSettings(true);
    onSettingsClick();
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  return (
    <div
      className={`h-screen flex flex-col pt-9 ${
        isDarkTheme ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      {showSettings ? (
        <AppSettingsPage
          isDarkTheme={isDarkTheme}
          onBack={handleBackFromSettings}
          onChangePathClick={onChangePathClick}
        />
      ) : (
        <>
          <MainSpaceToolbar
            onLanguageChange={() => {}}
            onSettingsClick={handleSettingsClick}
            isDarkTheme={isDarkTheme}
            onThemeChange={toggleTheme}
            onBackClick={undefined}
          />

      {/* Header image */}
      <div className="flex items-center justify-center pb-4 mt-4 ml-[-5px]">
        <img src="/img/UU-500.png" alt="Ultra Utility" draggable={false} className="select-none" />
      </div>

      {/* Cards Grid */}
      <div className="flex-1 flex justify-center px-8 pb-6">
        <div className="flex flex-col gap-3 max-w-md w-full">
          {menuCards.map((card) => (
            <button
              key={card.id}
              onClick={() => !card.disabled && onSectionSelect(card.id)}
              disabled={card.disabled}
              className={`
                group relative overflow-hidden
                rounded-lg px-6
                transition-all duration-200
                ${
                  card.disabled
                    ? "bg-gray-800/50 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-gray-800 to-gray-800/80 hover:from-gray-700 hover:to-gray-700/80 cursor-pointer"
                }
                border
                ${
                  card.disabled
                    ? "border-gray-700"
                    : "border-gray-700 hover:border-yellow-500/50"
                }
              `}
            >
              {/* Content */}
              <div className="relative z-10 flex items-center gap-4">
                <div className={`text-3xl ${!card.disabled && "group-hover:scale-110 transition-transform"}`}>
                  {card.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`text-lg font-semibold ${card.disabled ? "text-gray-500" : "text-white"}`}>
                    {card.title}
                  </h3>
                  <p className={`text-xs ${card.disabled ? "text-gray-600" : "text-gray-400"}`}>
                    {card.description}
                  </p>
                </div>
                {!card.disabled && (
                  <svg
                    className="w-5 h-5 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default MainMenuWindow;
