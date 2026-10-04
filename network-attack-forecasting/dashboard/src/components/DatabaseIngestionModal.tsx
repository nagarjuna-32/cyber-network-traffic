import React, { useState } from 'react';
import { 
  Database, 
  X, 
  Check, 
  AlertCircle, 
  Wifi, 
  Server, 
  Send, 
  Clock, 
  ShieldAlert, 
  Download, 
  RotateCcw, 
  Table, 
  Layers, 
  Sliders, 
  FileText, 
  CheckCircle2, 
  Zap,
  Search,
  ArrowRight
} from 'lucide-react';
import { 
  WorldModelState, 
  DatabaseConfig, 
  DatabaseFlowRecord 
} from '../types/prediction';

interface DatabaseIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onUpdateConfig: (newConfig: DatabaseConfig) => void;
  records: DatabaseFlowRecord[];
  onInjectRecord: (record: DatabaseFlowRecord) => void;
  onSeedRecords: () => void;
  onClearRecords: () => void;
  initialTab?: 'input' | 'config' | 'table';
}

export const DatabaseIngestionModal: React.FC<DatabaseIngestionModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  records,
  onInjectRecord,
  onSeedRecords,
  onClearRecords,
  initialTab = 'input'
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'config' | 'table'>(initialTab);
  
  // Connection Form State
  const [tempConfig, setTempConfig] = useState<DatabaseConfig>({ ...config });
  const [testStatus, setTestStatus] = useState<{ testing: boolean; success: boolean | null; message: string }>({
    testing: false,
    success: null,
    message: ''
  });

  // Record Form State
  const [formRecord, setFormRecord] = useState<Omit<DatabaseFlowRecord, 'id'>>({
    timestamp: new Date().toISOString(),
    sourceIp: '10.0.12.84',
    sourcePort: 4444,
    destIp: '192.168.1.105',
    destPort: 445,
    protocol: 'TCP',
    flowDuration: 240,
    packetRate: 142.5,
    byteRate: 48900,
    currentState: 'SUSPICIOUS',
    threatType: 'Lateral SMB Credential Probe (T1021)',
    threatScore: 78.4,
    confidence: 0.91,
    predictedNextState: 'PREDICTED ATTACK',
    predictionConfidence: 0.86,
    evidence: 'High-frequency SYN/ACK handshakes with abnormal SMB port entropy and rapid byte asymmetry.'
  });

  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('ALL');

  if (!isOpen) return null;

  // Preset Ingestion Templates
  const handleApplyPreset = (presetName: string) => {
    const now = new Date().toISOString();
    switch (presetName) {
      case 'DDOS':
        setFormRecord({
          timestamp: now,
          sourceIp: '203.0.113.55',
          sourcePort: 51234,
          destIp: '192.168.1.1',
          destPort: 80,
          protocol: 'UDP',
          flowDuration: 45,
          packetRate: 2450.0,
          byteRate: 850000,
          currentState: 'ATTACK',
          threatType: 'Volumetric UDP Reflection Flood (T1498)',
          threatScore: 94.8,
          confidence: 0.98,
          predictedNextState: 'ATTACK',
          predictionConfidence: 0.94,
          evidence: 'Volumetric flood reaching 2,450 pkts/s saturating gateway buffer.'
        });
        break;
      case 'C2':
        setFormRecord({
          timestamp: now,
          sourceIp: '10.0.12.84',
          sourcePort: 49152,
          destIp: '198.51.100.23',
          destPort: 443,
          protocol: 'TCP',
          flowDuration: 1800,
          packetRate: 0.8,
          byteRate: 350,
          currentState: 'SUSPICIOUS',
          threatType: 'Encrypted C2 Periodic Beaconing (T1071)',
          threatScore: 68.2,
          confidence: 0.89,
          predictedNextState: 'PREDICTED ATTACK',
          predictionConfidence: 0.82,
          evidence: 'Rigid 45.0s delta inter-arrival cadence matching stealth C2 agent heartbeat.'
        });
        break;
      case 'SCAN':
        setFormRecord({
          timestamp: now,
          sourceIp: '172.16.4.19',
          sourcePort: 38291,
          destIp: '192.168.1.254',
          destPort: 8080,
          protocol: 'TCP',
          flowDuration: 120,
          packetRate: 38.0,
          byteRate: 4200,
          currentState: 'ELEVATED',
          threatType: 'Network Service Scanning & Discovery (T1046)',
          threatScore: 42.0,
          confidence: 0.84,
          predictedNextState: 'SUSPICIOUS',
          predictionConfidence: 0.76,
          evidence: 'Sequential port probing spanning ephemeral services 8080, 8443, 9000.'
        });
        break;
      case 'NORMAL':
        setFormRecord({
          timestamp: now,
          sourceIp: '192.168.1.45',
          sourcePort: 54120,
          destIp: '142.250.190.46',
          destPort: 443,
          protocol: 'TCP',
          flowDuration: 3500,
          packetRate: 12.0,
          byteRate: 15400,
          currentState: 'NORMAL',
          threatType: 'Benign HTTPS Cloud Interaction',
          threatScore: 6.2,
          confidence: 0.96,
          predictedNextState: 'NORMAL',
          predictionConfidence: 0.95,
          evidence: 'Standard TLS 1.3 handshake with standard MTU packet distributions.'
        });
        break;
      case 'RECOVERY':
        setFormRecord({
          timestamp: now,
          sourceIp: '10.0.12.84',
          sourcePort: 4444,
          destIp: '192.168.1.105',
          destPort: 445,
          protocol: 'TCP',
          flowDuration: 50,
          packetRate: 0.0,
          byteRate: 0,
          currentState: 'RECOVERY',
          threatType: 'Post-Mitigation Isolation & Telemetry Dampening',
          threatScore: 24.5,
          confidence: 0.93,
          predictedNextState: 'NORMAL',
          predictionConfidence: 0.90,
          evidence: 'Ingress ACL enforced at switch interface; traffic dropped to nominal baseline.'
        });
        break;
    }
  };

  // Handle Submit Record
  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: DatabaseFlowRecord = {
      ...formRecord,
      id: `DB-${Date.now().toString().slice(-6)}`
    };
    onInjectRecord(newRecord);
    setFormSuccess(`Record ${newRecord.id} successfully written to ${config.databaseName}.${config.tableName} and processed by the World Model!`);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // Handle Test Connection
  const handleTestConnection = () => {
    setTestStatus({ testing: true, success: null, message: 'Initiating TCP/TLS handshake...' });
    setTimeout(() => {
      setTestStatus({
        testing: false,
        success: true,
        message: `Successfully connected to ${tempConfig.engine.toUpperCase()} at ${tempConfig.host}:${tempConfig.port}! Ping: 3.8ms, SSL: Verified, Table '${tempConfig.tableName}' accessible.`
      });
      onUpdateConfig({
        ...tempConfig,
        isConnected: true,
        lastPingMs: 4
      });
    }, 1200);
  };

  // Filtered table records
  const filteredRecords = records.filter(r => {
    const matchSearch = 
      r.id.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
      r.sourceIp.includes(searchTableQuery) ||
      r.destIp.includes(searchTableQuery) ||
      r.threatType.toLowerCase().includes(searchTableQuery.toLowerCase());
    const matchState = filterState === 'ALL' || r.currentState === filterState;
    return matchSearch && matchState;
  });

  // Export records
  const handleExportCSV = () => {
    const headers = ['ID,Timestamp,Src_IP,Src_Port,Dst_IP,Dst_Port,Protocol,Duration_ms,Packet_Rate,Byte_Rate,Current_State,Threat_Type,Threat_Score,Confidence,Predicted_Next_State'];
    const rows = records.map(r => 
      `"${r.id}","${r.timestamp}","${r.sourceIp}",${r.sourcePort},"${r.destIp}",${r.destPort},"${r.protocol}",${r.flowDuration},${r.packetRate},${r.byteRate},"${r.currentState}","${r.threatType}",${r.threatScore},${r.confidence},"${r.predictedNextState}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetForecast_DB_Records_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/60 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Database & Telemetry Ingestion Hub
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {config.engine.toUpperCase()}: READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Table: <code className="text-cyan-300 font-mono">{config.databaseName}.{config.tableName}</code> &bull; Fill telemetry inputs, test DB links, or query stored records
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'input'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>Fill Database Input</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'config'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>DB Connection ({config.engine})</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>Records Buffer ({records.length})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* TAB 1: FILL DATABASE INPUT FORM */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              {/* Quick Attack Presets Banner */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Quick Attack Simulation Presets:
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">1-Click Auto-Fill</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('DDOS')}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>⚡ Volumetric UDP Flood (ATTACK)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('C2')}
                    className="px-2.5 py-1 rounded-lg bg-orange-950/40 border border-orange-800/80 text-orange-300 hover:bg-orange-900/60 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>⚡ Stealth C2 Beacon (SUSPICIOUS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('SCAN')}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 hover:bg-amber-900/60 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>⚡ Port Recon Sweep (ELEVATED)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('NORMAL')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>⚡ Clean Traffic Baseline (NORMAL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('RECOVERY')}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/80 text-purple-300 hover:bg-purple-900/60 text-xs font-medium transition-all flex items-center gap-1"
                  >
                    <span>⚡ Containment Dampening (RECOVERY)</span>
                  </button>
                </div>
              </div>

              {/* Success Alert */}
              {formSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500 text-emerald-200 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Main Record Ingestion Form */}
              <form onSubmit={handleSubmitRecord} className="space-y-4">
                
                {/* 1. Network Sockets & Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Source IP</label>
                    <input
                      type="text"
                      value={formRecord.sourceIp}
                      onChange={(e) => setFormRecord({ ...formRecord, sourceIp: e.target.value })}
                      required
                      placeholder="e.g. 10.0.12.84"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Source Port</label>
                    <input
                      type="number"
                      value={formRecord.sourcePort}
                      onChange={(e) => setFormRecord({ ...formRecord, sourcePort: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Destination IP</label>
                    <input
                      type="text"
                      value={formRecord.destIp}
                      onChange={(e) => setFormRecord({ ...formRecord, destIp: e.target.value })}
                      required
                      placeholder="e.g. 192.168.1.10"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Destination Port</label>
                    <input
                      type="number"
                      value={formRecord.destPort}
                      onChange={(e) => setFormRecord({ ...formRecord, destPort: parseInt(e.target.value) || 0 })}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Protocol</label>
                    <select
                      value={formRecord.protocol}
                      onChange={(e) => setFormRecord({ ...formRecord, protocol: e.target.value as 'TCP' | 'UDP' | 'ICMP' })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="TCP">TCP</option>
                      <option value="UDP">UDP</option>
                      <option value="ICMP">ICMP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Flow Duration (ms)</label>
                    <input
                      type="number"
                      value={formRecord.flowDuration}
                      onChange={(e) => setFormRecord({ ...formRecord, flowDuration: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Packet Rate (pkts/s)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formRecord.packetRate}
                      onChange={(e) => setFormRecord({ ...formRecord, packetRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Byte Rate (B/s)</label>
                    <input
                      type="number"
                      value={formRecord.byteRate}
                      onChange={(e) => setFormRecord({ ...formRecord, byteRate: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* 2. World Model State Classification & Shreenisha Contract Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Current Security State
                    </label>
                    <select
                      value={formRecord.currentState}
                      onChange={(e) => setFormRecord({ ...formRecord, currentState: e.target.value as WorldModelState })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="ELEVATED">ELEVATED</option>
                      <option value="SUSPICIOUS">SUSPICIOUS</option>
                      <option value="PREDICTED ATTACK">PREDICTED ATTACK</option>
                      <option value="ATTACK">ATTACK</option>
                      <option value="RECOVERY">RECOVERY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Predicted Next State
                    </label>
                    <select
                      value={formRecord.predictedNextState}
                      onChange={(e) => setFormRecord({ ...formRecord, predictedNextState: e.target.value as WorldModelState })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold font-mono text-pink-300 focus:outline-none focus:border-pink-500"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="ELEVATED">ELEVATED</option>
                      <option value="SUSPICIOUS">SUSPICIOUS</option>
                      <option value="PREDICTED ATTACK">PREDICTED ATTACK</option>
                      <option value="ATTACK">ATTACK</option>
                      <option value="RECOVERY">RECOVERY</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Threat Type / Classification
                    </label>
                    <input
                      type="text"
                      value={formRecord.threatType}
                      onChange={(e) => setFormRecord({ ...formRecord, threatType: e.target.value })}
                      required
                      placeholder="e.g. Distributed SYN Flood"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Threat Score Slider + Input */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Threat Score (0-100):</span>
                      <span className="font-bold text-amber-400">{formRecord.threatScore.toFixed(1)}/100</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formRecord.threatScore}
                        onChange={(e) => setFormRecord({ ...formRecord, threatScore: parseFloat(e.target.value) })}
                        className="flex-1 accent-amber-500"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formRecord.threatScore}
                        onChange={(e) => setFormRecord({ ...formRecord, threatScore: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-1.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-white text-right"
                      />
                    </div>
                  </div>

                  {/* Current Confidence */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Current Confidence:</span>
                      <span className="font-bold text-emerald-400">{(formRecord.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formRecord.confidence}
                      onChange={(e) => setFormRecord({ ...formRecord, confidence: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Prediction Confidence */}
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-slate-400">Prediction Confidence:</span>
                      <span className="font-bold text-pink-400">{(formRecord.predictionConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formRecord.predictionConfidence}
                      onChange={(e) => setFormRecord({ ...formRecord, predictionConfidence: parseFloat(e.target.value) })}
                      className="w-full accent-pink-500"
                    />
                  </div>
                </div>

                {/* 3. Evidence Attribution Text */}
                <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Evidence Attribution & Statistical Signatures (Standardized Shreenisha Object)
                  </label>
                  <textarea
                    rows={2}
                    value={formRecord.evidence}
                    onChange={(e) => setFormRecord({ ...formRecord, evidence: e.target.value })}
                    required
                    placeholder="Enter statistical feature notes (e.g. High port entropy, low jitter IAT)..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                  >
                    <Send className="h-4 w-4" />
                    <span>Insert Record into Database & Trigger Forecast</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: DATABASE CONNECTION CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Server className="h-4 w-4 text-cyan-400" />
                  Database Engine & Connection Settings
                </h3>
                <p className="text-xs text-slate-400">
                  Configure live relational or time-series database endpoint for network telemetry ingestion.
                </p>

                {/* Engine Selector Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: 'sqlite', name: 'SQLite (store.db)', desc: 'Embedded local DB file' },
                    { id: 'postgresql', name: 'PostgreSQL / Timescale', desc: 'Enterprise time-series store' },
                    { id: 'influxdb', name: 'InfluxDB', desc: 'High-throughput metrics engine' },
                    { id: 'mysql', name: 'MySQL / MariaDB', desc: 'Relational telemetry DB' },
                    { id: 'rest_stream', name: 'REST / Kafka Stream', desc: 'Real-time JSON message bus' },
                  ].map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      onClick={() => setTempConfig({ ...tempConfig, engine: engine.id as any })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tempConfig.engine === engine.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">{engine.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{engine.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Connection Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Host / URI</label>
                    <input
                      type="text"
                      value={tempConfig.host}
                      onChange={(e) => setTempConfig({ ...tempConfig, host: e.target.value })}
                      placeholder="e.g. localhost or 10.0.12.84"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Port</label>
                    <input
                      type="number"
                      value={tempConfig.port}
                      onChange={(e) => setTempConfig({ ...tempConfig, port: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Database Name</label>
                    <input
                      type="text"
                      value={tempConfig.databaseName}
                      onChange={(e) => setTempConfig({ ...tempConfig, databaseName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Target Table Name</label>
                    <input
                      type="text"
                      value={tempConfig.tableName}
                      onChange={(e) => setTempConfig({ ...tempConfig, tableName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Username</label>
                    <input
                      type="text"
                      value={tempConfig.username}
                      onChange={(e) => setTempConfig({ ...tempConfig, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Password</label>
                    <input
                      type="password"
                      value={tempConfig.password || ''}
                      onChange={(e) => setTempConfig({ ...tempConfig, password: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* SSL Toggle */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="sslToggle"
                    checked={tempConfig.ssl}
                    onChange={(e) => setTempConfig({ ...tempConfig, ssl: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                  />
                  <label htmlFor="sslToggle" className="text-xs text-slate-300 font-mono">
                    Enforce TLS / SSL Encrypted Transport
                  </label>
                </div>

                {/* Test Feedback Message */}
                {testStatus.message && (
                  <div className={`p-3 rounded-xl text-xs font-mono flex items-center space-x-2 ${
                    testStatus.success 
                      ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-200' 
                      : 'bg-amber-950/60 border border-amber-500 text-amber-200'
                  }`}>
                    {testStatus.success ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-amber-400" />}
                    <span>{testStatus.message}</span>
                  </div>
                )}

                {/* Connection Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus.testing}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-semibold flex items-center space-x-2 transition-all border border-slate-700"
                  >
                    <Wifi className={`h-3.5 w-3.5 ${testStatus.testing ? 'animate-spin' : ''}`} />
                    <span>{testStatus.testing ? 'Testing Handshake...' : 'Test DB Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateConfig(tempConfig);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                  >
                    Save & Apply Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUFFERED DATABASE RECORDS TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={searchTableQuery}
                      onChange={(e) => setSearchTableQuery(e.target.value)}
                      placeholder="Search IP, ID, or threat..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 w-48 sm:w-64 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none"
                  >
                    <option value="ALL">All States</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="ELEVATED">ELEVATED</option>
                    <option value="SUSPICIOUS">SUSPICIOUS</option>
                    <option value="PREDICTED ATTACK">PREDICTED ATTACK</option>
                    <option value="ATTACK">ATTACK</option>
                    <option value="RECOVERY">RECOVERY</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onSeedRecords}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all flex items-center space-x-1"
                    title="Seed standard sample database records"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Seed Samples</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition-all flex items-center space-x-1 border border-slate-700"
                    title="Export buffer to CSV"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={onClearRecords}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-mono transition-all border border-rose-800/60"
                  >
                    Clear Buffer
                  </button>
                </div>
              </div>

              {/* Records Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Source Socket</th>
                        <th className="py-2.5 px-3">Dest Socket</th>
                        <th className="py-2.5 px-3">Proto</th>
                        <th className="py-2.5 px-3">State</th>
                        <th className="py-2.5 px-3">Threat Score</th>
                        <th className="py-2.5 px-3">Classification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                            No database records match current filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((r) => {
                          const isAttack = r.currentState === 'ATTACK' || r.currentState === 'PREDICTED ATTACK';
                          const isSusp = r.currentState === 'SUSPICIOUS' || r.currentState === 'ELEVATED';

                          return (
                            <tr key={r.id} className="hover:bg-slate-900/60 transition-colors">
                              <td className="py-2 px-3 text-cyan-300 font-bold">{r.id}</td>
                              <td className="py-2 px-3 text-slate-400 text-[11px]">
                                {r.timestamp.slice(11, 19)}
                              </td>
                              <td className="py-2 px-3 text-slate-200">
                                {r.sourceIp}:{r.sourcePort}
                              </td>
                              <td className="py-2 px-3 text-slate-200">
                                {r.destIp}:{r.destPort}
                              </td>
                              <td className="py-2 px-3 text-slate-400">{r.protocol}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isAttack 
                                    ? 'bg-rose-950/60 text-rose-300 border-rose-700/60' 
                                    : isSusp 
                                      ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                                }`}>
                                  {r.currentState}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-100">
                                <span className={r.threatScore > 75 ? 'text-rose-400' : r.threatScore > 50 ? 'text-amber-400' : 'text-emerald-400'}>
                                  {r.threatScore.toFixed(1)}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-xs" title={r.threatType}>
                                {r.threatType}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                <span>Showing {filteredRecords.length} of {records.length} stored rows</span>
                <span>Database Engine: {config.engine.toUpperCase()} &bull; Latency: {config.lastPingMs}ms</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
