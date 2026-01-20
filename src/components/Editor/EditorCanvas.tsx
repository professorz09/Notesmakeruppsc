import React from 'react';
import { BookOpen, Sparkles, Download } from 'lucide-react';
import { GenerationStatus } from '../../types';

interface EditorCanvasProps {
  status: GenerationStatus;
  generatedHtml: string | null;
  isEditing: boolean;
  fontSize: number;
  editorRef: React.RefObject<HTMLDivElement>;
  onEditorInput: () => void;
  onEditorBlur: () => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  status,
  generatedHtml,
  isEditing,
  fontSize,
  editorRef,
  onEditorInput,
  onEditorBlur,
  onEditorKeyDown,
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 lg:px-8 flex justify-center relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300">
      {status !== GenerationStatus.IDLE && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100 max-w-sm mx-4">
            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 md:mb-6"></div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Creating Content</h3>
            <p className="text-sm md:text-base text-gray-500 animate-pulse text-center">
              Analyzing • Structuring • Writing...
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl transition-all duration-700 ease-out">
        <div 
          className={`editor-container bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-200 transition-all duration-300 ${
            isEditing ? 'ring-2 ring-blue-500/20' : ''
          }`}
          style={{ fontSize: `${fontSize}pt` }} 
        >
          {!generatedHtml && status === GenerationStatus.IDLE ? (
            <div className="min-h-[60vh] md:min-h-[70vh] flex flex-col items-center justify-center text-center p-6 md:p-12">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full shadow-lg flex items-center justify-center mb-6 md:mb-8 transform hover:scale-105 transition-transform duration-500">
                <BookOpen className="w-8 h-8 md:w-12 md:h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3 md:mb-4 tracking-tight">
                Your Canvas Awaits
              </h2>
              <p className="text-sm md:text-lg text-slate-500 max-w-md mb-6 md:mb-8 leading-relaxed">
                Generate comprehensive notes or format your content instantly with AI
              </p>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-sm">
                <div className="p-3 md:p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 flex flex-col items-center">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-amber-500 mb-2" />
                  <span className="text-xs md:text-sm font-semibold text-slate-700">AI Powered</span>
                </div>
                <div className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 flex flex-col items-center">
                  <Download className="w-5 h-5 md:w-6 md:h-6 text-green-500 mb-2" />
                  <span className="text-xs md:text-sm font-semibold text-slate-700">PDF Ready</span>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`editor-content min-h-[60vh] p-4 md:p-6 lg:p-8 outline-none ${isEditing ? 'cursor-text' : ''}`}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              ref={editorRef}
              onInput={onEditorInput}
              onBlur={onEditorBlur}
              onKeyDown={onEditorKeyDown}
            />
          )}
        </div>
        
        {generatedHtml && (
          <div className="h-12 flex items-center justify-center mt-4 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
              End of Document
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
