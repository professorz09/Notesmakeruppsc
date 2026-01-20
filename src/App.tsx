import React, { useState, useEffect, useRef } from 'react';
import { 
  generateTopicContent, 
  generateFormattedNotes,
  generateTableOnly,
  generateCompactTimeline,
  generateFormattedNotesWithFormat,
  generateIncrementalTable,
  generateStructuredNotes,
  generateSingleTableForPNG,
  generateUPSCAnswer,
  rewriteContent, 
  rewriteSection,
  expandSection,
  generateNextContent, 
  generateDetailedNextTopic,
  generateSectionImage,
  generateComplexTable,
  rewriteTableCell,
  expandTableCell,
  rewriteTableColumn
} from './services/ai';
import { GenerationStatus, Mode, EditTab, RewriteType, OutputFormat, AIModel, UPSCSubject, UPSCWordLimit, UPSCAnswerType } from './types';
import { Sidebar } from './components/Sidebar/Sidebar';
import { EditorToolbar } from './components/Editor/EditorToolbar';
import { EditorCanvas } from './components/Editor/EditorCanvas';
import { RewriteModal } from './components/Editor/RewriteModal';
import { IncrementalTableBuilder } from './components/Editor/IncrementalTableBuilder';
import { PNGPreviewModal } from './components/Editor/PNGPreviewModal';
import { useEditor } from './hooks/useEditor';
import { useHistory } from './hooks/useHistory';
import { saveToLocalStorage, loadFromLocalStorage, clearLocalStorage } from './utils/storage';
import { exportToPDF } from './utils/pdf';

