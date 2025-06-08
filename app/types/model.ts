import type { ModelInfo as ImportedModelInfo } from '~/lib/modules/llm/types';

// Re-export ModelInfo so it can be imported from this module
export type ModelInfo = ImportedModelInfo;

export type ProviderInfo = {
  staticModels: ModelInfo[];
  name: string;
  // Aligning with the inferred signature from LLMManager's providers
  getDynamicModels?: (
    apiKeys?: Record<string, string>,
    providerSettings?: IProviderSetting,
    serverEnv?: Record<string, string>
  ) => Promise<ModelInfo[]>;
  getApiKeyLink?: string;
  labelForGetApiKey?: string;
  icon?: string;
};

export interface IProviderSetting {
  enabled?: boolean;
  baseUrl?: string;
}

export type IProviderConfig = ProviderInfo & {
  settings: IProviderSetting;
};
