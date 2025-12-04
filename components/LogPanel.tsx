import React, { useEffect, useRef } from 'react';
import { LogEntry, ProcessingStats } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  stats: ProcessingStats;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, stats }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const percentage = stats.totalLines > 0 
    ? Math.round(((stats.completedLines + stats.failedLines) / stats.totalLines) * 100) 
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden flex flex-col h-[300px]">
      {/* Progress Header */}
      <div className="bg-gray-750 p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
           <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Processing Status</h3>
           <span className="text-teal-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
           <span>Total: {stats.totalLines} lines</span>
           <span className="text-green-400">Done: {stats.completedLines}</span>
           <span className={stats.failedLines > 0 ? "text-red-400" : ""}>Failed: {stats.failedLines}</span>
        </div>
      </div>

      {/* Detailed Logs */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-xs scrollbar-thin"
      >
        {logs.length === 0 && <p className="text-gray-600 italic">Waiting to start...</p>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2">
             <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
             {log.source && <span className="text-blue-400 w-24 shrink-0 truncate">[{log.source}]</span>}
             <span className={`break-words ${
               log.type === 'error' ? 'text-red-400' : 
               log.type === 'success' ? 'text-green-400' : 
               log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
             }`}>
               {log.message}
             </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogPanel;