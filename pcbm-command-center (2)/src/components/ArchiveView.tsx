import React, { useState, useEffect } from 'react';
import { LogItem, getFocusScore, getSubjectConfig } from '../types';

export default function ArchiveView() {
  const [archivedDates, setArchivedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateLogs, setDateLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage);
    const dates = keys
      .filter(k => k.startsWith('pcbm_log_'))
      .map(k => k.replace('pcbm_log_', ''))
      .sort((a, b) => b.localeCompare(a));
    setArchivedDates(dates);
      
    if (dates.length > 0) {
       loadDate(dates[0]);
    }
  }, []);

  const loadDate = (dateStr: string) => {
      setSelectedDate(dateStr);
      try {
          const logs = JSON.parse(localStorage.getItem(`pcbm_log_${dateStr}`) || '[]');
          setDateLogs(logs);
      } catch(e) {
          setDateLogs([]);
      }
  };

  return (
    <div className="flex flex-col gap-6 w-full fade-in">
        <h2 className="font-headline text-headline-md text-on-surface font-bold">Archive</h2>
        <div className="flex flex-col md:flex-row gap-6">
            <div className="glass-panel ghost-border p-4 bg-surface-container-low min-w-[200px] flex flex-col gap-2 h-fit max-h-[60vh] overflow-y-auto">
               <h3 className="font-headline text-lg text-on-surface-variant font-medium px-2 py-1">Past Days</h3>
               {archivedDates.length === 0 && <p className="text-on-surface-variant text-sm px-2">No history</p>}
               {archivedDates.map(d => (
                   <button 
                       key={d} 
                       onClick={() => loadDate(d)}
                       className={`px-4 py-2 rounded-lg text-left text-sm transition-colors cursor-pointer ${d === selectedDate ? 'bg-primary/20 text-primary-fixed font-bold' : 'text-on-surface-variant hover:bg-white/5'}`}>
                       {d}
                   </button>
               ))}
            </div>

            <div className="glass-panel ghost-border p-6 flex-1 bg-surface-container-low flex flex-col gap-4">
                <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2">
                    {selectedDate ? `Logs for ${selectedDate}` : 'Select a date'}
                </h3>
                {dateLogs.length === 0 && <p className="text-on-surface-variant text-sm">No data available.</p>}
                {dateLogs.map(log => {
                    const conf = getSubjectConfig(log.subject);
                    const score = getFocusScore(log);
                    let metricsText = '';
                    if (log.sessionType === 'Exercise') {
                        const intensity = (log.vsaCount || 0) * 1 + (log.saCount || 0) * 3 + (log.laCount || 0) * 7;
                        metricsText = `${intensity} Intensity Points`;
                    } else if (log.startPage !== undefined && log.endPage !== undefined) {
                        const pages = Math.max(0, log.endPage - log.startPage + 1);
                        metricsText = `${pages} Pages`;
                    }

                    return (
                        <div key={log.id} className="glass-panel ghost-border p-4 flex flex-col gap-3 bg-surface-container-highest relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${conf.bg}`}></div>
                            <div className="pl-2">
                                <span className={`text-xs font-bold ${conf.text} uppercase tracking-wider mb-1 block`}>{conf.name} {log.isMissed && ' - MISSED'} <span className="ml-2 text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded-sm">{log.sessionType}</span></span>
                                <h4 className="text-on-surface font-semibold text-md">{log.topic}</h4>
                                <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant mt-2">
                                   {metricsText && <span className="flex items-center gap-1 font-bold text-on-surface"><span className="material-symbols-outlined text-[14px] text-tertiary-container">library_books</span> {metricsText}</span>}
                                   <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> {log.activeMins}m Active</span>
                                   <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">warning</span> {log.distractionMins}m Dist</span>
                                   <span className="flex items-center gap-1 ml-auto font-bold text-[#50C878]">{score}% Score</span>
                                </div>
                                {log.notes && (
                                   <div className="mt-2 p-3 bg-surface-container-lowest rounded border border-white/5 text-sm text-on-surface/80 italic border-l-2 border-l-primary/50">
                                       "{log.notes}"
                                   </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}
