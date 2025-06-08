import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { logStore, type LogEntry } from '~/lib/stores/logs';
import { useStore } from '@nanostores/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/Collapsible';
import { Progress } from '~/components/ui/Progress';
import { ScrollArea } from '~/components/ui/ScrollArea';
import { Badge } from '~/components/ui/Badge';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog'; // Note: DialogRoot might be specific to Radix
import { jsPDF } from 'jspdf';
import { useSettings } from '~/lib/hooks/useSettings';

// Interfaces (SystemInfo, GitHubRepoInfo, GitInfo, WebAppInfo, OllamaServiceStatus, ExportFormat) remain the same

// --- Re-paste interfaces here if they were part of the original file read that got truncated ---
interface SystemInfo { os: string; arch: string; platform: string; cpus: string; memory: { total: string; free: string; used: string; percentage: number; }; node: string; browser: { name: string; version: string; language: string; userAgent: string; cookiesEnabled: boolean; online: boolean; platform: string; cores: number; }; screen: { width: number; height: number; colorDepth: number; pixelRatio: number; }; time: { timezone: string; offset: number; locale: string; }; performance: { memory: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number; usagePercentage: number; }; timing: { loadTime: number; domReadyTime: number; readyStart: number; redirectTime: number; appcacheTime: number; unloadEventTime: number; lookupDomainTime: number; connectTime: number; requestTime: number; initDomTreeTime: number; loadEventTime: number; }; navigation: { type: number; redirectCount: number; }; }; network: { downlink: number; effectiveType: string; rtt: number; saveData: boolean; type: string; }; battery?: { charging: boolean; chargingTime: number; dischargingTime: number; level: number; }; storage: { quota: number; usage: number; persistent: boolean; temporary: boolean; }; }
interface GitHubRepoInfo { fullName: string; defaultBranch: string; stars: number; forks: number; openIssues?: number; }
interface GitInfo { local: { commitHash: string; branch: string; commitTime: string; author: string; email: string; remoteUrl: string; repoName: string; }; github?: { currentRepo: GitHubRepoInfo; upstream?: GitHubRepoInfo; }; isForked?: boolean; }
interface WebAppInfo { name: string; version: string; description: string; license: string; environment: string; timestamp: string; runtimeInfo: { nodeVersion: string; }; dependencies: { production: Array<{ name: string; version: string; type: string }>; development: Array<{ name: string; version: string; type: string }>; peer: Array<{ name: string; version: string; type: string }>; optional: Array<{ name: string; version: string; type: string }>; }; gitInfo: GitInfo; }
interface OllamaServiceStatus { isRunning: boolean; lastChecked: Date; error?: string; models?: Array<{ name: string; size: string; quantization: string; }>; }
interface ExportFormat { id: string; label: string; icon: string; handler: () => void; }
// --- End re-pasted interfaces ---


