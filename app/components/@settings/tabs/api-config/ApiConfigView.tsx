import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  selectedProviderStore,
  selectedModelNameStore,
  apiKeysStore,
  availableModelsForSelectedProviderStore,
  providerListStore,
  isLoadingModelsStore,
  loadInitialConfig, // Should be called at a higher level, e.g., app init
  selectProvider,
  selectModel,
  updateApiKey,
  fetchModelsForProvider,
  // setProviderList // This is now handled in Chat.client.tsx from useSettings
} from '~/lib/stores/modelConfig';
import type { ProviderInfo } from '~/types/model';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
// import { Button } from '~/components/ui/Button'; // Save button might be redundant
import { DEFAULT_PROVIDER, DEFAULT_MODEL, PROVIDER_LIST } from '~/utils/constants';

export const ApiConfigView: React.FC = () => {
  const selectedProvider = useStore(selectedProviderStore);
  const selectedModelName = useStore(selectedModelNameStore);
  const apiKeys = useStore(apiKeysStore);
  const availableModels = useStore(availableModelsForSelectedProviderStore);
  const providerList = useStore(providerListStore); // This list is populated by Chat.client.tsx
  const isLoadingModels = useStore(isLoadingModelsStore);

  // useEffect(() => {
  //   // loadInitialConfig(); // Moved to Chat.client.tsx or similar higher-level component
  //   // if (providerListStore.get().length === 0 && PROVIDER_LIST.length > 0) {
  //   //   setGlobalProviderList(PROVIDER_LIST as ProviderInfo[]);
  //   // }
  // }, []);

  useEffect(() => {
    // Fetch models when selectedProvider changes and is not null
    // This ensures models are loaded if a provider is pre-selected or changed.
    if (selectedProvider && selectedProvider.name) {
      fetchModelsForProvider(selectedProvider.name);
    } else {
      // Clear models if no provider is selected (e.g. initial state before loadInitialConfig)
      availableModelsForSelectedProviderStore.set([]);
    }
  }, [selectedProvider]);

  // Fallback to default provider/model if current selection from store is null
  // This is mainly for rendering the components before store is fully initialized by loadInitialConfig
  const currentProviderForUI = selectedProvider || (DEFAULT_PROVIDER as ProviderInfo);
  const currentModelNameForUI = selectedModelName || DEFAULT_MODEL;
  
  // Ensure providerList has a default if the store is empty initially
  const currentProviderListForUI = providerList.length > 0 ? providerList : (PROVIDER_LIST as ProviderInfo[]);


  return (
    <div className="bg-black p-6 rounded-xl space-y-8 text-sm text-gray-200"> {/* Added bg-black, adjusted text color for light text on black */}
      <div>
        <h3 className="text-lg font-medium leading-6 text-white mb-2"> {/* Ensure heading is white */}
          AI Provider & Model
        </h3>
        <p className="text-xs text-gray-400 mb-4"> {/* Gray-400 for subtext is fine */}
          Choose your preferred AI provider and model for chat interactions. API keys are stored locally in your browser's cookies.
        </p>
        <ModelSelector
          provider={currentProviderForUI}
          setProvider={(newProvider) => {
            if (newProvider) selectProvider(newProvider);
          }}
          model={currentModelNameForUI}
          setModel={(newModelName) => {
            // selectModel action expects string | null
            selectModel(newModelName || null);
          }}
          providerList={currentProviderListForUI}
          modelList={availableModels} // This is already filtered by selectedProvider in the store's fetchModels action
          apiKeys={apiKeys} 
          modelLoading={isLoadingModels === currentProviderForUI?.name ? currentProviderForUI.name : undefined}
        />
      </div>

      {currentProviderForUI && (
        <div className="pt-6 border-t border-gray-700"> {/* Border color might need adjustment for black bg */}
          <h3 className="text-lg font-medium leading-6 text-white mb-2"> {/* Ensure heading is white */}
            API Key for {currentProviderForUI.name}
          </h3>
          <APIKeyManager
            provider={currentProviderForUI}
            apiKey={apiKeys[currentProviderForUI.name] || ''}
            setApiKey={(key) => {
              updateApiKey(currentProviderForUI.name, key);
            }}
          />
        </div>
      )}
      
      {/* 
        A global "Save" button for the entire settings panel might be managed by ControlPanel.tsx itself.
        The individual components (ModelSelector, APIKeyManager) update the store (and cookies) on change.
      */}
    </div>
  );
};

export default ApiConfigView;
