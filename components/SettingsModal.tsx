import React, { useState } from 'react';
import type { LLMSettings } from '../types';

interface SettingsModalProps {
  currentSettings: LLMSettings;
  onSave: (settings: LLMSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [settings, setSettings] = useState<LLMSettings>(currentSettings);

  const handleSave = () => {
    onSave(settings);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        aria-labelledby="settings-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6 m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-xl font-bold text-white mb-4">
          Local LLM Settings
        </h2>
        
        <p className="text-sm text-gray-400 mb-6">
          Configure the connection to your local LLM server (e.g., Ollama, LMStudio).
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-300 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              id="endpoint"
              name="endpoint"
              value={settings.endpoint}
              onChange={handleChange}
              placeholder="http://localhost:11434/api/generate"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
              Model Name
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={settings.model}
              onChange={handleChange}
              placeholder="llama3"
              className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
            />
             <p className="text-xs text-gray-500 mt-1">E.g., 'llama3', 'mistral', 'codellama'</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
