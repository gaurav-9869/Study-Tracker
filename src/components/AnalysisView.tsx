import React from 'react';
import { LogItem, getSubjectConfig } from '../types';

interface AnalysisViewProps {
  loggedSessions: LogItem[];
}

export default function AnalysisView({ loggedSessions }: AnalysisViewProps) {
  const subjectMinutes: Record<string, number> = { bio: 0, phys: 0, chem: 0, math: 0 };
  let totalMinutes = 0;
  let totalSessions = 0;
  let exerciseSessions = 0;

  loggedSessions.forEach(log => {
    if (!log || log.isMissed) return;
    totalSessions++;
    if (log.sessionType === 'Exercise') exerciseSessions++;
    
    if (log.subject && log.activeMins && log.subject in subjectMinutes) {
      subjectMinutes[log.subject] += log.activeMins;
      totalMinutes += log.activeMins;
    }
  });

  // Data processing calculations for SVG Pie Chart matrix
  let currentAngle = 0;
  const pieSlices = Object.entries(subjectMinutes).map(([key, mins]) => {
    const config = getSubjectConfig(key);
    const percentage = totalMinutes > 0 ? (mins / totalMinutes) * 100 : 0;
    const angle = totalMinutes > 0 ? (mins / totalMinutes) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { key, mins, percentage, startAngle, angle, config };
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto text-zinc-100 animate-fade-in">
      
      {/* Master Analytics Grid Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART A: Premium SVG Syllabus Distribution Pie Chart */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col gap-6">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Time Share Distribution</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Stream category breakdown ratios</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            <div className="relative w-44 h-44 shrink-0">
              {totalMinutes > 0 ? (
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                  {pieSlices.map((slice, idx) => {
                    // Cumulative dash calculating circle strokes
                    const accumulatedPercent = pieSlices.slice(0, idx).reduce((sum, p) => sum + p.percentage, 0);
                    return (
                      <circle
                        key={slice.key}
                        cx="16" cy="16" r="14"
                        fill="transparent"
                        stroke={slice.config.color}
                        strokeWidth="4"
                        strokeDasharray={`${slice.percentage} 100`}
                        strokeDashoffset={-accumulatedPercent}
                        className="transition-all duration-700 hover:stroke-[5] cursor-pointer"
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="w-full h-full rounded-full border border-dashed border-white/10 flex items-center justify-center text-xs text-zinc-500">No logs saved</div>
              )}
              <div className="absolute inset-7 bg-[#0b0f19] rounded-full border border-white/5 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Total</span>
                <span className="text-base font-black text-white mt-0.5">{totalMinutes}m</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {pieSlices.map(slice => (
                <div key={slice.key} className="flex items-center gap-3 text-xs bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.config.color }} />
                  <span className="font-semibold text-zinc-300 capitalize min-w-[70px]">{slice.config.name}:</span>
                  <span className="font-mono font-bold text-white ml-auto">{Math.round(slice.percentage)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART B: Premium Horizontal Metrics Allocation Bar Graph */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col gap-6">
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">Focus Symmetrical Balance</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Tracked hours relative progression marks</p>
          </div>

          <div className="flex flex-col gap-5 justify-center flex-1 py-2">
            {pieSlices.map(slice => {
              const maxMinutes = Math.max(...Object.values(subjectMinutes), 1);
              const progressWidth = Math.round((slice.mins / maxMinutes) * 100);
              return (
                <div key={slice.key} className="flex flex-col gap-1.5 w-full">
                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="font-bold text-zinc-300 capitalize">{slice.config.name}</span>
                    <span className="font-mono text-zinc-500">{slice.mins} mins spend</span>
                  </div>
                  <div className="w-full h-3.5 bg-black/40 rounded-full border border-white/5 overflow-hidden p-0.5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressWidth || 3}%`, backgroundColor: slice.config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHART C: Highly Creative Habit Overlap Venn Diagram */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 shadow-2xl flex flex-col gap-6">
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">Syllabus Convergence Core</h4>
          <p className="text-xs text-zinc-400 mt-0.5">Creative intersection parameters of your active learning methods</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-6 bg-black/20 rounded-2xl border border-white/5">
          <div className="relative w-64 h-48 shrink-0 flex items-center justify-center">
            {/* SVG Overlapping Translucent Geometry vectors representing cross-sectional goals */}
            <svg className="w-full h-full opacity-80" viewBox="0 0 300 200">
              {/* Left Circle: Total Study Sessions */}
              <circle cx="110" cy="100" r="65" fill="#10B981" fillOpacity="0.18" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" />
              {/* Right Circle: Question Exercises */}
              <circle cx="190" cy="100" r="65" fill="#3B82F6" fillOpacity="0.18" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
              
              {/* Floating Indicator Graph Connections */}
              <text x="70" y="105" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">Study logs</text>
              <text x="230" y="105" fill="#bfdbfe" fontSize="11" fontWeight="bold" textAnchor="middle">Exercise</text>
              <text x="150" y="105" fill="#fff" fontSize="13" fontWeight="bold" textAnchor="middle">Velocity</text>
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full px-4">
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Total Logs</span>
              <span className="text-2xl font-black text-white mt-1 block">{totalSessions}</span>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">Practice Deck</span>
              <span className="text-2xl font-black text-sky-400 mt-1 block">{exerciseSessions}</span>
            </div>
            <div className="bg-black/30 border border-white/5 p-4 rounded-xl text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 block">System Affinity</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {totalSessions > 0 ? Math.round((exerciseSessions / totalSessions) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
