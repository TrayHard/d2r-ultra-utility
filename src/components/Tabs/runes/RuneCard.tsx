import React from 'react';
import { ERune, runeMinLvl } from '../../../constants/runes';
import { useTranslation } from 'react-i18next';
import Dropdown from '../../ui/Dropdown';
import { RuneSettings } from '../../../contexts/SettingsContext';

interface RuneCardProps {
  rune: ERune;
  isDarkTheme: boolean;
  isSelected?: boolean;
  onSelectionChange?: (isSelected: boolean) => void;
  settings?: RuneSettings;
  onSettingsChange?: (settings: RuneSettings) => void;
}

const RuneCard: React.FC<RuneCardProps> = ({ 
  rune, 
  isDarkTheme, 
  isSelected = false, 
  onSelectionChange,
  settings,
  onSettingsChange
}) => {
  const runeName = rune.charAt(0).toUpperCase() + rune.slice(1);
  const minLevel = runeMinLvl[rune];
  const runeImagePath = `/img/runes/${rune}_rune.webp`;
  const { t } = useTranslation();

  // Используем только переданные настройки или дефолтные значения
  const isHighlighted = settings?.isHighlighted ?? false;
  const showNumber = settings?.showNumber ?? false;
  const boxSize = settings?.boxSize ?? 0;
  const color = settings?.color ?? 'white1';
  const runeNames = settings?.locales ?? {
    enUS: '',
    ruRU: '',
    zhTW: '',
    deDE: '',
    esES: '',
    frFR: '',
    itIT: '',
    koKR: '',
    plPL: '',
    esMX: '',
    jaJP: '',
    ptBR: '',
    zhCN: ''
  };

  // Language codes for iteration
  const languageCodes = [
    'enUS', 'ruRU', 'zhTW', 'deDE', 'esES', 'frFR', 
    'itIT', 'koKR', 'plPL', 'esMX', 'jaJP', 'ptBR', 'zhCN'
  ];

  // Handle language name change
  const handleLanguageNameChange = (langCode: string, value: string) => {
    const newRuneNames = {
      ...runeNames,
      [langCode]: value
    };
    
    // Обновляем настройки сразу при изменении языковых полей
    handleSettingChange({ locales: newRuneNames });
  };

  // Handle settings change
  const handleSettingChange = (newSettings: Partial<RuneSettings>) => {
    if (!onSettingsChange) return;
    
    const updatedSettings: RuneSettings = {
      isHighlighted,
      showNumber,
      boxSize,
      color,
      locales: runeNames,
      ...newSettings
    };
    
    onSettingsChange(updatedSettings);
  };

  // Handle individual control changes
  const handleHighlightChange = (checked: boolean) => {
    handleSettingChange({ isHighlighted: checked });
  };

  const handleShowNumberChange = (checked: boolean) => {
    handleSettingChange({ showNumber: checked });
  };

  const handleBoxSizeChange = (size: string) => {
    const sizeNumber = parseInt(size);
    handleSettingChange({ boxSize: sizeNumber });
  };

  const handleColorChange = (newColor: string) => {
    handleSettingChange({ color: newColor });
  };

  // Options for dropdowns
  const sizeOptions = [
    { value: '0', label: t('runeControls.sizes.Normal') },
    { value: '1', label: t('runeControls.sizes.Medium') },
    { value: '2', label: t('runeControls.sizes.Large') }
  ];

  const colorOptions = [
    { value: 'white1', label: t('runeControls.colors.white1') },
    { value: 'white2', label: t('runeControls.colors.white2') },
    { value: 'gray1', label: t('runeControls.colors.gray1') },
    { value: 'gray2', label: t('runeControls.colors.gray2') },
    { value: 'gray3', label: t('runeControls.colors.gray3') },
    { value: 'black1', label: t('runeControls.colors.black1') },
    { value: 'black2', label: t('runeControls.colors.black2') },
    { value: 'lightred', label: t('runeControls.colors.lightred') },
    { value: 'red1', label: t('runeControls.colors.red1') },
    { value: 'red2', label: t('runeControls.colors.red2') },
    { value: 'darkred', label: t('runeControls.colors.darkred') },
    { value: 'orange1', label: t('runeControls.colors.orange1') },
    { value: 'orange2', label: t('runeControls.colors.orange2') },
    { value: 'orange3', label: t('runeControls.colors.orange3') },
    { value: 'orange4', label: t('runeControls.colors.orange4') },
    { value: 'lightgold1', label: t('runeControls.colors.lightgold1') },
    { value: 'lightgold2', label: t('runeControls.colors.lightgold2') },
    { value: 'gold1', label: t('runeControls.colors.gold1') },
    { value: 'gold2', label: t('runeControls.colors.gold2') },
    { value: 'yellow1', label: t('runeControls.colors.yellow1') },
    { value: 'yellow2', label: t('runeControls.colors.yellow2') },
    { value: 'green1', label: t('runeControls.colors.green1') },
    { value: 'green2', label: t('runeControls.colors.green2') },
    { value: 'green3', label: t('runeControls.colors.green3') },
    { value: 'green4', label: t('runeControls.colors.green4') },
    { value: 'darkgreen1', label: t('runeControls.colors.darkgreen1') },
    { value: 'darkgreen2', label: t('runeControls.colors.darkgreen2') },
    { value: 'turquoise', label: t('runeControls.colors.turquoise') },
    { value: 'skyblue', label: t('runeControls.colors.skyblue') },
    { value: 'lightblue1', label: t('runeControls.colors.lightblue1') },
    { value: 'lightblue2', label: t('runeControls.colors.lightblue2') },
    { value: 'blue1', label: t('runeControls.colors.blue1') },
    { value: 'blue2', label: t('runeControls.colors.blue2') },
    { value: 'lightpink', label: t('runeControls.colors.lightpink') },
    { value: 'pink', label: t('runeControls.colors.pink') },
    { value: 'purple', label: t('runeControls.colors.purple') }
  ];

  return (
    <div className={`
      relative rounded-lg p-4 border-2 transition-all duration-300 hover:shadow-lg cursor-pointer
      ${isSelected 
        ? (isDarkTheme 
          ? 'bg-yellow-900/30 border-yellow-400 shadow-yellow-400/20 shadow-lg' 
          : 'bg-yellow-50 border-yellow-400 shadow-yellow-400/20 shadow-lg'
        )
        : (isDarkTheme 
          ? 'bg-gray-800 border-gray-700 hover:border-yellow-500' 
          : 'bg-white border-gray-200 hover:border-yellow-400'
        )
      }
    `}>
      {/* Selection Checkbox */}
      {onSelectionChange && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className={`
              w-5 h-5 rounded transition-all duration-200
              ${isDarkTheme 
                ? 'text-yellow-400 bg-gray-700 border-gray-600' 
                : 'text-yellow-500 bg-white border-gray-300'
              }
            `}
          />
        </div>
      )}

      {/* Main Card Content */}
      <div onClick={() => onSelectionChange && onSelectionChange(!isSelected)}>
        {/* Rune Image */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-lg">
            <img 
              src={runeImagePath} 
              alt={`${runeName} rune`}
              className="w-full h-full object-contain filter drop-shadow-sm"
              onError={(e) => {
                // Fallback to text if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />
            {/* Fallback text icon */}
            <div className="w-full h-full hidden items-center justify-center font-bold text-lg text-black">
              {runeName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Rune Name */}
        <h3 className={`
          text-center font-bold text-lg mb-2
          ${isDarkTheme ? 'text-white' : 'text-gray-900'}
        `}>
          {t(`runes.${rune}`)}
        </h3>

        {/* Level Requirement */}
        <div className="flex justify-center mb-4">
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${isDarkTheme 
              ? 'bg-gray-700 text-gray-300' 
              : 'bg-gray-100 text-gray-700'
            }
          `}>
            {minLevel === 0 ? 'Any Level' : `Level ${minLevel}+`}
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <div 
        className={`
          mt-4 p-4 rounded-xl shadow-inner backdrop-blur-sm transition-all duration-300
          ${isDarkTheme 
            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 shadow-gray-900/50' 
            : 'bg-gradient-to-br from-white/90 to-gray-50/90 border border-gray-200/50 shadow-gray-200/50'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          {/* Checkboxes */}
          <div className="space-y-3">
            {/* Highlight Rune Checkbox */}
            <label className={`
              flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-200
              ${isDarkTheme 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-100/50'
              }
            `}>
              <input
                type="checkbox"
                checked={isHighlighted}
                onChange={(e) => handleHighlightChange(e.target.checked)}
                className={`
                  w-5 h-5 rounded transition-all duration-200
                  ${isDarkTheme 
                    ? 'text-yellow-400 bg-gray-700 border-gray-600' 
                    : 'text-yellow-500 bg-white border-gray-300'
                  }
                `}
              />
              <span className={`text-sm font-medium transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
                {t('runeControls.highlightRune')}
              </span>
            </label>

            {/* Show Rune Number Checkbox */}
            <label className={`
              flex items-center space-x-3 cursor-pointer p-2 rounded-lg transition-all duration-200
              ${isDarkTheme 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-100/50'
              }
            `}>
              <input
                type="checkbox"
                checked={showNumber}
                onChange={(e) => handleShowNumberChange(e.target.checked)}
                className={`
                  w-5 h-5 rounded transition-all duration-200
                  ${isDarkTheme 
                    ? 'text-yellow-400 bg-gray-700 border-gray-600' 
                    : 'text-yellow-500 bg-white border-gray-300'
                  }
                `}
              />
              <span className={`text-sm font-medium transition-colors ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
                {t('runeControls.showRuneNumber')}
              </span>
            </label>
          </div>

          {/* Divider */}
          <div className={`border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Dropdowns */}
          <div className="space-y-4">
            {/* Box Size Dropdown */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('runeControls.boxSize')}
              </label>
              <Dropdown
                options={sizeOptions}
                selectedValue={boxSize.toString()}
                onSelect={handleBoxSizeChange}
                isDarkTheme={isDarkTheme}
                size="md"
              />
            </div>

            {/* Color Dropdown */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('runeControls.color')}
              </label>
              <Dropdown
                options={colorOptions}
                selectedValue={color}
                onSelect={handleColorChange}
                isDarkTheme={isDarkTheme}
                size="md"
              />
            </div>
          </div>

          {/* Divider */}
          <div className={`border-t ${isDarkTheme ? 'border-gray-700' : 'border-gray-200'}`}></div>

          {/* Language Names Section */}
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('runeControls.languageCustomization')}
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {languageCodes.map((langCode) => (
                <div key={langCode} className="space-y-1">
                  <label className={`text-xs font-medium ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t(`runeControls.languageLabels.${langCode}`)} ({langCode})
                  </label>
                  <textarea
                    value={runeNames[langCode as keyof typeof runeNames]}
                    onChange={(e) => handleLanguageNameChange(langCode, e.target.value)}
                    placeholder={t(`runeControls.placeholders.${langCode}`)}
                    rows={3}
                    className={`
                      w-full px-3 py-2 text-sm rounded-lg border transition-all duration-200 resize-vertical
                      ${isDarkTheme 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500'
                      }
                    `}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rarity Indicator */}
      <div className="absolute top-2 right-2">
        <div className={`
          w-3 h-3 rounded-full
          ${getRarityColor(rune)}
        `} />
      </div>
    </div>
  );
};

const getRarityColor = (rune: ERune): string => {
  const runeIndex = Object.values(ERune).indexOf(rune);
  
  if (runeIndex < 10) return 'bg-gray-400'; // Common
  if (runeIndex < 20) return 'bg-blue-400'; // Magic
  if (runeIndex < 28) return 'bg-yellow-400'; // Rare
  return 'bg-orange-500'; // Unique/High
};

export default RuneCard;