import React, { useRef } from 'react';
import { APIConfig, APIType, GlobalConfig, TranslationDomain } from '../types';
import { PlusIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface SetupPanelProps {
  config: GlobalConfig;
  setConfig: React.Dispatch<React.SetStateAction<GlobalConfig>>;
  apis: APIConfig[];
  setApis: React.Dispatch<React.SetStateAction<APIConfig[]>>;
  onFileUpload: (content: string, filename: string) => void;
  isProcessing: boolean;
}

const SetupPanel: React.FC<SetupPanelProps> = ({
  config,
  setConfig,
  apis,
  setApis,
  onFileUpload,
  isProcessing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      onFileUpload(text, file.name);
    };
    reader.readAsText(file);
  };

  const addApi = () => {
    const newApi: APIConfig = {
      id: Date.now().toString(),
      type: APIType.GEMINI,
      name: `Gemini API ${apis.length + 1}`,
      apiKey: '',
      isEnabled: true,
      status: 'idle'
    };
    setApis([...apis, newApi]);
  };

  const updateApi = (id: string, field: keyof APIConfig, value: any) => {
    setApis(apis.map(api => api.id === id ? { ...api, [field]: value } : api));
  };

  const removeApi = (id: string) => {
    setApis(apis.filter(api => api.id !== id));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: File & General Settings */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-bold text-teal-400 border-b border-gray-700 pb-2">1. Input & Settings</h2>
          
          {/* File Upload */}
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition hover:border-teal-500 hover:bg-gray-700/50 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-gray-300 font-medium">Click to upload .srt or .txt</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".srt,.txt" 
              className="hidden" 
            />
          </div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Source Language</label>
              <select 
                disabled={isProcessing}
                value={config.sourceLang}
                onChange={(e) => setConfig({...config, sourceLang: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="English">English</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Korean">Korean</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Language</label>
              <select 
                disabled={isProcessing}
                value={config.targetLang}
                onChange={(e) => setConfig({...config, targetLang: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="Vietnamese">Vietnamese</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>

          {/* Domain & Batch Size */}
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm text-gray-400 mb-1">Context / Domain</label>
              <select 
                disabled={isProcessing}
                value={config.domain}
                onChange={(e) => setConfig({...config, domain: e.target.value as TranslationDomain})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                {Object.values(TranslationDomain).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Batch Size (Lines)</label>
              <input 
                type="number" 
                min="1" 
                max="50"
                disabled={isProcessing}
                value={config.batchSize}
                onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value) || 10})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
             <label className="block text-sm text-gray-400 mb-1">Custom Prompt / Glossary</label>
             <textarea 
                disabled={isProcessing}
                value={config.customContext}
                onChange={(e) => setConfig({...config, customContext: e.target.value})}
                placeholder="e.g. Translate 'sect' as 'tông môn', keep names in Pinyin..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-teal-500 h-20 text-sm"
             />
          </div>
        </div>

        {/* Right Column: API Management */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <h2 className="text-xl font-bold text-teal-400">2. Translation APIs</h2>
            <button 
              onClick={addApi}
              disabled={isProcessing}
              className="flex items-center text-xs bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded text-white transition disabled:opacity-50"
            >
              <PlusIcon className="w-4 h-4 mr-1" /> Add API
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-2">
            {apis.map((api, index) => (
              <div key={api.id} className="bg-gray-700/50 p-3 rounded border border-gray-600 relative group">
                 <div className="flex justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <select 
                          disabled={isProcessing}
                          value={api.type}
                          onChange={(e) => updateApi(api.id, 'type', e.target.value)}
                          className="bg-gray-800 border border-gray-600 text-xs rounded px-2 py-1 text-white"
                        >
                          <option value={APIType.GEMINI}>Gemini</option>
                          <option value={APIType.DEEPL}>DeepL (Simulated)</option>
                          <option value={APIType.MICROSOFT}>Microsoft (Simulated)</option>
                        </select>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${api.status === 'error' ? 'bg-red-900 text-red-200' : api.status === 'working' ? 'bg-blue-900 text-blue-200' : 'bg-gray-600 text-gray-300'}`}>
                          {api.status}
                        </span>
                    </div>
                    <button 
                      disabled={isProcessing}
                      onClick={() => removeApi(api.id)} 
                      className="text-gray-500 hover:text-red-400 transition"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                 </div>
                 <input 
                    type="password" 
                    placeholder="API Key" 
                    disabled={isProcessing}
                    value={api.apiKey}
                    onChange={(e) => updateApi(api.id, 'apiKey', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-sm rounded px-3 py-2 text-white focus:border-teal-500 focus:outline-none"
                 />
                 <div className="flex items-center mt-2 space-x-2">
                    <input 
                      type="checkbox" 
                      id={`enable-${api.id}`}
                      checked={api.isEnabled}
                      disabled={isProcessing}
                      onChange={(e) => updateApi(api.id, 'isEnabled', e.target.checked)}
                      className="rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-0"
                    />
                    <label htmlFor={`enable-${api.id}`} className="text-xs text-gray-400">Enable this worker</label>
                 </div>
              </div>
            ))}
            {apis.length === 0 && (
              <p className="text-gray-500 text-sm text-center italic py-4">No APIs configured. Add one to start.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPanel;