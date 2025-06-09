import { useState, useEffect } from "react";
import { 
  MODEL_SIZE_NAMES 
} from "@/components/ChatBox/utils/modelSelection";
import {
  getPreferredModelSize,
  setPreferredModelSize,
  clearModelPreference,
  ModelSizeKey
} from "@/components/ChatBox/utils/modelPreferences";

interface ModelSelectorProps {
  onClose?: () => void;
}

export default function ModelSelector({ onClose }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<ModelSizeKey | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Load the current model preference when component mounts
    const currentPreference = getPreferredModelSize();
    if (currentPreference) {
      setSelectedModel(currentPreference);
    }
  }, []);

  const handleModelChange = (modelSize: ModelSizeKey) => {
    setSelectedModel(modelSize);
    setPreferredModelSize(modelSize);
  };

  const handleResetPreference = () => {
    clearModelPreference();
    setSelectedModel(null);
  };

  const allowedModels: ModelSizeKey[] = ['MEDIUM', 'SMALL'];

  if (!showSettings) {
    return (
      <button 
        onClick={() => setShowSettings(true)}
        className="text-xs bg-black hover:bg-gray-800 text-white py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Model Settings ⚙️
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-black p-4 rounded-lg w-full max-w-md mx-auto shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-base font-medium text-white">Model Size Selection</h4>
          <button 
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white text-xl bg-transparent hover:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-300 mb-2">
            Select a model based on your device&apos;s capabilities:
          </p>
          
          <div className="flex flex-col space-y-3">
            {allowedModels.map((key) => (
              <label 
                key={key} 
                className="flex items-center cursor-pointer text-sm text-gray-200 hover:text-white"
              >
                <input
                  type="radio"
                  name="modelSize"
                  checked={selectedModel === key}
                  onChange={() => handleModelChange(key)}
                  className="mr-3 h-4 w-4"
                />
                {MODEL_SIZE_NAMES[key]}
              </label>
            ))}
          </div>
        </div>
      
        <div className="border-t border-gray-700 pt-3">
          <p className="text-sm text-gray-400 mb-3">
            ℹ️ {selectedModel ? 
              `Using ${MODEL_SIZE_NAMES[selectedModel]} model (manually selected)` : 
              'Using auto-detected model size'}
          </p>
          
          <div className="flex justify-end mt-3 space-x-3">
            <button
              onClick={handleResetPreference}
              className="py-2 px-4 bg-black hover:bg-gray-800 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
            >
              Reset to Auto
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                if (onClose) onClose();
              }}
              className="py-2 px-4 bg-black hover:bg-gray-800 text-white text-sm rounded focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
            >
              Done
            </button>
          </div>
          <p className="mt-4 text-sm text-yellow-500">
            Note: Changes will take effect on next page load
          </p>
        </div>
      </div>
    </div>
  );
}
