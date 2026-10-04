import React from 'react';
import { Cpu, Loader2 } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Banner / Loading notice */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50 flex items-center justify-between text-cyan-300">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          <div className="text-xs font-mono">
            Synchronizing with PyTorch World Model engine & evaluating temporal sliding window...
          </div>
        </div>
        <div className="text-xs font-mono bg-cyan-900/40 px-2.5 py-1 rounded border border-cyan-700/50">
          INITIALIZING
        </div>
      </div>

      {/* State Transition Skeleton */}
      <div className="h-44 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between">
        <div className="h-5 w-64 bg-slate-800 rounded" />
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800/60 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-8 w-48 bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Timeline Skeleton */}
      <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <div className="h-5 w-48 bg-slate-800 rounded" />
        <div className="h-40 bg-slate-800/40 rounded-xl" />
      </div>
    </div>
  );
};
