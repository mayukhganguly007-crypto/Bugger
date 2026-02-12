
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from '@google/genai';

// --- Types ---
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'security';
  message: string;
  source: string;
}

interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  status: 'active' | 'patched' | 'analyzing';
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  threatLevel: number; // 0-100
}

// --- Constants ---
const LOG_SOURCES = ['Kernel', 'AuthSvc', 'NetStack', 'DataLayer', 'UIRenderer', 'LeakGuard'];
const GENAI_MODEL = 'gemini-3-pro-preview';

// --- Main Application ---
const BuggerApp: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({ cpu: 12, memory: 45, network: 8, threatLevel: 2 });
  const [isShieldActive, setIsShieldActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [terminalText, setTerminalText] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini
  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Simulate incoming logs
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        level: Math.random() > 0.9 ? 'error' : (Math.random() > 0.8 ? 'warning' : 'info'),
        message: generateMockMessage(),
        source: LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)]
      };
      setLogs(prev => [...prev.slice(-49), newLog]);
      
      // Fluctuating metrics
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() - 0.5) * 5)),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() - 0.5) * 2)),
        network: Math.min(100, Math.max(0, prev.network + (Math.random() - 0.5) * 10)),
        threatLevel: prev.threatLevel
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const generateMockMessage = () => {
    const msgs = [
      "Heartbeat signal received",
      "GET /api/v1/user 200 OK",
      "Cache invalidated for key: session_4x9",
      "Memory cleanup routine triggered",
      "Inbound packet from 192.168.1.45 accepted",
      "Database connection pool synchronized",
      "Third-party endpoint blocked by LeakGuard",
      "Unexpected token in JSON parsing attempt",
      "Resource allocation threshold reached"
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  };

  const handleDeepScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setTerminalText("Initializing neural scan... \nAccessing application bytecode... \nAnalyzing outbound patterns...");

    try {
      // Gather recent logs for analysis
      const recentLogs = logs.slice(-10).map(l => `[${l.level}] ${l.source}: ${l.message}`).join('\n');
      
      const response = await ai.models.generateContent({
        model: GENAI_MODEL,
        contents: `Analyze these application logs and identify potential bugs, vulnerabilities, or data leak threats. 
                   Return the findings in a structured JSON format. 
                   Logs:
                   ${recentLogs}
                   
                   Current Security Shield Status: ${isShieldActive ? 'ACTIVE' : 'INACTIVE'}`,
        config: {
          thinkingConfig: { thinkingBudget: 5000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                    description: { type: Type.STRING },
                    remediation: { type: Type.STRING }
                  },
                  required: ['type', 'severity', 'description', 'remediation']
                }
              },
              overallThreatScore: { type: Type.NUMBER, description: "0 to 100 score" }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      
      const newThreats: Threat[] = result.findings.map((f: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...f,
        status: 'active'
      }));

      setThreats(prev => [...newThreats, ...prev].slice(0, 10));
      setMetrics(prev => ({ ...prev, threatLevel: result.overallThreatScore }));
      setTerminalText("Scan Complete. Vulnerabilities cataloged.");
      
    } catch (error) {
      console.error("Scan failed", error);
      setTerminalText("Scan interrupted: Connection to AI core lost.");
    } finally {
      setIsScanning(false);
    }
  };

  const patchThreat = (id: string) => {
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status: 'patched' } : t));
    setMetrics(prev => ({ ...prev, threatLevel: Math.max(0, prev.threatLevel - 15) }));
    
    const patchLog: LogEntry = {
      id: 'patch-' + id,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      level: 'security',
      message: `THREAT NEUTRALIZED: Applied patch to system core`,
      source: 'LeakGuard'
    };
    setLogs(prev => [...prev, patchLog]);
  };

  const clearPatched = () => {
    setThreats(prev => prev.filter(t => t.status !== 'patched'));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-cyber relative">
      <div className="scanline"></div>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold mono tracking-tighter text-emerald-500 glitch-text">BUGGER_v3.1</h1>
          <p className="text-zinc-500 mono text-xs uppercase tracking-widest mt-1">Autonomous Security & QA Layer</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex flex-col items-end">
            <span className="text-[10px] mono text-zinc-500">LEAKGUARD SHIELD</span>
            <div 
              onClick={() => setIsShieldActive(!isShieldActive)}
              className={`cursor-pointer w-12 h-6 rounded-full transition-colors relative flex items-center ${isShieldActive ? 'bg-emerald-500' : 'bg-red-500'}`}
            >
              <div className={`absolute w-4 h-4 bg-white rounded-full transition-all ${isShieldActive ? 'left-7' : 'left-1'}`}></div>
            </div>
          </div>
          
          <button 
            onClick={handleDeepScan}
            disabled={isScanning}
            className={`px-6 py-2 rounded-sm mono font-bold text-sm transition-all border ${
              isScanning 
                ? 'bg-zinc-800 border-zinc-700 text-zinc-500' 
                : 'bg-emerald-600/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black'
            }`}
          >
            {isScanning ? 'SCANNING...' : 'DEEP SCAN'}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: System Metrics & Status */}
        <div className="lg:col-span-3 space-y-6">
          <section className="bg-black/40 border border-white/10 p-4 rounded-lg">
            <h2 className="mono text-xs text-zinc-400 mb-4 border-b border-white/5 pb-2">SYSTEM_HEALTH</h2>
            <div className="space-y-4">
              <MetricBar label="CORE_LOAD" value={metrics.cpu} color="bg-blue-500" />
              <MetricBar label="MEM_USAGE" value={metrics.memory} color="bg-emerald-500" />
              <MetricBar label="NET_TRAFFIC" value={metrics.network} color="bg-purple-500" />
              <MetricBar label="THREAT_INDEX" value={metrics.threatLevel} color={metrics.threatLevel > 70 ? 'bg-red-500' : (metrics.threatLevel > 30 ? 'bg-amber-500' : 'bg-emerald-500')} />
            </div>
          </section>

          <section className="bg-black/40 border border-white/10 p-4 rounded-lg h-48 overflow-hidden">
            <h2 className="mono text-xs text-zinc-400 mb-2 border-b border-white/5 pb-2">SCANNER_OUTPUT</h2>
            <div className="mono text-[10px] text-emerald-400/80 leading-relaxed overflow-y-auto h-full">
              {terminalText ? terminalText.split('\n').map((line, i) => (
                <div key={i}>&gt; {line}</div>
              )) : "Idle. Awaiting scan command."}
            </div>
          </section>
        </div>

        {/* Center Column: Live Logs */}
        <div className="lg:col-span-5 flex flex-col h-[600px] bg-black/60 border border-white/10 rounded-lg overflow-hidden relative">
          <div className="bg-white/5 px-4 py-2 flex justify-between items-center">
            <span className="mono text-xs font-semibold text-emerald-500">LIVE_TELEMETRY</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className={`flex gap-3 ${log.level === 'error' ? 'text-red-400' : (log.level === 'security' ? 'text-emerald-400 bg-emerald-950/20 py-1' : 'text-zinc-400')}`}>
                <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                <span className={`shrink-0 w-16 px-1 text-center border ${
                  log.level === 'error' ? 'border-red-900/50 bg-red-900/10' : 
                  (log.level === 'warning' ? 'border-amber-900/50 text-amber-500' : 
                  (log.level === 'security' ? 'border-emerald-500/50' : 'border-zinc-800'))
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-zinc-500 font-bold shrink-0">{log.source}:</span>
                <span className="truncate">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Right Column: Threats & Findings */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <section className="bg-black/40 border border-white/10 p-4 rounded-lg flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
              <h2 className="mono text-xs text-zinc-400 uppercase">Threat_Database</h2>
              <button onClick={clearPatched} className="text-[10px] text-zinc-500 hover:text-emerald-400 mono">CLEAR_PATCHED</button>
            </div>
            
            <div className="overflow-y-auto space-y-3 flex-1 pr-2">
              {threats.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 mono text-xs">
                  <p>No active threats detected.</p>
                  <p className="mt-2 text-[10px]">Initiate Deep Scan to analyze system state.</p>
                </div>
              ) : (
                threats.map((threat) => (
                  <div key={threat.id} className={`p-3 border rounded relative overflow-hidden ${
                    threat.status === 'patched' ? 'border-zinc-800 bg-zinc-900/20' : 
                    (threat.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5')
                  }`}>
                    {threat.status === 'patched' && <div className="absolute top-2 right-2 px-1 bg-emerald-500 text-[8px] text-black font-bold mono">PATCHED</div>}
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[10px] mono font-bold ${
                        threat.severity === 'critical' ? 'text-red-500' : (threat.severity === 'high' ? 'text-orange-500' : 'text-amber-500')
                      }`}>{threat.type.toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-white/80 mb-2">{threat.description}</p>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5">
                      <span className="text-[9px] mono text-zinc-500 italic max-w-[150px] truncate">{threat.remediation}</span>
                      {threat.status === 'active' && (
                        <button 
                          onClick={() => patchThreat(threat.id)}
                          className="px-2 py-1 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 text-[10px] mono hover:bg-emerald-500 hover:text-black transition-colors"
                        >
                          APPLY_PATCH
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isShieldActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                {isShieldActive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="mono text-xs font-bold text-white uppercase">{isShieldActive ? 'LeakGuard Shield: ACTIVE' : 'LeakGuard Shield: DISABLED'}</h3>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {isShieldActive 
                    ? "Blocking all unauthorized third-party data exfiltration attempts."
                    : "WARNING: System vulnerable to data exposure via third-party hooks."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-12 text-center text-[10px] mono text-zinc-600 border-t border-white/5 pt-6">
        BUGGER &copy; 2025 // ENHANCED QA ENGINE // TERMINAL-01 // OPERATIONAL
      </footer>
    </div>
  );
};

// --- Subcomponents ---

const MetricBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between mono text-[10px]">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-300">{Math.round(value)}%</span>
      </div>
      <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<BuggerApp />);
}
