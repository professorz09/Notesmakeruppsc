export interface BookMetadata {
  title: string;
  author?: string;
  chapters: ChapterOutline[];
}

export interface ChapterOutline {
  id: string;
  title: string;
  description: string;
}

export interface ChapterContent {
  id: string;
  htmlContent: string;
  isGenerated: boolean;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  GENERATING_CHAPTER = 'GENERATING_CHAPTER',
  ERROR = 'ERROR',
}

export type Mode = 'topic' | 'text' | 'file';
export type OutputFormat = 'detailed-notes' | 'table-only' | 'compact-timeline' | 'incremental-table' | 'structured-notes' | 'png-table' | 'upsc-answer';
export type EditTab = 'rewrite' | 'expand' | 'continue' | 'next_topic' | 'diagram' | 'table';
export type RewriteType = 'selection' | 'section';
export type AIModel = 'gemini-3-flash' | 'gemini-3-pro';
export type UPSCSubject = string; // Allow any custom subject name
export type UPSCWordLimit = 'none' | '150' | '250' | '500';
export type UPSCAnswerType = 'standard' | 'analytical' | 'descriptive' | 'critical';
