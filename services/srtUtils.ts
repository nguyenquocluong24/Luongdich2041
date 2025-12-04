import { SubtitleItem } from '../types';

export const parseSRT = (content: string): SubtitleItem[] => {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Split by double newlines to separate blocks
  const blocks = normalized.split(/\n\n+/);
  
  const items: SubtitleItem[] = [];
  
  // Regex to parse a standard SRT block:
  // 1
  // 00:00:01,000 --> 00:00:04,000
  // Text content...
  const srtRegex = /^(\d+)\n(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})\n([\s\S]*)$/;

  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    const match = trimmed.match(srtRegex);
    if (match) {
      items.push({
        id: parseInt(match[1], 10),
        startTime: match[2],
        endTime: match[3],
        original: match[4].trim(), // Keep parsed text
        translated: '',
        status: 'pending'
      });
    } else {
        // Fallback for messy SRTs or just parse text lines if it fails strict regex
        // This is a simplified fallback
        const lines = trimmed.split('\n');
        if (lines.length >= 3) {
             const id = parseInt(lines[0], 10);
             const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
             if (timeMatch && !isNaN(id)) {
                 items.push({
                    id,
                    startTime: timeMatch[1],
                    endTime: timeMatch[2],
                    original: lines.slice(2).join('\n'),
                    translated: '',
                    status: 'pending'
                 });
             }
        }
    }
  });

  return items;
};

export const generateSRT = (items: SubtitleItem[]): string => {
  return items.map(item => {
    const text = item.translated.trim() || item.original.trim(); // Fallback to original if no translation
    return `${item.id}\n${item.startTime} --> ${item.endTime}\n${text}\n`;
  }).join('\n');
};

export const downloadFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};