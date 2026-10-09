import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, Bell } from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  unreadAlertCount?: number;
  apiConnected?: boolean;
  modelOnline?: boolean;
  networkOperational?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefresh,
  isRefreshing = false,
  lastUpdated = new Date(),
  unreadAlertCount = 0,
  apiConnected = true,
  modelOnline = true,
  networkOperational = true,
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#080d1a]/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Branding and Subtitle */}
      <div>
        <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
          NetForecast AI
        </h1>
        <p className="text-xs text-slate-400">
          AI-Powered Network Security
        </p>
      </div>

      {/* Right: Three Compact Status Indicators + Controls */}
      <div className="flex items-center gap-3">
        {/* Three Status Indicators */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          {/* 1. Network: Operational */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800/80 text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                networkOperational ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-400">Network:</span>
            <span className={networkOperational ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {networkOperational ? 'Operational' : 'Degraded'}
            </span>
          </div>

          {/* 2. AI Model: Online */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800/80 text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                modelOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400">AI Model:</span>
            <span className={modelOnline ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {modelOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* 3. API: Connected */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800/80 text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="text-slate-400">API:</span>
            <span className={apiConnected ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {apiConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Refresh Action Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title={`Refresh data (Updated: ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        )}

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/alerts')}
          title="View security alerts"
          className="relative p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#080d1a]">
              {unreadAlertCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
