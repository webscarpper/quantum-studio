import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { TbActivityHeartbeat } from 'react-icons/tb';
import { BsCheckCircleFill, BsXCircleFill, BsExclamationCircleFill } from 'react-icons/bs';
import { SiAmazon, SiGoogle, SiHuggingface, SiPerplexity, SiOpenai } from 'react-icons/si';
import { BsRobot, BsCloud } from 'react-icons/bs';
import { TbBrain } from 'react-icons/tb';
import { BiChip, BiCodeBlock } from 'react-icons/bi';
import { FaCloud, FaBrain } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useSettings } from '~/lib/hooks/useSettings'; // Assuming this hook provides API keys or settings
import { toast } from 'react-toastify'; // Assuming useToast is a wrapper around react-toastify

// --- Types (ProviderName, ServiceStatus, ProviderConfig, ApiResponse) ---
// For brevity, assuming types are defined as in the original file.
type ProviderName = 'AmazonBedrock' | 'Anthropic' | 'Cohere' | 'Deepseek' | 'Google' | 'Groq' | 'HuggingFace' | 'Mistral' | 'OpenAI' | 'OpenRouter' | 'Perplexity' | 'Together' | 'XAI';
type ServiceStatus = { provider: ProviderName; status: 'operational' | 'degraded' | 'down'; lastChecked: string; statusUrl?: string; icon?: IconType; message?: string; responseTime?: number; incidents?: string[]; };
type ProviderConfig = { statusUrl: string; apiUrl: string; headers: Record<string, string>; testModel: string; };
type ApiResponse = { error?: { message: string; }; message?: string; model?: string; models?: Array<{ id?: string; name?: string; }>; data?: Array<{ id?: string; name?: string; }>; };
// --- End Types ---

