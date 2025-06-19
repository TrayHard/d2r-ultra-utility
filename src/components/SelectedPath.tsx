import React from 'react';

interface SelectedPathProps {
  path: string;
  homeDirectory: string;
  onChangeClick: () => void;
}

const SelectedPath: React.FC<SelectedPathProps> = ({ path, homeDirectory, onChangeClick }) => {
  return (
    <div className="max-w-4xl w-full">
      <div className="bg-green-900 border border-green-600 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-bold text-green-200 mb-4">
          🎮 Diablo 2 Resurrected Found!
        </h2>
        <div className="bg-gray-800 p-4 rounded-lg mb-4 space-y-3">
          <div>
            <p className="text-gray-300 text-sm mb-2">D2R.exe path:</p>
            <p className="text-white font-mono text-sm break-all bg-gray-700 p-3 rounded border-l-4 border-green-500">
              {path}
            </p>
          </div>
          <div>
            <p className="text-gray-300 text-sm mb-2">Home Directory:</p>
            <p className="text-white font-mono text-sm break-all bg-gray-700 p-3 rounded border-l-4 border-blue-500">
              {homeDirectory}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onChangeClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Change Path
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(homeDirectory);
              alert('Home directory copied to clipboard!');
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Copy Home Directory
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectedPath; 