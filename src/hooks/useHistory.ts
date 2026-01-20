import { useState, useCallback } from 'react';

export const useHistory = (initialContent: string = '') => {
  const [history, setHistory] = useState<string[]>(initialContent ? [initialContent] : []);
  const [historyIndex, setHistoryIndex] = useState(initialContent ? 0 : -1);

  const pushToHistory = useCallback((content: string) => {
    setHistory(prev => {
      if (historyIndex >= 0 && prev[historyIndex] === content) return prev;
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, content];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const resetHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  };
};
