/**
 * Model Store
 * Zustand store for managing model selection and preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelSize } from '@/types';
import { DEFAULT_MODEL_SIZE } from '@/config/models';

interface ModelState {
  // Current model selection
  selectedModel: ModelSize;
  
  // Model that's actually loaded in the worker
  loadedModel: ModelSize | null;
  
  // Flag to show reload prompt when selection changes
  needsReload: boolean;
  
  // Chat reopen flag (replaces localStorage)
  shouldReopenChat: boolean;
  
  // Actions
  setSelectedModel: (model: ModelSize) => void;
  setLoadedModel: (model: ModelSize) => void;
  setShouldReopenChat: (shouldReopen: boolean) => void;
  resetModelState: () => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedModel: DEFAULT_MODEL_SIZE,
      loadedModel: null,
      needsReload: false,
      shouldReopenChat: false,
      
      // Set user's model selection
      setSelectedModel: (model) => {
        const loadedModel = get().loadedModel;
        set({
          selectedModel: model,
          needsReload: loadedModel !== null && loadedModel !== model,
        });
      },
      
      // Set the model that's actually loaded
      setLoadedModel: (model) => {
        set({
          loadedModel: model,
          needsReload: false,
        });
      },
      
      // Set chat reopen flag
      setShouldReopenChat: (shouldReopen) => {
        set({ shouldReopenChat: shouldReopen });
      },
      
      // Reset to defaults
      resetModelState: () => {
        set({
          selectedModel: DEFAULT_MODEL_SIZE,
          loadedModel: null,
          needsReload: false,
          shouldReopenChat: false,
        });
      },
    }),
    {
      name: 'model-storage',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        shouldReopenChat: state.shouldReopenChat,
      }),
    }
  )
);
