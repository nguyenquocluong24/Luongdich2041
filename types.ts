export interface SubtitleItem {
  id: number;
  startTime: string; // 00:00:01,000
  endTime: string;   // 00:00:03,500
  original: string;
  translated: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  apiUsed?: string;
}

export enum APIType {
  GEMINI = 'GEMINI',
  DEEPL = 'DEEPL', // Mock support for UI demonstration
  MICROSOFT = 'MICROSOFT' // Mock support
}

export interface APIConfig {
  id: string;
  type: APIType;
  name: string;
  apiKey: string;
  isEnabled: boolean;
  status: 'idle' | 'working' | 'error' | 'rate_limited';
  errorMessage?: string;
}

export enum TranslationDomain {
  GENERAL = 'General',
  XIANXIA = 'Xianxia/Wuxia (Tu Tiên/Kiếm Hiệp)',
  TECHNICAL = 'Technical/Academic',
  MODERN = 'Modern Life',
  MOVIE = 'Movie/Drama'
}

export interface GlobalConfig {
  sourceLang: string;
  targetLang: string;
  batchSize: number;
  domain: TranslationDomain;
  customContext: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  source?: string;
}

export interface ProcessingStats {
  totalLines: number;
  completedLines: number;
  failedLines: number;
  startTime: number | null;
  endTime: number | null;
}