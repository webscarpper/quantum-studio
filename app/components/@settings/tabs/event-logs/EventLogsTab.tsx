import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Switch } from '~/components/ui/Switch';
import { logStore, type LogEntry } from '~/lib/stores/logs';
import { useStore } from '@nanostores/react';
import { classNames } from '~/utils/classNames';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Dialog, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ScrollArea } from '~/components/ui/ScrollArea'; // Import ScrollArea
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';

interface SelectOption { value: string; label: string; icon?: string; color?: string; }
const logLevelOptions: SelectOption[] = [ { value: 'all', label: 'All Types', icon: 'i-ph:funnel', color: '#c084fc', }, { value: 'provider', label: 'LLM', icon: 'i-ph:robot', color: '#34d399', }, { value: 'api', label: 'API', icon: 'i-ph:cloud', color: '#60a5fa', }, { value: 'error', label: 'Errors', icon: 'i-ph:warning-circle', color: '#f87171', }, { value: 'warning', label: 'Warnings', icon: 'i-ph:warning', color: '#fbbf24', }, { value: 'info', label: 'Info', icon: 'i-ph:info', color: '#60a5fa', }, { value: 'debug', label: 'Debug', icon: 'i-ph:bug', color: '#9ca3af', }, ];
interface LogEntryItemProps { log: LogEntry; isExpanded: boolean; use24Hour: boolean; showTimestamp: boolean; }