const PROVIDER_STATUS_URLS: Record<ProviderName, ProviderConfig> = { /* ... Same as original ... */ OpenAI: { statusUrl: 'https://status.openai.com/', apiUrl: 'https://api.openai.com/v1/models', headers: { Authorization: 'Bearer $OPENAI_API_KEY', }, testModel: 'gpt-3.5-turbo', }, Anthropic: { statusUrl: 'https://status.anthropic.com/', apiUrl: 'https://api.anthropic.com/v1/messages', headers: { 'x-api-key': '$ANTHROPIC_API_KEY', 'anthropic-version': '2024-02-29', }, testModel: 'claude-3-sonnet-20240229', }, Cohere: { statusUrl: 'https://status.cohere.com/', apiUrl: 'https://api.cohere.ai/v1/models', headers: { Authorization: 'Bearer $COHERE_API_KEY', }, testModel: 'command', }, Google: { statusUrl: 'https://status.cloud.google.com/', apiUrl: 'https://generativelanguage.googleapis.com/v1/models', headers: { 'x-goog-api-key': '$GOOGLE_API_KEY', }, testModel: 'gemini-pro', }, HuggingFace: { statusUrl: 'https://status.huggingface.co/', apiUrl: 'https://api-inference.huggingface.co/models', headers: { Authorization: 'Bearer $HUGGINGFACE_API_KEY', }, testModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', }, Mistral: { statusUrl: 'https://status.mistral.ai/', apiUrl: 'https://api.mistral.ai/v1/models', headers: { Authorization: 'Bearer $MISTRAL_API_KEY', }, testModel: 'mistral-tiny', }, Perplexity: { statusUrl: 'https://status.perplexity.com/', apiUrl: 'https://api.perplexity.ai/v1/models', headers: { Authorization: 'Bearer $PERPLEXITY_API_KEY', }, testModel: 'pplx-7b-chat', }, Together: { statusUrl: 'https://status.together.ai/', apiUrl: 'https://api.together.xyz/v1/models', headers: { Authorization: 'Bearer $TOGETHER_API_KEY', }, testModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', }, AmazonBedrock: { statusUrl: 'https://health.aws.amazon.com/health/status', apiUrl: 'https://bedrock.us-east-1.amazonaws.com/models', headers: { Authorization: 'Bearer $AWS_BEDROCK_CONFIG', }, testModel: 'anthropic.claude-3-sonnet-20240229-v1:0', }, Groq: { statusUrl: 'https://groqstatus.com/', apiUrl: 'https://api.groq.com/v1/models', headers: { Authorization: 'Bearer $GROQ_API_KEY', }, testModel: 'mixtral-8x7b-32768', }, OpenRouter: { statusUrl: 'https://status.openrouter.ai/', apiUrl: 'https://openrouter.ai/api/v1/models', headers: { Authorization: 'Bearer $OPEN_ROUTER_API_KEY', }, testModel: 'anthropic/claude-3-sonnet', }, XAI: { statusUrl: 'https://status.x.ai/', apiUrl: 'https://api.x.ai/v1/models', headers: { Authorization: 'Bearer $XAI_API_KEY', }, testModel: 'grok-1', }, Deepseek: { statusUrl: 'https://status.deepseek.com/', apiUrl: 'https://api.deepseek.com/v1/models', headers: { Authorization: 'Bearer $DEEPSEEK_API_KEY', }, testModel: 'deepseek-chat', }, };
const PROVIDER_ICONS: Record<ProviderName, IconType> = { /* ... Same as original ... */ AmazonBedrock: SiAmazon, Anthropic: FaBrain, Cohere: BiChip, Google: SiGoogle, Groq: BsCloud, HuggingFace: SiHuggingface, Mistral: TbBrain, OpenAI: SiOpenai, OpenRouter: FaCloud, Perplexity: SiPerplexity, Together: BsCloud, XAI: BsRobot, Deepseek: BiCodeBlock, };

const ServiceStatusTab = () => {
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [testApiKey, setTestApiKey] = useState<string>('');
  const [testProvider, setTestProvider] = useState<ProviderName | ''>('');
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const settings = useSettings(); // Assuming this provides API keys from settings store

  const getApiKey = useCallback((provider: ProviderName): string | null => { 
    if (!settings.providers) return null; 
    const envKeyMap: Record<ProviderName, string> = {
        OpenAI: 'OPENAI_API_KEY',
        Anthropic: 'ANTHROPIC_API_KEY',
        Cohere: 'COHERE_API_KEY',
        Google: 'GOOGLE_GENERATIVE_AI_API_KEY', // Corrected key if this is what's in .env
        HuggingFace: 'HUGGINGFACE_API_KEY', // Assuming this is the env var name
        Mistral: 'MISTRAL_API_KEY',
        Perplexity: 'PERPLEXITY_API_KEY',
        Together: 'TOGETHER_API_KEY',
        AmazonBedrock: 'AWS_BEDROCK_CONFIG', // This might be a JSON string, handle accordingly
        Groq: 'GROQ_API_KEY',
        OpenRouter: 'OPEN_ROUTER_API_KEY',
        XAI: 'XAI_API_KEY',
        Deepseek: 'DEEPSEEK_API_KEY',
    };
    const envKey = envKeyMap[provider]; 
    if (!envKey) return null; 
    
    // Explicitly cast to access nested properties if type inference is an issue
    const providerConfig = settings.providers[provider] as ({ settings?: { apiKey?: string; [key: string]: any; } } | undefined);
    const apiKeyFromStore = providerConfig?.settings?.apiKey;
    
    const apiKeyFromEnv = (import.meta.env[envKey] as string) || null;
    return apiKeyFromStore || apiKeyFromEnv; 
  }, [settings.providers]);

  const getProviderConfig = useCallback((provider: ProviderName): ProviderConfig | null => { /* ... (Same as original) ... */ const config = PROVIDER_STATUS_URLS[provider]; if (!config) return null; let updatedConfig = { ...config }; const togetherBaseUrl = settings.providers?.Together?.settings?.baseUrl || import.meta.env.TOGETHER_API_BASE_URL; if (provider === 'Together' && togetherBaseUrl) { updatedConfig = { ...config, apiUrl: `${togetherBaseUrl}/models` }; } return updatedConfig; }, [settings.providers]);
  const checkApiEndpoint = useCallback(async (url: string, headers?: Record<string, string>, testModel?: string): Promise<{ ok: boolean; status: number | string; message?: string; responseTime: number }> => { /* ... (Same as original) ... */ try {const ctl=new AbortController();const tid=setTimeout(()=>ctl.abort(),10000);const st=performance.now();const pH={'Content-Type':'application/json',...headers};const rsp=await fetch(url,{method:'GET',headers:pH,signal:ctl.signal});const et=performance.now();const rT=et-st;clearTimeout(tid);const d=await rsp.json() as ApiResponse;if(!rsp.ok){let eM=`API status: ${rsp.status}`;if(d.error?.message)eM=d.error.message;else if(d.message)eM=d.message;return{ok:false,status:rsp.status,message:eM,responseTime:rT};}let m:string[]=[];if(Array.isArray(d))m=d.map(md=>(md.id||md.name||''));else if(d.data&&Array.isArray(d.data))m=d.data.map(md=>(md.id||md.name||''));else if(d.models&&Array.isArray(d.models))m=d.models.map(md=>(md.id||md.name||''));else if(d.model)m=[d.model];if(!testModel||m.length>0)return{ok:true,status:rsp.status,responseTime:rT,message:'API key valid'};if(testModel&&!m.includes(testModel))return{ok:true,status:'model_not_found',message:`Test model ${testModel} not found`,responseTime:rT};return{ok:true,status:rsp.status,message:'API key valid',responseTime:rT};}catch(e){return{ok:false,status:e instanceof Error?e.message:'Unknown',message:e instanceof Error?`Conn fail: ${e.message}`:'Conn fail',responseTime:0};} }, []);
  const fetchPublicStatus = useCallback(async (provider: ProviderName): Promise<{ status: ServiceStatus['status']; message?: string; incidents?: string[]; }> => { /* ... (Same as original, mostly relies on no-cors checks) ... */ try {const chk=async(u:string)=>{try{const r=await fetch(u,{mode:'no-cors',headers:{Accept:'text/html'}});return r.type==='opaque'?'reachable':'unreachable';}catch(e){return'unreachable';}}; switch(provider){case'HuggingFace':const esHF=await chk('https://status.huggingface.co/');const asHF=await chk('https://api-inference.huggingface.co/models');return{status:esHF==='reachable'&&asHF==='reachable'?'operational':'degraded',message:`Status:${esHF}, API:${asHF}`};default:return{status:'operational',message:'Basic reachability check'};}}catch(e){return{status:'degraded',message:'CORS limited status check'};} }, []);
  const fetchProviderStatus = useCallback(async (provider: ProviderName, config: ProviderConfig): Promise<ServiceStatus> => { /* ... (Same as original, using above helpers) ... */ const MAX_RETRIES=1; const RETRY_DELAY=1000; const attempt=async(att:number):Promise<ServiceStatus>=>{try{const pubStatProviders=['Anthropic','OpenAI','Google','HuggingFace','Mistral','Groq','Perplexity','Together'];if(pubStatProviders.includes(provider)){const pS=await fetchPublicStatus(provider);return{provider,status:pS.status,lastChecked:new Date().toISOString(),statusUrl:config.statusUrl,icon:PROVIDER_ICONS[provider],message:pS.message,incidents:pS.incidents};}const apiK=getApiKey(provider);const pCfg=getProviderConfig(provider);if(!apiK||!pCfg)return{provider,status:'operational',lastChecked:new Date().toISOString(),statusUrl:config.statusUrl,icon:PROVIDER_ICONS[provider],message:!apiK?'API key needed':'Config needed'};const{ok,status,message,responseTime}=await checkApiEndpoint(pCfg.apiUrl,pCfg.headers,pCfg.testModel);if(!ok&&att<MAX_RETRIES){await new Promise(r=>setTimeout(r,RETRY_DELAY));return attempt(att+1);}return{provider,status:ok?'operational':'degraded',lastChecked:new Date().toISOString(),statusUrl:pCfg.statusUrl,icon:PROVIDER_ICONS[provider],message:ok?'Service & API operational':`API: ${message||status}`,responseTime,incidents:[]};}catch(e){if(att<MAX_RETRIES){await new Promise(r=>setTimeout(r,RETRY_DELAY));return attempt(att+1);}return{provider,status:'degraded',lastChecked:new Date().toISOString(),statusUrl:config.statusUrl,icon:PROVIDER_ICONS[provider],message:'Status check error',responseTime:0,incidents:[]};}}; return attempt(1); }, [checkApiEndpoint, getApiKey, getProviderConfig, fetchPublicStatus]);
  const fetchAllStatuses = useCallback(async () => { try { setLoading(true); const statuses = await Promise.all( Object.entries(PROVIDER_STATUS_URLS).map(([p,c]) => fetchProviderStatus(p as ProviderName, c)) ); setServiceStatuses(statuses.sort((a,b)=>a.provider.localeCompare(b.provider))); setLastRefresh(new Date()); toast.success('Service statuses updated'); } catch (err) { toast.error('Failed to update statuses'); } finally { setLoading(false); } }, [fetchProviderStatus]);
  useEffect(() => { fetchAllStatuses(); const interval = setInterval(fetchAllStatuses, 2 * 60 * 1000); return () => clearInterval(interval); }, [fetchAllStatuses]);
  const testApiKeyForProvider = useCallback(async (provider: ProviderName, apiKey: string) => { /* ... (Same as original, ensure toast styles are fine) ... */ try{setTestingStatus('testing');const cfg=PROVIDER_STATUS_URLS[provider];if(!cfg)throw new Error('No config');const hdrs={...cfg.headers};Object.keys(hdrs).forEach(k=>{if(hdrs[k].startsWith('$'))hdrs[k]=hdrs[k].replace(/\$.*/,apiKey);});if(provider==='Google'){const gUrl=`${cfg.apiUrl}?key=${apiKey}`;const res=await checkApiEndpoint(gUrl,{},cfg.testModel);if(res.ok){setTestingStatus('success');toast.success('API key valid!');}else{setTestingStatus('error');toast.error(`Test fail: ${res.message}`);}return;}const{ok,message}=await checkApiEndpoint(cfg.apiUrl,hdrs,cfg.testModel);if(ok){setTestingStatus('success');toast.success('API key valid!');}else{setTestingStatus('error');toast.error(`Test fail: ${message}`);}}catch(e){setTestingStatus('error');toast.error(`Test fail: ${e instanceof Error?e.message:'Unknown'}`);}finally{setTimeout(()=>setTestingStatus('idle'),3000);} }, [checkApiEndpoint]);
  const getStatusColor = (status: ServiceStatus['status']) => { switch(status){case 'operational':return 'text-green-400'; case 'degraded':return 'text-yellow-400'; case 'down':return 'text-red-400'; default:return 'text-gray-400';} }; // Adjusted colors
  const getStatusIcon = (status: ServiceStatus['status']) => { switch(status){case 'operational':return <BsCheckCircleFill className="w-4 h-4"/>; case 'degraded':return <BsExclamationCircleFill className="w-4 h-4"/>; case 'down':return <BsXCircleFill className="w-4 h-4"/>; default:return <BsXCircleFill className="w-4 h-4"/>;} };

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 space-y-6"> {/* Root styles */}
      <motion.div className="space-y-4" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.3}}>
        <div className="flex items-center justify-between gap-2 mt-0 mb-4"> {/* Adjusted mt */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 text-purple-400"><TbActivityHeartbeat className="w-5 h-5"/></div>
            <div>
              <h4 className="text-md font-medium text-gray-100">Service Status</h4>
              <p className="text-sm text-gray-400">Monitor cloud LLM provider status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Last updated: {lastRefresh.toLocaleTimeString()}</span>
            <button onClick={fetchAllStatuses} className={classNames('px-3 py-1.5 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-100 transition-all duration-200 flex items-center gap-2', loading ? 'opacity-50 cursor-not-allowed' : '')} disabled={loading}>
              <div className={`i-ph:arrows-clockwise w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700"> {/* API Key Test Section styles */}
          <h5 className="text-sm font-medium text-gray-100 mb-2">Test API Key</h5>
          <div className="flex gap-2">
            <select value={testProvider} onChange={(e)=>setTestProvider(e.target.value as ProviderName)} className="flex-1 px-3 py-1.5 rounded-lg text-sm max-w-[200px] bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50">
              <option value="">Select Provider</option>
              {Object.keys(PROVIDER_STATUS_URLS).map(p=>(<option key={p} value={p}>{p}</option>))}
            </select>
            <input type="password" value={testApiKey} onChange={(e)=>setTestApiKey(e.target.value)} placeholder="Enter API key" className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"/>
            <button onClick={()=>testProvider&&testApiKey&&testApiKeyForProvider(testProvider as ProviderName,testApiKey)} disabled={!testProvider||!testApiKey||testingStatus==='testing'} className={classNames('px-4 py-1.5 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 flex items-center gap-2',!testProvider||!testApiKey||testingStatus==='testing'?'opacity-50 cursor-not-allowed':'')}>
              {testingStatus==='testing'?(<><div className="i-ph:spinner-gap w-4 h-4 animate-spin"/><span>Testing...</span></>):(<><div className="i-ph:key w-4 h-4"/><span>Test Key</span></>)}
            </button>
          </div>
        </div>

        {loading && serviceStatuses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Loading service statuses...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceStatuses.map((service, index) => (
              <motion.div key={service.provider} className="bg-gray-900 hover:bg-gray-800 border border-gray-700 transition-all duration-200 relative overflow-hidden rounded-lg" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:index*0.05}} whileHover={{scale:1.01}}>
                <div className={classNames('block p-4', service.statusUrl ? 'cursor-pointer':'')} onClick={()=>service.statusUrl&&window.open(service.statusUrl,'_blank')}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {service.icon && (<div className={classNames('w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800', getStatusColor(service.status))}>{React.createElement(service.icon,{className:'w-5 h-5'})}</div>)}
                      <div>
                        <h4 className="text-sm font-medium text-gray-100">{service.provider}</h4>
                        <div className="space-y-0.5"> {/* Reduced space */}
                          <p className="text-xs text-gray-400">Last checked: {new Date(service.lastChecked).toLocaleTimeString()}</p>
                          {service.responseTime!=null && (<p className="text-xs text-gray-500">Response: {Math.round(service.responseTime)}ms</p>)}
                          {service.message && (<p className="text-xs text-gray-500 truncate max-w-xs" title={service.message}>{service.message}</p>)}
                        </div>
                      </div>
                    </div>
                    <div className={classNames('flex items-center gap-2', getStatusColor(service.status))}>
                      <span className="text-sm capitalize">{service.status}</span>
                      {getStatusIcon(service.status)}
                    </div>
                  </div>
                  {service.incidents && service.incidents.length > 0 && ( <div className="mt-2 border-t border-gray-700 pt-2"> <p className="text-xs font-medium text-gray-300 mb-1">Incidents:</p> <ul className="text-xs text-gray-400 space-y-1">{service.incidents.map((inc,i)=>(<li key={i}>{inc}</li>))}</ul> </div> )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
export default ServiceStatusTab;
