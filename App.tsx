import React, { useState, useEffect, useCallback, useRef } from 'react';
import SetupPanel from './components/SetupPanel';
import LogPanel from './components/LogPanel';
import SubtitleTable from './components/SubtitleTable';
import { SubtitleItem, GlobalConfig, APIConfig, APIType, TranslationDomain, LogEntry, ProcessingStats } from './types';
import { parseSRT, generateSRT, downloadFile } from './services/srtUtils';
import { GeminiTranslator } from './services/geminiService';
import { PlayIcon, ArrowDownTrayIcon, StopIcon } from '@heroicons/react/24/solid';

const App: React.FC = () => {
  // State
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [filename, setFilename] = useState<string>('translated.srt');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apis, setApis] = useState<APIConfig[]>([
    { id: '1', type: APIType.GEMINI, name: 'Primary Gemini', apiKey: '', isEnabled: true, status: 'idle' }
  ]);
  const [config, setConfig] = useState<GlobalConfig>({
    sourceLang: 'English',
    targetLang: 'Vietnamese',
    batchSize: 10,
    domain: TranslationDomain.GENERAL,
    customContext: ''
  });
  const [stats, setStats] = useState<ProcessingStats>({
    totalLines: 0,
    completedLines: 0,
    failedLines: 0,
    startTime: null,
    endTime: null
  });

  // Refs for async control
  const stopSignalRef = useRef<boolean>(false);
  const subtitlesRef = useRef<SubtitleItem[]>([]); // Ref to access latest state in async loop
  
  // Keep ref in sync
  useEffect(() => {
    subtitlesRef.current = subtitles;
  }, [subtitles]);

  // Logger helper
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info', source?: string) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type,
      source
    };
    setLogs(prev => [...prev, entry]);
  }, []);

  // File Upload Handler
  const handleFileUpload = (content: string, name: string) => {
    try {
      const items = parseSRT(content);
      setSubtitles(items);
      setFilename(name);
      setStats({
        totalLines: items.length,
        completedLines: 0,
        failedLines: 0,
        startTime: null,
        endTime: null
      });
      addLog(`Loaded ${items.length} lines from ${name}`, 'success');
    } catch (e) {
      addLog(`Failed to parse file: ${(e as Error).message}`, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // Core Logic: Multithreaded Processing
  // --------------------------------------------------------------------------

  const processBatch = async (
    batchItems: SubtitleItem[], 
    api: APIConfig
  ): Promise<{ success: boolean; translatedText?: string[]; error?: any }> => {
    
    // Simulate delay for mock APIs
    if (api.type !== APIType.GEMINI) {
      await new Promise(r => setTimeout(r, 2000));
      return { 
        success: true, 
        translatedText: batchItems.map(item => `[MOCK ${api.type}] ${item.original}`) 
      };
    }

    // Real Gemini Call
    if (!api.apiKey) return { success: false, error: "Missing API Key" };
    
    try {
      const translator = new GeminiTranslator(api.apiKey);
      const originals = batchItems.map(item => item.original);
      const translated = await translator.translateBatch(
        originals,
        config.sourceLang,
        config.targetLang,
        config.domain,
        config.customContext
      );
      return { success: true, translatedText: translated };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const startTranslation = async () => {
    const activeApis = apis.filter(a => a.isEnabled && a.apiKey.trim() !== '' || a.type !== APIType.GEMINI);
    
    if (activeApis.length === 0) {
      addLog("No active APIs configured or missing keys!", 'error');
      return;
    }
    
    if (subtitles.length === 0) {
      addLog("No subtitles loaded.", 'warning');
      return;
    }

    setIsProcessing(true);
    stopSignalRef.current = false;
    setStats(prev => ({ ...prev, startTime: Date.now(), failedLines: 0, completedLines: 0 }));
    addLog("Starting translation process...", 'info');

    // 1. Queue creation: Group pending items into batches
    const pendingItems = subtitles.filter(item => item.status === 'pending');
    const batches: SubtitleItem[][] = [];
    
    for (let i = 0; i < pendingItems.length; i += config.batchSize) {
      batches.push(pendingItems.slice(i, i + config.batchSize));
    }

    addLog(`Created ${batches.length} batches. Using ${activeApis.length} worker threads.`, 'info');

    // 2. Shared Queue Index
    let currentBatchIndex = 0;

    // 3. Worker Function
    const worker = async (apiIndex: number) => {
      const api = activeApis[apiIndex];
      const apiId = api.id;
      const apiName = api.name || `API ${apiIndex + 1}`;

      while (currentBatchIndex < batches.length && !stopSignalRef.current) {
        // Atomic-like retrieval of batch
        const batchIdx = currentBatchIndex++; 
        const batch = batches[batchIdx];

        if (!batch) break;

        // Update UI: Mark batch as processing
        const itemIds = batch.map(i => i.id);
        setSubtitles(prev => prev.map(item => 
          itemIds.includes(item.id) ? { ...item, status: 'processing', apiUsed: apiName } : item
        ));
        
        setApis(prev => prev.map(a => a.id === apiId ? { ...a, status: 'working' } : a));

        const startT = Date.now();
        const result = await processBatch(batch, api);
        const duration = ((Date.now() - startT) / 1000).toFixed(1);

        if (result.success && result.translatedText) {
          // Success
          addLog(`Batch ${batchIdx + 1} done (${duration}s)`, 'success', apiName);
          
          setSubtitles(prev => prev.map(item => {
            if (!itemIds.includes(item.id)) return item;
            const idxInBatch = batch.findIndex(b => b.id === item.id);
            return {
              ...item,
              status: 'completed',
              translated: result.translatedText![idxInBatch] || '',
            };
          }));

          setStats(prev => ({ ...prev, completedLines: prev.completedLines + batch.length }));

        } else {
          // Failure
          addLog(`Batch ${batchIdx + 1} failed: ${result.error}`, 'error', apiName);
          
          // Mark as error (or ideally, put back in queue for another worker, but simpler here)
          setSubtitles(prev => prev.map(item => 
            itemIds.includes(item.id) ? { ...item, status: 'error' } : item
          ));
          setStats(prev => ({ ...prev, failedLines: prev.failedLines + batch.length }));

          // Simple Backoff if error
          setApis(prev => prev.map(a => a.id === apiId ? { ...a, status: 'error' } : a));
          await new Promise(r => setTimeout(r, 5000)); // Cool down
        }
      }

      setApis(prev => prev.map(a => a.id === apiId ? { ...a, status: 'idle' } : a));
    };

    // 4. Start all workers
    await Promise.all(activeApis.map((_, idx) => worker(idx)));

    setIsProcessing(false);
    setStats(prev => ({ ...prev, endTime: Date.now() }));
    addLog("Translation process finished.", 'info');
  };

  const stopTranslation = () => {
    stopSignalRef.current = true;
    addLog("Stopping process...", 'warning');
  };

  const handleDownload = () => {
    const content = generateSRT(subtitles);
    downloadFile(`translated_${filename}`, content);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
              Polyglot Subtitle Translator
            </h1>
            <p className="text-gray-400 mt-1">AI-Powered Multi-threaded SRT Translation Studio</p>
          </div>
          <div className="flex space-x-3">
             {isProcessing ? (
                <button 
                  onClick={stopTranslation}
                  className="flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition transform active:scale-95"
                >
                  <StopIcon className="w-5 h-5 mr-2" /> Stop
                </button>
             ) : (
                <button 
                  onClick={startTranslation}
                  disabled={subtitles.length === 0}
                  className="flex items-center bg-teal-600 hover:bg-teal-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="w-5 h-5 mr-2" /> Start Translation
                </button>
             )}
             <button 
                onClick={handleDownload}
                disabled={subtitles.length === 0}
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
             >
               <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Export SRT
             </button>
          </div>
        </div>

        {/* Setup Section */}
        <SetupPanel 
           config={config} 
           setConfig={setConfig} 
           apis={apis} 
           setApis={setApis} 
           onFileUpload={handleFileUpload}
           isProcessing={isProcessing}
        />

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Table (Takes 2 columns) */}
           <div className="lg:col-span-2 space-y-2">
              <h3 className="font-semibold text-gray-300">Preview & Results</h3>
              <SubtitleTable items={subtitles} />
           </div>

           {/* Logs (Takes 1 column) */}
           <div className="space-y-2">
              <h3 className="font-semibold text-gray-300">Live Process Logs</h3>
              <LogPanel logs={logs} stats={stats} />
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;