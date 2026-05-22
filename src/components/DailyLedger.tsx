import React from 'react';
import { nanoid } from 'nanoid';
import { SubjectKey, SessionMode, LogItem, PlanItem, UserSettings, getSubjectConfig, getFocusScore } from '../types';

interface DailyLedgerProps {
  morningPlan: PlanItem[];
  setMorningPlan?: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  loggedSessions: LogItem[];
  setLoggedSessions: React.Dispatch<React.SetStateAction<LogItem[]>>;
  logSubject: SubjectKey;
  setLogSubject: (s: SubjectKey) => void;
  logTopic: string;
  setLogTopic: (t: string) => void;
  logType: SessionMode;
  setLogType: (s: SessionMode) => void;
  logActive: string;
  setLogActive: (v: string) => void;
  logDistract: string;
  setLogDistract: (v: string) => void;
  logRecover: string;
  setLogRecover: (v: string) => void;
  logRetention: string;
  setLogRetention: (v: string) => void;
  logNotes: string;
  setLogNotes: (v: string) => void;
  logActivePlanId: string | null;
  setLogActivePlanId: (id: string | null) => void;
  
  logStartPage: string;
  setLogStartPage: (v: string) => void;
  logEndPage: string;
  setLogEndPage: (v: string) => void;
  logVsa: string;
  setLogVsa: (v: string) => void;
  logSa: string;
  setLogSa: (v: string) => void;
  logLa: string;
  setLogLa: (v: string) => void;
  
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export default function DailyLedger({
    morningPlan, setMorningPlan, loggedSessions, setLoggedSessions,
    logSubject, setLogSubject, logTopic, setLogTopic,
    logType, setLogType, logActive, setLogActive,
    logDistract, setLogDistract, logRecover, setLogRecover,
    logRetention, setLogRetention,
    logNotes, setLogNotes, logActivePlanId, setLogActivePlanId,
    logStartPage, setLogStartPage, logEndPage, setLogEndPage,
    logVsa, setLogVsa, logSa, setLogSa, logLa, setLogLa,
    userSettings, setUserSettings
}: DailyLedgerProps) {

  const [logFriction, setLogFriction] = React.useState('');
  const [logRevisionType, setLogRevisionType] = React.useState('Standard Review');
  const [extractInput, setExtractInput] = React.useState('');
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [logError, setLogError] = React.useState('');

  const handleExtractAI = async () => {
    if (!extractInput.trim()) return;
    setIsExtracting(true);
    setLogError('');
    try {
        const apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");
        
        const reqBody = {
            contents: [{ parts: [{ text: `Extract JSON metrics from this text: "${extractInput}". Schema required (integer values only): { "retentionScore": X, "vsaqCount": X, "saqCount": X, "activeMins": X, "distractionMins": X }. Return ONLY JSON, no markdown formatting.` }] }]
        };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody)
        });
        if (!res.ok) throw new Error(`API responded with status: ${res.status}`);
        const data = await res.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        if (parsed.retentionScore) setLogRetention(parsed.retentionScore.toString());
        if (parsed.vsaqCount) setLogVsa(parsed.vsaqCount.toString());
        if (parsed.saqCount) setLogSa(parsed.saqCount.toString());
        if (parsed.activeMins) setLogActive(parsed.activeMins.toString());
        if (parsed.distractionMins) setLogDistract(parsed.distractionMins.toString());
        
