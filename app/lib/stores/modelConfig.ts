import { atom, map } from 'nanostores';
import Cookies from 'js-cookie';
import type { ProviderInfo, ModelInfo } from '~/types/model';
import { DEFAULT_MODEL, DEFAULT_PROVIDER, PROVIDER_LIST } from '~/utils/constants';
import { getApiKeysFromCookies } from '~/components/chat/APIKeyManager'; // Assuming this can be reused or adapted

// --- Atoms ---

// Information about the currently selected provider
export const selectedProviderStore = atom<ProviderInfo | null>(null);

// Name/ID of the currently selected model for the selected provider
export const selectedModelNameStore = atom<string | null>(null);

// All API keys, mapping providerName to apiKey
export const apiKeysStore = map<Record<string, string>>({});

// List of all models fetched, potentially for all providers or just the current one
// For simplicity, let's start with models for the currently selected provider
export const availableModelsForSelectedProviderStore = atom<ModelInfo[]>([]);

// List of all configured/available providers (e.g., from global settings)
export const providerListStore = atom<ProviderInfo[]>(PROVIDER_LIST); // Initialize with full list, can be refined

// Loading state: string is providerName being loaded, 'all', or null if not loading
export const isLoadingModelsStore = atom<string | null>(null);

// --- Actions ---

export function loadInitialConfig() {
    const savedProviderName = Cookies.get('selectedProvider');
    const savedModelName = Cookies.get('selectedModel');
    const savedApiKeys = getApiKeysFromCookies(); // This function already parses JSON

    const currentProviderList = providerListStore.get();
    const initialProvider = currentProviderList.find(p => p.name === savedProviderName) || DEFAULT_PROVIDER;

    selectedProviderStore.set(initialProvider);
    selectedModelNameStore.set(savedModelName || DEFAULT_MODEL); // Ensure a default model if provider changes
    apiKeysStore.set(savedApiKeys);

    // Initially fetch models for the loaded provider
    if (initialProvider) {
    // console.log('Initial load: fetching models for', initialProvider.name);
      // fetchModelsForProvider(initialProvider.name); // Component will trigger this
    }
    // Consider if this function needs to return values or if components will subscribe to stores
}

export async function selectProvider(newProvider: ProviderInfo) {
    selectedProviderStore.set(newProvider);
    Cookies.set('selectedProvider', newProvider.name, { expires: 30 });
    
    // Clear current model and model list, then fetch new ones
    selectedModelNameStore.set(null); // Or set to a default for the new provider
    availableModelsForSelectedProviderStore.set([]);
    // console.log('Provider selected:', newProvider.name, 'Fetching models...');
    // Component will call fetchModelsForProvider after selecting a provider
}

export function selectModel(modelName: string | null) { // Allow null
    selectedModelNameStore.set(modelName);
    if (modelName) {
      Cookies.set('selectedModel', modelName, { expires: 30 });
    } else {
      Cookies.remove('selectedModel');
    }
    // console.log('Model selected:', modelName);
}

export function updateApiKey(providerName: string, apiKey: string) {
    // apiKeysStore is a map store, use setKey
    apiKeysStore.setKey(providerName, apiKey);
    
    // For saving to cookies, we need the whole map
    const allKeys = apiKeysStore.get();
    Cookies.set('apiKeys', JSON.stringify(allKeys), { expires: 30 });
    // console.log('API Key updated for', providerName);
}

export async function fetchModelsForProvider(providerName: string) {
    if (!providerName) {
      availableModelsForSelectedProviderStore.set([]);
      selectModel(null);
      isLoadingModelsStore.set(null);
      return;
    }

    isLoadingModelsStore.set(providerName);
    availableModelsForSelectedProviderStore.set([]); // Clear previous models

    try {
      const response = await fetch(`/api/models/${encodeURIComponent(providerName)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models for ${providerName}: ${response.statusText}`);
      }
      const data = await response.json();
      const providerModels = (data as { modelList: ModelInfo[] }).modelList;
      
      // Filter models to ensure they belong to the requested provider, just in case API returns more
      const filteredModels = providerModels.filter(m => m.provider === providerName);
      availableModelsForSelectedProviderStore.set(filteredModels);

      // Auto-select the first model if none is selected for this provider or if current selection is not in new list
      const currentModel = selectedModelNameStore.get();
      if (!currentModel || !filteredModels.find(m => m.name === currentModel)) {
        if (filteredModels.length > 0) {
          selectModel(filteredModels[0].name);
        } else {
          selectModel(null); // No models available
        }
      }
      // console.log('Fetched models for', providerName, filteredModels);

    } catch (error) {
      console.error(`Error fetching models for ${providerName}:`, error);
      availableModelsForSelectedProviderStore.set([]); // Clear on error
      selectModel(null);
    } finally {
      isLoadingModelsStore.set(null);
    }
}

// Action to update the list of available providers (e.g., from global settings)
export function setProviderList(providers: ProviderInfo[]) {
    providerListStore.set(providers);
}

// Call loadInitialConfig when the store is initialized (e.g. on app load)
// This should ideally be called from a root component or similar.
// For now, let's assume it will be called.
// loadInitialConfig(); 
// Commenting out direct call, will be called from a component useEffect.
