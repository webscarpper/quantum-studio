import React, { useEffect, useState, useCallback } from 'react';
import { Switch } from '~/components/ui/Switch';
import { useSettings } from '~/lib/hooks/useSettings';
import { URL_CONFIGURABLE_PROVIDERS } from '~/lib/stores/settings';
// Ensure IProviderConfig is the one with all optional top-level props like apiUrl, models
import type { IProviderConfig, IProviderSetting, ProviderInfo, ModelInfo } from '~/types/model'; 
import { logStore } from '~/lib/stores/logs';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';
import { providerBaseUrlEnvKeys } from '~/utils/constants';
import { SiAmazon, SiGoogle, SiHuggingface, SiPerplexity, SiOpenai } from 'react-icons/si';
import { BsRobot, BsCloud } from 'react-icons/bs';
import { TbBrain, TbCloudComputing } from 'react-icons/tb';
import { BiCodeBlock, BiChip } from 'react-icons/bi';
import { FaCloud, FaBrain } from 'react-icons/fa';
import type { IconType } from 'react-icons';

type ProviderName = 'AmazonBedrock' | 'Anthropic' | 'Cohere' | 'Deepseek' | 'Google' | 'Groq' | 'HuggingFace' | 'Hyperbolic' | 'Mistral' | 'OpenAI' | 'OpenRouter' | 'Perplexity' | 'Together' | 'XAI';
const PROVIDER_ICONS: Record<ProviderName, IconType> = { AmazonBedrock: SiAmazon, Anthropic: FaBrain, Cohere: BiChip, Deepseek: BiCodeBlock, Google: SiGoogle, Groq: BsCloud, HuggingFace: SiHuggingface, Hyperbolic: TbCloudComputing, Mistral: TbBrain, OpenAI: SiOpenai, OpenRouter: FaCloud, Perplexity: SiPerplexity, Together: BsCloud, XAI: BsRobot, };
const PROVIDER_DESCRIPTIONS: Partial<Record<ProviderName, string>> = { Anthropic: 'Access Claude and other Anthropic models', OpenAI: 'Use GPT-4, GPT-3.5, and other OpenAI models', };

// This interface needs to align with what filteredProviders state expects and what is rendered.
// It should be compatible with IProviderConfig, especially if passed to functions expecting IProviderConfig.
interface DisplayProviderConfig {
  name: string;
  settings: IProviderSetting;
  apiUrl?: string;
  apiKeyUrl?: string;
  staticModels: string[]; // ProviderInfo requires this
  defaultModel?: string;
  getDynamicModels?: IProviderConfig['getDynamicModels']; // Keep full signature if needed by other parts
  getApiKeyLink?: IProviderConfig['getApiKeyLink'];
  labelForGetApiKey?: IProviderConfig['labelForGetApiKey'];
  icon?: string; 
}

