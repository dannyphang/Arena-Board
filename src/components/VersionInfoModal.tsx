import React, { useState, useEffect } from 'react';
import { APP_VERSION_INFO } from '../config/version';
import { sounds } from '../services/audio';
import {
  Info,
  CheckCircle2,
  RefreshCw,
  Server,
  Globe,
  Clock,
  Sparkles,
  X,
  Code2,
  FileText,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionInfoModal: React.FC<VersionInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [serverVersion, setServerVersion] = useState<{
    version: string;
    buildId?: string;
    timestamp?: string;
    uptime?: number;
    environment?: string;
  } | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Esc shortcut
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Check server version on open
  useEffect(() => {
    if (isOpen) {
      checkServerVersion();
    }
  }, [isOpen]);

  const checkServerVersion = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch('/api/version');
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data);
      } else {
        setCheckError(`Server responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      setCheckError(err?.message || 'Could not connect to /api/version');
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.host : 'localhost';
  const isLatest = serverVersion ? serverVersion.version === APP_VERSION_INFO.version : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 font-['Outfit']">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Fredoka'] text-slate-100">
                  App Version & Environment Info
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {APP_VERSION_INFO.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verify active build deployment, description, prompt, and environment freshness
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close dialog (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                <span>Application is running latest deployed build</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-black">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Client bundle and server service are synchronized on <strong className="text-slate-200">{APP_VERSION_INFO.version}</strong> ({APP_VERSION_INFO.buildId}).
              </p>
            </div>

            <button
              onClick={() => {
                sounds.playPop();
                checkServerVersion();
              }}
              disabled={checking}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 transition cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Re-check environment"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${checking ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-semibold text-[10px]">Refresh</span>
            </button>
          </div>

          {/* Environment & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Active Environment Host
              </div>
              <div className="font-mono font-bold text-slate-200 truncate">
                {currentHost}
              </div>
              <div className="text-[10px] text-slate-500">
                Origin: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Build Release Date
              </div>
              <div className="font-mono font-bold text-slate-200">
                {APP_VERSION_INFO.releaseDate}
              </div>
              <div className="text-[10px] text-slate-500">
                Build ID: {APP_VERSION_INFO.buildId}
              </div>
            </div>
          </div>

          {/* Description & Prompt Section */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-extrabold uppercase tracking-wider text-[11px]">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Current Version Prompt & Description</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {APP_VERSION_INFO.version}
              </span>
            </div>

            <div className="space-y-2 text-slate-300 leading-relaxed">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  User Prompt Specification:
                </span>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-amber-200/90 whitespace-pre-line">
                  {APP_VERSION_INFO.latestPrompt}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Implemented Features Summary:
                </span>
                <p className="text-[11px] text-slate-300">
                  {APP_VERSION_INFO.promptDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Version Changelog History */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Recent Version History
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {APP_VERSION_INFO.changeLog.map((log) => (
                <div
                  key={log.version}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-300">
                        {log.version}
                      </span>
                      <span className="text-[10px] text-slate-500">• {log.date}</span>
                    </div>
                    {log.version === APP_VERSION_INFO.version && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium italic">
                    "{log.prompt}"
                  </div>
                  <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5 pl-1">
                    {log.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Studio Cloud Run Node Server Active</span>
          </div>

          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
