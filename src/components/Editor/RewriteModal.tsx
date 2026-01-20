import React from 'react';
import { Sparkles, Wand2, ArrowLeft, Zap, Target } from 'lucide-react';
import { Button } from '../ui/Button';
import { EditTab, RewriteType, AIModel } from '../../types';

interface RewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewriteType: RewriteType;
  editTab: EditTab;
  onTabChange: (tab: EditTab) => void;
  instruction: string;
  onInstructionChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isRewriting: boolean;
  selectedText: string;
  aiModel: AIModel;
  onAIModelChange: (model: AIModel) => void;
}

export const RewriteModal: React.FC<RewriteModalProps> = ({
  isOpen,
  onClose,
  rewriteType,
  editTab,
  onTabChange,
  instruction,
  onInstructionChange,
  onSubmit,
  isRewriting,
  selectedText,
  aiModel,
  onAIModelChange,
}) => {
  if (!isOpen) return null;

  const tabs: EditTab[] = ['rewrite', 'expand', 'continue', 'next_topic', 'diagram', 'table'];

  const getTabLabel = (tab: EditTab) => {
    switch (tab) {
      case 'expand': return 'Deep Dive';
      case 'continue': return 'Continue';
      case 'next_topic': return 'Next Topic';
      case 'diagram': return 'Diagram';
      case 'table': return 'Table';
      default: return 'Refine';
    }
  };

  const getPlaceholder = () => {
    switch (editTab) {
      case 'expand': return "e.g. Add 3 examples and a comparison table...";
      case 'diagram': return "e.g. Create a flowchart / comparison table / timeline / tree diagram...";
      case 'next_topic': return "e.g. The impact of economic reforms...";
      case 'table': return "e.g. Compare features of X and Y...";
      default: return "e.g. Make it more professional...";
    }
  };

  const getButtonLabel = () => {
    switch (editTab) {
      case 'expand': return 'Expand Content';
      case 'continue': return 'Generate Next';
      case 'next_topic': return 'Generate Detailed Notes';
      case 'diagram': return 'Create Diagram';
      case 'table': return 'Create Matrix';
      default: return 'Apply Changes';
    }
  };

  const getButtonClass = () => {
    const base = 'text-white shadow-lg';
    switch (editTab) {
      case 'expand': return `${base} bg-blue-600 hover:bg-blue-700`;
      case 'continue': return `${base} bg-emerald-600 hover:bg-emerald-700`;
      case 'next_topic': return `${base} bg-orange-600 hover:bg-orange-700`;
      case 'diagram': return `${base} bg-indigo-600 hover:bg-indigo-700`;
      case 'table': return `${base} bg-teal-600 hover:bg-teal-700`;
      default: return `${base} bg-purple-600 hover:bg-purple-700`;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-3 md:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 md:p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-slate-800">
            {rewriteType === 'section' ? (
              <div className="p-1.5 bg-blue-100 rounded-lg"><Sparkles className="w-4 h-4 md:w-5 md:h-5 text-blue-600"/></div>
            ) : (
              <div className="p-1.5 bg-purple-100 rounded-lg"><Wand2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600"/></div>
            )}
            <span className="text-sm md:text-base">{rewriteType === 'section' ? 'AI Editor' : 'Rewrite'}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 rotate-180" />
          </button>
        </div>

        <div className="p-4 md:p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-xl mb-4 md:mb-6">
            {tabs.map(tab => (
              <button 
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`flex-1 min-w-[60px] py-2 px-2 text-[10px] md:text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
                  editTab === tab 
                    ? 'bg-white shadow-md text-blue-600 transform scale-[1.02]' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
          
          <div className="mb-4 md:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">Context</span>
              <span className="text-[9px] md:text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Preview</span>
            </div>
            <div className="text-xs md:text-sm text-gray-600 bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200 max-h-24 md:max-h-32 overflow-y-auto italic leading-relaxed">
              "{rewriteType === 'section' ? "Selected Section Context..." : selectedText.substring(0, 150) + "..."}"
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Instructions</label>
            <input 
              type="text" 
              value={instruction}
              onChange={(e) => onInstructionChange(e.target.value)}
              placeholder={getPlaceholder()}
              className="w-full px-3 md:px-4 py-2.5 md:py-3.5 text-sm md:text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 outline-none bg-white text-gray-900 transition-shadow shadow-sm"
              autoFocus
            />

            {/* AI Model Toggle - Show for Deep Dive, Next Topic, and Table */}
            {(editTab === 'expand' || editTab === 'next_topic' || editTab === 'table') && (
              <div className="mb-6">
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">AI Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onAIModelChange('gemini-3-flash')}
                    className={`
                      flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all
                      ${aiModel === 'gemini-3-flash'
                        ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Zap className="w-4 h-4" />
                    Flash (Fast)
                  </button>
                  <button
                    type="button"
                    onClick={() => onAIModelChange('gemini-3-pro')}
                    className={`
                      flex items-center justify-center gap-2 p-3 rounded-lg text-sm font-semibold transition-all
                      ${aiModel === 'gemini-3-pro'
                        ? 'bg-purple-500 text-white shadow-lg ring-2 ring-purple-400'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Target className="w-4 h-4" />
                    Pro (Advanced)
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 md:gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isRewriting}
                className="px-4 py-2 text-sm md:text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRewriting}
                className={`px-4 py-2 text-sm md:text-base font-semibold text-white rounded-lg shadow-lg transition-all disabled:opacity-50 ${getButtonClass()}`}
              >
                {isRewriting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  getButtonLabel()
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
