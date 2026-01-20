import { useRef, useCallback } from 'react';

export const useEditor = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isResettingRef = useRef(false);

  const getCurrentHtml = useCallback((generatedHtml: string | null) => {
    return editorRef.current ? editorRef.current.innerHTML : (generatedHtml || '');
  }, []);

  const getCleanHtml = useCallback((generatedHtml: string | null) => {
    if (!editorRef.current) return generatedHtml || '';
    const clone = editorRef.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.ai-edit-trigger').forEach(b => b.remove());
    clone.querySelectorAll('[data-edit-id]').forEach(el => el.removeAttribute('data-edit-id'));
    clone.querySelectorAll('font').forEach(font => {
      const span = document.createElement('span');
      span.innerHTML = font.innerHTML;
      if (font.getAttribute('style')) span.setAttribute('style', font.getAttribute('style')!);
      font.replaceWith(span);
    });
    return clone.innerHTML;
  }, []);

  const getSectionNodes = useCallback((startNode: Element): Element[] => {
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
  }, []);

  return {
    editorRef,
    isResettingRef,
    getCurrentHtml,
    getCleanHtml,
    getSectionNodes,
  };
};