const App: React.FC = () => {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always open on desktop, toggle on mobile
  const [fontSize, setFontSize] = useState(12);
  
  // Generation State
  const [mode, setMode] = useState<Mode>('topic');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('detailed-notes');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [language, setLanguage] = useState('Hindi');
  const [aiModel, setAIModel] = useState<AIModel>('gemini-3-flash');
  const [upscSubject, setUpscSubject] = useState<UPSCSubject>('GS1');
  const [upscWordLimit, setUpscWordLimit] = useState<UPSCWordLimit>('250');
  const [upscAnswerType, setUpscAnswerType] = useState<UPSCAnswerType>('standard');
  const [upscCustomInstruction, setUpscCustomInstruction] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileTopicName, setFileTopicName] = useState('');

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rewrite State
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const selectionRangeRef = useRef<Range | null>(null);
  const activeEditIdRef = useRef<string | null>(null);
  const [activeSectionHtml, setActiveSectionHtml] = useState<string>('');
  const [rewriteType, setRewriteType] = useState<RewriteType>('selection');
  const [editTab, setEditTab] = useState<EditTab>('rewrite');

  // PNG Preview State
  const [pngPreviewOpen, setPngPreviewOpen] = useState(false);
  const [pngTableHtml, setPngTableHtml] = useState<string>('');

  // Custom Hooks
  const { editorRef, isResettingRef, getCurrentHtml, getCleanHtml, getSectionNodes } = useEditor();
  const { pushToHistory, undo, redo, canUndo, canRedo, resetHistory } = useHistory(generatedHtml || '');

  // Initialize from localStorage
  useEffect(() => {
    const savedContent = loadFromLocalStorage();
    if (savedContent) {
      setGeneratedHtml(savedContent);
    }
  }, []);

  // Sync content to DOM
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (generatedHtml || '')) {
      editorRef.current.innerHTML = generatedHtml || '';
    }
  }, [generatedHtml, editorRef]);

  // Auto-save logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const content = getCleanHtml(generatedHtml);
        saveToLocalStorage(content);
      }
    };
    
    const intervalId = setInterval(() => { 
      if (isEditing) {
        const content = getCleanHtml(generatedHtml);
        saveToLocalStorage(content);
      }
    }, 5000);
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', () => saveToLocalStorage(getCleanHtml(generatedHtml)));
    window.addEventListener('beforeunload', () => saveToLocalStorage(getCleanHtml(generatedHtml)));
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', () => saveToLocalStorage(getCleanHtml(generatedHtml)));
      window.removeEventListener('beforeunload', () => saveToLocalStorage(getCleanHtml(generatedHtml)));
      clearInterval(intervalId);
    };
  }, [isEditing, generatedHtml, getCleanHtml]);

  // Editor handlers
  const handleEditorInput = () => {
    if (isResettingRef.current) return;
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
      if (isResettingRef.current) return;
      const rawContent = getCurrentHtml(generatedHtml);
      if (rawContent !== generatedHtml) {
        setGeneratedHtml(rawContent);
        pushToHistory(rawContent);
        saveToLocalStorage(getCleanHtml(generatedHtml));
      }
    }, 800);
  };

  const handleEditorBlur = () => {
    if (isResettingRef.current) return;
    const rawContent = getCurrentHtml(generatedHtml);
    setGeneratedHtml(rawContent);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+' || e.key === '-')) {
      e.preventDefault();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const parentEl = selection.anchorNode?.parentElement;
      if (!parentEl) return;
      
      const currentSize = parseFloat(window.getComputedStyle(parentEl).fontSize);
      const change = (e.key === '=' || e.key === '+') ? 2 : -2;
      const newSize = Math.max(8, currentSize + change);

      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand('fontSize', false, '7');

      const markers = editorRef.current?.querySelectorAll('font[size="7"]');
      markers?.forEach(el => {
        el.removeAttribute('size');
        (el as HTMLElement).style.fontSize = `${newSize}px`;
      });

      handleEditorInput();
    }
  };

  // Font size handlers
  const handleZoomIn = () => setFontSize(p => Math.min(p + 1, 18));
  const handleZoomOut = () => setFontSize(p => Math.max(p - 1, 8));

  // Generation handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'topic' && !topicInput.trim()) return;
    if (mode === 'text' && !textInput.trim()) return;
    if (mode === 'file' && !uploadedFile) {
      alert('Please upload a file first!');
      return;
    }
    if (mode === 'file' && !fileTopicName.trim()) {
      alert('Please enter a topic name for the file!');
      return;
    }

    setStatus(GenerationStatus.GENERATING_CHAPTER);
    
    try {
      let result = "";
      if (mode === 'topic') {
        // Generate based on output format
        if (outputFormat === 'table-only') {
          result = await generateTableOnly(topicInput, language, aiModel);
        } else if (outputFormat === 'png-table') {
          result = await generateSingleTableForPNG(topicInput, language, aiModel);
        } else if (outputFormat === 'upsc-answer') {
          result = await generateUPSCAnswer(topicInput, upscSubject, upscWordLimit, upscAnswerType, upscCustomInstruction, language, aiModel);
        } else if (outputFormat === 'compact-timeline') {
          result = await generateCompactTimeline(topicInput, language);
        } else if (outputFormat === 'incremental-table') {
          result = await generateIncrementalTable(topicInput, language);
        } else if (outputFormat === 'structured-notes') {
          result = await generateStructuredNotes(topicInput, language);
        } else {
          result = await generateTopicContent(topicInput, language, aiModel);
        }
      } else if (mode === 'file') {
        // Process uploaded file
        const { generateFromFile } = await import('./services/ai');
        result = await generateFromFile(uploadedFile!, fileTopicName, language, outputFormat, aiModel);
      } else {
        // Format text based on output format
        if (outputFormat === 'incremental-table') {
          result = await generateIncrementalTable(textInput, language);
        } else if (outputFormat === 'structured-notes') {
          result = await generateStructuredNotes(textInput, language);
        } else if (outputFormat === 'png-table') {
          result = await generateSingleTableForPNG(textInput, language);
        } else {
          result = await generateFormattedNotesWithFormat(textInput, language, outputFormat);
        }
      }

      if (isResettingRef.current) return;

      setGeneratedHtml(result);
      pushToHistory(result);
      saveToLocalStorage(result);
      
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      if (!isResettingRef.current) {
        console.error(error);
        alert("Error generating content. Please try again.");
      }
    } finally {
      if (!isResettingRef.current) {
        setStatus(GenerationStatus.IDLE);
      }
    }
  };

  // Add another UPSC question
  const handleAddAnotherQuestion = async () => {
    if (!topicInput.trim()) {
      alert('Please enter a question first!');
      return;
    }

    setStatus(GenerationStatus.GENERATING_CHAPTER);
    
    try {
      const newAnswer = await generateUPSCAnswer(topicInput, upscSubject, upscWordLimit, upscAnswerType, upscCustomInstruction, language, aiModel);
      
      if (isResettingRef.current) return;

      const updatedHtml = (generatedHtml || '') + newAnswer;
      setGeneratedHtml(updatedHtml);
      pushToHistory(updatedHtml);
      saveToLocalStorage(updatedHtml);
      
      // Clear input for next question
      setTopicInput('');
    } catch (error) {
      if (!isResettingRef.current) {
        console.error(error);
        alert("Error generating answer. Please try again.");
      }
    } finally {
      if (!isResettingRef.current) {
        setStatus(GenerationStatus.IDLE);
      }
    }
  };

  // Incremental table: Add more rows
  const handleAddTableRows = async (instruction: string) => {
    if (!generatedHtml) return;
    
    setStatus(GenerationStatus.GENERATING_CHAPTER);
    
    try {
      const result = await generateIncrementalTable(instruction, language, generatedHtml);
      
      if (isResettingRef.current) return;

      setGeneratedHtml(result);
      pushToHistory(result);
      saveToLocalStorage(result);
    } catch (error) {
      if (!isResettingRef.current) {
        console.error(error);
        alert("Error adding rows. Please try again.");
      }
    } finally {
      if (!isResettingRef.current) {
        setStatus(GenerationStatus.IDLE);
      }
    }
  };

  const handleClearCanvas = () => {
    if (!confirm("Are you sure you want to clear the editor?")) return;
    isResettingRef.current = true;
    setGeneratedHtml(null);
    resetHistory();
    setIsEditing(false);
    activeEditIdRef.current = null;
    selectionRangeRef.current = null;
    setUploadedFile(null);
    setFileTopicName('');
    clearLocalStorage();
    setTimeout(() => { isResettingRef.current = false; }, 100);
  };

  // History handlers
  const handleUndo = () => {
    const content = undo();
    if (content !== null) {
      setGeneratedHtml(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  };

  const handleRedo = () => {
    const content = redo();
    if (content !== null) {
      setGeneratedHtml(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    }
  };

  // Edit mode handlers
  const handleToggleEdit = () => {
    if (isEditing) {
      const content = getCleanHtml(generatedHtml);
      saveToLocalStorage(content);
    }
    setIsEditing(!isEditing);
  };

  // Add/remove edit buttons
  useEffect(() => {
    if (!editorRef.current) return;
    
    // Add/remove editing-mode class for CSS
    if (isEditing) {
      editorRef.current.classList.add('editing-mode');
    } else {
      editorRef.current.classList.remove('editing-mode');
    }
    
    if (isEditing) {
      const elements = editorRef.current.querySelectorAll('h1, h2, h3, h4, li, table, .flowchart-container');
      elements.forEach((el) => {
        if (el.querySelector('.ai-edit-trigger')) return;
        
        const btn = document.createElement('span');
        btn.contentEditable = "false";
        btn.className = "ai-edit-trigger no-print";
        btn.innerHTML = "✨";
        btn.title = "Rewrite/Expand";

        if (el.tagName === 'TABLE') {
          let cap = el.querySelector('caption');
          if (!cap) {
            cap = document.createElement('caption');
            el.prepend(cap);
          }
          btn.style.position = 'absolute';
          btn.style.right = '-10px';
          btn.style.top = '-10px';
          btn.style.zIndex = '10';
          cap.appendChild(btn);
          
          // Add interactive controls to table cells and rows
          addTableControls(el as HTMLTableElement);
        } else if (el.classList.contains('flowchart-container')) {
          btn.style.position = 'absolute';
          btn.style.right = '10px';
          btn.style.top = '10px';
          btn.style.zIndex = '10';
          btn.style.backgroundColor = '#fff';
          el.appendChild(btn);
        } else if (el.tagName === 'LI') {
          el.insertBefore(btn, el.firstChild);
        } else {
          el.appendChild(btn);
        }
      });
    } else {
      editorRef.current.querySelectorAll('.ai-edit-trigger').forEach(btn => btn.remove());
      editorRef.current.querySelectorAll('caption').forEach(cap => {
        if (cap.innerHTML.trim() === '') cap.remove();
      });
      // Remove table controls
      editorRef.current.querySelectorAll('.cell-actions, .row-delete-btn, .col-delete-btn').forEach(el => el.remove());
    }
  }, [isEditing, generatedHtml, editorRef]);

  // Add table cell/row/column controls
  const addTableControls = (table: HTMLTableElement) => {
    // Add cell action buttons
    const cells = table.querySelectorAll('td');
    cells.forEach((cell) => {
      if (cell.querySelector('.cell-actions')) return;
      
      const actions = document.createElement('div');
      actions.className = 'cell-actions no-print';
      actions.contentEditable = 'false';
      
      const rewriteBtn = document.createElement('button');
      rewriteBtn.className = 'cell-action-btn rewrite';
      rewriteBtn.innerHTML = '✏️';
      rewriteBtn.title = 'Rewrite cell';
      rewriteBtn.onclick = (e) => {
        e.stopPropagation();
        handleCellRewrite(cell);
      };
      
      const expandBtn = document.createElement('button');
      expandBtn.className = 'cell-action-btn expand';
      expandBtn.innerHTML = '➕';
      expandBtn.title = 'Expand cell';
      expandBtn.onclick = (e) => {
        e.stopPropagation();
        handleCellExpand(cell);
      };
      
      actions.appendChild(rewriteBtn);
      actions.appendChild(expandBtn);
      cell.appendChild(actions);
    });
    
    // Add row delete buttons and add row buttons
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
        handleRowDelete(row as HTMLTableRowElement);
      };
      
      const addBtn = document.createElement('button');
      addBtn.className = 'row-add-btn no-print';
      addBtn.contentEditable = 'false';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add row below';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        handleAddRow(row as HTMLTableRowElement);
      };
      
      row.appendChild(deleteBtn);
      row.appendChild(addBtn);
    });
    
    // Add column controls to header cells
    const headerCells = table.querySelectorAll('thead th');
    headerCells.forEach((th, colIndex) => {
      if (th.querySelector('.col-delete-btn')) return;
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'col-delete-btn no-print';
      deleteBtn.contentEditable = 'false';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete column';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        handleColumnDelete(table, colIndex);
      };
      
      // Add column button
      const addBtn = document.createElement('button');
      addBtn.className = 'col-add-btn no-print';
      addBtn.contentEditable = 'false';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add column';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        handleAddColumn(table, colIndex);
      };
      
      // Rewrite column button
      const rewriteBtn = document.createElement('button');
      rewriteBtn.className = 'col-rewrite-btn no-print';
      rewriteBtn.contentEditable = 'false';
      rewriteBtn.innerHTML = '✏️';
      rewriteBtn.title = 'Rewrite entire column';
      rewriteBtn.onclick = (e) => {
        e.stopPropagation();
        handleColumnRewrite(table, colIndex);
      };
      
      // Resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'col-resize-handle no-print';
      resizeHandle.contentEditable = 'false';
      resizeHandle.onmousedown = (e) => {
        e.stopPropagation();
        handleColumnResizeStart(e, th as HTMLTableCellElement);
      };
      
      th.appendChild(deleteBtn);
      th.appendChild(addBtn);
      th.appendChild(rewriteBtn);
      th.appendChild(resizeHandle);
    });
  };

  // Handle cell rewrite
  const handleCellRewrite = async (cell: HTMLTableCellElement) => {
    const instruction = prompt('Enter rewrite instruction (or leave empty for general improvement):');
    if (instruction === null) return;
    
    const currentContent = cell.innerHTML.replace(/<div class="cell-actions">.*?<\/div>/s, '').trim();
    
    setStatus(GenerationStatus.GENERATING_CHAPTER);
    try {
      const newContent = await rewriteTableCell(currentContent, instruction || 'Improve this content', language);
      
      // Preserve cell actions
      const actions = cell.querySelector('.cell-actions');
      cell.innerHTML = newContent;
      if (actions) cell.appendChild(actions);
      
      const rawContent = getCurrentHtml(generatedHtml);
      setGeneratedHtml(rawContent);
      pushToHistory(rawContent);
      saveToLocalStorage(getCleanHtml(generatedHtml));
    } catch (error) {
      console.error('Error rewriting cell:', error);
      alert('Failed to rewrite cell. Please try again.');
    } finally {
      setStatus(GenerationStatus.IDLE);
    }
  };

  // Handle cell expand
  const handleCellExpand = async (cell: HTMLTableCellElement) => {
    const currentContent = cell.innerHTML.replace(/<div class="cell-actions">.*?<\/div>/s, '').trim();
    
    setStatus(GenerationStatus.GENERATING_CHAPTER);
    try {
      const newContent = await expandTableCell(currentContent, language);
      
      // Preserve cell actions
      const actions = cell.querySelector('.cell-actions');
      cell.innerHTML = newContent;
      if (actions) cell.appendChild(actions);
      
      const rawContent = getCurrentHtml(generatedHtml);
      setGeneratedHtml(rawContent);
      pushToHistory(rawContent);
      saveToLocalStorage(getCleanHtml(generatedHtml));
    } catch (error) {
      console.error('Error expanding cell:', error);
      alert('Failed to expand cell. Please try again.');
    } finally {
      setStatus(GenerationStatus.IDLE);
    }
  };

  // Handle row delete
  const handleRowDelete = (row: HTMLTableRowElement) => {
    if (!confirm('Delete this row?')) return;
    
    row.remove();
    
    const rawContent = getCurrentHtml(generatedHtml);
    setGeneratedHtml(rawContent);
    pushToHistory(rawContent);
    saveToLocalStorage(getCleanHtml(generatedHtml));
  };

  // Handle column delete
  const handleColumnDelete = (table: HTMLTableElement, colIndex: number) => {
    if (!confirm('Delete this column?')) return;
    
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
    
    const rawContent = getCurrentHtml(generatedHtml);
    setGeneratedHtml(rawContent);
    pushToHistory(rawContent);
    saveToLocalStorage(getCleanHtml(generatedHtml));
  };

  // Handle add row
  const handleAddRow = (currentRow: HTMLTableRowElement) => {
    const colCount = currentRow.querySelectorAll('td').length;
    const newRow = document.createElement('tr');
    
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement('td');
      newCell.innerHTML = 'New data';
      newRow.appendChild(newCell);
    }
    
    // Insert after current row
    if (currentRow.nextSibling) {
      currentRow.parentNode?.insertBefore(newRow, currentRow.nextSibling);
    } else {
      currentRow.parentNode?.appendChild(newRow);
    }
    
    // Add controls to new row
    const table = currentRow.closest('table') as HTMLTableElement;
    if (table) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'row-delete-btn no-print';
      deleteBtn.contentEditable = 'false';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete row';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        handleRowDelete(newRow);
      };
      
      const addBtn = document.createElement('button');
      addBtn.className = 'row-add-btn no-print';
      addBtn.contentEditable = 'false';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add row below';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        handleAddRow(newRow);
      };
      
      newRow.appendChild(deleteBtn);
      newRow.appendChild(addBtn);
      
      // Add cell controls
      newRow.querySelectorAll('td').forEach((cell) => {
        const actions = document.createElement('div');
        actions.className = 'cell-actions no-print';
        actions.contentEditable = 'false';
        
        const rewriteBtn = document.createElement('button');
        rewriteBtn.className = 'cell-action-btn rewrite';
        rewriteBtn.innerHTML = '✏️';
        rewriteBtn.title = 'Rewrite cell';
        rewriteBtn.onclick = (e) => {
          e.stopPropagation();
          handleCellRewrite(cell);
        };
        
        const expandBtn = document.createElement('button');
        expandBtn.className = 'cell-action-btn expand';
        expandBtn.innerHTML = '➕';
        expandBtn.title = 'Expand cell';
        expandBtn.onclick = (e) => {
          e.stopPropagation();
          handleCellExpand(cell);
        };
        
        actions.appendChild(rewriteBtn);
        actions.appendChild(expandBtn);
        cell.appendChild(actions);
      });
    }
    
    const rawContent = getCurrentHtml(generatedHtml);
    setGeneratedHtml(rawContent);
    pushToHistory(rawContent);
    saveToLocalStorage(getCleanHtml(generatedHtml));
  };

  // Handle add column
  const handleAddColumn = (table: HTMLTableElement, afterColIndex: number) => {
    // Add header cell
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      const newHeader = document.createElement('th');
      newHeader.innerHTML = 'New Column';
      
      if (afterColIndex < headerCells.length - 1) {
        headerRow.insertBefore(newHeader, headerCells[afterColIndex + 1]);
      } else {
        headerRow.appendChild(newHeader);
      }
      
      // Add controls to new header
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'col-delete-btn no-print';
      deleteBtn.contentEditable = 'false';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete column';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        handleColumnDelete(table, afterColIndex + 1);
      };
      
      const addBtn = document.createElement('button');
      addBtn.className = 'col-add-btn no-print';
      addBtn.contentEditable = 'false';
      addBtn.innerHTML = '+';
      addBtn.title = 'Add column';
      addBtn.onclick = (e) => {
        e.stopPropagation();
        handleAddColumn(table, afterColIndex + 1);
      };
      
      const rewriteBtn = document.createElement('button');
      rewriteBtn.className = 'col-rewrite-btn no-print';
      rewriteBtn.contentEditable = 'false';
      rewriteBtn.innerHTML = '✏️';
      rewriteBtn.title = 'Rewrite entire column';
      rewriteBtn.onclick = (e) => {
        e.stopPropagation();
        handleColumnRewrite(table, afterColIndex + 1);
      };
      
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'col-resize-handle no-print';
      resizeHandle.contentEditable = 'false';
      resizeHandle.onmousedown = (e) => {
        e.stopPropagation();
        handleColumnResizeStart(e, newHeader);
      };
      
      newHeader.appendChild(deleteBtn);
      newHeader.appendChild(addBtn);
      newHeader.appendChild(rewriteBtn);
      newHeader.appendChild(resizeHandle);
    }
    
    // Add cells to all rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const newCell = document.createElement('td');
      newCell.innerHTML = 'New data';
      
      if (afterColIndex < cells.length - 1) {
        row.insertBefore(newCell, cells[afterColIndex + 1]);
      } else {
        row.appendChild(newCell);
      }
      
      // Add cell controls
      const actions = document.createElement('div');
      actions.className = 'cell-actions no-print';
      actions.contentEditable = 'false';
      
      const rewriteBtn = document.createElement('button');
      rewriteBtn.className = 'cell-action-btn rewrite';
      rewriteBtn.innerHTML = '✏️';
      rewriteBtn.title = 'Rewrite cell';
      rewriteBtn.onclick = (e) => {
        e.stopPropagation();
        handleCellRewrite(newCell);
      };
      
      const expandBtn = document.createElement('button');
      expandBtn.className = 'cell-action-btn expand';
      expandBtn.innerHTML = '➕';
      expandBtn.title = 'Expand cell';
      expandBtn.onclick = (e) => {
        e.stopPropagation();
        handleCellExpand(newCell);
      };
      
      actions.appendChild(rewriteBtn);
      actions.appendChild(expandBtn);
      newCell.appendChild(actions);
    });
    
    const rawContent = getCurrentHtml(generatedHtml);
    setGeneratedHtml(rawContent);
    pushToHistory(rawContent);
    saveToLocalStorage(getCleanHtml(generatedHtml));
  };

  // Handle column rewrite (entire vertical column)
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
    
    setStatus(GenerationStatus.GENERATING_CHAPTER);
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
      
      const rawContent = getCurrentHtml(generatedHtml);
      setGeneratedHtml(rawContent);
      pushToHistory(rawContent);
      saveToLocalStorage(getCleanHtml(generatedHtml));
    } catch (error) {
      console.error('Error rewriting column:', error);
      alert('Failed to rewrite column. Please try again.');
    } finally {
      setStatus(GenerationStatus.IDLE);
    }
  };

  // Handle column resize
  const handleColumnResizeStart = (e: MouseEvent, th: HTMLTableCellElement) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = th.offsetWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      th.style.width = `${newWidth}px`;
      th.style.minWidth = `${newWidth}px`;
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const rawContent = getCurrentHtml(generatedHtml);
      setGeneratedHtml(rawContent);
      pushToHistory(rawContent);
      saveToLocalStorage(getCleanHtml(generatedHtml));
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle edit button clicks
  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ai-edit-trigger')) {
        e.preventDefault();
        e.stopPropagation();
        let parentEl = target.parentElement;
        if (parentEl?.tagName === 'CAPTION') {
          parentEl = parentEl.parentElement;
        }
        if (parentEl) handleSectionEdit(parentEl);
      }
    };
    const editor = editorRef.current;
    if (editor) editor.addEventListener('click', handleEditorClick);
    return () => { if (editor) editor.removeEventListener('click', handleEditorClick); };
  }, [isEditing, editorRef]);

  const handleSectionEdit = (startNode: Element) => {
    if (!editorRef.current) return;
    const currentRaw = getCurrentHtml(generatedHtml);
    pushToHistory(currentRaw);
    setGeneratedHtml(currentRaw);

    const editId = `edit-${Date.now()}`;
    editorRef.current.querySelectorAll('[data-edit-id]').forEach(el => el.removeAttribute('data-edit-id'));
    startNode.setAttribute('data-edit-id', editId);
    activeEditIdRef.current = editId;

    const nodes = getSectionNodes(startNode);
    const tempDiv = document.createElement('div');
    nodes.forEach(node => {
      const clone = node.cloneNode(true) as Element;
      const trigger = clone.querySelector('.ai-edit-trigger');
      if (trigger) trigger.remove();
      clone.removeAttribute('data-edit-id');
      tempDiv.appendChild(clone);
    });
    setActiveSectionHtml(tempDiv.innerHTML);
    setGeneratedHtml(editorRef.current.innerHTML);
    setRewriteType('section');
    setEditTab('rewrite');
    setRewriteInstruction('');
    setRewriteModalOpen(true);
  };

  const openSelectionRewriteModal = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
      alert("Please select text to rewrite.");
      return;
    }
    selectionRangeRef.current = selection.getRangeAt(0);
    setRewriteType('selection');
    setEditTab('rewrite');
    setRewriteInstruction('');
    setRewriteModalOpen(true);
  };

  const handleRewriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleRewriteSubmit called', { editTab, rewriteType, instruction: rewriteInstruction });
    setIsRewriting(true);
    try {
      const rawBefore = getCurrentHtml(generatedHtml);
      pushToHistory(rawBefore);
      let resultHtml = "";

      if (rewriteType === 'section') {
        console.log('📝 Section rewrite mode');
        if (editTab === 'rewrite') resultHtml = await rewriteSection(activeSectionHtml, rewriteInstruction);
        else if (editTab === 'expand') resultHtml = await expandSection(activeSectionHtml, rewriteInstruction, aiModel);
        else if (editTab === 'continue') resultHtml = await generateNextContent(activeSectionHtml, rewriteInstruction);
        else if (editTab === 'next_topic') resultHtml = await generateDetailedNextTopic(activeSectionHtml, rewriteInstruction, aiModel);
        else if (editTab === 'diagram') {
          console.log('🎨 Generating diagram for section');
          console.log('📄 Active section HTML length:', activeSectionHtml.length);
          const imgHtml = await generateSectionImage(activeSectionHtml, rewriteInstruction, aiModel);
          console.log('✅ Diagram HTML received, length:', imgHtml.length);
          console.log('🔍 First 200 chars of diagram:', imgHtml.substring(0, 200));
          resultHtml = activeSectionHtml + imgHtml;
        } else if (editTab === 'table') {
          resultHtml = await generateComplexTable(activeSectionHtml, rewriteInstruction, aiModel);
        }
      } else {
        console.log('📝 Selection rewrite mode');
        const selectedText = selectionRangeRef.current?.toString() || "";
        if (editTab === 'rewrite') resultHtml = await rewriteContent(selectedText, rewriteInstruction);
        else if (editTab === 'expand') resultHtml = await expandSection(selectedText, rewriteInstruction, aiModel);
        else if (editTab === 'continue') {
          const nextContent = await generateNextContent(selectedText, rewriteInstruction);
          resultHtml = selectedText + " " + nextContent;
        } else if (editTab === 'next_topic') {
          const nextContent = await generateDetailedNextTopic(selectedText, rewriteInstruction, aiModel);
          resultHtml = selectedText + " " + nextContent;
        } else if (editTab === 'diagram') {
          console.log('🎨 Generating diagram for selection');
          console.log('📄 Selected text length:', selectedText.length);
          const imgHtml = await generateSectionImage(selectedText, rewriteInstruction, aiModel);
          console.log('✅ Diagram HTML received, length:', imgHtml.length);
          console.log('🔍 First 200 chars of diagram:', imgHtml.substring(0, 200));
          resultHtml = selectedText + "<br/>" + imgHtml;
        } else if (editTab === 'table') {
          resultHtml = await generateComplexTable(selectedText, rewriteInstruction, aiModel);
        }
      }

      console.log('📦 Result HTML length:', resultHtml.length);
      if (isResettingRef.current) return;
      if (!resultHtml) {
        console.error('❌ No result HTML generated!');
        throw new Error("No content generated");
      }

      console.log('🔄 Inserting content into DOM...');
      // DOM Replacement Logic
      if (rewriteType === 'section') {
        const editId = activeEditIdRef.current;
        if (!editorRef.current || !editId) throw new Error("Editor context lost.");
        const startNode = editorRef.current.querySelector(`[data-edit-id="${editId}"]`);
        if (!startNode) throw new Error("Lost position.");
        const nodesToReplace = getSectionNodes(startNode);
        const firstNode = nodesToReplace[0];
        const lastNode = nodesToReplace[nodesToReplace.length - 1];
        const parent = firstNode.parentNode;
        if (!parent) throw new Error("Parent node lost.");

        const range = document.createRange();
        range.setStartBefore(firstNode);
        const fragment = range.createContextualFragment(resultHtml);

        if (editTab === 'continue' || editTab === 'next_topic' || editTab === 'diagram') {
          console.log('➕ Appending content after section');
          if (lastNode.nextSibling) parent.insertBefore(fragment, lastNode.nextSibling);
          else parent.appendChild(fragment);
          startNode.removeAttribute('data-edit-id');
        } else {
          console.log('🔄 Replacing section content');
          parent.insertBefore(fragment, firstNode);
          nodesToReplace.forEach(n => n.remove());
        }
      } else {
        const range = selectionRangeRef.current;
        if (range) {
          const fragment = range.createContextualFragment(resultHtml);
          range.deleteContents();
          range.insertNode(fragment);
          const selection = window.getSelection();
          selection?.removeAllRanges();
        }
      }
      
      console.log('✅ Content inserted successfully');
      setRewriteModalOpen(false);
      if (editorRef.current) {
        const rawContent = getCurrentHtml(generatedHtml);
        setGeneratedHtml(rawContent);
        pushToHistory(rawContent);
        saveToLocalStorage(getCleanHtml(generatedHtml));
      }
    } catch (error) {
      if (!isResettingRef.current) {
        console.error("Rewrite failed:", error);
        alert("Failed. Please try again.");
      }
    } finally {
      if (!isResettingRef.current) setIsRewriting(false);
    }
  };

  const handleExportPDF = () => {
    if (!generatedHtml) return;
    const contentToPrint = isEditing && editorRef.current ? getCleanHtml(generatedHtml) : generatedHtml;
    exportToPDF(contentToPrint, fontSize);
  };

  const handleExportTablesToPNG = () => {
    if (!editorRef.current) return;
    
    const table = editorRef.current.querySelector('table');
    if (!table) {
      alert('No table found to export!');
      return;
    }
    
    // Get clean table HTML
    const tableClone = table.cloneNode(true) as HTMLElement;
    tableClone.querySelectorAll('.ai-edit-trigger, caption').forEach(el => {
      if (el.textContent?.trim() === '') el.remove();
    });
    
    setPngTableHtml(tableClone.outerHTML);
    setPngPreviewOpen(true);
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
        outputFormat={outputFormat}
        onOutputFormatChange={setOutputFormat}
        topicInput={topicInput}
        onTopicChange={setTopicInput}
        textInput={textInput}
        onTextChange={setTextInput}
        language={language}
        onLanguageChange={setLanguage}
        aiModel={aiModel}
        onAIModelChange={setAIModel}
        upscSubject={upscSubject}
        onUPSCSubjectChange={setUpscSubject}
        upscWordLimit={upscWordLimit}
        onUPSCWordLimitChange={setUpscWordLimit}
        upscAnswerType={upscAnswerType}
        onUPSCAnswerTypeChange={setUpscAnswerType}
        upscCustomInstruction={upscCustomInstruction}
        onUPSCCustomInstructionChange={setUpscCustomInstruction}
        uploadedFile={uploadedFile}
        onFileUpload={setUploadedFile}
        fileTopicName={fileTopicName}
        onFileTopicNameChange={setFileTopicName}
        onGenerate={handleGenerate}
        onAddAnotherQuestion={handleAddAnotherQuestion}
        onClear={handleClearCanvas}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        status={status}
        canUndo={canUndo}
        canRedo={canRedo}
        fontSize={fontSize}
        generatedHtml={generatedHtml}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Toolbar - Always on top with high z-index */}
        <div className="relative z-50">
        <EditorToolbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(true)}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          fontSize={fontSize}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          isEditing={isEditing}
          onToggleEdit={handleToggleEdit}
          onRewrite={openSelectionRewriteModal}
          onExportPDF={handleExportPDF}
          onExportPNG={handleExportTablesToPNG}
          showPNGExport={outputFormat === 'png-table'}
        />
        </div>

        <EditorCanvas
          status={status}
          generatedHtml={generatedHtml}
          isEditing={isEditing}
          fontSize={fontSize}
          editorRef={editorRef}
          onEditorInput={handleEditorInput}
          onEditorBlur={handleEditorBlur}
          onEditorKeyDown={handleEditorKeyDown}
        />

        {/* Incremental Table Builder - Show only in incremental-table mode */}
        {outputFormat === 'incremental-table' && generatedHtml && (
          <IncrementalTableBuilder
            onAddRows={handleAddTableRows}
            isLoading={status === GenerationStatus.GENERATING_CHAPTER}
          />
        )}
      </main>

      <RewriteModal
        isOpen={rewriteModalOpen}
        onClose={() => setRewriteModalOpen(false)}
        rewriteType={rewriteType}
        editTab={editTab}
        onTabChange={setEditTab}
        instruction={rewriteInstruction}
        onInstructionChange={setRewriteInstruction}
        onSubmit={handleRewriteSubmit}
        isRewriting={isRewriting}
        selectedText={selectionRangeRef.current?.toString() || ""}
        aiModel={aiModel}
        onAIModelChange={setAIModel}
      />

      <PNGPreviewModal
        isOpen={pngPreviewOpen}
        onClose={() => setPngPreviewOpen(false)}
        tableHtml={pngTableHtml}
        language={language}
      />
    </div>
  );
};

export default App;