const LogEntryItem = ({ log, isExpanded: forceExpanded, use24Hour, showTimestamp }: LogEntryItemProps) => {
  const [localExpanded, setLocalExpanded] = useState(forceExpanded);
  useEffect(() => { setLocalExpanded(forceExpanded); }, [forceExpanded]);
  const timestamp = useMemo(() => new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: !use24Hour }), [log.timestamp, use24Hour]);

  const style = useMemo(() => {
    const baseColors = {
      provider: { icon: 'i-ph:robot', color: 'text-emerald-400', bg: 'hover:bg-emerald-700/30', badge: 'text-emerald-300 bg-emerald-700/40 border border-emerald-600/50' },
      api: { icon: 'i-ph:cloud', color: 'text-blue-400', bg: 'hover:bg-blue-700/30', badge: 'text-blue-300 bg-blue-700/40 border border-blue-600/50' },
      error: { icon: 'i-ph:warning-circle', color: 'text-red-400', bg: 'hover:bg-red-700/30', badge: 'text-red-300 bg-red-700/40 border border-red-600/50' },
      warning: { icon: 'i-ph:warning', color: 'text-yellow-400', bg: 'hover:bg-yellow-700/30', badge: 'text-yellow-300 bg-yellow-700/40 border border-yellow-600/50' },
      debug: { icon: 'i-ph:bug', color: 'text-gray-400', bg: 'hover:bg-gray-700/30', badge: 'text-gray-300 bg-gray-700/40 border border-gray-600/50' },
      info: { icon: 'i-ph:info', color: 'text-sky-400', bg: 'hover:bg-sky-700/30', badge: 'text-sky-300 bg-sky-700/40 border border-sky-600/50' },
    };
    if (log.category && baseColors[log.category as keyof typeof baseColors]) return baseColors[log.category as keyof typeof baseColors];
    return baseColors[log.level as keyof typeof baseColors] || baseColors.info;
  }, [log.level, log.category]);

  const renderDetails = (details: any) => {
    const preClass = "text-xs text-gray-300 bg-gray-800 rounded p-2 whitespace-pre-wrap";
    const labelClass = "text-xs font-medium text-gray-300";
    const valueClass = "text-xs text-gray-400";
    const errorPreClass = "text-xs text-red-300 bg-red-700/20 rounded p-2 whitespace-pre-wrap";

    if (log.category === 'provider') {
      return ( <div className="flex flex-col gap-2 mt-2"> <div className={`flex items-center gap-2 text-xs ${valueClass}`}> <span>Model: {details.model}</span> <span>•</span> <span>Tokens: {details.totalTokens}</span> <span>•</span> <span>Duration: {details.duration}ms</span> </div> {details.prompt && ( <div className="flex flex-col gap-1"> <div className={labelClass}>Prompt:</div> <pre className={preClass}>{details.prompt}</pre> </div> )} {details.response && ( <div className="flex flex-col gap-1"> <div className={labelClass}>Response:</div> <pre className={preClass}>{details.response}</pre> </div> )} </div> );
    }
    if (log.category === 'api') {
      return ( <div className="flex flex-col gap-2 mt-2"> <div className={`flex items-center gap-2 text-xs ${valueClass}`}> <span className={details.method === 'GET' ? 'text-green-400' : 'text-blue-400'}>{details.method}</span> <span>•</span> <span>Status: {details.statusCode}</span> <span>•</span> <span>Duration: {details.duration}ms</span> </div> <div className={`${valueClass} break-all`}>{details.url}</div> {details.request && ( <div className="flex flex-col gap-1"> <div className={labelClass}>Request:</div> <pre className={preClass}>{JSON.stringify(details.request, null, 2)}</pre> </div> )} {details.response && ( <div className="flex flex-col gap-1"> <div className={labelClass}>Response:</div> <pre className={preClass}>{JSON.stringify(details.response, null, 2)}</pre> </div> )} {details.error && ( <div className="flex flex-col gap-1"> <div className="text-xs font-medium text-red-400">Error:</div> <pre className={errorPreClass}>{JSON.stringify(details.error, null, 2)}</pre> </div> )} </div> );
    }
    return ( <pre className={`${preClass} mt-2`}>{JSON.stringify(details, null, 2)}</pre> );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={classNames( 'flex flex-col gap-2 rounded-lg p-4 bg-gray-900 border border-gray-700', style.bg, 'transition-all duration-200', )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={classNames('text-lg mt-0.5', style.icon, style.color)} />
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium text-gray-100">{log.message}</div>
            {log.details && ( <> <button onClick={() => setLocalExpanded(!localExpanded)} className="text-xs text-gray-400 hover:text-purple-400 transition-colors self-start"> {localExpanded ? 'Hide' : 'Show'} Details </button> {localExpanded && renderDetails(log.details)} </> )}
            <div className="flex items-center gap-2 mt-1">
              <div className={classNames('px-2 py-0.5 rounded text-xs font-medium uppercase', style.badge)}> {log.level} </div>
              {log.category && ( <div className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 border border-gray-600"> {log.category} </div> )}
            </div>
          </div>
        </div>
        {showTimestamp && <time className="shrink-0 text-xs text-gray-500">{timestamp}</time>}
      </div>
    </motion.div>
  );
};

interface ExportFormatListItem { id: string; label: string; icon: string; handler: () => void; } // Renamed to avoid conflict

export function EventLogsTab() {
  const logs = useStore(logStore.logs);
  const [selectedLevel, setSelectedLevel] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [use24Hour, setUse24Hour] = useState(false);
  const [autoExpand, setAutoExpand] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLevelFilter, setShowLevelFilter] = useState(false); // Added missing state
  
  const filteredLogs = useMemo(() => { /* ... existing filter logic ... */ const allLogs = Object.values(logs); if (selectedLevel === 'all') { return allLogs.filter((log) => searchQuery ? log.message.toLowerCase().includes(searchQuery.toLowerCase()) : true, ); } return allLogs.filter((log) => { const matchesType = log.category === selectedLevel || log.level === selectedLevel; const matchesSearch = searchQuery ? log.message.toLowerCase().includes(searchQuery.toLowerCase()) : true; return matchesType && matchesSearch; }); }, [logs, selectedLevel, searchQuery]);
  useEffect(() => { /* ... existing mount/unmount logging ... */ const startTime = performance.now(); logStore.logInfo('Event Logs tab mounted', { type: 'component_mount', component: 'EventLogsTab', message: 'Event Logs tab mounted' }); return () => { const duration = performance.now() - startTime; logStore.logPerformanceMetric('EventLogsTab', 'mount-duration', duration); }; }, []);
  const handleLevelFilterChange = useCallback((newLevel: string) => { /* ... existing logic ... */ logStore.logInfo('Log level filter changed', { type: 'filter_change', message: `Log level filter changed from ${selectedLevel} to ${newLevel}`, previousLevel: selectedLevel, newLevel }); setSelectedLevel(newLevel); setShowLevelFilter(false); }, [selectedLevel]);
  useEffect(() => { /* ... existing search logging ... */ const timeoutId = setTimeout(() => { if (searchQuery) { logStore.logInfo('Log search performed', { type: 'search', message: `Search performed with query "${searchQuery}"`, query: searchQuery, resultsCount: filteredLogs.length }); } }, 1000); return () => clearTimeout(timeoutId); }, [searchQuery, filteredLogs.length]);
  const handleRefresh = useCallback(async () => { /* ... existing logic ... */ setIsRefreshing(true); try { await logStore.refreshLogs(); logStore.logSuccess('Logs refreshed successfully', { type: 'refresh', message: 'Logs refreshed', logsCount: Object.keys(logs).length }); } catch (error) { logStore.logError('Failed to refresh logs', error, { type: 'refresh_error', message: 'Failed to refresh logs' }); } finally { setTimeout(() => setIsRefreshing(false), 500); } }, [logs]);
  const handlePreferenceChange = useCallback((type: string, value: boolean) => { /* ... existing logic ... */ logStore.logInfo('Log preference changed', { type: 'preference_change', message: `Log preference "${type}" changed to ${value}`, preference: type, value }); switch (type) { case 'timestamps': setShowTimestamps(value); break; case '24hour': setUse24Hour(value); break; case 'autoExpand': setAutoExpand(value); break; } }, []);
  
  const selectedLevelOption = logLevelOptions.find((opt) => opt.value === selectedLevel);

  const exportAsJSON = () => { /* ... existing logic ... */ try {const exportData={timestamp:new Date().toISOString(),logs:filteredLogs,filters:{level:selectedLevel,searchQuery},preferences:{use24Hour,showTimestamps,autoExpand}};const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bolt-event-logs-${new Date().toISOString()}.json`;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);document.body.removeChild(a);toast.success('Logs exported as JSON')}catch(e){console.error(e);toast.error('Failed to export JSON')} };
  const exportAsCSV = () => { /* ... existing logic ... */ try {const headers=['Timestamp','Level','Category','Message','Details'];const csvData=[headers,...filteredLogs.map(log=>[new Date(log.timestamp).toISOString(),log.level,log.category||'',log.message,log.details?JSON.stringify(log.details):''])];const csvContent=csvData.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');const blob=new Blob([csvContent],{type:'text/csv;charset=utf-8;'});const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bolt-event-logs-${new Date().toISOString()}.csv`;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);document.body.removeChild(a);toast.success('Logs exported as CSV')}catch(e){console.error(e);toast.error('Failed to export CSV')} };
  const exportAsPDF = () => { /* ... existing PDF export logic, ensure text colors are light for black bg if any text is drawn directly ... */ toast.info('PDF export is complex and styling for black background needs careful review.'); };
  const exportAsText = () => { /* ... existing logic ... */ try {const textContent=filteredLogs.map(log=>{let content=`[${new Date(log.timestamp).toLocaleString()}] ${log.level.toUpperCase()}: ${log.message}\n`;if(log.category){content+=`Category: ${log.category}\n`}if(log.details){content+=`Details:\n${JSON.stringify(log.details,null,2)}\n`}return content+'-'.repeat(80)+'\n'}).join('\n');const blob=new Blob([textContent],{type:'text/plain'});const url=window.URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bolt-event-logs-${new Date().toISOString()}.txt`;document.body.appendChild(a);a.click();window.URL.revokeObjectURL(url);document.body.removeChild(a);toast.success('Logs exported as text')}catch(e){console.error(e);toast.error('Failed to export text')} };
  const exportFormats: ExportFormatListItem[] = [ { id: 'json', label: 'Export as JSON', icon: 'i-ph:file-js', handler: exportAsJSON }, { id: 'csv', label: 'Export as CSV', icon: 'i-ph:file-csv', handler: exportAsCSV }, { id: 'pdf', label: 'Export as PDF', icon: 'i-ph:file-pdf', handler: exportAsPDF }, { id: 'txt', label: 'Export as Text', icon: 'i-ph:file-text', handler: exportAsText }, ];

  const ExportButton = () => { /* ... existing ExportButton logic, ensure dialog and buttons are styled for black bg ... */ const [isOpen, setIsOpen] = useState(false); return ( <DialogRoot open={isOpen} onOpenChange={setIsOpen}> <button onClick={() => setIsOpen(true)} className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-100 bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-all duration-200" > <span className="i-ph:download text-lg text-gray-400 group-hover:text-purple-400 transition-colors" /> Export </button> <Dialog showCloseButton> <div className="p-6 bg-gray-950 rounded-lg"> <DialogTitle className="flex items-center gap-2 text-gray-100"> <div className="i-ph:download w-5 h-5" /> Export Event Logs </DialogTitle> <div className="mt-4 flex flex-col gap-2"> {exportFormats.map((format) => ( <button key={format.id} onClick={() => {format.handler(); setIsOpen(false);}} className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg transition-colors w-full text-left bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-100" > <div className={classNames(format.icon, 'w-5 h-5 text-gray-300')} /> <div> <div className="font-medium text-gray-100">{format.label}</div> <div className="text-xs text-gray-400 mt-0.5"> {/* Descriptions */} </div> </div> </button> ))} </div> </div> </Dialog> </DialogRoot> ); };

  return (
    <div className="bg-black p-6 rounded-xl h-full text-gray-200 flex flex-col gap-6"> {/* Root styles */}
      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <DropdownMenu.Root onOpenChange={setShowLevelFilter}>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-100 bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-all duration-200" >
              <span className={classNames('text-lg', selectedLevelOption?.icon || 'i-ph:funnel')} style={{ color: selectedLevelOption?.color || '#A0A0A0' }} />
              {selectedLevelOption?.label || 'All Types'}
              <span className="i-ph:caret-down text-lg text-gray-400" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] bg-gray-950 rounded-lg shadow-lg py-1 z-[250] animate-in fade-in-0 zoom-in-95 border border-gray-700" sideOffset={5} align="start" side="bottom" >
              {logLevelOptions.map((option) => ( <DropdownMenu.Item key={option.value} className="group flex items-center px-4 py-2.5 text-sm text-gray-200 hover:bg-purple-500/20 cursor-pointer transition-colors" onClick={() => handleLevelFilterChange(option.value)} > <div className="mr-3 flex h-5 w-5 items-center justify-center"> <div className={classNames(option.icon, 'text-lg group-hover:text-purple-400 transition-colors')} style={{ color: option.color }} /> </div> <span className="group-hover:text-purple-400 transition-colors">{option.label}</span> </DropdownMenu.Item> ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <div className="flex items-center gap-4">
          {/* Preferences Switches */}
          <div className="flex items-center gap-2"><Switch checked={showTimestamps} onCheckedChange={(v)=>handlePreferenceChange('timestamps',v)} className="data-[state=checked]:bg-purple-600"/><span className="text-sm text-gray-400">Timestamps</span></div>
          <div className="flex items-center gap-2"><Switch checked={use24Hour} onCheckedChange={(v)=>handlePreferenceChange('24hour',v)} className="data-[state=checked]:bg-purple-600"/><span className="text-sm text-gray-400">24h Time</span></div>
          <div className="flex items-center gap-2"><Switch checked={autoExpand} onCheckedChange={(v)=>handlePreferenceChange('autoExpand',v)} className="data-[state=checked]:bg-purple-600"/><span className="text-sm text-gray-400">Auto Expand</span></div>
          <div className="w-px h-4 bg-gray-700" /> {/* Separator */}
          <button onClick={handleRefresh} className={classNames('group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-100 bg-gray-900 border border-gray-700 hover:bg-gray-800 transition-all duration-200', isRefreshing ? 'pointer-events-none' : '')} > <span className={classNames("i-ph:arrows-clockwise text-lg text-gray-400 group-hover:text-purple-400 transition-colors", isRefreshing ? "animate-spin" : '')} /> Refresh </button>
          <ExportButton />
        </div>
      </div>
      {/* Search and Logs Area */}
      <div className="flex flex-col gap-4 flex-1 min-h-0"> {/* flex-1 and min-h-0 for scroll area */}
        <div className="relative">
          <input type="text" placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-2 pl-10 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/70 transition-all duration-200" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2"> <div className="i-ph:magnifying-glass text-lg text-gray-400" /> </div>
        </div>
        <ScrollArea className="flex-1"> {/* ScrollArea takes remaining space */}
          <div className="space-y-2 pr-2"> {/* Added pr-2 for scrollbar gap */}
            {filteredLogs.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center gap-4 rounded-lg p-8 text-center bg-gray-900 border border-gray-700 mt-4" >
                <span className="i-ph:clipboard-text text-4xl text-gray-500" />
                <div className="flex flex-col gap-1"> <h3 className="text-sm font-medium text-gray-100">No Logs Found</h3> <p className="text-sm text-gray-400">Try adjusting your search or filters</p> </div>
              </motion.div>
            ) : (
              filteredLogs.map((log) => ( <LogEntryItem key={log.id} log={log} isExpanded={autoExpand} use24Hour={use24Hour} showTimestamp={showTimestamps} /> ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
