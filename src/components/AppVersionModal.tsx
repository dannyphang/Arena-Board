import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Terminal,
  Activity,
  Server,
  RefreshCw,
  Copy,
  Check,
  Info,
  ShieldCheck,
  Tag,
  Cpu,
} from 'lucide-react';
import { APP_VERSION_INFO } from '../config/version';
import { sounds } from '../services/audio';
import { getBackendUrl } from '../services/socket';

interface AppVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppVersionModal({ isOpen, onClose }: AppVersionModalProps) {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<{
    online: boolean;
    uptime?: number;
    serverVersion?: string;
    serverTimestamp?: string;
  } | null>(null);

  // Check server health/version
  const checkFreshness = async () => {
    setIsChecking(true);
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/version`);
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          online: true,
          uptime: data.uptime,
          serverVersion: data.version,
          serverTimestamp: data.timestamp,
        });
      } else {
        setServerStatus({ online: false });
      }
    } catch {
      setServerStatus({ online: false });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkFreshness();
    }
  }, [isOpen]);

  const handleCopyPrompt = () => {
    sounds.playPop();
    const textToCopy = `ArenaBoard Version: ${APP_VERSION_INFO.version}\nBuild: ${APP_VERSION_INFO.buildId}\nLatest Prompt:\n${APP_VERSION_INFO.latestPrompt}\n\nDescription:\n${APP_VERSION_INFO.promptDescription}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-['Outfit']">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 font-['Fredoka']">
                  Application Version & Deployment
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {APP_VERSION_INFO.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ArenaBoard • Live Deployment Inspector & Specification
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status & Freshness Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <span>Environment Deployment Status:</span>
                  <span className="text-emerald-400 font-black">Latest Release Active</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                  <span>Build: {APP_VERSION_INFO.buildId}</span>
                  <span>•</span>
                  <span>Host: {typeof window !== 'undefined' ? window.location.hostname : 'Cloud'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playPop();
                checkFreshness();
              }}
              disabled={isChecking}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Verify active server deployment"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Server'}</span>
            </button>
          </div>

          {/* Prompt Specification Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Active Release Specification (User Prompt)</span>
              </div>
              <button
                onClick={handleCopyPrompt}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/25 space-y-2 text-slate-200">
              <div className="font-mono text-[11px] bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-amber-300/90 whitespace-pre-wrap leading-relaxed">
                {APP_VERSION_INFO.latestPrompt}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                {APP_VERSION_INFO.promptDescription}
              </p>
            </div>
          </div>

          {/* Diagnostics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>Release Date</span>
              </div>
              <div className="font-bold text-slate-200 text-xs">{APP_VERSION_INFO.releaseDate}</div>
              <div className="text-[10px] text-slate-400">Deployed Build Time</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-400" />
                <span>Server Endpoint</span>
              </div>
              <div className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {serverStatus?.online ? `Online (${serverStatus.uptime}s uptime)` : 'Connected'}
              </div>
              <div className="text-[10px] text-slate-400">Socket.IO & Express Proxy</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Applet Environment</span>
              </div>
              <div className="font-bold text-slate-200 text-xs truncate">
                ID: 2f571dca-cf9e
              </div>
              <div className="text-[10px] text-slate-400">Port 3000 Full-Stack SPA</div>
            </div>
          </div>

          {/* Change History Highlights */}
          <div className="space-y-2">
            <div className="text-slate-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Version Release History</span>
            </div>

            <div className="space-y-2">
              {APP_VERSION_INFO.changeLog.map((log) => (
                <div
                  key={log.version}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
                      <span>{log.version}</span>
                      <span className="text-[10px] font-normal text-slate-400">({log.date})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 italic">{log.prompt}</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-300">
                    {log.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">Esc</kbd> anytime to close
          </span>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer shadow-md"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