const CloudProvidersTab = () => {
  const settings = useSettings();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [filteredProviders, setFilteredProviders] = useState<DisplayProviderConfig[]>([]);
  const [categoryEnabled, setCategoryEnabled] = useState<boolean>(false);

  useEffect(() => {
    const newFilteredProviders = Object.entries(settings.providers || {})
      .filter(([key]) => !['Ollama', 'LMStudio', 'OpenAILike'].includes(key))
      .map(([key, providerValueUntyped]) => {
        const value = providerValueUntyped as IProviderConfig; // Source object
        return {
          name: key,
          settings: value.settings, // from IProviderConfig
          apiUrl: (value as any).apiUrl, // from IProviderConfig (optional) - using any cast
          apiKeyUrl: (value as any).apiKeyUrl, // from IProviderConfig (optional) - using any cast
          staticModels: (value as any).models || [], // map IProviderConfig.models to staticModels - using any cast
          defaultModel: (value as any).defaultModel, // from IProviderConfig (optional) - using any cast
          getDynamicModels: value.getDynamicModels, // from IProviderConfig (optional)
          getApiKeyLink: value.getApiKeyLink, // from IProviderConfig (optional)
          labelForGetApiKey: value.labelForGetApiKey, // from IProviderConfig (optional)
          icon: value.icon, // from IProviderConfig (optional)
        } as DisplayProviderConfig; 
      });
    const sorted = newFilteredProviders.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredProviders(sorted);
    const allEnabled = newFilteredProviders.every((p) => p.settings && p.settings.enabled);
    setCategoryEnabled(allEnabled);
  }, [settings.providers]);

  const handleToggleCategory = useCallback( (enabled: boolean) => { filteredProviders.forEach((provider) => { settings.updateProviderSettings(provider.name, { ...provider.settings, enabled }); }); setCategoryEnabled(enabled); toast.success(enabled ? 'All cloud providers enabled' : 'All cloud providers disabled'); }, [filteredProviders, settings]);
  const handleToggleProvider = useCallback( (provider: DisplayProviderConfig, enabled: boolean) => { settings.updateProviderSettings(provider.name, { ...provider.settings, enabled }); if (enabled) { logStore.logProvider(`Provider ${provider.name} enabled`, { provider: provider.name, message: `${provider.name} enabled` }); toast.success(`${provider.name} enabled`); } else { logStore.logProvider(`Provider ${provider.name} disabled`, { provider: provider.name, message: `${provider.name} disabled` }); toast.success(`${provider.name} disabled`); } }, [settings]);
  const handleUpdateBaseUrl = useCallback( (provider: DisplayProviderConfig, baseUrl: string) => { const newBaseUrl: string | undefined = baseUrl.trim() || undefined; settings.updateProviderSettings(provider.name, { ...provider.settings, baseUrl: newBaseUrl }); logStore.logProvider(`Base URL updated for ${provider.name}`, { provider: provider.name, baseUrl: newBaseUrl, message: `Base URL for ${provider.name} updated` }); toast.success(`${provider.name} base URL updated`); setEditingProvider(null); }, [settings]);

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 space-y-6">
      <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between gap-4 mt-0 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-purple-400">
              <TbCloudComputing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-100">Cloud Providers</h4>
              <p className="text-sm text-gray-400">Connect to cloud-based AI models and services</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Enable All Cloud</span>
            <Switch checked={categoryEnabled} onCheckedChange={handleToggleCategory} className="data-[state=checked]:bg-purple-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProviders.map((provider, index) => (
            <motion.div key={provider.name} className="rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-200 relative overflow-hidden group flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.01 }}>
              <div className="absolute top-0 right-0 p-2 flex gap-1">
                {URL_CONFIGURABLE_PROVIDERS.includes(provider.name) && ( <motion.span className="px-2 py-0.5 text-xs rounded-full bg-purple-600/30 text-purple-300 font-medium" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} > Configurable </motion.span> )}
              </div>
              <div className="flex items-start gap-4 p-4">
                <motion.div className={classNames('w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 group-hover:bg-gray-700 transition-all duration-200', provider.settings.enabled ? 'text-purple-400' : 'text-gray-500')} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <div className="w-6 h-6 transition-transform duration-200 group-hover:rotate-12">
                    {React.createElement(PROVIDER_ICONS[provider.name as ProviderName] || BsRobot, { className: 'w-full h-full', 'aria-label': `${provider.name} logo`, })}
                  </div>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-100 group-hover:text-purple-300 transition-colors">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{PROVIDER_DESCRIPTIONS[provider.name as keyof typeof PROVIDER_DESCRIPTIONS] || (URL_CONFIGURABLE_PROVIDERS.includes(provider.name) ? 'Configure custom endpoint' : 'Standard AI provider')}</p>
                    </div>
                    <Switch checked={provider.settings.enabled} onCheckedChange={(checked) => handleToggleProvider(provider, checked)} className="data-[state=checked]:bg-purple-600"/>
                  </div>
                  {provider.settings.enabled && URL_CONFIGURABLE_PROVIDERS.includes(provider.name) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-center gap-2 mt-4">
                        {editingProvider === provider.name ? (
                          <input type="text" defaultValue={provider.settings.baseUrl} placeholder={`Enter ${provider.name} base URL`} className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200" onKeyDown={(e)=>{if(e.key==='Enter'){handleUpdateBaseUrl(provider,e.currentTarget.value);}else if(e.key==='Escape'){setEditingProvider(null);}}} onBlur={(e)=>handleUpdateBaseUrl(provider,e.target.value)} autoFocus />
                        ) : (
                          <div className="flex-1 px-3 py-1.5 rounded-lg text-sm cursor-pointer group/url" onClick={()=>setEditingProvider(provider.name)}>
                            <div className="flex items-center gap-2 text-gray-400"> <div className="i-ph:link text-sm" /> <span className="group-hover/url:text-purple-300 transition-colors">{provider.settings.baseUrl || 'Click to set base URL'}</span> </div>
                          </div>
                        )}
                      </div>
                      {providerBaseUrlEnvKeys[provider.name as keyof typeof providerBaseUrlEnvKeys]?.baseUrlKey && ( <div className="mt-2 text-xs text-green-400"><div className="flex items-center gap-1"><div className="i-ph:info"/><span>Env URL set</span></div></div> )}
                    </motion.div>
                  )}
                </div>
              </div>
              <motion.div className="absolute inset-0 border-2 border-purple-500/0 rounded-lg pointer-events-none" animate={{borderColor:provider.settings.enabled?'rgba(168,85,247,0.3)':'rgba(168,85,247,0)',scale:provider.settings.enabled?1:0.98}} transition={{duration:0.2}}/>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
export default CloudProvidersTab;
