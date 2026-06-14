import React from 'react';
import { LogItem, getFocusScore, getSubjectConfig } from '../types';

interface ConceptVelocityProps {
  loggedSessions: LogItem[];
}

export default function ConceptVelocity({ loggedSessions }: ConceptVelocityProps) {
  // Pull last 7 logged records safely to map timeline trends
  const displayWindowNodes = loggedSessions.slice(-7);

  return (
    <div className="w-full flex flex-col gap-4 text-zinc-100">
      <div className="flex flex-col gap-0.5">
         <h4 className="text-sm font-bold text-white uppercase tracking-wider">Concept Velocity Axis</h4>
         <p className="text-xs text-zinc-500">Chronological analysis tracker of recent sessions.</p>
      </div>

      {displayWindowNodes.length === 0 ? (
         <div className="p-6 text-center text-zinc-600 text-xs italic font-medium">
             Awaiting historical completion telemetry datasets...
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
             {displayWindowNodes.map((log) => {
                 const config = getSubjectConfig(log.subject);
                 const focus = getFocusScore(log);
                 return (
                     <div key={log.id} className="bg-black/20 border border-white/[0.04] p-4 rounded-xl flex flex-col gap-2 relative overflow-hidden">
                         <div className="absolute top-0 right-0 left-0 h-[2px]" style={{ backgroundColor: config.color }} />
                         <div className="flex justify-between items-start w-full">
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${config.text}`}>{config.name}</span>
                             <span className="text-[10px] font-mono text-zinc-500 font-bold bg-black/30 border border-white/5 px-2 py-0.5 rounded-md">Focus: {focus}%</span>
                         </div>
                         <h5 className="text-sm font-bold text-zinc-200 truncate mt-1">{log.topic}</h5>
                         <span className="text-[11px] text-zinc-500 font-medium">Duration: {log.activeMins}m active focus ring</span>
                     </div>
                 );
             })}
         </div>
      )}
    </div>
  );
}
