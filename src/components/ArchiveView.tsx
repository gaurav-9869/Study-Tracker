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

  // --- ADVANCED FILTER MATRIX ENGINE ---
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

  // Extract list of all unique months present to populate dropdown elements dynamically
  const uniqueMonths = Array.from(new Set(
      archivedDates.map(date => date.substring(0, 7))
  )).sort((a, b) => b.localeCompare(a));

  // Determine which active dates to display based on filtering choices
  const visibleDates = archivedDates.filter(date => {
      const matchesMonth = selectedMonth === 'all' || date.startsWith(selectedMonth);
      const dayHasValidLogs = getFilteredLogsForDate(date).length > 0;
      return matchesMonth && (searchQuery.trim() === '' || dayHasValidLogs);
  });

  // Load active collections
  let dynamicDisplayLogs = selectedDate ? getFilteredLogsForDate(selectedDate) : [];

  const isGlobalSearching = searchQuery.trim() !== '';
  if (isGlobalSearching) {
      const combinedStream: (LogItem & { logDate: string })[] = [];
      visibleDates.forEach(date => {
          getFilteredLogsForDate(date).forEach(l => {
              combinedStream.push({ ...l, logDate: date });
          });
      });
      
      if (sortBy === 'newest') combinedStream.sort((a, b) => b.logDate.localeCompare(a.logDate));
      if (sortBy === 'oldest') combinedStream.sort((a, b) => a.logDate.localeCompare(b.logDate));
      if (sortBy === 'focusHigh') combinedStream.sort((a, b) => getFocusScore(b) - getFocusScore(a));
      if (sortBy === 'focusLow') combinedStream.sort((a, b) => getFocusScore(a) - getFocusScore(b));
      
      dynamicDisplayLogs = combinedStream as any;
  } else {
      if (sortBy === 'focusHigh') dynamicDisplayLogs = [...dynamicDisplayLogs].sort((a, b) => getFocusScore(b) - getFocusScore(a));
      if (sortBy === 'focusLow') dynamicDisplayLogs = [...dynamicDisplayLogs].sort((a, b) => getFocusScore(a) - getFocusScore(b));
  }

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-ios-fade-in text-zinc-100 transition-all duration-500">
        
        {/* Filter Configuration Header */}
        <div className="ios-glass-panel p-5 flex flex-col gap-4" style={glassStyle}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:flex-1 relative">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search past chapters, topics, or friction data logs..." 
                        className="w-full ios-glass-input pl-11 pr-4 py-3 text-sm rounded-xl bg-black/10 border-white/[0.06] outline-none placeholder:text-zinc-500 focus:border-primary/30"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-3.5 text-zinc-500 text-[20px]">search</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex gap-3 w-full md:w-auto">
                    <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer bg-[#0a0f18] border-white/[0.06] rounded-xl outline-none">
                        <option value="all">All Subjects</option>
                        <option value="bio">Biology</option>
                        <option value="phys">Physics</option>
                        <option value="chem">Chemistry</option>
                        <option value="math">Mathematics</option>
                    </select>

                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer bg-[#0a0f18] border-white/[0.06] rounded-xl outline-none">
                        <option value="all">All Months</option>
                        {uniqueMonths.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ios-glass-input p-3 text-xs font-semibold cursor-pointer col-span-2 sm:col-span-1 bg-[#0a0f18] border-white/[0.06] rounded-xl outline-none">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="focusHigh">Highest Focus</option>
                        <option value="focusLow">Lowest Focus</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Dynamic Display Layout Split Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            
            {!isGlobalSearching && (
                <div className="ios-glass-panel p-4 w-full md:w-64 flex flex-col gap-2 h-fit max-h-[70vh] overflow-y-auto shrink-0" style={glassStyle}>
                   <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-3 py-2 mb-1 border-b border-white/5">Directories</h3>
                   {visibleDates.length === 0 && <p className="text-zinc-600 text-xs italic p-3">No matching inputs found.</p>}
                   {visibleDates.map(d => (
                       <button 
                           key={d} 
                           onClick={() => setSelectedDate(d)}
                           className={`px-4 py-3 rounded-xl text-left text-sm transition-all flex items-center justify-between font-medium cursor-pointer ${d === selectedDate ? 'bg-primary text-white font-bold shadow-md shadow-primary/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'}`}>
                           <span>{d}</span>
                           <span className="material-symbols-outlined text-[16px] opacity-40">calendar_today</span>
                       </button>
                   ))}
                </div>
            )}

            <div className="ios-glass-panel p-6 flex-1 flex flex-col gap-5 w-full" style={glassStyle}>
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    {isGlobalSearching ? `Global Index Search Matches (${dynamicDisplayLogs.length})` : selectedDate ? `Archived Records Node: ${selectedDate}` : 'Select Archive Node'}
                </h3>
                
                {dynamicDisplayLogs.length === 0 && (
                    <div className="p-8 text-center text-zinc-600 text-sm italic font-medium">
                        No localized logs found matching current filtering combinations.
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
                        <div key={log.id} className="bg-black/15 border border-white/[0.04] p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all duration-500">
                            
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${conf.bg}`} style={{ backgroundColor: conf.color }} />
                            
                            <div className="pl-2 flex flex-col gap-1.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase ${conf.bg} ${conf.text} tracking-widest border border-white/[0.02]`}>
                                            {conf.name}
                                        </span>
                                        {log.isMissed && (
                                            <span className="text-[9px] font-bold px-2.5 py-1 rounded-lg bg-error/10 text-error border border-error/20 uppercase tracking-widest">MISSED</span>
                                        )}
                                        <span className="text-xs text-zinc-500 font-mono bg-black/20 border border-white/[0.05] px-2.5 py-1 rounded-lg">
                                            {log.sessionType}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {isGlobalSearching && log.logDate && (
                                            <span className="text-xs font-mono text-zinc-500 bg-black/20 border border-white/[0.05] px-2 py-1 rounded-lg flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[14px]">calendar_today</span> {log.logDate}
                                            </span>
                                        )}
                                        <span className="text-xs font-bold text-zinc-400 bg-black/20 border border-white/[0.05] px-3 py-1.5 rounded-lg">
                                            Focus: <span className="text-primary">{score}%</span>
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-zinc-100 font-semibold text-lg mt-1">{log.topic}</h4>
                                
                                {log.revisionType && (
                                    <div className="text-xs text-sky-400 font-semibold uppercase tracking-wider mt-0.5">Depth: {log.revisionType}</div>
                                )}

                                {log.frictionAnalysis && (
                                   <div className="mt-2 p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-xs text-amber-300/90 leading-relaxed">
                                       <strong className="text-amber-400">Friction Point:</strong> {log.frictionAnalysis}
                                   </div>
                                )}

                                {log.notes && (
                                   <div className="mt-1 p-3 bg-black/10 rounded-xl border border-white/[0.03] text-sm text-zinc-400 italic">
                                       "{log.notes}"
                                   </div>
                                )}

                                <div className="flex flex-wrap gap-5 text-xs text-zinc-500 mt-3 border-t border-white/5 pt-3 font-medium">
                                   {metricsText && (
                                       <span className="flex items-center gap-1.5 text-zinc-300">
                                           <span className="material-symbols-outlined text-[16px] text-primary">menu_book</span> {metricsText}
                                       </span>
                                   )}
                                   <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-600">timer</span> {log.activeMins}m Active</span>
                                   <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-600">warning</span> {log.distractionMins}m Overdue</span>
                                   {log.retentionScore !== undefined && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-amber-500">psychology</span> Retention: {log.retentionScore}/10</span>}
                                </div>

                                {/* Miniature Persisted Canvas Drawing Component Preview Slot */}
                                {log.scratchpadImage && (
                                    <div className="mt-4 border border-white/[0.05] bg-black/30 rounded-xl p-2 max-w-sm overflow-hidden flex flex-col gap-1">
                                        <img 
                                           src={log.scratchpadImage} 
                                           alt="Canvas Preview" 
                                           className="w-full h-auto rounded-lg max-h-32 object-contain bg-black/20" 
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
