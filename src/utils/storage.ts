const STORAGE_KEY = 'ai_book_writer_draft';

export const saveToLocalStorage = (content: string): void => {
  if (content) {
    localStorage.setItem(STORAGE_KEY, content);
  }
};

export const loadFromLocalStorage = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const clearLocalStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
