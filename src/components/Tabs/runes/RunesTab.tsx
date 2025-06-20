import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ERune, runes, runeMinLvl } from '../../../constants/runes';
import RuneCard from './RuneCard';
import Icon from '@mdi/react';
import { mdiOrderAlphabeticalAscending, mdiOrderAlphabeticalDescending } from '@mdi/js';

interface RunesTabProps {
  isDarkTheme: boolean;
}

type SortType = 'name' | 'level';
type SortOrder = 'asc' | 'desc';

const RunesTab: React.FC<RunesTabProps> = ({ isDarkTheme }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedRunes = useMemo(() => {
    let filtered = runes.filter(rune => 
      rune.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortType === 'name') {
        const comparison = a.localeCompare(b);
        return sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const levelA = runeMinLvl[a];
        const levelB = runeMinLvl[b];
        const comparison = levelA - levelB;
        return sortOrder === 'asc' ? comparison : -comparison;
      }
    });
  }, [searchQuery, sortType, sortOrder]);

  const handleSort = (type: SortType) => {
    if (sortType === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortType(type);
      setSortOrder('asc');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Control Block */}
      <div className={`
        p-6 border-b
        ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}
      `}>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={t('search.placeholder') ?? 'Search runes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                ${isDarkTheme 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('name')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${sortType === 'name'
                  ? (isDarkTheme ? 'bg-yellow-600 border-yellow-500 text-black' : 'bg-yellow-500 border-yellow-400 text-white')
                  : (isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                }
              `}
            >
              <Icon path={sortOrder === 'asc' ? mdiOrderAlphabeticalAscending : mdiOrderAlphabeticalDescending} size={0.8} />
              Name
              {sortType === 'name' && (
                <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleSort('level')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${sortType === 'level'
                  ? (isDarkTheme ? 'bg-yellow-600 border-yellow-500 text-black' : 'bg-yellow-500 border-yellow-400 text-white')
                  : (isDarkTheme ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50')
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Level
              {sortType === 'level' && (
                <svg className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Runes List */}
      <div className="flex-1 p-6 overflow-y-auto">
        {filteredAndSortedRunes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className={`text-lg ${isDarkTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('search.noResults') ?? 'No runes found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {filteredAndSortedRunes.map((rune) => (
              <RuneCard
                key={rune}
                rune={rune}
                isDarkTheme={isDarkTheme}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RunesTab; 