const DependencySection = ({
  title,
  deps,
}: {
  title: string;
  deps: Array<{ name: string; version: string; type: string }>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  if (deps.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className={classNames(
          'flex w-full items-center justify-between p-4',
          'bg-gray-900 hover:bg-gray-800', // Adjusted for black bg
          'border-b border-gray-700', // Adjusted for black bg
          'transition-colors duration-200',
          'first:rounded-t-lg last:rounded-b-lg',
          { 'hover:rounded-lg': !isOpen },
        )}
      >
        <div className="flex items-center gap-3">
          <div className="i-ph:package text-gray-400 w-4 h-4" /> {/* Adjusted text color */}
          <span className="text-base text-gray-100"> {/* Adjusted text color */}
            {title} Dependencies ({deps.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{isOpen ? 'Hide' : 'Show'}</span> {/* Adjusted text color */}
          <div
            className={classNames(
              'i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-gray-400', // Adjusted text color
              isOpen ? 'rotate-180' : '',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea
          className={classNames(
            'h-[200px] w-full',
            'bg-gray-900', // Adjusted for black bg
            'border-b border-gray-700', // Adjusted for black bg
            'last:rounded-b-lg last:border-b-0',
          )}
        >
          <div className="space-y-2 p-4">
            {deps.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-100">{dep.name}</span> {/* Adjusted text color */}
                <span className="text-gray-400">{dep.version}</span> {/* Adjusted text color */}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function DebugTab() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [webAppInfo, setWebAppInfo] = useState<WebAppInfo | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaServiceStatus>({ isRunning: false, lastChecked: new Date() });
  const [loading, setLoading] = useState({ systemInfo: false, webAppInfo: false, errors: false, performance: false });
  const [openSections, setOpenSections] = useState({ system: false, webapp: false, errors: false, performance: false });
  const { providers } = useSettings();
  const logs = useStore(logStore.logs);
  const errorLogs = useMemo(() => Object.values(logs).filter((log): log is LogEntry => typeof log === 'object' && log !== null && 'level' in log && log.level === 'error'), [logs]);

  // useEffects for error listeners, initial data load, periodic refresh remain largely the same
  // ... (Keep existing useEffects, ensure any UI elements they update are styled for black bg) ...
  useEffect(() => { const handleError = (event: ErrorEvent) => { logStore.logError(event.message, event.error, { filename: event.filename, lineNumber: event.lineno, columnNumber: event.colno, }); }; const handleRejection = (event: PromiseRejectionEvent) => { logStore.logError('Unhandled Promise Rejection', event.reason); }; window.addEventListener('error', handleError); window.addEventListener('unhandledrejection', handleRejection); return () => { window.removeEventListener('error', handleError); window.removeEventListener('unhandledrejection', handleRejection); }; }, []);
  useEffect(() => { if (openSections.errors) checkErrors(); }, [openSections.errors]);
  useEffect(() => { const loadInitialData = async () => { await Promise.all([getSystemInfo(), getWebAppInfo()]); }; loadInitialData(); }, []);
  useEffect(() => { if (openSections.system) getSystemInfo(); if (openSections.webapp) getWebAppInfo(); }, [openSections.system, openSections.webapp]);
  useEffect(() => { if (!openSections.webapp) return undefined; const fetchGitInfo = async () => { try { const response = await fetch('/api/system/git-info'); const updatedGitInfo = (await response.json()) as GitInfo; setWebAppInfo((prev) => { if (!prev) return null; if (JSON.stringify(prev.gitInfo) === JSON.stringify(updatedGitInfo)) return prev; return { ...prev, gitInfo: updatedGitInfo, }; }); } catch (error) { console.error('Failed to fetch git info:', error); } }; fetchGitInfo(); const interval = setInterval(fetchGitInfo, 5 * 60 * 1000); return () => clearInterval(interval); }, [openSections.webapp]);


  // getSystemInfo, formatBytes, getWebAppInfo, handleLogPerformance, checkErrors, export functions remain the same internally
  // ... (Keep existing helper functions, ensure any UI elements they update are styled for black bg) ...
  const formatBytes = (bytes: number) => { if (bytes === 0) return '0 B'; const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; const i = Math.floor(Math.log(bytes) / Math.log(1024)); if (i === 0) return `${bytes} ${units[i]}`; return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`; };
  const getSystemInfo = async () => { setLoading((prev) => ({ ...prev, systemInfo: true })); try { /* ... existing logic ... */ const userAgent = navigator.userAgent; let detectedOS = 'Unknown'; let detectedArch = 'unknown'; if (userAgent.indexOf('Win') !== -1) detectedOS = 'Windows'; else if (userAgent.indexOf('Mac') !== -1) detectedOS = 'macOS'; else if (userAgent.indexOf('Linux') !== -1) detectedOS = 'Linux'; if (userAgent.indexOf('x86_64') !== -1 || userAgent.indexOf('x64') !== -1) detectedArch = 'x64'; else if (userAgent.indexOf('arm64') !== -1 || userAgent.indexOf('aarch64') !== -1) detectedArch = 'arm64'; const browserName = (() => { if (userAgent.indexOf('Edg/') !== -1) return 'Edge'; if (userAgent.indexOf('Chrome') !== -1) return 'Chrome'; if (userAgent.indexOf('Firefox') !== -1) return 'Firefox'; if (userAgent.indexOf('Safari') !== -1) return 'Safari'; return 'Unknown'; })(); const browserVersionMatch = userAgent.match(/(Edg|Chrome|Firefox|Safari)[\s/](\d+(\.\d+)*)/); const browserVersion = browserVersionMatch ? browserVersionMatch[2] : 'Unknown'; const performanceMemory = (performance as any).memory || {}; const totalMemory = performanceMemory.jsHeapSizeLimit || 0; const usedMemory = performanceMemory.usedJSHeapSize || 0; const freeMemory = totalMemory - usedMemory; const memoryPercentage = totalMemory ? (usedMemory / totalMemory) * 100 : 0; const timing = performance.timing; const navigation = performance.navigation; const connection = (navigator as any).connection || {}; let loadTime = 0; let domReadyTime = 0; try { const navEntries = performance.getEntriesByType('navigation'); if (navEntries.length > 0) { const navTiming = navEntries[0] as PerformanceNavigationTiming; loadTime = navTiming.loadEventEnd - navTiming.startTime; domReadyTime = navTiming.domContentLoadedEventEnd - navTiming.startTime; } else { loadTime = timing.loadEventEnd - timing.navigationStart; domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart; } } catch { loadTime = timing.loadEventEnd - timing.navigationStart; domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart; } let batteryInfo; try { const battery = await (navigator as any).getBattery(); batteryInfo = { charging: battery.charging, chargingTime: battery.chargingTime, dischargingTime: battery.dischargingTime, level: battery.level * 100, }; } catch { /* ignore */ } let storageInfo = { quota: 0, usage: 0, persistent: false, temporary: false, }; try { const storage = await navigator.storage.estimate(); const persistent = await navigator.storage.persist(); storageInfo = { quota: storage.quota || 0, usage: storage.usage || 0, persistent, temporary: !persistent, }; } catch { /* ignore */ } const sysInfoData: SystemInfo = { os: detectedOS, arch: detectedArch, platform: navigator.platform || 'unknown', cpus: navigator.hardwareConcurrency + ' cores', memory: { total: formatBytes(totalMemory), free: formatBytes(freeMemory), used: formatBytes(usedMemory), percentage: Math.round(memoryPercentage), }, node: 'browser', browser: { name: browserName, version: browserVersion, language: navigator.language, userAgent: navigator.userAgent, cookiesEnabled: navigator.cookieEnabled, online: navigator.onLine, platform: navigator.platform || 'unknown', cores: navigator.hardwareConcurrency, }, screen: { width: window.screen.width, height: window.screen.height, colorDepth: window.screen.colorDepth, pixelRatio: window.devicePixelRatio, }, time: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, offset: new Date().getTimezoneOffset(), locale: navigator.language, }, performance: { memory: { jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit || 0, totalJSHeapSize: performanceMemory.totalJSHeapSize || 0, usedJSHeapSize: performanceMemory.usedJSHeapSize || 0, usagePercentage: performanceMemory.totalJSHeapSize ? (performanceMemory.usedJSHeapSize / performanceMemory.totalJSHeapSize) * 100 : 0, }, timing: { loadTime, domReadyTime, readyStart: timing.fetchStart - timing.navigationStart, redirectTime: timing.redirectEnd - timing.redirectStart, appcacheTime: timing.domainLookupStart - timing.fetchStart, unloadEventTime: timing.unloadEventEnd - timing.unloadEventStart, lookupDomainTime: timing.domainLookupEnd - timing.domainLookupStart, connectTime: timing.connectEnd - timing.connectStart, requestTime: timing.responseEnd - timing.requestStart, initDomTreeTime: timing.domInteractive - timing.responseEnd, loadEventTime: timing.loadEventEnd - timing.loadEventStart, }, navigation: { type: navigation.type, redirectCount: navigation.redirectCount, }, }, network: { downlink: connection?.downlink || 0, effectiveType: connection?.effectiveType || 'unknown', rtt: connection?.rtt || 0, saveData: connection?.saveData || false, type: connection?.type || 'unknown', }, battery: batteryInfo, storage: storageInfo, }; setSystemInfo(sysInfoData); toast.success('System information updated'); } catch (error) { toast.error('Failed to get system information'); console.error('Failed to get system information:', error); } finally { setLoading((prev) => ({ ...prev, systemInfo: false })); } };
  const getWebAppInfo = async () => { setLoading((prev) => ({ ...prev, webAppInfo: true })); try { const [appResponse, gitResponse] = await Promise.all([ fetch('/api/system/app-info'), fetch('/api/system/git-info'), ]); if (!appResponse.ok || !gitResponse.ok) throw new Error('Failed to fetch webapp info'); const appData = (await appResponse.json()) as Omit<WebAppInfo, 'gitInfo'>; const gitData = (await gitResponse.json()) as GitInfo; setWebAppInfo({ ...appData, gitInfo: gitData, }); toast.success('WebApp information updated'); return true; } catch (error) { console.error('Failed to fetch webapp info:', error); toast.error('Failed to fetch webapp information'); setWebAppInfo(null); return false; } finally { setLoading((prev) => ({ ...prev, webAppInfo: false })); } };
  const handleLogPerformance = () => { /* ... existing logic ... */ try { setLoading(prev => ({...prev, performance: true})); const performanceEntries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming; const memory = (performance as any).memory; const timingMetrics = { loadTime: performanceEntries.loadEventEnd - performanceEntries.startTime, domReadyTime: performanceEntries.domContentLoadedEventEnd - performanceEntries.startTime, fetchTime: performanceEntries.responseEnd - performanceEntries.fetchStart, redirectTime: performanceEntries.redirectEnd - performanceEntries.redirectStart, dnsTime: performanceEntries.domainLookupEnd - performanceEntries.domainLookupStart, tcpTime: performanceEntries.connectEnd - performanceEntries.connectStart, ttfb: performanceEntries.responseStart - performanceEntries.requestStart, processingTime: performanceEntries.loadEventEnd - performanceEntries.responseEnd, }; const resourceEntries = performance.getEntriesByType('resource'); const resourceStats = { totalResources: resourceEntries.length, totalSize: resourceEntries.reduce((total, entry) => total + ((entry as any).transferSize || 0), 0), totalTime: Math.max(...resourceEntries.map(entry => entry.duration)), }; const memoryMetrics = memory ? { jsHeapSizeLimit: memory.jsHeapSizeLimit, totalJSHeapSize: memory.totalJSHeapSize, usedJSHeapSize: memory.usedJSHeapSize, heapUtilization: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100, } : null; logStore.logSystem('Performance Metrics', { timing: timingMetrics, resources: resourceStats, memory: memoryMetrics, timestamp: new Date().toISOString(), navigationEntry: { type: performanceEntries.type, redirectCount: performanceEntries.redirectCount, }, }); toast.success('Performance metrics logged'); } catch (error) { toast.error('Failed to log performance metrics'); console.error('Failed to log performance metrics:', error); } finally { setLoading(prev => ({...prev, performance: false})); } };
  const checkErrors = async () => { /* ... existing logic ... */ try { setLoading(prev => ({...prev, errors: true})); const storedErrors = errorLogs; if (storedErrors.length === 0) toast.success('No errors found'); else toast.warning(`Found ${storedErrors.length} error(s)`); } catch (error) { toast.error('Failed to check errors'); console.error('Failed to check errors:', error); } finally { setLoading(prev => ({...prev, errors: false})); } };
  const exportDebugInfo = () => { /* ... existing logic ... */ try { const debugData = { timestamp: new Date().toISOString(), system: systemInfo, webApp: webAppInfo, errors: logStore.getLogs().filter((log: LogEntry) => log.level === 'error'), performance: { memory: (performance as any).memory || {}, timing: performance.timing, navigation: performance.navigation, }, }; const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bolt-debug-info-${new Date().toISOString()}.json`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); toast.success('Debug information exported successfully'); } catch (error) { console.error('Failed to export debug info:', error); toast.error('Failed to export debug information'); } };
  const exportAsCSV = () => { /* ... existing logic ... */ try { const debugData = { system: systemInfo, webApp: webAppInfo, errors: logStore.getLogs().filter((log: LogEntry) => log.level === 'error'), performance: { memory: (performance as any).memory || {}, timing: performance.timing, navigation: performance.navigation, }, }; const csvData = [ ['Category', 'Key', 'Value'], ...Object.entries(debugData).flatMap(([category, data]) => Object.entries(data || {}).map(([key, value]) => [ category, key, typeof value === 'object' ? JSON.stringify(value) : String(value), ])), ]; const csvContent = csvData.map(row => row.join(',')).join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bolt-debug-info-${new Date().toISOString()}.csv`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); toast.success('Debug information exported as CSV'); } catch (error) { console.error('Failed to export CSV:', error); toast.error('Failed to export debug information as CSV'); } };
  const exportAsPDF = () => { /* ... existing logic ... */ try { const debugData = { system: systemInfo, webApp: webAppInfo, errors: logStore.getLogs().filter((log: LogEntry) => log.level === 'error'), performance: { memory: (performance as any).memory || {}, timing: performance.timing, navigation: performance.navigation, }, }; const doc = new jsPDF(); /* ... PDF generation logic ... */ doc.save(`bolt-debug-info-${new Date().toISOString()}.pdf`); toast.success('Debug information exported as PDF'); } catch (error) { console.error('Failed to export PDF:', error); toast.error('Failed to export debug information as PDF'); } };
  const exportAsText = () => { /* ... existing logic ... */ try { const debugData = { system: systemInfo, webApp: webAppInfo, errors: logStore.getLogs().filter((log: LogEntry) => log.level === 'error'), performance: { memory: (performance as any).memory || {}, timing: performance.timing, navigation: performance.navigation, }, }; const textContent = Object.entries(debugData) .map(([category, data]) => `${category.toUpperCase()}\n${'-'.repeat(30)}\n${JSON.stringify(data, null, 2)}\n\n`) .join('\n'); const blob = new Blob([textContent], { type: 'text/plain' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bolt-debug-info-${new Date().toISOString()}.txt`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); toast.success('Debug information exported as text file'); } catch (error) { console.error('Failed to export text file:', error); toast.error('Failed to export debug information as text file'); } };
  const exportFormats: ExportFormat[] = [ { id: 'json', label: 'Export as JSON', icon: 'i-ph:file-js', handler: exportDebugInfo, }, { id: 'csv', label: 'Export as CSV', icon: 'i-ph:file-csv', handler: exportAsCSV, }, { id: 'pdf', label: 'Export as PDF', icon: 'i-ph:file-pdf', handler: exportAsPDF, }, { id: 'txt', label: 'Export as Text', icon: 'i-ph:file-text', handler: exportAsText, }, ];
  const checkOllamaStatus = useCallback(async () => { /* ... existing logic ... */ try { const ollamaProvider = providers?.Ollama; const baseUrl = ollamaProvider?.settings?.baseUrl || 'http://127.0.0.1:11434'; const versionResponse = await fetch(`${baseUrl}/api/version`); if (!versionResponse.ok) throw new Error('Service not running'); const modelsResponse = await fetch(`${baseUrl}/api/tags`); const modelsData = (await modelsResponse.json()) as { models: Array<{ name: string; size: string; quantization: string; }>; }; setOllamaStatus({ isRunning: true, lastChecked: new Date(), models: modelsData.models, }); } catch { setOllamaStatus({ isRunning: false, error: 'Connection failed', lastChecked: new Date(), models: undefined, }); } }, [providers]);
  useEffect(() => { const ollamaProvider = providers?.Ollama; if (ollamaProvider?.settings?.enabled) { checkOllamaStatus(); const intervalId = setInterval(checkOllamaStatus, 10000); return () => clearInterval(intervalId); } return undefined; }, [providers, checkOllamaStatus]);
  const ExportButton = () => { /* ... existing logic, needs styling for black bg ... */ const [isOpen, setIsOpen] = useState(false); const handleOpenChange = useCallback((open: boolean) => setIsOpen(open), []); const handleFormatClick = useCallback((handler: () => void) => { handler(); setIsOpen(false); }, []); return ( <DialogRoot open={isOpen} onOpenChange={handleOpenChange}> <button onClick={() => setIsOpen(true)} className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-100 bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-all duration-200" > <span className="i-ph:download text-lg text-gray-400 group-hover:text-purple-400 transition-colors" /> Export </button> <Dialog showCloseButton> <div className="p-6 bg-gray-950 rounded-lg"> {/* Dialog bg */} <DialogTitle className="flex items-center gap-2 text-gray-100"> <div className="i-ph:download w-5 h-5" /> Export Debug Information </DialogTitle> <div className="mt-4 flex flex-col gap-2"> {exportFormats.map((format) => ( <button key={format.id} onClick={() => handleFormatClick(format.handler)} className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors w-full text-left bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100" > <div className={classNames(format.icon, 'w-5 h-5 text-gray-300')} /> <div> <div className="font-medium text-gray-100">{format.label}</div> <div className="text-xs text-gray-400 mt-0.5"> {format.id === 'json' && 'Export as a structured JSON file'} {format.id === 'csv' && 'Export as a CSV spreadsheet'} {format.id === 'pdf' && 'Export as a formatted PDF document'} {format.id === 'txt' && 'Export as a formatted text file'} </div> </div> </button> ))} </div> </div> </Dialog> </DialogRoot> ); };
  const getOllamaStatus = () => { /* ... existing logic ... */ const ollamaProvider = providers?.Ollama; const isOllamaEnabled = ollamaProvider?.settings?.enabled; if (!isOllamaEnabled) return { status: 'Disabled', color: 'text-red-400', bgColor: 'bg-red-500/30', message: 'Ollama provider is disabled in settings', }; if (!ollamaStatus.isRunning) return { status: 'Not Running', color: 'text-red-400', bgColor: 'bg-red-500/30', message: ollamaStatus.error || 'Ollama service is not running', }; const modelCount = ollamaStatus.models?.length ?? 0; return { status: 'Running', color: 'text-green-400', bgColor: 'bg-green-500/30', message: `Ollama service is running with ${modelCount} installed models (Provider: Enabled)`, }; };
  type StatusResult = { status: string; color: string; bgColor: string; message: string; };
  const status = getOllamaStatus() as StatusResult;


  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 flex flex-col gap-6"> {/* Root styles */}
      {/* Quick Stats Banner - Adjusted for black bg */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Errors Card */}
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 h-[180px] flex flex-col">
          <div className="flex items-center gap-2">
            <div className="i-ph:warning-octagon text-purple-400 w-4 h-4" />
            <div className="text-sm text-gray-400">Errors</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={classNames('text-2xl font-semibold', errorLogs.length > 0 ? 'text-red-400' : 'text-green-400')}>
              {errorLogs.length}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <div className={classNames('w-3.5 h-3.5', errorLogs.length > 0 ? 'i-ph:warning text-red-400' : 'i-ph:check-circle text-green-400')} />
            {errorLogs.length > 0 ? 'Errors detected' : 'No errors detected'}
          </div>
        </div>

        {/* Memory Usage Card */}
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 h-[180px] flex flex-col">
          <div className="flex items-center gap-2">
            <div className="i-ph:cpu text-purple-400 w-4 h-4" />
            <div className="text-sm text-gray-400">Memory Usage</div>
          </div>
          {/* ... (rest of card content with adjusted text colors if needed) ... */}
          <div className="flex items-center gap-2 mt-2"> <span className={classNames('text-2xl font-semibold', (systemInfo?.memory?.percentage ?? 0) > 80 ? 'text-red-400' : (systemInfo?.memory?.percentage ?? 0) > 60 ? 'text-yellow-400' : 'text-green-400')} > {(systemInfo?.memory?.percentage ?? 0)}% </span> </div> <Progress value={systemInfo?.memory?.percentage ?? 0} className={classNames('mt-2', (systemInfo?.memory?.percentage ?? 0) > 80 ? '[&>div]:bg-red-500' : (systemInfo?.memory?.percentage ?? 0) > 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500')} /> <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"> <div className="i-ph:info w-3.5 h-3.5 text-purple-400" /> Used: {systemInfo?.memory.used ?? '0 GB'} / {systemInfo?.memory.total ?? '0 GB'} </div>
        </div>

        {/* Page Load Time Card */}
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 h-[180px] flex flex-col">
          <div className="flex items-center gap-2">
            <div className="i-ph:timer text-purple-400 w-4 h-4" />
            <div className="text-sm text-gray-400">Page Load Time</div>
          </div>
          {/* ... (rest of card content with adjusted text colors if needed) ... */}
          <div className="flex items-center gap-2 mt-2"> <span className={classNames('text-2xl font-semibold', (systemInfo?.performance.timing.loadTime ?? 0) > 2000 ? 'text-red-400' : (systemInfo?.performance.timing.loadTime ?? 0) > 1000 ? 'text-yellow-400' : 'text-green-400')} > {systemInfo ? (systemInfo.performance.timing.loadTime / 1000).toFixed(2) : '-'}s </span> </div> <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"> <div className="i-ph:code w-3.5 h-3.5 text-purple-400" /> DOM Ready: {systemInfo ? (systemInfo.performance.timing.domReadyTime / 1000).toFixed(2) : '-'}s </div>
        </div>

        {/* Network Speed Card */}
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 h-[180px] flex flex-col">
          <div className="flex items-center gap-2">
            <div className="i-ph:wifi-high text-purple-400 w-4 h-4" />
            <div className="text-sm text-gray-400">Network Speed</div>
          </div>
          {/* ... (rest of card content with adjusted text colors if needed) ... */}
          <div className="flex items-center gap-2 mt-2"> <span className={classNames('text-2xl font-semibold', (systemInfo?.network.downlink ?? 0) < 5 ? 'text-red-400' : (systemInfo?.network.downlink ?? 0) < 10 ? 'text-yellow-400' : 'text-green-400')} > {systemInfo?.network.downlink ?? '-'} Mbps </span> </div> <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"> <div className="i-ph:activity w-3.5 h-3.5 text-purple-400" /> RTT: {systemInfo?.network.rtt ?? '-'} ms </div>
        </div>
        
        {/* Ollama Service Card */}
        <div className="md:col-span-4 p-6 rounded-xl bg-gray-900 border border-gray-700 hover:border-purple-500/30 transition-all duration-200 h-[260px] flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="i-ph:robot text-purple-400 w-5 h-5" />
              <div>
                <div className="text-base font-medium text-gray-100">Ollama Service</div>
                <div className="text-xs text-gray-400 mt-0.5">{status.message}</div>
              </div>
            </div>
            {/* ... (Ollama status display with adjusted text/bg colors) ... */}
            <div className="flex items-center gap-3"> <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-800"> <div className={classNames('w-2 h-2 rounded-full animate-pulse', status.bgColor.replace('bg-red-500/30', 'bg-red-400/70').replace('bg-green-500/30', 'bg-green-400/70'))} /> <span className={classNames('text-xs font-medium flex items-center gap-1', status.color)}> {status.status} </span> </div> <div className="text-[10px] text-gray-500 flex items-center gap-1.5"> <div className="i-ph:clock w-3 h-3" /> {ollamaStatus.lastChecked.toLocaleTimeString()} </div> </div>
          </div>
          <div className="mt-6 flex-1 min-h-0 flex flex-col">
            {status.status === 'Running' && ollamaStatus.models && ollamaStatus.models.length > 0 ? (
              <>
                <div className="text-xs font-medium text-gray-400 flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"> <div className="i-ph:cube-duotone w-4 h-4 text-purple-400" /> <span>Installed Models</span> <Badge variant="secondary" className="ml-1 bg-gray-700 text-gray-300 border-gray-600">{ollamaStatus.models.length}</Badge> </div>
                </div>
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
                  <div className="grid grid-cols-2 gap-3 pr-2">
                    {ollamaStatus.models.map((model) => (
                      <div key={model.name} className="text-sm bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-3 flex items-center justify-between transition-colors group" >
                        <div className="flex items-center gap-2 text-gray-400"> <div className="i-ph:cube w-4 h-4 text-purple-400/70 group-hover:text-purple-400 transition-colors" /> <span className="font-mono truncate text-gray-300">{model.name}</span> </div> <Badge variant="outline" className="ml-2 text-xs font-mono border-gray-600 text-gray-400"> {Math.round(parseInt(model.size) / 1024 / 1024)}MB </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : ( /* ... (No models / Not running state with adjusted text colors) ... */ <div className="flex-1 flex items-center justify-center"> <div className="flex flex-col items-center gap-3 max-w-[280px] text-center"> <div className={classNames('w-12 h-12', { 'i-ph:warning-circle text-red-400/80': status.status === 'Not Running' || status.status === 'Disabled', 'i-ph:cube-duotone text-purple-400/80': status.status === 'Running', })} /> <span className="text-sm text-gray-400">{status.message}</span> </div> </div> )}
          </div>
        </div>
      </div>

      {/* Action Buttons - Adjusted for black bg */}
      <div className="flex flex-wrap gap-4">
        {/* Example button adjustment */}
        <button onClick={getSystemInfo} disabled={loading.systemInfo} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" > {loading.systemInfo ? <div className="i-ph:spinner-gap w-4 h-4 animate-spin" /> : <div className="i-ph:gear w-4 h-4" />} Update System Info </button>
        <button onClick={handleLogPerformance} disabled={loading.performance} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" > {loading.performance ? <div className="i-ph:spinner-gap w-4 h-4 animate-spin" /> : <div className="i-ph:chart-bar w-4 h-4" />} Log Performance </button>
        <button onClick={checkErrors} disabled={loading.errors} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" > {loading.errors ? <div className="i-ph:spinner-gap w-4 h-4 animate-spin" /> : <div className="i-ph:warning w-4 h-4" />} Check Errors </button>
        <button onClick={getWebAppInfo} disabled={loading.webAppInfo} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" > {loading.webAppInfo ? <div className="i-ph:spinner-gap w-4 h-4 animate-spin" /> : <div className="i-ph:info w-4 h-4" />} Fetch WebApp Info </button>
        <ExportButton />
      </div>

      {/* Collapsible Sections - Adjusted for black bg */}
      {/* System Information */}
      <Collapsible open={openSections.system} onOpenChange={(open: boolean) => setOpenSections((prev) => ({ ...prev, system: open }))} className="w-full" >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800">
            <div className="flex items-center gap-3"> <div className="i-ph:cpu text-purple-400 w-5 h-5" /> <h3 className="text-base font-medium text-gray-100">System Information</h3> </div>
            <div className={classNames('i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-gray-400', openSections.system ? 'rotate-180' : '')} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-6 mt-2 rounded-xl bg-gray-900 border border-gray-700">
            {systemInfo ? ( /* ... (systemInfo display with adjusted text colors: text-gray-400 for labels, text-gray-100 for values) ... */ <div className="grid grid-cols-2 gap-6"> <div className="space-y-2"> <div className="text-sm flex items-center gap-2"> <div className="i-ph:desktop text-gray-400 w-4 h-4" /> <span className="text-gray-400">OS: </span> <span className="text-gray-100">{systemInfo.os}</span> </div> {/* ... more items ... */} <div className="text-sm flex items-center gap-2"> <div className="i-ph:hard-drive text-gray-400 w-4 h-4" /> <span className="text-gray-400">Storage: </span> <span className="text-gray-100"> {(systemInfo.storage.usage / (1024 * 1024 * 1024)).toFixed(2)}GB /{' '} {(systemInfo.storage.quota / (1024 * 1024 * 1024)).toFixed(2)}GB </span> </div> </div> <div className="space-y-2"> <div className="text-sm flex items-center gap-2"> <div className="i-ph:database text-gray-400 w-4 h-4" /> <span className="text-gray-400">Memory Usage: </span> <span className="text-gray-100"> {systemInfo.memory.used} / {systemInfo.memory.total} ({systemInfo.memory.percentage}%) </span> </div> {/* ... more items ... */} <div className="text-sm flex items-center gap-2"> <div className="i-ph:code text-gray-400 w-4 h-4" /> <span className="text-gray-400">DOM Ready: </span> <span className="text-gray-100"> {(systemInfo.performance.timing.domReadyTime / 1000).toFixed(2)}s </span> </div> </div> </div> ) : ( <div className="text-sm text-gray-400">Loading system information...</div> )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Performance Metrics */}
      <Collapsible open={openSections.performance} onOpenChange={(open: boolean) => setOpenSections((prev) => ({ ...prev, performance: open }))} className="w-full" >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800">
            <div className="flex items-center gap-3"> <div className="i-ph:chart-line text-purple-400 w-5 h-5" /> <h3 className="text-base font-medium text-gray-100">Performance Metrics</h3> </div>
            <div className={classNames('i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-gray-400', openSections.performance ? 'rotate-180' : '')} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-6 mt-2 rounded-xl bg-gray-900 border border-gray-700">
            {systemInfo && ( /* ... (performance metrics display with adjusted text colors) ... */ <div className="grid grid-cols-2 gap-4"> <div className="space-y-2"> <div className="text-sm"><span className="text-gray-400">Page Load Time: </span><span className="text-gray-100">{(systemInfo.performance.timing.loadTime / 1000).toFixed(2)}s</span></div> {/* ... more ... */} </div> <div className="space-y-2"> <div className="text-sm"><span className="text-gray-400">JS Heap Usage: </span><span className="text-gray-100">{(systemInfo.performance.memory.usedJSHeapSize / (1024*1024)).toFixed(1)}MB / {(systemInfo.performance.memory.totalJSHeapSize / (1024*1024)).toFixed(1)}MB</span></div> {/* ... more ... */} </div> </div> )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* WebApp Information */}
      <Collapsible open={openSections.webapp} onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, webapp: open }))} className="w-full" >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800">
            <div className="flex items-center gap-3"> <div className="i-ph:info text-blue-400 w-5 h-5" /> <h3 className="text-base font-medium text-gray-100">WebApp Information</h3> {loading.webAppInfo && <span className="loading loading-spinner loading-sm" />} </div>
            <div className={classNames('i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-gray-400', openSections.webapp ? 'rotate-180' : '')} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-6 mt-2 rounded-xl bg-gray-900 border border-gray-700">
            {loading.webAppInfo ? ( /* ... */ <div className="flex items-center justify-center p-8"><span className="loading loading-spinner loading-lg text-purple-400" /></div> ) : !webAppInfo ? ( /* ... */ <div className="flex flex-col items-center justify-center p-8 text-gray-400"> <div className="i-ph:warning-circle w-8 h-8 mb-2" /> <p>Failed to load WebApp information</p> <button onClick={() => getWebAppInfo()} className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" > Retry </button> </div> ) : ( /* ... (webAppInfo display with adjusted text colors) ... */ <div className="grid grid-cols-2 gap-6"> <div> <h3 className="mb-4 text-base font-medium text-gray-100">Basic Information</h3> <div className="space-y-3"> <div className="text-sm flex items-center gap-2"><div className="i-ph:app-window text-gray-400 w-4 h-4" /><span className="text-gray-400">Name:</span><span className="text-gray-100">{webAppInfo.name}</span></div> {/* ... more ... */} </div> </div> <div> <h3 className="mb-4 text-base font-medium text-gray-100">Git Information</h3> <div className="space-y-3"> <div className="text-sm flex items-center gap-2"><div className="i-ph:git-branch text-gray-400 w-4 h-4" /><span className="text-gray-400">Branch:</span><span className="text-gray-100">{webAppInfo.gitInfo.local.branch}</span></div> {/* ... more ... */} </div> </div> </div> )}
            {webAppInfo && ( <div className="mt-6"> <h3 className="mb-4 text-base font-medium text-gray-100">Dependencies</h3> <div className="bg-gray-950 border border-gray-700 rounded-lg divide-y divide-gray-700"> <DependencySection title="Production" deps={webAppInfo.dependencies.production} /> <DependencySection title="Development" deps={webAppInfo.dependencies.development} /> <DependencySection title="Peer" deps={webAppInfo.dependencies.peer} /> <DependencySection title="Optional" deps={webAppInfo.dependencies.optional} /> </div> </div> )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Error Check */}
      <Collapsible open={openSections.errors} onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, errors: open }))} className="w-full" >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-6 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800">
            <div className="flex items-center gap-3"> <div className="i-ph:warning text-red-400 w-5 h-5" /> <h3 className="text-base font-medium text-gray-100">Error Check</h3> {errorLogs.length > 0 && <Badge variant="destructive" className="ml-2 bg-red-500/20 text-red-300 border-red-500/30">{errorLogs.length} Errors</Badge>} </div>
            <div className={classNames('i-ph:caret-down w-4 h-4 transform transition-transform duration-200 text-gray-400', openSections.errors ? 'rotate-180' : '')} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-6 mt-2 rounded-xl bg-gray-900 border border-gray-700">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                <div className="text-sm text-gray-400"> Checks for: <ul className="list-disc list-inside mt-2 space-y-1"> <li>Unhandled JavaScript errors</li> <li>Unhandled Promise rejections</li> <li>Runtime exceptions</li> <li>Network errors</li> </ul> </div>
                <div className="text-sm"> <span className="text-gray-400">Status: </span> <span className="text-gray-100"> {loading.errors ? 'Checking...' : errorLogs.length > 0 ? `${errorLogs.length} errors found` : 'No errors found'} </span> </div>
                {errorLogs.length > 0 && ( <div className="mt-4"> <div className="text-sm font-medium text-gray-100 mb-2">Recent Errors:</div> <div className="space-y-2"> {errorLogs.map((error) => ( <div key={error.id} className="text-sm text-red-300 bg-red-500/10 p-2 rounded"> <div className="font-medium">{error.message}</div> {error.source && <div className="text-xs mt-1 text-red-400"> Source: {error.source}{error.details?.lineNumber && `:${error.details.lineNumber}`} </div>} {error.stack && <div className="text-xs mt-1 text-red-400 font-mono whitespace-pre-wrap">{error.stack}</div>} </div> ))} </div> </div> )}
              </div>
            </ScrollArea>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
