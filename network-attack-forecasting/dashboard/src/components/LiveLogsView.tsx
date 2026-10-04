import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Pause, 
  Play, 
  Code, 
  Layers, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Clock, 
  FileJson,
  Filter
} from 'lucide-react';
import { LiveLogEntry, SecurityDecision, SystemHealthStatus } from '../types/prediction';

interface LiveLogsViewProps {
  logs: LiveLogEntry[];
  rawBackendJson: any;
  onClearLogs: () => void;
  isStreaming: boolean;
  onToggleStreaming: () => void;
  health: SystemHealthStatus;
  decision: SecurityDecision | null;
}

export const LiveLogsView: React.FC<LiveLogsViewProps> = ({
  logs,
  rawBackendJson,
  onClearLogs,
  isStreaming,
  onToggleStreaming,
  health,
  decision,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'raw-json'>('terminal');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && activeSubTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, activeSubTab]);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = 
      filterLevel === 'ALL' || 
      log.level === filterLevel || 
      log.category === filterLevel;

    const matchesSearch = 
      searchQuery === '' || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.timestamp.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rawBackendJson || {}, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `netforecast-soc-telemetry-${new Date().toISOString().slice(0, 19)}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-950/60 border-red-800/80';
      case 'WARN':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'SUCCESS':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      default:
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'WORLD_MODEL':
        return 'text-purple-400';
      case 'TOPOLOGY':
        return 'text-cyan-400';
      case 'MITRE':
        return 'text-orange-400';
      case 'XAI':
        return 'text-pink-400';
      case 'ALERT':
        return 'text-red-400';
      default:
        return 'text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Top SIEM Telemetry Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Terminal className="h-4 w-4" />
              <span>Real-Time SOC Event Stream &bull; 1-Second Telemetry</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              Live SOC Telemetry & Forensic Stream
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono flex items-center gap-1.5 ${
                isStreaming 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                {isStreaming ? '1.0s REAL-TIME POLLING' : 'STREAM PAUSED'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inspect millisecond-level telemetry emitted every second across AI World Model state predictions, topological graph metrics, MITRE techniques, and pipeline latency.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Total Events:</span>
              <span className="text-cyan-300 font-bold">{logs.length}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">Inference:</span>
              <span className="text-emerald-300 font-bold">{health.inferenceLatencyMs > 0 ? `${health.inferenceLatencyMs}ms` : '<1ms'}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-2">
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-slate-400">Rate:</span>
              <span className="text-purple-300 font-bold">1 Hz (1s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal & JSON Inspector Card */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Terminal Header Toolbar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          
          {/* Sub-tabs: Terminal vs Raw JSON */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('terminal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center space-x-2 border transition-all ${
                activeSubTab === 'terminal'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Live SOC Terminal ({filteredLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('raw-json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center space-x-2 border transition-all ${
                activeSubTab === 'raw-json'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Live Backend Output JSON</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Stream toggle */}
            <button
              onClick={onToggleStreaming}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border flex items-center space-x-1.5 transition-all ${
                isStreaming
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Pause 1s Stream</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-slate-300" />
                  <span>Resume 1s Stream</span>
                </>
              )}
            </button>

            {/* Auto-scroll toggle (only in terminal) */}
            {activeSubTab === 'terminal' && (
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all ${
                  autoScroll
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle automatic downward scrolling"
              >
                Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>
            )}

            {/* Copy button */}
            {activeSubTab === 'terminal' ? (
              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Copy all logs"
              >
                {copiedLogs ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            ) : (
              <button
                onClick={handleCopyJson}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Copy raw JSON payload"
              >
                {copiedJson ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            )}

            {/* Download logs */}
            {activeSubTab === 'terminal' && (
              <button
                onClick={handleDownloadLogs}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
                title="Download .log file"
              >
                <Download className="h-4 w-4" />
              </button>
            )}

            {/* Clear logs */}
            {activeSubTab === 'terminal' && (
              <button
                onClick={onClearLogs}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-red-300 transition-all"
                title="Clear log history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar (Terminal tab) */}
        {activeSubTab === 'terminal' && (
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Level Filters */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {['ALL', 'CRITICAL', 'WARN', 'INFO', 'WORLD_MODEL', 'TOPOLOGY', 'MITRE', 'PIPELINE'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-medium border transition-all ${
                    filterLevel === lvl
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold'
                      : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-52"
              />
            </div>
          </div>
        )}

        {/* 3. Sub-Tab 1: Monospace SIEM Terminal */}
        {activeSubTab === 'terminal' && (
          <div className="p-4 font-mono text-[11px] leading-relaxed max-h-[550px] min-h-[420px] overflow-y-auto space-y-1.5 bg-[#05070c]">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-400 py-16 text-center">
                <Terminal className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p>No telemetry events matching current filter.</p>
                <p className="text-[10px] mt-1 text-slate-400">
                  Telemetry stream polls every second when active.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="hover:bg-slate-900/60 p-1.5 rounded-lg transition-colors flex items-start space-x-2.5 group"
                >
                  {/* Timestamp */}
                  <span className="text-slate-400 flex-shrink-0 select-none">
                    [{log.timestamp}]
                  </span>

                  {/* Level Badge */}
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex-shrink-0 ${getLevelBadgeClass(log.level)}`}>
                    {log.level}
                  </span>

                  {/* Category */}
                  <span className={`font-semibold flex-shrink-0 ${getCategoryColor(log.category)}`}>
                    [{log.category}]
                  </span>

                  {/* Log Message */}
                  <span className="text-slate-200 break-all flex-1">
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* 4. Sub-Tab 2: Raw Backend JSON Inspector */}
        {activeSubTab === 'raw-json' && (
          <div className="p-4 bg-[#05070c] max-h-[550px] min-h-[420px] overflow-y-auto font-mono text-xs text-cyan-300">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-purple-400" />
                <span>Live Endpoint Payload &bull; Received from FastAPI backend:</span>
              </div>
              <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 overflow-x-auto text-emerald-300 leading-normal select-all">
              {JSON.stringify(rawBackendJson || { status: 'No payload captured yet' }, null, 2)}
            </pre>
          </div>
        )}

        {/* Terminal Footer Info */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected: <span className="text-slate-200">http://127.0.0.1:8000/api</span></span>
          </div>
          <div>
            <span>Backend World Model: <span className="text-cyan-400">PyTorch GRU Dual-Head</span></span>
            <span className="mx-2">&bull;</span>
            <span>Forecasting Horizon: <span className="text-purple-400">+5s, +10s, +15s</span></span>
          </div>
        </div>

      </div>
    </div>
  );
};
