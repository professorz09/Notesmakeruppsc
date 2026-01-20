import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { rewriteTableColumn } from '../../services/ai';

interface PNGPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableHtml: string;
  language: string;
}

export const PNGPreviewModal: React.FC<PNGPreviewModalProps> = ({
  isOpen,
  onClose,
  tableHtml,
  language,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (isOpen && previewRef.current && tableHtml) {
      previewRef.current.innerHTML = tableHtml;
      
      // Add edit mode class
      previewRef.current.classList.add('editing-mode', 'editor-content');
      
      // Set initial font size and line height
      previewRef.current.style.fontSize = `${fontSize}pt`;
      const table = previewRef.current.querySelector('table');
      if (table) {
        (table as HTMLElement).style.lineHeight = lineHeight.toString();
      }
      
      // Add interactive controls
      addTableControls();
    }
  }, [isOpen, tableHtml, fontSize, lineHeight]);

  const addTableControls = () => {
    if (!previewRef.current) return;
    
    const table = previewRef.current.querySelector('table');
    if (!table) return;

    // Add cell action buttons
    const cells = table.querySelectorAll('td');
    cells.forEach((cell) => {
      if (cell.querySelector('.cell-actions')) return;
      
      const actions = document.createElement('div');
      actions.className = 'cell-actions no-print';
      actions.contentEditable = 'false';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'cell-action-btn rewrite';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Clear cell';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        cell.innerHTML = '';
        cell.appendChild(actions);
      };
      
      actions.appendChild(deleteBtn);
      cell.appendChild(actions);
    });
    
    // Add row delete buttons
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      if (row.querySelector('.row-delete-btn')) return;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'row-delete-btn no-print';
      deleteBtn.contentEditable = 'false';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete row';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Delete this row?')) {
          row.remove();
        }
      };
      
      row.appendChild(deleteBtn);
    });
    
    // Add column controls to header cells
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach((th, colIndex) => {
      if (th.querySelector('.col-delete-btn')) return;
      
      // Delete column button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'col-delete-btn no-print';
      deleteBtn.contentEditable = 'false';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete column';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Delete this column?')) {
          handleColumnDelete(table as HTMLTableElement, colIndex);
        }
      };
      
      // Rewrite column button (AI)
      const rewriteBtn = document.createElement('button');
      rewriteBtn.className = 'col-rewrite-btn no-print';
      rewriteBtn.contentEditable = 'false';
      rewriteBtn.innerHTML = '✏️';
      rewriteBtn.title = 'AI Rewrite entire column';
      rewriteBtn.onclick = (e) => {
        e.stopPropagation();
        handleColumnRewrite(table as HTMLTableElement, colIndex);
      };
      
      th.appendChild(deleteBtn);
      th.appendChild(rewriteBtn);
    });

    // Make cells editable
    cells.forEach((cell) => {
      cell.setAttribute('contenteditable', 'true');
    });
    
    // Make headers editable
    headerCells.forEach((th) => {
      th.setAttribute('contenteditable', 'true');
    });
  };

  const handleColumnDelete = (table: HTMLTableElement, colIndex: number) => {
    // Delete header cell
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      if (headerCells[colIndex]) headerCells[colIndex].remove();
    }
    
    // Delete all cells in this column
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells[colIndex]) cells[colIndex].remove();
    });
  };

  const handleColumnRewrite = async (table: HTMLTableElement, colIndex: number) => {
    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    
    const headerCells = headerRow.querySelectorAll('th');
    const columnHeader = headerCells[colIndex]?.textContent?.trim() || 'Column';
    
    // Extract all cell data from this column
    const rows = table.querySelectorAll('tbody tr');
    const columnData: string[] = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells[colIndex]) {
        const cellContent = cells[colIndex].innerHTML.replace(/<div class="cell-actions">.*?<\/div>/s, '').trim();
        columnData.push(cellContent);
      }
    });
    
    if (columnData.length === 0) {
      alert('No data in this column to rewrite.');
      return;
    }
    
    setIsRewriting(true);
    try {
      const newColumnData = await rewriteTableColumn(columnData, columnHeader, language);
      
      // Update all cells in this column
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        if (cells[colIndex] && newColumnData[rowIndex]) {
          const cell = cells[colIndex] as HTMLTableCellElement;
          const actions = cell.querySelector('.cell-actions');
          cell.innerHTML = newColumnData[rowIndex];
          if (actions) cell.appendChild(actions);
        }
      });
      
      alert('Column rewritten successfully!');
    } catch (error) {
      console.error('Error rewriting column:', error);
      alert('Failed to rewrite column. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSelectionRewrite = async () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      alert('Please select text to rewrite.');
      return;
    }

    const selectedText = selection.toString();
    const instruction = prompt('Enter rewrite instruction (or leave empty for general improvement):');
    if (instruction === null) return;

    setIsRewriting(true);
    try {
      const { rewriteContent } = await import('../../services/ai');
      const newContent = await rewriteContent(selectedText, instruction || 'Improve this content');
      
      // Replace selected text
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const fragment = range.createContextualFragment(newContent);
      range.insertNode(fragment);
      
      selection.removeAllRanges();
      alert('Text rewritten successfully!');
    } catch (error) {
      console.error('Error rewriting selection:', error);
      alert('Failed to rewrite text. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(24, fontSize + delta));
    setFontSize(newSize);
    if (previewRef.current) {
      previewRef.current.style.fontSize = `${newSize}pt`;
    }
  };

  const handleLineHeightChange = (delta: number) => {
    const newHeight = Math.max(1.0, Math.min(3.0, lineHeight + delta));
    setLineHeight(newHeight);
    if (previewRef.current) {
      const table = previewRef.current.querySelector('table');
      if (table) {
        (table as HTMLElement).style.lineHeight = newHeight.toString();
      }
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const table = previewRef.current.querySelector('table');
      if (!table) return;

      // Create a temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.background = 'white';
      container.style.padding = '40px';
      container.style.width = 'max-content';
      container.style.minWidth = '800px';
      document.body.appendChild(container);

      // Clone the table
      const tableClone = table.cloneNode(true) as HTMLElement;
      
      // Remove edit buttons and controls
      tableClone.querySelectorAll('.cell-actions, .row-delete-btn, .col-delete-btn, .ai-edit-trigger, caption').forEach(el => el.remove());
      
      // Force table styling
      tableClone.style.fontSize = '14px';
      tableClone.style.fontFamily = 'Inter, sans-serif';
      tableClone.style.width = 'auto';
      tableClone.style.margin = '0';
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.border = '2px solid #000000';
      
      // Style all cells
      const allCells = tableClone.querySelectorAll('th, td');
      allCells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.border = '1px solid #000000';
        htmlCell.style.padding = '12px 16px';
      });
      
      // Style headers
      const headerCells = tableClone.querySelectorAll('th');
      headerCells.forEach((th: Element) => {
        const htmlTh = th as HTMLElement;
        htmlTh.style.backgroundColor = '#172554';
        htmlTh.style.color = '#ffffff';
        htmlTh.style.fontWeight = '600';
      });
      
      // Style body rows
      const bodyRows = tableClone.querySelectorAll('tbody tr');
      bodyRows.forEach((row: Element, index: number) => {
        if (index % 2 === 1) {
          (row as HTMLElement).style.backgroundColor = '#f8fafc';
        }
      });
      
      container.appendChild(tableClone);

      // Generate canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `table-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');

    } catch (error) {
      console.error('Error downloading table:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full h-full bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <div>
            <h2 className="text-2xl font-bold">PNG Table Preview & Editor</h2>
            <p className="text-sm opacity-90 mt-1">Edit cells, delete rows/columns, AI rewrite columns</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-4">
            {/* Font Size Controls */}
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold">Font:</span>
              <button
                onClick={() => handleFontSizeChange(-1)}
                className="w-7 h-7 bg-white bg-opacity-30 hover:bg-opacity-50 rounded flex items-center justify-center transition-all"
                title="Decrease font size"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm font-bold min-w-[3rem] text-center">{fontSize}pt</span>
              <button
                onClick={() => handleFontSizeChange(1)}
                className="w-7 h-7 bg-white bg-opacity-30 hover:bg-opacity-50 rounded flex items-center justify-center transition-all"
                title="Increase font size"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Line Height Controls */}
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold">Lines:</span>
              <button
                onClick={() => handleLineHeightChange(-0.1)}
                className="w-7 h-7 bg-white bg-opacity-30 hover:bg-opacity-50 rounded flex items-center justify-center transition-all"
                title="Decrease line spacing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-sm font-bold min-w-[2.5rem] text-center">{lineHeight.toFixed(1)}</span>
              <button
                onClick={() => handleLineHeightChange(0.1)}
                className="w-7 h-7 bg-white bg-opacity-30 hover:bg-opacity-50 rounded flex items-center justify-center transition-all"
                title="Increase line spacing"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* AI Rewrite Selection */}
            <button
              onClick={handleSelectionRewrite}
              disabled={isRewriting}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              title="Select text and click to rewrite with AI"
            >
              <span className="text-lg">✨</span>
              <span className="text-sm">AI Rewrite</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || isRewriting}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isRewriting}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* AI Rewriting Overlay */}
        {isRewriting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-purple-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xl font-semibold text-gray-800">AI Rewriting Column...</p>
              <p className="text-sm text-gray-600">Please wait while we improve the content</p>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Context Heading */}
            <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-2">📊 Table Editor</h3>
              <p className="text-sm opacity-90">
                Select text & click ✨ AI Rewrite • Click cells to edit • Hover headers for ✏️ column rewrite • Hover for × delete
              </p>
            </div>
            
            {/* Horizontal Line */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-6 shadow-md"></div>
            
            <div className="bg-white rounded-xl shadow-2xl p-8">
              <div
                ref={previewRef}
                className="editor-content"
                style={{ fontSize: `${fontSize}pt` }}
              />
            </div>
            
            {/* Bottom Horizontal Line */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full mt-6 shadow-md"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-gray-800 text-white text-sm flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Font: {fontSize}pt • Lines: {lineHeight.toFixed(1)}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Click cells/headers to edit
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            ✨ Select text for AI rewrite
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            ✏️ AI rewrite column
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            × Delete rows/columns
          </span>
        </div>
      </div>
    </div>
  );
};
