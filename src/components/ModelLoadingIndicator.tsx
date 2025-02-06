import React from 'react';
import { ProgressStatusInfo } from '../contexts/ModelContext';

interface ModelLoadingIndicatorProps {
  progress: ProgressStatusInfo | undefined;
}

export const ModelLoadingIndicator: React.FC<ModelLoadingIndicatorProps> = ({ progress }) => {
  const calculatePercentage = (): number => {
    if (!progress?.progress) return 0;
    const percentage = progress.progress * 100; // Convert decimal to percentage
    return Number.isNaN(percentage) ? 0 : Math.min(Math.round(percentage), 100);
  };

  const percentage = calculatePercentage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading {progress?.name}</h2>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                  Progress
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-blue-600">
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
              <div
                style={{ width: `${percentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            {progress?.status !== "done"
              ? 'Please wait while we initialize the AI model...'
              : 'Almost ready...'}
          </p>
          {percentage < 25 && (
            <p className="text-gray-500 text-xs mt-4">
              Initial load may take a few moments
            </p>
          )}
        </div>
      </div>
    </div>
  );
};