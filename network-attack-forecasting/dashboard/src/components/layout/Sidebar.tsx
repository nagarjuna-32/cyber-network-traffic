import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, Activity, Cpu } from 'lucide-react';
import { NAV_ITEMS } from '../../constants';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 flex flex-col justify-between bg-[#0b101d] border-r border-slate-800/80 shrink-0 h-screen sticky top-0 select-none">
      {/* Brand & Logo Header */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white">NetForecast</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-medium">AI</span>
            </div>
            <p className="text-[11px] text-slate-400">Security Operations</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Compact System Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#090d18] text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Engine Online
          </span>
          <span className="text-slate-300 font-mono text-[10px]">GRU Dual-Head</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1.5 border-t border-slate-800/40">
          <span>Enterprise SOC</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
