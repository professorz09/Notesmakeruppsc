import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  generateTopicContent, 
  generateFormattedNotes, 
  rewriteContent, 
  rewriteSection,
  expandSection,
  generateNextContent, 
  generateDetailedNextTopic,
  generateSectionImage,
  generateComplexTable
} from './services/ai';
import { GenerationStatus } from './types';
import { Button } from './components/Button';
import { 
  BookOpen, 
  PenTool, 
  Printer, 
  Sparkles,
  FileText,
  Trash2,
  Wand2,
  ArrowLeft,
  Check,
  Save,
  Undo,
  Redo,
  RefreshCw,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Download,
  Eraser,
  Settings,
  Image as ImageIcon,
  Minus,
  Type,
  Table as TableIcon
} from 'lucide-react';

const STORAGE_KEY = 'ai_book_writer_draft';

const App: React.FC = () => {
  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontSize, setFontSize] = useState(12); // Default to 12pt (Normal)
  
  // --- GENERATION STATE ---
  const [mode, setMode] = useState<'topic' | 'text'>('topic');
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [language, setLanguage] = useState('Hindi'); 
  const [topicInput, setTopicInput] = useState('');
  const [textInput, setTextInput] = useState('');

  // --- EDITOR STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // --- HISTORY STATE ---
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- REWRITE STATE ---
  const isResettingRef = useRef(false);
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const selectionRangeRef = useRef<Range | null>(null);
  const activeEditIdRef = useRef<string | null>(null);
  const [activeSectionHtml, setActiveSectionHtml] = useState<string>('');
  const [rewriteType, setRewriteType] = useState<'selection' | 'section'>('selection');
  const [editTab, setEditTab] = useState<'rewrite' | 'expand' | 'continue' | 'next_topic' | 'image' | 'table'>('rewrite');

  // --- 1. INITIALIZATION & HISTORY ---

  const pushToHistory = useCallback((content: string) => {
    setHistory(prev => {
      if (historyIndex >= 0 && prev[historyIndex] === content) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, content];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  useEffect(() => {
    const savedContent = localStorage.getItem(STORAGE_KEY);
    if (savedContent) {
      setGeneratedHtml(savedContent);
      setHistory([savedContent]);
      setHistoryIndex(0);
    }
  }, []);

  // --- 2. EDITOR HELPERS ---

  const getCurrentHtml = useCallback(() => {
    return editorRef.current ? editorRef.current.innerHTML : (generatedHtml || '');
  }, [generatedHtml]);

  const getCleanHtml = useCallback(() => {
    if (!editorRef.current) return generatedHtml || '';
    const clone = editorRef.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.ai-edit-trigger').forEach(b => b.remove());
    clone.querySelectorAll('[data-edit-id]').forEach(el => el.removeAttribute('data-edit-id'));
    // Clean up font tags that might have been left over from resizing
    clone.querySelectorAll('font').forEach(font => {
       const span = document.createElement('span');
       span.innerHTML = font.innerHTML;
       // If font has size attribute but no style, we might want to convert or drop it
       // But our resize logic replaces size with style, so just keep style
       if(font.getAttribute('style')) span.setAttribute('style', font.getAttribute('style')!);
       font.replaceWith(span);
    });
    return clone.innerHTML;
  }, [generatedHtml]);

  const saveToStorage = useCallback(() => {
    if (isResettingRef.current) return;
    const content = getCleanHtml();
    if (content) {
      localStorage.setItem(STORAGE_KEY, content);
    }
    return content;
  }, [getCleanHtml]);

  // Sync content state to DOM without resetting cursor during edits
  useEffect(() => {
    if (editorRef.current) {
        // Only update DOM if the new generatedHtml is logically different
        // This prevents re-renders from killing the cursor position during typing
        if (editorRef.current.innerHTML !== (generatedHtml || '')) {
             editorRef.current.innerHTML = generatedHtml || '';
        }
    }
  }, [generatedHtml]);

  // Auto-save logic
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveToStorage();
    };
    const intervalId = setInterval(() => { if (isEditing) saveToStorage(); }, 5000);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', saveToStorage);
    window.addEventListener('beforeunload', saveToStorage);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', saveToStorage);
      window.removeEventListener('beforeunload', saveToStorage);
      clearInterval(intervalId);
    };
  }, [saveToStorage, isEditing]);

  const handleEditorInput = () => {
    if (isResettingRef.current) return;
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
       if (isResettingRef.current) return;
       const rawContent = getCurrentHtml(); 
       // Only update state if content actually changed
       if (rawContent !== generatedHtml) {
           setGeneratedHtml(rawContent); 
           pushToHistory(rawContent);
           saveToStorage();
       }
    }, 800);
  };

  const handleEditorBlur = () => {
      if (isResettingRef.current) return;
      const rawContent = getCurrentHtml();
      setGeneratedHtml(rawContent);
  };

  // --- FONT SIZE HANDLERS ---
  const handleZoomIn = () => setFontSize(p => Math.min(p + 1, 18));
  const handleZoomOut = () => setFontSize(p => Math.max(p - 1, 8));

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Check for Cmd/Ctrl + '+' or Cmd/Ctrl + '-' (including '=' which is unshifted +)
    if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+' || e.key === '-')) {
      e.preventDefault();
      
      const selection = window.getSelection();
      // Only proceed if there is an actual text selection (not just cursor)
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      // 1. Calculate new size based on the start of the selection context
      const parentEl = selection.anchorNode?.parentElement;
      if (!parentEl) return;
      
      const currentSize = parseFloat(window.getComputedStyle(parentEl).fontSize);
      const change = (e.key === '=' || e.key === '+') ? 2 : -2;
      const newSize = Math.max(8, currentSize + change);

      // 2. Use execCommand to wrap selection.
      // We use the 'fontSize' command with value '7' (largest) as a temporary marker.
      // This is the most reliable way to handle selections that span multiple nodes/tags.
      // styleWithCSS: false ensures it creates <font size="7"> tags.
      document.execCommand('styleWithCSS', false, 'false');
      document.execCommand('fontSize', false, '7');

      // 3. Find the markers and apply specific pixel size
      const markers = editorRef.current?.querySelectorAll('font[size="7"]');
      markers?.forEach(el => {
          el.removeAttribute('size');
          // el is an HTMLElement, but TS might see Element
          (el as HTMLElement).style.fontSize = `${newSize}px`;
          // Optional: Convert font tag to span for cleaner DOM, though visually identical
          // We keep it simple here to ensure stability
      });

      handleEditorInput(); 
    }
  };

  // --- 3. CORE GENERATION LOGIC ---

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'topic' && !topicInput.trim()) return;
    if (mode === 'text' && !textInput.trim()) return;

    setStatus(GenerationStatus.GENERATING_CHAPTER);
    
    try {
      let result = "";
      if (mode === 'topic') {
        result = await generateTopicContent(topicInput, language);
      } else {
        result = await generateFormattedNotes(textInput, language);
      }

      if (isResettingRef.current) return;

      setGeneratedHtml(result);
      pushToHistory(result);
      localStorage.setItem(STORAGE_KEY, result); 
      
      // On mobile, auto-close sidebar after generation for better UX
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

  const handleClearCanvas = () => {
    if(!confirm("Are you sure you want to clear the editor?")) return;
    isResettingRef.current = true;
    setGeneratedHtml(null);
    setHistory([]);
    setHistoryIndex(-1);
    setIsEditing(false);
    activeEditIdRef.current = null;
    selectionRangeRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
    setTimeout(() => { isResettingRef.current = false; }, 100);
  };

  // --- 4. REWRITE & EDIT LOGIC ---
  // (Helper for edit buttons)
  const getSectionNodes = (startNode: Element): Element[] => {
    const nodes: Element[] = [startNode];
    const tagName = startNode.tagName;
    const getLevel = (tag: string) => {
      const t = tag.toUpperCase();
      if (t === 'H1') return 1;
      if (t === 'H2') return 2;
      if (t === 'H3') return 3;
      if (t === 'H4') return 4;
      return 10; 
    };
    const currentLevel = getLevel(tagName);
    if (currentLevel <= 4) {
      let nextSibling = startNode.nextElementSibling;
      while (nextSibling) {
        const nextTag = nextSibling.tagName;
        const nextLevel = getLevel(nextTag);
        if (nextLevel <= currentLevel) break;
        nodes.push(nextSibling);
        nextSibling = nextSibling.nextElementSibling;
      }
    } 
    return nodes;
  };

  useEffect(() => {
    if (!editorRef.current) return;
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
      // Cleanup empty captions created for buttons
      editorRef.current.querySelectorAll('caption').forEach(cap => {
          if (cap.innerHTML.trim() === '') cap.remove();
      });
    }
  }, [isEditing, generatedHtml]);

  useEffect(() => {
    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('ai-edit-trigger')) {
        e.preventDefault();
        e.stopPropagation();
        let parentEl = target.parentElement;
        // Fix for Table Caption
        if (parentEl?.tagName === 'CAPTION') {
            parentEl = parentEl.parentElement;
        }
        if (parentEl) handleSectionEdit(parentEl);
      }
    };
    const editor = editorRef.current;
    if (editor) editor.addEventListener('click', handleEditorClick);
    return () => { if (editor) editor.removeEventListener('click', handleEditorClick); };
  }, [isEditing]);

  const handleSectionEdit = (startNode: Element) => {
    if (!editorRef.current) return;
    const currentRaw = getCurrentHtml();
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
        if(trigger) trigger.remove();
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
    setIsRewriting(true);
    try {
      const rawBefore = getCurrentHtml();
      pushToHistory(rawBefore);
      let resultHtml = "";

      if (rewriteType === 'section') {
         if (editTab === 'rewrite') resultHtml = await rewriteSection(activeSectionHtml, rewriteInstruction);
         else if (editTab === 'expand') resultHtml = await expandSection(activeSectionHtml, rewriteInstruction);
         else if (editTab === 'continue') resultHtml = await generateNextContent(activeSectionHtml, rewriteInstruction);
         else if (editTab === 'next_topic') resultHtml = await generateDetailedNextTopic(activeSectionHtml, rewriteInstruction);
         else if (editTab === 'image') {
             const imgHtml = await generateSectionImage(activeSectionHtml, rewriteInstruction);
             resultHtml = activeSectionHtml + imgHtml;
         } else if (editTab === 'table') {
             resultHtml = await generateComplexTable(activeSectionHtml, rewriteInstruction);
         }
      } else {
         const selectedText = selectionRangeRef.current?.toString() || "";
         if (editTab === 'rewrite') resultHtml = await rewriteContent(selectedText, rewriteInstruction);
         else if (editTab === 'expand') resultHtml = await expandSection(selectedText, rewriteInstruction);
         else if (editTab === 'continue') {
             const nextContent = await generateNextContent(selectedText, rewriteInstruction);
             resultHtml = selectedText + " " + nextContent;
         } else if (editTab === 'next_topic') {
             const nextContent = await generateDetailedNextTopic(selectedText, rewriteInstruction);
             resultHtml = selectedText + " " + nextContent;
         } else if (editTab === 'image') {
             const imgHtml = await generateSectionImage(selectedText, rewriteInstruction);
             // For selection, we append the image after the text
             resultHtml = selectedText + "<br/>" + imgHtml;
         } else if (editTab === 'table') {
             resultHtml = await generateComplexTable(selectedText, rewriteInstruction);
         }
      }

      if (isResettingRef.current) return;
      if (!resultHtml) throw new Error("No content generated");

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

         if (editTab === 'continue' || editTab === 'next_topic') {
            if (lastNode.nextSibling) parent.insertBefore(fragment, lastNode.nextSibling);
            else parent.appendChild(fragment);
            startNode.removeAttribute('data-edit-id');
         } else {
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
      setRewriteModalOpen(false);
      if (editorRef.current) {
        const rawContent = getCurrentHtml();
        setGeneratedHtml(rawContent);
        pushToHistory(rawContent);
        saveToStorage();
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

  // --- 5. PDF EXPORT ---
  const handleExportPDF = () => {
    if (!generatedHtml) return;
    const contentToPrint = isEditing && editorRef.current ? getCleanHtml() : generatedHtml;
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert("Enable pop-ups."); return; }
    
    // Pass the current fontSize to the print window or keep default 12pt for formal print
    const printFontSize = fontSize < 10 ? 10 : fontSize;

    const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Export Notes</title>
          <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
              @page { size: A4; margin: 15mm; }
              body { font-family: 'Inter', sans-serif; font-size: ${printFontSize}pt; line-height: 1.5; color: #1e293b; background: white; margin: 0; padding: 0; }
              h1 { font-family: 'Inter', sans-serif; font-size: 2.25em; font-weight: 800; color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 8px; margin-top: 0; margin-bottom: 16px; page-break-after: avoid; }
              h2 { font-family: 'Inter', sans-serif; font-size: 1.75em; font-weight: 700; color: #1e3a8a; margin-top: 24px; margin-bottom: 12px; page-break-after: avoid; border-bottom: 1px solid #e2e8f0; }
              h3 { font-family: 'Inter', sans-serif; font-size: 1.4em; font-weight: 600; color: #334155; margin-top: 18px; margin-bottom: 8px; page-break-after: avoid; }
              p { margin-bottom: 12px; text-align: justify; }
              ul, ol { margin-bottom: 12px; padding-left: 24px; }
              li { margin-bottom: 6px; }
              strong { color: #0f172a; font-weight: 700; }
              .key-point { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 20px 0; font-family: 'Inter', sans-serif; font-size: 0.95em; page-break-inside: avoid; }
              
              /* FORCE BLACK BORDERS ON PRINT */
              table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #000 !important; page-break-inside: avoid; font-size: 0.9em; }
              th { background-color: #1e293b !important; color: white !important; padding: 8px; font-weight: 600; text-align: left; font-family: 'Inter', sans-serif; border: 1px solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              td { border: 1px solid #000 !important; padding: 8px; vertical-align: top; }
              tr:nth-child(even) { background-color: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              
              .flowchart-container { display: flex; justify-content: center; margin: 24px 0; padding: 10px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
              svg { max-width: 100%; height: auto; }

              /* IMAGE PRINT STYLES */
              figure { margin: 20px 0; text-align: center; page-break-inside: avoid; }
              img { max-width: 100%; height: auto; border: 1px solid #ccc; }
              figcaption { font-size: 0.9em; color: #666; font-style: italic; margin-top: 5px; }

              @media print {
                  body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .no-print { display: none; }
                  h1, h2, h3 { page-break-after: avoid; }
                  table, .flowchart-container, .key-point, figure, img { page-break-inside: avoid; }
                  p, li { orphans: 3; widows: 3; }
              }
          </style>
      </head>
      <body>
          ${contentToPrint}
          <script>
              window.onload = function() { setTimeout(function() { window.print(); }, 800); }
          </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setGeneratedHtml(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setGeneratedHtml(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden dot-pattern">
      
      {/* --- SIDEBAR (INPUT) --- */}
      <aside 
        className={`${sidebarOpen ? 'w-full md:w-[400px]' : 'w-0'} 
          fixed md:relative z-40 h-full bg-[#0f172a] text-white transition-all duration-300 ease-in-out flex flex-col border-r border-gray-800 shadow-2xl overflow-hidden`}
      >
        <div className="w-full md:w-[400px] flex flex-col h-full min-w-[400px]"> 
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#0f172a]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/50">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">Made by Professor UPSC</h1>
                        <p className="text-xs text-slate-400 font-medium">Professional Edition</p>
                    </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <PanelLeftClose className="w-5 h-5"/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                {/* TABS */}
                <div className="flex bg-slate-900/50 p-1.5 rounded-xl mb-8 border border-slate-800">
                    <button 
                    onClick={() => setMode('topic')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'topic' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <Sparkles className="w-4 h-4" /> Topic
                    </button>
                    <button 
                    onClick={() => setMode('text')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <FileText className="w-4 h-4" /> Text
                    </button>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                    {mode === 'topic' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Book Topic</label>
                        <input 
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="e.g. History of India..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                        />
                    </div>
                    ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Content</label>
                        <textarea 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste your notes here..."
                            className="w-full h-48 bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-inner leading-relaxed"
                        />
                    </div>
                    )}

                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
                        <div className="relative">
                            <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-slate-800 transition-colors"
                            >
                                <option value="Hindi">Hindi (हिन्दी)</option>
                                <option value="English">English</option>
                                <option value="Hinglish">Hinglish</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    <Button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transform transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2 group"
                    isLoading={status === GenerationStatus.GENERATING_CHAPTER}
                    >
                        {status === GenerationStatus.GENERATING_CHAPTER ? (
                             'Generating...'
                        ) : (
                            <>
                              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                              {mode === 'topic' ? 'Generate Magic Chapter' : 'Format Notes Perfectly'}
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-800">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleClearCanvas} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-900 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-slate-800 hover:border-red-500/30 text-sm font-medium group">
                        <Eraser className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Clear
                    </button>
                    <button onClick={() => setGeneratedHtml(history[historyIndex - 1])} disabled={historyIndex <= 0} className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all border border-slate-800 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
                        <Undo className="w-4 h-4" /> Undo
                    </button>
                    </div>
                </div>
            </div>
            
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-600 text-center uppercase tracking-widest font-semibold">
                AI Powered • v2.1 Pro
            </div>
        </div>
      </aside>

      {/* --- MAIN AREA (EDITOR) --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300">
         
         {/* TOP TOOLBAR - Floating Style */}
         <div className="absolute top-4 left-6 right-6 h-16 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl flex items-center justify-between px-6 shadow-sm z-30 transition-all">
             <div className="flex items-center gap-4">
                 {!sidebarOpen && (
                    <button 
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors group"
                    title="Open Sidebar"
                    >
                        <PanelLeft className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    </button>
                 )}
                 <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100/80 rounded-lg p-1 border border-gray-200">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 transition-all"><Undo className="w-4 h-4"/></button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 disabled:opacity-30 transition-all"><Redo className="w-4 h-4"/></button>
                    </div>
                    
                    {/* FONT SIZE CONTROLS */}
                    <div className="flex items-center gap-1 bg-gray-100/80 rounded-lg p-1 border border-gray-200 ml-2">
                        <button onClick={handleZoomOut} className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all" title="Decrease Font Size">
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold w-6 text-center text-gray-600 select-none">{fontSize}</span>
                        <button onClick={handleZoomIn} className="p-2 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all" title="Increase Font Size">
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                 </div>
             </div>

             <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex gap-2 animate-in fade-in zoom-in duration-200">
                     <Button variant="ghost" onClick={openSelectionRewriteModal} className="text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100 shadow-sm">
                        <Wand2 className="w-4 h-4 mr-2" /> Rewrite
                     </Button>
                     <Button variant="primary" onClick={() => { setIsEditing(false); saveToStorage(); }} className="bg-emerald-600 hover:bg-emerald-700 border-emerald-500 shadow-emerald-500/20">
                        <Check className="w-4 h-4 mr-2" /> Done
                     </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setIsEditing(true)} className="bg-white border-gray-200 shadow-sm hover:border-gray-300">
                    <PenTool className="w-4 h-4 mr-2 text-gray-500" /> Edit
                  </Button>
                )}
                
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                
                <Button variant="primary" onClick={handleExportPDF} className="shadow-blue-500/20">
                   <Printer className="w-4 h-4 mr-2" /> Export PDF
                </Button>
             </div>
         </div>

         {/* CANVAS AREA */}
         <div className="flex-1 overflow-y-auto pt-28 pb-12 px-4 md:px-8 flex justify-center relative scrollbar-thin scrollbar-track-transparent">
             {status !== GenerationStatus.IDLE && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-gray-100">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Content</h3>
                        <p className="text-gray-500 animate-pulse">Analyzing topic • Structuring • Writing...</p>
                    </div>
                </div>
             )}

             <div className={`w-full max-w-[210mm] transition-all duration-700 ease-out ${!generatedHtml && status === GenerationStatus.IDLE ? 'opacity-100' : 'opacity-100'}`}>
                 <div 
                    className={`editor-container a4-page editor-content bg-white min-h-[297mm] transition-all duration-300 ${isEditing ? 'ring-4 ring-blue-500/10' : ''}`}
                    style={{ fontSize: `${fontSize}pt` }} 
                 >
                    {!generatedHtml && status === GenerationStatus.IDLE ? (
                        <div className="h-[250mm] flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                            <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-blue-100 flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
                                <BookOpen className="w-10 h-10 text-blue-600 ml-1" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Your Empty Canvas</h2>
                            <p className="text-lg text-slate-500 max-w-md mb-8 leading-relaxed">
                                Use the sidebar to generate a comprehensive study guide, or paste your rough notes to format them instantly.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md opacity-70">
                                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                                    <Sparkles className="w-6 h-6 text-amber-400 mb-2" />
                                    <span className="text-sm font-semibold text-slate-700">AI Powered</span>
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                                    <Download className="w-6 h-6 text-green-500 mb-2" />
                                    <span className="text-sm font-semibold text-slate-700">PDF Ready</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className={`min-h-[267mm] outline-none ${isEditing ? 'cursor-text' : ''}`}
                            contentEditable={isEditing}
                            suppressContentEditableWarning={true}
                            ref={editorRef}
                            onInput={handleEditorInput}
                            onBlur={handleEditorBlur}
                            onKeyDown={handleEditorKeyDown}
                        />
                    )}
                 </div>
                 <div className="h-12 flex items-center justify-center mt-4 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">End of Document</span>
                 </div>
             </div>
         </div>

      </main>

      {/* --- REWRITE MODAL --- */}
      {rewriteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-slate-50 p-5 border-b border-gray-200 flex items-center justify-between">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    {rewriteType === 'section' ? <div className="p-1.5 bg-blue-100 rounded-lg"><Sparkles className="w-5 h-5 text-blue-600"/></div> : <div className="p-1.5 bg-purple-100 rounded-lg"><Wand2 className="w-5 h-5 text-purple-600"/></div>}
                    {rewriteType === 'section' ? 'Magic AI Editor' : 'Rewrite Selection'}
                 </h3>
                 <button onClick={() => setRewriteModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
              </div>

              <div className="p-6">
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                    {(['rewrite', 'expand', 'continue', 'next_topic', 'image', 'table'] as const).map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setEditTab(tab)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${editTab === tab ? 'bg-white shadow-md text-blue-600 transform scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'expand' ? 'Deep Dive' : tab === 'continue' ? 'Continue' : tab === 'next_topic' ? 'Next Topic' : tab === 'image' ? 'Image' : tab === 'table' ? 'Table' : 'Refine'}
                        </button>
                    ))}
                </div>
                
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Context</span>
                         <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Preview</span>
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-32 overflow-y-auto italic leading-relaxed">
                        "{rewriteType === 'section' ? "Selected Section Context..." : selectionRangeRef.current?.toString().substring(0, 150) + "..."}"
                    </div>
                </div>

                <form onSubmit={handleRewriteSubmit}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
                    <input 
                    type="text" 
                    value={rewriteInstruction}
                    onChange={(e) => setRewriteInstruction(e.target.value)}
                    placeholder={
                        editTab === 'expand' ? "e.g. Add 3 examples and a comparison table..." : 
                        editTab === 'image' ? "e.g. A detailed diagram of a cell structure..." :
                        editTab === 'next_topic' ? "e.g. The impact of economic reforms..." :
                        editTab === 'table' ? "e.g. Compare features of X and Y..." :
                        "e.g. Make it more professional..."
                    }
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-8 outline-none bg-white text-gray-900 transition-shadow shadow-sm"
                    autoFocus
                    />
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={() => setRewriteModalOpen(false)} disabled={isRewriting} className="border-gray-300">Cancel</Button>
                        <Button 
                            type="submit" 
                            isLoading={isRewriting} 
                            className={`text-white shadow-lg ${
                                editTab === 'expand' ? 'bg-blue-600 hover:bg-blue-700' : 
                                editTab === 'continue' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                                editTab === 'next_topic' ? 'bg-orange-600 hover:bg-orange-700' :
                                editTab === 'image' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                editTab === 'table' ? 'bg-teal-600 hover:bg-teal-700' :
                                'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            {
                                editTab === 'expand' ? 'Expand Content' : 
                                editTab === 'continue' ? 'Generate Next' : 
                                editTab === 'next_topic' ? 'Generate Detailed Notes' :
                                editTab === 'image' ? 'Create Illustration' :
                                editTab === 'table' ? 'Create Matrix' :
                                'Apply Changes'
                            }
                        </Button>
                    </div>
                </form>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;