import React, { useState, useEffect } from 'react';
import { LogItem, getFocusScore, getSubjectConfig } from '../types';

export default function ArchiveView() {
  const [allLogsByDate, setAllLogsByDate] = useState<Record<string, LogItem[]>>({});
  const [archivedDates, setArchivedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    const keys = Object.keys(localStorage);
    const logData: Record<string, LogItem[]> = {};
    const datesWithLogs: string[] = [];

    // Index all existing local datasets systematically
    keys
      .filter(k => k.startsWith('pcbm_log_'))
      .forEach(k => {
         const dateStr = k.replace('pcbm_log_', '');
         try {
             const logs = JSON.parse(localStorage.getItem(k) || '[]');
             if (Array.isArray(logs) && logs.length > 0) {
                 logData[dateStr] = logs;
                 datesWithLogs.push(dateStr);
             }
         } catch(e) {}
      });

    // Sort initial tracking dates chronological downward
    datesWithLogs.sort((a, b) => b.localeCompare(a));
    
    setAllLogsByDate(logData);
    setArchivedDates(datesWithLogs);
      
    if (datesWithLogs.length > 0) {
       setSelectedDate(datesWithLogs[0]);
    }
  }, []);

  // --- COMPREHENSIVE ADVANCED FILTER ENGINE ---
  const getFilteredLogsForDate = (dateStr: string): LogItem[] => {
      const logs = allLogsByDate[dateStr] || [];
      return logs.filter(log => {
          const matchesSubject = selectedSubject === 'all' || log.subject === selectedSubject;
          const matchesSearch = searchQuery.trim() === '' || 
              log.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (log.frictionAnalysis && log.frictionAnalysis.toLowerCase().includes(searchQuery.toLowerCase()));
          return matchesSubject && matchesSearch;
      });
  };

  // Extract list of all unique months present in saved logs to populate dropdown options automatically
  const uniqueMonths = Array.from(new Set(
      archivedDates.map(date => date.substring(0, 7)) // Captures "YYYY-MM" formatting syntax securely
  )).sort((a, b) => b.localeCompare(a));

  // Determine which active dates to show in the sidebar column based on month and search choices
  const visibleDates = archivedDates.filter(date => {
      const matchesMonth = selectedMonth === 'all' || date.startsWith(selectedMonth);
      const dayHasValidLogs = getFilteredLogsForDate(date).length > 0;
      return matchesMonth && (searchQuery.trim() === '' || dayHasValidLogs);
  });

  // Fetch log collection matching filters to draw in main display view box
  let dynamicDisplayLogs = selectedDate ? getFilteredLogsForDate(selectedDate) : [];

  // If user enters a global search, collapse standard single-date view and merge all filtering results into a single global stream
  const isGlobalSearching = searchQuery.trim() !== '';
  if (isGlobalSearching) {
      const combinedStream: (LogItem & { logDate: string })[] = [];
      visibleDates.forEach(date => {
          getFilteredLogsForDate(date).forEach(l => {
              combinedStream.push({ ...l, logDate: date });
          });
      });
      
      // Handle advanced multi-metric sorting criteria loops
      if (sortBy === 'newest') combinedStream.sort((a, b) => b.logDate.localeCompare(a.logDate));
      if (sortBy === 'oldest') combinedStream.sort((a, b) => a.logDate.localeCompare(b.logDate));
      if (sortBy === 'focusHigh') combinedStream.sort((a, b) => getFocusScore(b) - getFocusScore(a));
      if (sortBy === 'focusLow') combinedStream.sort((a, b) => getFocusScore(a) - getFocusScore(b));
      
      dynamicDisplayLogs = combinedStream as any;
  } else {
      if (sortBy === 'focusHigh') dynamicDisplayLogs = [...dynamicDisplayLogs].sort((a, b) => getFocusScore(b) - getFocusScore(a));
      if (sortBy === 'focusLow') dynamicDisplayLogs = [...dynamicDisplayLogs].sort((a, b) => getFocusScore(a) - getFocusScore(b));
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-ios-fade-in text-zinc-100">
        
        {/* --- TOP ROW: INTUATIVE FILTERBAR INTERACTION --- */}
        <div className="ios-glass-panel p-5 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-1 relative">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search specific chapters, topics, or friction notes..." 
                        className="w-full ios-glass-input pl-11 pr-4 py-3 text-sm placeholder:text-zinc-500"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-3.5 text-zinc-500 text-[20px]">search</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-3 w-full md:w-auto">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer bg-[#0a0f18]">
                        <option value="all">All Subjects</option>
                        <option value="bio">Biology</option>
                        <option value="phys">Physics</option>
                        <option value="chem">Chemistry</option>
                        <option value="math">Mathematics</option>
                    </select>

                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer bg-[#0a0f18]">
                        <option value="all">All Months</option>
                        {uniqueMonths.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer col-span-2 sm:col-span-1 bg-[#0a0f18]">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="focusHigh">Highest Focus</option>
                        <option value="focusLow">Lowest Focus</option>
                    </select>
                </div>
            </div>
        </div>

        {/* --- MAIN STRUCTURE SPLIT PANEL --- */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            
            {/* Sidebar Column: Display Active Logging Dates Index */}
            {!isGlobalSearching && (
                <div className="ios-glass-panel p-4 w-full md:w-64 flex flex-col gap-2 h-fit max-h-[70vh] overflow-y-auto shrink-0">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 px-3 py-2 mb-1 border-b border-white/5">Active Logs Directory</h3>
                   {visibleDates.length === 0 && <p className="text-zinc-500 text-xs italic p-3">No active history matching filters.</p>}
                   {visibleDates.map(d => (
                       <button 
                           key={d} 
                           onClick={() => setSelectedDate(d)}
                           className={`px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${d === selectedDate ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}>
                           <span>{d}</span>
                           <span className="material-symbols-outlined text-[16px] opacity-60">calendar_today</span>
                       </button>
                   ))}
                </div>
            )}

            {/* Content Display Column: Renders Saved Logs Loop */}
            <div className="ios-glass-panel p-6 flex-1 flex flex-col gap-5 w-full">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    {isGlobalSearching ? `Cross-Reference Search Results (${dynamicDisplayLogs.length})` : selectedDate ? `Archived Session History: ${selectedDate}` : 'Select History Node'}
                </h3>
                
                {dynamicDisplayLogs.length === 0 && (
                    <div className="p-8 text-center text-zinc-500 text-sm italic font-medium">
                        No validated log nodes match your active parameters or filters inside this container scope.
                    </div>
                )}
                
                {dynamicDisplayLogs.map((log: any) => {
                    const conf = getSubjectConfig(log.subject);
                    const score = getFocusScore(log);
                    let metricsText = '';
                    if (log.sessionType === 'Exercise') {
                        metricsText = `VSAQ: ${log.vsaCount || 0} | SAQ: ${log.saCount || 0} | LAQ: ${log.laCount || 0}`;
                    } else if (log.startPage !== undefined && log.endPage !== undefined) {
                        metricsText = `Pages: ${log.startPage} - ${log.endPage}`;
                    }

                    return (
                        <div key={log.id} className="ios-glass-card-nested p-5 flex flex-col gap-4 relative overflow-hidden transition-all">
                            
                            {/* Color Tag Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${conf.bg}`}></div>
                            
                            <div className="pl-2 flex flex-col gap-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${conf.bg} text-black tracking-widest`}>
                                            {conf.name}
                                        </span>
                                        {log.isMissed && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-error/20 text-error border border-error/20 uppercase tracking-wider">MISSED</span>
                                        )}
                                        <span className="text-xs text-zinc-400 font-mono bg-black/30 border border-white/5 px-2.5 py-1 rounded-lg">
                                            {log.sessionType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isGlobalSearching && log.logDate && (
                                            <span className="text-xs font-mono text-zinc-400 bg-black/20 border border-white/5 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px]">calendar_today</span> {log.logDate}
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-zinc-400 bg-black/20 border border-white/5 px-3 py-1.5 rounded-lg">
                                            Score: <span className="text-primary">{score}%</span>
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-zinc-100 font-semibold text-lg mt-1">{log.topic}</h4>
                                
                                {log.revisionType && (
                                    <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mt-0.5">Horizon: {log.revisionType}</div>
                                )}

                                {log.frictionAnalysis && (
                                   <div className="mt-2 p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs text-amber-300 leading-relaxed">
                                       <strong className="text-amber-400">Friction Bottleneck:</strong> {log.frictionAnalysis}
                                   </div>
                                )}

                                {log.notes && (
                                   <div className="mt-1 p-3 bg-black/20 rounded-xl border border-white/5 text-sm text-zinc-400 italic">
                                       "{log.notes}"
                                   </div>
                                )}

                                <div className="flex flex-wrap gap-5 text-xs text-zinc-400 mt-3 border-t border-white/5 pt-3 font-medium">
                                   {metricsText && (
                                       <span className="flex items-center gap-1.5 text-zinc-200">
                                           <span className="material-symbols-outlined text-[16px] text-primary">menu_book</span> {metricsText}
                                       </span>
                                   )}
                                   <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">timer</span> {log.activeMins}m Active</span>
                                   <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">warning</span> {log.distractionMins}m Distracted</span>
                                   {log.retentionScore !== undefined && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-amber-500">psychology</span> Retention: {log.retentionScore}/10</span>}
                                </div>

                                {/* --- PERSISTENT DIGITAL SKETCHPAD DISPLAY CONTAINER --- */}
                                {log.scratchpadImage && (
                                    <div className="mt-4 border border-white/5 bg-[#0a0f18] rounded-2xl p-2 max-w-lg overflow-hidden flex flex-col gap-1.5">
                                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-2 pt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">draw</span> Saved Workspace Sketch
                                        </div>
                                        <img 
                                           src={log.scratchpadImage} 
                                           alt="Archived digital sketch drawing canvas screenshot" 
                                           className="w-full h-auto rounded-xl max-h-48 object-contain bg-black/40 border border-white/5 shadow-inner" 
                                        />
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
