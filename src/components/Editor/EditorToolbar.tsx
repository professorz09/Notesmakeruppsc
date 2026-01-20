import React from 'react';
import { Menu, Undo, Redo, Minus, Plus, Edit3, Check, Printer, Wand2, Image } from 'lucide-react';
import { Button } from '../ui/Button';

interface EditorToolbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  fontSize: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onRewrite: () => void;
  onExportPDF: () => void;
  onExportPNG?: () => void;
  showPNGExport?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  sidebarOpen,
  onToggleSidebar,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  fontSize,
  onZoomIn,
  onZoomOut,
  isEditing,
  onToggleEdit,
  onRewrite,
  onExportPDF,
  onExportPNG,
  showPNGExport = false,
}) => {
  return (
    <div className="sticky top-0 z-[60] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 py-2 sm:py-3 gap-1.5 sm:gap-2">
        {/* Left Section */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Menu button - Always visible when sidebar is closed */}
          {!sidebarOpen && (
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors flex-shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </button>
          )}
          
          {/* History Controls - Hidden on mobile, visible on tablet+ */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button 
              onClick={onUndo} 
              disabled={!canUndo} 
              className="p-1.5 md:p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 transition-all"
              title="Undo"
            >
              <Undo className="w-3.5 h-3.5 md:w-4 md:h-4"/>
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo} 
              className="p-1.5 md:p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 transition-all"
              title="Redo"
            >
              <Redo className="w-3.5 h-3.5 md:w-4 md:h-4"/>
            </button>
          </div>
          
          {/* Font Size Controls - Always visible, compact on mobile */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 rounded-lg p-0.5 sm:p-1">
            <button 
              onClick={onZoomOut} 
              className="p-1 sm:p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all" 
              title="Decrease Font"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold min-w-[1.25rem] sm:min-w-[2rem] text-center text-gray-600 select-none px-0.5">
              {fontSize}
            </span>
            <button 
              onClick={onZoomIn} 
              className="p-1 sm:p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all" 
              title="Increase Font"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onRewrite}
                className="hidden sm:flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all"
              >
                <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Rewrite</span>
              </button>
              <button
                onClick={onToggleEdit}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg shadow-sm transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Done</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onToggleEdit}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onExportPDF}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>PDF</span>
              </button>
              {showPNGExport && onExportPNG && (
                <button
                  onClick={onExportPNG}
                  className="hidden sm:flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg shadow-sm transition-all"
                >
                  <Image className="w-4 h-4" />
                  <span>PNG</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
