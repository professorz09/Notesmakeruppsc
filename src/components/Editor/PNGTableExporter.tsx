import React from 'react';
import { Download, Image as ImageIcon } from 'lucide-react';

interface PNGTableExporterProps {
  onExportAll: () => void;
  tableCount: number;
}

export const PNGTableExporter: React.FC<PNGTableExporterProps> = ({
  onExportAll,
  tableCount,
}) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-blue-50 via-blue-50 to-transparent pt-8 pb-4 px-4 md:px-6 lg:px-8 border-t-2 border-blue-200 shadow-lg z-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border-2 border-blue-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">PNG Export Mode</h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {tableCount > 0 ? `${tableCount} table(s) ready to export` : 'Generate tables to export'}
                </p>
              </div>
            </div>
            
            <button
              onClick={onExportAll}
              disabled={tableCount === 0}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base whitespace-nowrap"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span>Export as PNG</span>
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <span className="text-blue-500 font-bold">💡</span>
              <div>
                <p className="font-semibold mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Each table will be exported as a separate PNG image</li>
                  <li>High-quality images (2x resolution) with white background</li>
                  <li>All edit buttons and controls will be removed automatically</li>
                  <li>Images will be downloaded to your Downloads folder</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
