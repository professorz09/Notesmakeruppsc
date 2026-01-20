import React, { useRef } from 'react';
import { BookOpen, X, Sparkles, FileText, Eraser, Undo, Redo, ZoomIn, ZoomOut, Table2, List, GitBranch, PlusSquare, FileEdit, Image, Zap, Target, Upload, File, Award } from 'lucide-react';
import { Button } from '../ui/Button';
import { GenerationStatus, Mode, OutputFormat, AIModel, UPSCSubject, UPSCWordLimit, UPSCAnswerType } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  outputFormat: OutputFormat;
  onOutputFormatChange: (format: OutputFormat) => void;
  topicInput: string;
  onTopicChange: (value: string) => void;
  textInput: string;
  onTextChange: (value: string) => void;
  language: string;
  onLanguageChange: (value: string) => void;
  aiModel: AIModel;
  onAIModelChange: (model: AIModel) => void;
  upscSubject: UPSCSubject;
  onUPSCSubjectChange: (subject: UPSCSubject) => void;
  upscWordLimit: UPSCWordLimit;
  onUPSCWordLimitChange: (limit: UPSCWordLimit) => void;
  upscAnswerType: UPSCAnswerType;
  onUPSCAnswerTypeChange: (type: UPSCAnswerType) => void;
  upscCustomInstruction: string;
  onUPSCCustomInstructionChange: (instruction: string) => void;
  onGenerate: (e: React.FormEvent) => void;
  onAddAnotherQuestion: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  status: GenerationStatus;
  canUndo: boolean;
  canRedo: boolean;
  fontSize: number;
  uploadedFile: File | null;
  onFileUpload: (file: File | null) => void;
  fileTopicName: string;
  onFileTopicNameChange: (value: string) => void;
  generatedHtml: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  outputFormat,
  onOutputFormatChange,
  topicInput,
  onTopicChange,
  textInput,
  onTextChange,
  language,
  onLanguageChange,
  aiModel,
  onAIModelChange,
  upscSubject,
  onUPSCSubjectChange,
  upscWordLimit,
  onUPSCWordLimitChange,
  upscAnswerType,
  onUPSCAnswerTypeChange,
  upscCustomInstruction,
  onUPSCCustomInstructionChange,
  onGenerate,
  onAddAnotherQuestion,
  onClear,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  status,
  canUndo,
  canRedo,
  fontSize,
  uploadedFile,
  onFileUpload,
  fileTopicName,
  onFileTopicNameChange,
  generatedHtml,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or image file (JPG, PNG, WEBP)');
        return;
      }
      onFileUpload(file);
    }
  };

  const handleRemoveFile = () => {
    onFileUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-40
        w-[85vw] sm:w-96 md:w-[400px]
        bg-gradient-to-br from-gray-950 via-slate-950 to-gray-950
        border-r border-slate-800/50
        shadow-2xl
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-5 border-b border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Notes AI</h2>
                <p className="text-[10px] text-blue-100">Smart Study Assistant</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="p-3 bg-slate-950/50 border-b border-slate-800/50">
          <div className="grid grid-cols-3 gap-1.5 p-0.5 bg-black/30 rounded-xl">
            <button 
              onClick={() => onModeChange('topic')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                text-xs font-semibold transition-all duration-200
                ${mode === 'topic' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                }
              `}
            >
              <Sparkles className="w-3.5 h-3.5" /> 
              Topic
            </button>
            <button 
              onClick={() => onModeChange('text')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                text-xs font-semibold transition-all duration-200
                ${mode === 'text' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                }
              `}
            >
              <FileText className="w-3.5 h-3.5" /> 
              Text
            </button>
            <button 
              onClick={() => onModeChange('file')}
              className={`
                flex items-center justify-center gap-1.5 py-2.5 rounded-lg
                text-xs font-semibold transition-all duration-200
                ${mode === 'file' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                }
              `}
            >
              <Upload className="w-3.5 h-3.5" /> 
              File
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <form onSubmit={onGenerate} className="space-y-4">
            {/* Input Section */}
            {mode === 'topic' ? (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  📝 Enter Topic
                </label>
                <input 
                  type="text"
                  value={topicInput}
                  onChange={(e) => onTopicChange(e.target.value)}
                  placeholder="e.g., History of India..."
                  className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            ) : mode === 'text' ? (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  📄 Paste Content
                </label>
                <textarea 
                  value={textInput}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder="Paste your notes here..."
                  rows={5}
                  className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  📎 Upload Files
                </label>
                
                {/* File Upload Area */}
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    multiple
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-700/50 rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900/70 hover:border-blue-500/50 transition-all"
                  >
                    <Upload className="w-7 h-7 text-slate-500 mb-1.5" />
                    <span className="text-sm text-slate-400 font-medium">Click to upload files</span>
                    <span className="text-xs text-slate-600 mt-0.5">PDF or Images (JPG, PNG)</span>
                    <span className="text-xs text-blue-400 mt-0.5">Multiple files supported</span>
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFile && (
                  <div className="flex items-center gap-2.5 p-3 bg-slate-900/70 border border-slate-700/50 rounded-xl">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <File className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}

                {/* Topic Name Input (shown after file upload) */}
                {uploadedFile && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      🏷️ Topic Name
                    </label>
                    <input 
                      type="text"
                      value={fileTopicName}
                      onChange={(e) => onFileTopicNameChange(e.target.value)}
                      placeholder="e.g., Chapter 1: Introduction"
                      className="w-full bg-slate-900/70 border border-slate-700/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Language Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                🌐 Language
              </label>
              <select 
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="English">English</option>
                <option value="Hinglish">Hinglish</option>
              </select>
            </div>

            {/* AI Model Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                🤖 AI Model
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onAIModelChange('gemini-3-flash')}
                  className={`
                    flex flex-col items-center gap-1.5 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${aiModel === 'gemini-3-flash'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <Zap className="w-4 h-4" />
                  <span>Flash</span>
                  <span className="text-[9px] opacity-80">Fast</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAIModelChange('gemini-3-pro')}
                  className={`
                    flex flex-col items-center gap-1.5 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${aiModel === 'gemini-3-pro'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 ring-2 ring-purple-400'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <Target className="w-4 h-4" />
                  <span>Pro</span>
                  <span className="text-[9px] opacity-80">Advanced</span>
                </button>
              </div>
            </div>

            {/* Output Format Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                📊 Output Format
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('detailed-notes')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'detailed-notes'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">Detailed</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('structured-notes')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'structured-notes'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">Structured</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('compact-timeline')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'compact-timeline'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">Timeline</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('table-only')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'table-only'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">Tables</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('incremental-table')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'incremental-table'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">Builder</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('png-table')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'png-table'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">PNG</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => onOutputFormatChange('upsc-answer')}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl
                    text-xs font-semibold transition-all duration-200
                    ${outputFormat === 'upsc-answer'
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                    }
                  `}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span className="text-[9px] leading-tight text-center">UPSC</span>
                </button>
              </div>
            </div>

            {/* UPSC Subject Selection - Show only when UPSC format is selected */}
            {outputFormat === 'upsc-answer' && (
              <>
                {/* UPSC Subject Input - Custom subject name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    📚 Subject / Paper
                  </label>
                  <input 
                    type="text"
                    value={upscSubject}
                    onChange={(e) => onUPSCSubjectChange(e.target.value as UPSCSubject)}
                    placeholder="e.g., GS Paper 1, Hindi Literature, Ethics..."
                    className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['GS1', 'GS2', 'GS3', 'GS4', 'Ethics', 'Hindi Lit', 'Essay'].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => onUPSCSubjectChange(quick as UPSCSubject)}
                        className="px-2 py-0.5 text-xs bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all border border-slate-700/50"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Word Limit */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    📏 Word Limit
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['none', '150', '250', '500'] as UPSCWordLimit[]).map((limit) => (
                      <button
                        key={limit}
                        type="button"
                        onClick={() => onUPSCWordLimitChange(limit)}
                        className={`
                          py-2 px-1.5 rounded-lg text-xs font-semibold transition-all
                          ${upscWordLimit === limit
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-700/70 border border-slate-600/50'
                          }
                        `}
                      >
                        {limit === 'none' ? 'None' : `${limit}w`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Answer Type */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    ✍️ Answer Type
                  </label>
                  <select 
                    value={upscAnswerType}
                    onChange={(e) => onUPSCAnswerTypeChange(e.target.value as UPSCAnswerType)}
                    className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    <option value="standard">Standard (Balanced)</option>
                    <option value="analytical">Analytical (Cause-Effect)</option>
                    <option value="descriptive">Descriptive (Detailed)</option>
                    <option value="critical">Critical (Pros-Cons)</option>
                  </select>
                </div>

                {/* Custom Instructions */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                    💡 Custom Instructions (Optional)
                  </label>
                  <textarea 
                    value={upscCustomInstruction}
                    onChange={(e) => onUPSCCustomInstructionChange(e.target.value)}
                    placeholder="e.g., Focus on recent developments, Include case studies..."
                    rows={2}
                    className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                  />
                </div>
              </>
            )}

            {/* Generate Button */}
            <Button 
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 hover:from-blue-600 hover:via-purple-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
              isLoading={status === GenerationStatus.GENERATING_CHAPTER}
            >
              {status === GenerationStatus.GENERATING_CHAPTER ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {mode === 'topic' ? (outputFormat === 'upsc-answer' ? 'Generate Answer' : 'Generate Notes') : 'Format Notes'}
                </>
              )}
            </Button>
          </form>

          {/* Add Another Question Button - Show only in UPSC mode with existing content */}
          {outputFormat === 'upsc-answer' && generatedHtml && (
            <button
              onClick={onAddAnotherQuestion}
              disabled={status === GenerationStatus.GENERATING_CHAPTER}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusSquare className="w-4 h-4" />
              Add Another Question
            </button>
          )}

          {/* Quick Actions */}
          <div className="pt-4 border-t border-slate-700/50 space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ⚡ Quick Actions
            </h3>
            
            {/* History Controls */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={onUndo} 
                disabled={!canUndo} 
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all border border-slate-600/50 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo className="w-3.5 h-3.5" /> Undo
              </button>
              <button 
                onClick={onRedo} 
                disabled={!canRedo} 
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all border border-slate-600/50 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Redo className="w-3.5 h-3.5" /> Redo
              </button>
            </div>

            {/* Font Size Controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400">Font Size</span>
                <span className="text-xs font-bold text-blue-400">{fontSize}pt</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onZoomOut} 
                  className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all border border-slate-600/50 text-sm font-medium"
                >
                  <ZoomOut className="w-3.5 h-3.5" /> Smaller
                </button>
                <button 
                  onClick={onZoomIn} 
                  className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/70 text-slate-300 hover:bg-slate-700/70 hover:text-white transition-all border border-slate-600/50 text-sm font-medium"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Larger
                </button>
              </div>
            </div>

            {/* Clear Canvas */}
            <button 
              onClick={onClear} 
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/30 text-sm font-medium"
            >
              <Eraser className="w-3.5 h-3.5" /> Clear Canvas
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
