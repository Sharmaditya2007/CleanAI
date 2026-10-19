import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Server,
  Zap,
  Globe,
  Terminal,
  Database,
  Cpu,
  X
} from 'lucide-react';
import { getApiBase, setCustomApiUrl, getCustomApiUrl } from '../services/api';

interface CloudConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudConnectModal: React.FC<CloudConnectModalProps> = ({ isOpen, onClose }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    modelLoaded?: boolean;
    dbType?: string;
  } | null>(null);
  const [tab, setTab] = useState<'connect' | 'render' | 'tunnel'>('connect');

  const activeApiUrl = getApiBase();
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  useEffect(() => {
    if (isOpen) {
      const custom = getCustomApiUrl() || 'https://cleanai-6pwl.onrender.com';
      setCurrentUrl(custom);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const targetUrl = currentUrl.trim();
    if (!targetUrl) {
      setTestResult({
        success: false,
        message: 'Please enter a valid backend URL (e.g., https://your-backend.onrender.com)'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const base = targetUrl.endsWith('/api') ? targetUrl : `${targetUrl.replace(/\/$/, '')}/api`;
    try {
      const resp = await fetch(`${base}/health`, { method: 'GET' });
      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setTestResult({
        success: true,
        message: `Successfully connected to Clean AI Backend (${data.service || 'Platform'})!`,
        modelLoaded: data.model?.loaded,
        dbType: data.database?.type
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Network error. Ensure the backend URL is public HTTPS and CORS enabled.'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const trimmed = currentUrl.trim();
    if (trimmed) {
      setCustomApiUrl(trimmed);
    } else {
      setCustomApiUrl(null);
    }
    window.location.reload();
  };

  const handleReset = () => {
    setCustomApiUrl(null);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0C0C0E] border border-[#262626] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-[#F5F5F7] max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2997FF]/10 text-[#2997FF] flex items-center justify-center border border-[#2997FF]/20">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F5F5F7]">Cloud Backend Connection</h2>
              <p className="text-xs text-[#86868B]">
                {isVercel ? 'Vercel Deployment & Live API Integration' : 'Manage Backend Service Endpoint'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#86868B] hover:text-[#F5F5F7] hover:bg-[#1A1A1A] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Banner */}
        <div className="p-4 rounded-2xl bg-[#141416] border border-[#262626] flex items-center justify-between text-xs">
          <div>
            <span className="text-[#86868B] block">Active API Endpoint:</span>
            <span className="font-mono font-medium text-[#F5F5F7] break-all">{activeApiUrl}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ml-3 ${
            activeApiUrl.startsWith('http')
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {activeApiUrl.startsWith('http') ? 'Custom/Cloud Linked' : 'Relative (/api)'}
          </span>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-3 p-1 bg-[#141416] border border-[#262626] rounded-xl text-xs font-medium">
          <button
            onClick={() => setTab('connect')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'connect' ? 'bg-[#F5F5F7] text-black font-semibold' : 'text-[#86868B] hover:text-white'
            }`}
          >
            Connect API
          </button>
          <button
            onClick={() => setTab('render')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'render' ? 'bg-[#F5F5F7] text-black font-semibold' : 'text-[#86868B] hover:text-white'
            }`}
          >
            Render Cloud
          </button>
          <button
            onClick={() => setTab('tunnel')}
            className={`py-2 rounded-lg transition-all ${
              tab === 'tunnel' ? 'bg-[#F5F5F7] text-black font-semibold' : 'text-[#86868B] hover:text-white'
            }`}
          >
            Local Tunnel
          </button>
        </div>

        {/* Tab: Connect Custom API */}
        {tab === 'connect' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#A1A1A6]">
                Enter Live Backend API URL
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6E6E73]" />
                <input
                  type="url"
                  placeholder="https://clean-ai-backend.onrender.com"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#141416] border border-[#262626] rounded-xl text-xs text-[#F5F5F7] focus:border-[#2997FF] focus:outline-hidden font-mono"
                />
              </div>
              <p className="text-[11px] text-[#86868B]">
                Paste your deployed Render URL or HTTPS localtunnel URL. Clean AI will store this in your browser to immediately connect all portals.
              </p>
            </div>

            {testResult && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{testResult.message}</span>
                </div>
                {testResult.success && (
                  <div className="text-[11px] text-zinc-400 pl-6 space-y-0.5">
                    <div>AI Model: <span className="text-white font-mono">{testResult.modelLoaded ? 'Loaded (YOLOv11)' : 'Not Loaded'}</span></div>
                    <div>Database: <span className="text-white font-mono">{testResult.dbType || 'Connected'}</span></div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white border border-[#333333] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>Test Connection</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#F5F5F7] hover:bg-white text-black transition-all cursor-pointer font-medium"
              >
                Save & Connect
              </button>
            </div>

            {getCustomApiUrl() && (
              <button
                type="button"
                onClick={handleReset}
                className="w-full text-center text-xs text-[#86868B] hover:text-rose-400 py-1 transition-colors"
              >
                Reset to default environment configuration
              </button>
            )}
          </div>
        )}

        {/* Tab: Render Cloud Deployment Guide */}
        {tab === 'render' && (
          <div className="space-y-4 text-xs text-[#A1A1A6] leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[#141416] border border-[#262626] space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Server size={15} className="text-[#2997FF]" />
                Permanent 24/7 Hosting on Render (Free)
              </h3>
              <p>
                To let all public citizens and officers access Clean AI through your Vercel link anytime without keeping your PC on:
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300">
                <li>Go to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-[#2997FF] underline inline-flex items-center gap-0.5">Render Dashboard <ExternalLink size={11} /></a>.</li>
                <li>Click <strong>New +</strong> &rarr; <strong>Web Service</strong>.</li>
                <li>Connect your repository: <code className="bg-black/50 px-1 py-0.5 rounded text-white">Sharmaditya2007/CleanAI</code>.</li>
                <li>Render will automatically read <code className="bg-black/50 px-1 py-0.5 rounded text-white">render.yaml</code> from the repository.</li>
                <li>Copy the resulting service URL (e.g. <code className="text-emerald-400">https://clean-ai-backend.onrender.com</code>).</li>
                <li>In your <strong>Vercel Project Settings</strong> &rarr; <strong>Environment Variables</strong>:
                  <div className="mt-1 p-2 rounded bg-black/60 font-mono text-[11px] text-white">
                    VITE_API_URL = https://clean-ai-backend.onrender.com/api
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab: Local Tunnel Guide */}
        {tab === 'tunnel' && (
          <div className="space-y-4 text-xs text-[#A1A1A6] leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[#141416] border border-[#262626] space-y-2">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Terminal size={15} className="text-[#30D158]" />
                Instant 10-Second Tunnel (Local PC to Vercel)
              </h3>
              <p>
                Want your Vercel deployment to connect to your local backend and database right now?
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-zinc-300">
                <li>Make sure your backend is running locally on port 8000.</li>
                <li>Run this command in your terminal (or double-click <code className="bg-black/50 px-1 py-0.5 rounded text-white">start_tunnel.bat</code>):
                  <div className="mt-1 p-2 rounded bg-black/60 font-mono text-[11px] text-[#30D158]">
                    npx localtunnel --port 8000
                  </div>
                </li>
                <li>Copy the generated HTTPS URL (e.g. <code className="text-[#2997FF]">https://clean-ai-tunnel.loca.lt</code>).</li>
                <li>Switch to the <strong>Connect API</strong> tab above, paste the URL, and click <strong>Save & Connect</strong>!</li>
              </ol>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
