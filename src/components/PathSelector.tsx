import React from 'react';

interface PathSelectorProps {
  paths: string[];
  onPathSelect: (path: string) => void;
  onCancel: () => void;
}

const PathSelector: React.FC<PathSelectorProps> = ({ paths, onPathSelect, onCancel }) => {
  return (
    <div className="max-w-4xl w-full">
      <div className="bg-blue-900 border border-blue-600 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-blue-200 mb-4">
          🎯 Multiple D2R.exe locations found!
        </h2>
        <p className="text-blue-100 mb-6">Please select which one you want to use:</p>
        
        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
          {paths.map((path, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-600 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-white font-mono text-sm break-all bg-gray-700 p-3 rounded border-l-4 border-blue-500">
                    {path}
                  </p>
                </div>
                <button
                  onClick={() => onPathSelect(path)}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex-shrink-0"
                >
                  Select This
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Cancel & Search Manually
          </button>
        </div>
      </div>
    </div>
  );
};

export default PathSelector; 