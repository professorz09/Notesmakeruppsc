import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';

interface IncrementalTableBuilderProps {
  onAddRows: (instruction: string) => Promise<void>;
  isLoading: boolean;
}

export const IncrementalTableBuilder: React.FC<IncrementalTableBuilderProps> = ({
  onAddRows,
  isLoading,
}) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || isLoading) return;
    
    await onAddRows(instruction);
    setInstruction('');
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 px-4 md:px-6 lg:px-8 border-t border-gray-200 shadow-lg z-20">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g., Add Articles 21-40 or Add more constitutional amendments..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!instruction.trim() || isLoading}
            className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                <span className="hidden sm:inline">Adding...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span>Add Rows</span>
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Tip: Specify range or topic to add more rows to your table
        </p>
      </div>
    </div>
  );
};