        setLogNotes(extractInput);
        setExtractInput('');
    } catch(err: any) {
        setLogError(`AI Extraction Error: ${err.message}`);
    } finally {
        setIsExtracting(false);
    }
  };

  const handleLogSession = () => {
    if (!logTopic.trim()) { setLogError("Topic is required."); return; }
    if (logFriction.trim().length < 10) { 
        setLogError("You must identify what caused the most friction or time drain in this session. (Min 10 chars)"); 
        return; 
    }
    
    setLoggedSessions(prev => [...prev, {
        id: nanoid(),
        planId: logActivePlanId || undefined,
        associatedPlanId: logActivePlanId || undefined, // Used for synchronization
        subject: logSubject || 'General',
        topic: logTopic.trim(),
        sessionType: logType,
        revisionType: logType === 'Revise' ? logRevisionType : undefined,
        
        startPage: (logType === 'Study' || logType === 'Revise') ? (Number(logStartPage) || 0) : undefined,
        endPage: (logType === 'Study' || logType === 'Revise') ? (Number(logEndPage) || 0) : undefined,
        vsaCount: logType === 'Exercise' ? (Number(logVsa) || 0) : undefined,
        saCount: logType === 'Exercise' ? (Number(logSa) || 0) : undefined,
        laCount: logType === 'Exercise' ? (Number(logLa) || 0) : undefined,
        
        activeMins: Number(logActive) || 0,
        distractionMins: Number(logDistract) || 0,
        recoveryMins: Number(logRecover) || 0,
        retentionScore: Number(logRetention) || 5,
        frictionAnalysis: logFriction.trim(),
        notes: logNotes,
        isMissed: false
    }]);

    if (logActivePlanId && setMorningPlan) {
        setMorningPlan(plans => plans.map(p => p.id === logActivePlanId ? { ...p, status: 'completed' } : p));
    }

    setLogTopic('');
    setLogActive('0');
    setLogDistract('0');
    setLogRecover('0');
    setLogRetention('5');
    setLogStartPage('0');
    setLogEndPage('0');
    setLogVsa('0');
    setLogSa('0');
    setLogLa('0');
    setLogNotes('');
    setLogFriction('');
    setLogError('');
    setLogActivePlanId(null);
  };

  const handleEditLog = (log: LogItem) => {
    setLoggedSessions(prev => prev.filter(l => l.id !== log.id));

    setLogActivePlanId(log.planId || null);
    setLogSubject(log.subject);
    setLogTopic(log.topic);
    setLogType(log.sessionType);
    if (log.revisionType) setLogRevisionType(log.revisionType);
    
    if (log.sessionType === 'Exercise') {
        setLogVsa(log.vsaCount?.toString() || '0');
        setLogSa(log.saCount?.toString() || '0');
        setLogLa(log.laCount?.toString() || '0');
    } else {
        setLogStartPage(log.startPage?.toString() || '0');
        setLogEndPage(log.endPage?.toString() || '0');
    }

    setLogActive(log.activeMins.toString());
    setLogDistract(log.distractionMins.toString());
    setLogRecover(log.recoveryMins.toString());
    setLogRetention(log.retentionScore?.toString() || '5');
    setLogNotes(log.notes);
  };

  const calculateStats = () => {
      let totalScore = 0;
      let ratedSessions = 0;
      let totalPages = 0;
      let totalActiveMinsForPages = 0;
      
      loggedSessions.forEach(log => {
          totalScore += getFocusScore(log);
          ratedSessions++;
          
          if (!log.isMissed && (log.sessionType === 'Study' || log.sessionType === 'Revise') && log.startPage !== undefined && log.endPage !== undefined) {
              const pages = Math.max(0, log.endPage - log.startPage + 1);
              totalPages += pages;
              totalActiveMinsForPages += log.activeMins;
          }
      });
      const avgScore = ratedSessions > 0 ? Math.round(totalScore / ratedSessions) : 0;
      const timePerPage = totalPages > 0 ? (totalActiveMinsForPages / totalPages).toFixed(1) : '0';

      return { avgScore, timePerPage };
  };

  const { avgScore, timePerPage } = calculateStats();

  return (
    <section className="flex flex-col gap-6 w-full fade-in">
      <h2 className="font-headline text-headline-md text-on-surface font-bold">Daily Ledger</h2>

       {/* DAILY STATS BANNER */}
       <div className="glass-panel ghost-border p-4 flex gap-4 bg-gradient-to-br from-surface-container-lowest to-surface-container-low shadow-lg">
           <div className="flex-1 flex flex-col items-center justify-center border-r border-white/5">
               <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">Avg Focus</span>
               <span className={`text-3xl font-headline font-bold ${avgScore >= 80 ? 'text-tertiary-container' : avgScore >= 50 ? 'text-primary' : 'text-error'}`}>{avgScore}%</span>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center">
               <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">Time per Page</span>
               <span className="text-3xl font-headline font-bold text-on-surface">{timePerPage}<span className="text-sm text-on-surface-variant ml-1 font-normal">m</span></span>
           </div>
       </div>
      
      <div className="glass-panel ghost-border p-6 flex flex-col gap-6 bg-surface-container-low">
        <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2">Log Session</h3>
        
        <div className="bg-surface-container-lowest p-1 rounded-full flex justify-between">
          {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(type => (
             <button 
               key={type}
               onClick={() => setLogType(type)}
               className={`flex-1 py-1 px-1 text-center rounded-full text-xs font-medium transition-colors cursor-pointer ${logType === type ? 'bg-primary/20 text-primary-fixed' : 'text-on-surface-variant hover:bg-surface-container-high/50'}`}>
               {type}
             </button>
          ))}
        </div>

        {logType === 'Revise' && (
          <div>
              <label className="block text-label-sm text-on-surface-variant mb-2">Revision Depth</label>
              <select 
                  value={logRevisionType} 
                  onChange={e => setLogRevisionType(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors"
               >
                  <option value="Quick Recap">Quick Recap</option>
                  <option value="Standard Review">Standard Review</option>
                  <option value="Large Session / Deep Dive">Large Session / Deep Dive</option>
              </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-label-sm text-on-surface-variant mb-2">Subject</label>
               <input 
                 list="logger-subjects"
                 value={logSubject}
                 onChange={e => setLogSubject(e.target.value)}
                 placeholder="Select or type subject"
                 className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors" 
               />
               <datalist id="logger-subjects">
                   {userSettings.activeSubjects.map(sub => (
                       <option key={sub} value={sub}>{getSubjectConfig(sub).name}</option>
                   ))}
               </datalist>
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-2 truncate">Topic {logActivePlanId ? '(From Plan)' : ''}</label>
              <input type="text" value={logTopic} onChange={e=>setLogTopic(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors placeholder:text-on-surface-variant/50" placeholder="Required" />
            </div>
        </div>

        {(logType === 'Study' || logType === 'Revise') ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">Start Page</label>
                <input type="number" value={logStartPage} onChange={e=>setLogStartPage(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">End Page</label>
                <input type="number" value={logEndPage} onChange={e=>setLogEndPage(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
              </div>
            </div>
        ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">VSA (Very Short)</label>
                <input type="number" value={logVsa} onChange={e=>setLogVsa(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">SA (Short)</label>
                <input type="number" value={logSa} onChange={e=>setLogSa(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-variant mb-2">LA (Long)</label>
                <input type="number" value={logLa} onChange={e=>setLogLa(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
              </div>
            </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Active Mins</label>
            <input type="number" value={logActive} onChange={e=>setLogActive(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-tertiary-container/50 focus:ring-0 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Distract</label>
            <input type="number" value={logDistract} onChange={e=>setLogDistract(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-error/50 focus:ring-0 focus:outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Recov Mins</label>
            <input type="number" value={logRecover} onChange={e=>setLogRecover(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary-container/50 focus:ring-0 focus:outline-none transition-colors" />
          </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-label-sm text-on-surface-variant">Retention Score</label>
                <span className="font-bold text-primary">{logRetention}/10</span>
            </div>
            <input 
                type="range" 
                min="1" max="10" 
                value={logRetention} 
                onChange={e=>setLogRetention(e.target.value)} 
                className="w-full accent-primary" 
            />
        </div>

        <div>
          <label className="block text-label-sm text-on-surface-variant mb-2">Raw Cognitive Notes</label>
          <div className="flex flex-col gap-2 relative">
              <textarea 
                value={extractInput} 
                onChange={e => setExtractInput(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-tertiary-container/50 focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/50 resize-none font-body" 
                placeholder="Describe your session to auto-fill metrics via AI, or just type notes directly below..." 
                rows={2}
               ></textarea>
               <button 
                onClick={handleExtractAI}
                disabled={isExtracting}
                className={`absolute right-2 bottom-2 px-3 py-1 text-xs font-bold rounded-md bg-tertiary-container text-on-tertiary-container hover:opacity-80 transition-opacity ${isExtracting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
               >
                 {isExtracting ? 'Extracting...' : 'Auto-Fill Details'}
               </button>
          </div>
          <textarea 
            value={logNotes} 
            onChange={e=>setLogNotes(e.target.value)}
            className="w-full mt-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/50 resize-none font-body" 
            placeholder="Log insights, mental blocks, or immediate next steps..." 
            rows={3}></textarea>
        </div>

        <div>
           <label className="block text-label-sm text-on-surface-variant mb-2 text-error">Friction Point Analysis *</label>
           <textarea 
            value={logFriction} 
            onChange={e=>setLogFriction(e.target.value)}
            className="w-full bg-surface-container-lowest border border-error/30 rounded-lg p-4 text-on-surface focus:border-error focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/50 resize-none font-body" 
            placeholder="What caused the most friction or time drain in this session? (required, min 10 chars)" 
            rows={2}></textarea>
        </div>

        {logError && <div className="text-sm font-medium text-error p-3 bg-error/10 rounded-lg">{logError}</div>}

        <button onClick={handleLogSession} className="w-full rounded-full py-3 text-on-surface cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md font-medium text-sm transition-colors border border-white/5">
            Log Session Data
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        {loggedSessions.length === 0 && <p className="text-on-surface-variant text-sm border border-dashed border-white/10 rounded-xl p-4 text-center">No logged sessions today.</p>}
        {loggedSessions.slice().reverse().map(log => {
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
              <div key={log.id} className="glass-panel ghost-border p-5 flex flex-col gap-4 bg-surface-container-highest relative overflow-hidden transition-all shadow-sm">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${conf.bg}`}></div>
                
                <div className="flex justify-between items-start pl-2">
                  <div>
                    <span className={`text-xs font-bold ${conf.text} uppercase tracking-wider mb-1 block`}>{conf.name} {log.isMissed && ' - MISSED'} <span className="ml-2 text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded-sm">{log.sessionType}</span></span>
                    <h4 className="text-on-surface font-semibold text-lg">{log.topic}</h4>
                  </div>
                  <button onClick={() => handleEditLog(log)} className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </div>

                <div className="pl-2">
                  <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                    <span>Focus Score</span>
                    <span className="text-[#50C878] font-bold">{score}%</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest rounded-full h-2 overflow-hidden">
                    <div className={`bg-gradient-to-r ${conf.from} to-[#50C878] h-full rounded-full transition-all`} style={{ width: `${score}%` }}></div>
                  </div>
                </div>

                <div className="pl-2 flex gap-4 text-sm text-on-surface-variant mt-1 flex-wrap">
                  {metricsText && <span className="flex items-center gap-1 font-semibold text-on-surface"><span className="material-symbols-outlined text-[16px] text-tertiary-container">library_books</span> {metricsText}</span>}
                  <span className="flex items-center gap-1"><span className={`material-symbols-outlined text-[16px] ${log.isMissed ? 'text-error' : 'text-[#50C878]'}`}>{log.isMissed ? 'cancel' : 'check_circle'}</span> {log.activeMins}m Active</span>
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-error">warning</span> {log.distractionMins}m Dist</span>
                  {log.synced && <span className="flex items-center gap-1 ml-auto text-primary"><span className="material-symbols-outlined text-[16px]">sync</span> Synced</span>}
                </div>
              </div>
            );
        })}
      </div>
    </section>
  );
}
