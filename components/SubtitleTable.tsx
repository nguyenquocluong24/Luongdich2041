import React from 'react';
import { SubtitleItem } from '../types';

interface SubtitleTableProps {
  items: SubtitleItem[];
}

const SubtitleTable: React.FC<SubtitleTableProps> = ({ items }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden flex flex-col h-[600px]">
      <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-900 text-gray-400 sticky top-0 z-10 shadow-md">
            <tr>
              <th className="px-4 py-3 font-medium w-16">#</th>
              <th className="px-4 py-3 font-medium w-32">Time</th>
              <th className="px-4 py-3 font-medium">Original</th>
              <th className="px-4 py-3 font-medium">Translation</th>
              <th className="px-4 py-3 font-medium w-24">API</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-2 text-gray-500 font-mono">{item.id}</td>
                <td className="px-4 py-2 text-teal-500 font-mono text-xs">
                  <div>{item.startTime}</div>
                  <div className="opacity-50">{item.endTime}</div>
                </td>
                <td className="px-4 py-2 text-gray-300 whitespace-pre-wrap min-w-[200px] max-w-md">{item.original}</td>
                <td className={`px-4 py-2 whitespace-pre-wrap min-w-[200px] max-w-md ${item.translated ? 'text-white' : 'text-gray-600 italic'}`}>
                  {item.status === 'processing' ? (
                     <span className="animate-pulse text-teal-500">Translating...</span>
                  ) : item.status === 'error' ? (
                     <span className="text-red-500">Failed to translate</span>
                  ) : item.translated || '(Pending)'}
                </td>
                <td className="px-4 py-2">
                   {item.apiUsed && (
                       <span className="inline-block px-2 py-1 rounded text-[10px] bg-blue-900/50 text-blue-200 border border-blue-800">
                           {item.apiUsed}
                       </span>
                   )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Upload a file to see subtitles here.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubtitleTable;