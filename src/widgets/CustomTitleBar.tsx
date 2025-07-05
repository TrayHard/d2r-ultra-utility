import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { mdiMinus, mdiSquareOutline, mdiClose } from '@mdi/js';
import logoImage from '../shared/assets/logo_128.png';

interface CustomTitleBarProps {
  title?: string;
}

const CustomTitleBar: React.FC<CustomTitleBarProps> = ({ title = 'Diablo II Utility' }) => {
  // Debug: проверяем что пути иконок загрузились
  console.log('MDI paths loaded:', { mdiMinus, mdiSquareOutline, mdiClose });

  const handleMinimize = async () => {
    try {
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const window = getCurrentWindow();
      await window.toggleMaximize();
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  return (
    <div className="flex justify-between items-center h-9 bg-gradient-to-r from-red-950 via-red-900 to-orange-900 text-white select-none border-b-2 border-orange-600 shadow-lg fixed top-0 left-0 right-0 z-50">
      {/* Draggable area */}
      <div
        data-tauri-drag-region
        className="flex-1 flex items-center px-4 h-full cursor-move"
      >
        <div className="flex items-center gap-3">
          {/* Diablo themed icon */}
          <img
            src={logoImage}
            alt="Diablo 2 Logo"
            className="h-5 w-auto drop-shadow-md"
          />
          <span className="text-sm font-bold text-orange-100 tracking-wide drop-shadow-md">
            {title}
          </span>
        </div>
      </div>

      {/* Window controls */}
      <div className="flex">
        <button
          onClick={handleMinimize}
          className="flex items-center justify-center w-9 h-9 hover:bg-red-800 transition-all duration-200 group bg-red-900/20"
          title="Minimize"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="group-hover:scale-110 transition-transform duration-200 min-w-5 min-h-5"
          >
            <path d={mdiMinus} fill="#fbbf24" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="flex items-center justify-center w-9 h-9 hover:bg-red-800 transition-all duration-200 group bg-red-900/20 min-w-5 min-h-5"
          title="Maximize"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="group-hover:scale-110 transition-transform duration-200 min-w-4 min-h-4"
          >
            <path d={mdiSquareOutline} fill="#fbbf24" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-9 h-9 hover:bg-red-600 hover:shadow-lg transition-all duration-200 group bg-red-900/20"
          title="Close"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="group-hover:scale-110 transition-transform duration-200 min-w-5 min-h-5"
          >
            <path d={mdiClose} fill="#fbbf24" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
