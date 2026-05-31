import React, { useState, useEffect, useRef } from 'react';
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

export default function DailyLedger(props: DailyLedgerProps) {
  const [autoFillInput, setAutoFillInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [frictionText, setFrictionText] = useState('');
  const [revisionDepth, setRevisionDepth] = useState('Standard Review');

  // Form Visibility Control State
  const [isLogging, setIsLogging] = useState(false);

  // Automatically expand the logging form if a plan is targeted in the left column
  useEffect(() => {
      if (props.logActivePlanId) {
          setIsLogging(true);
      }
  }, [props.logActivePlanId]);

  // --- DIGITAL SCRATCHPAD SAFE ENGINE ---
  const [showScratchpad, setShowScratchpad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false); 

  useEffect(() => {
    if (showScratchpad && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#10B981'; 
            ctx.lineWidth = 3;
        }
    }
  }, [showScratchpad]);

  const clearCanvas = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };

  const handleSaveLog = () => {
      if (!props.logTopic.trim()) return;
      
      if (!frictionText.trim() || frictionText.trim().length < 10) {
          alert("Metacognitive Review: Please log your Friction Point Analysis (min 10 characters) detailing any conceptual blockages before submitting.");
          return;
      }

      const newLog: LogItem = {
          id: nanoid(),
          // CRITICAL COMPILER FIX: Strictly Maps to Types.ts declaration
          planId: props.logActivePlanId || undefined,
          subject: props.logSubject,
          topic: props.logTopic.trim(),
          sessionType: props.logType,
          revisionType: props.logType === 'Revise' ? revisionDepth : undefined,
          activeMins: Number(props.logActive) || 0,
          distractionMins: Number(props.logDistract) || 0,
          recoveryMins: Number(props.logRecover) || 0,
          retentionScore: Number(props.logRetention) || 5,
          startPage: props.logType !== 'Exercise' && Number(props.logStartPage) ? Number(props.logStartPage) : undefined,
          endPage: props.logType !== 'Exercise' && Number(props.logEndPage) ? Number(props.logEndPage) : undefined,
          vsaCount: props.logType === 'Exercise' && Number(props.logVsa) ? Number(props.logVsa) : undefined,
          saCount: props.logType === 'Exercise' && Number(props.logSa) ? Number(props.logSa) : undefined,
          laCount: props.logType === 'Exercise' && Number(props.logLa) ? Number(props.logLa) : undefined,
          frictionAnalysis: frictionText.trim(),
          notes: props.logNotes.trim(),
          synced: false
      };

      props.setLoggedSessions(prev => [...prev, newLog]);
      
      if (props.logActivePlanId && props.setMorningPlan) {
          props.setMorningPlan(prev => prev.map(p => p.id === props.logActivePlanId ? { ...p, status: 'completed' } : p));
      }

      props.setLogTopic('');
      props.setLogActivePlanId(null);
      props.setLogActive('0');
      props.setLogDistract('0');
      props.setLogRecover('0');
      props.setLogNotes('');
      setFrictionText('');
      props.setLogStartPage('0');
      props.setLogEndPage('0');
      props.setLogVsa('0');
      props.setLogSa('0');
      props.setLogLa('0');
      
      // Auto-collapse form after successful commit
      setIsLogging(false);
  };

  const handleExtractAI = async () => {
      if (!autoFillInput.trim()) return;
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
          alert("Configure your Gemini API Key in the profile tab first.");
          return;
      }
      
      setIsExtracting(true);
      try {
          const reqBody = {
              contents: [{ parts: [{ text: `Extract data fields from this text: "${autoFillInput}". Output format: { "topic": "string", "activeMins": number, "distractionMins": number, "startPage": number, "endPage": number, "vsaqCount": number, "saqCount": number, "laqCount": number, "retentionScore": number, "frictionPoint": "string" }. Return raw JSON only.` }] }]
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
          });
          const data = await res.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(textResponse.replace(/```json|```/g, '').trim());
          
          if (parsed.topic) props.setLogTopic(parsed.topic);
          if (parsed.activeMins) props.setLogActive(String(parsed.activeMins));
          if (parsed.distractionMins) props.setLogDistract(String(parsed.distractionMins));
          if (parsed.startPage) props.setLogStartPage(String(parsed.startPage));
          if (parsed.endPage) props.setLogEndPage(String(parsed.endPage));
          if (parsed.vsaqCount) props.setLogVsa(String(parsed.vsaqCount));
          if (parsed.saqCount) props.setLogSa(String(parsed.saqCount));
          if (parsed.laqCount) props.setLogLa(String(parsed.laqCount));
          if (parsed.retentionScore) props.setLogRetention(String(parsed.retentionScore));
          if (parsed.frictionPoint) setFrictionText(parsed.frictionPoint);
          
          setAutoFillInput('');
      } catch(e) {
          alert("AI extraction failed to parse input.");
      } finally {
          setIsExtracting(false);
      }
  };

  return (
    <section className="flex flex-col gap-6 w-full animate-ios-fade-in text-zinc-100">
        
        {/* Dynamic Header & Modal Trigger */}
        <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl tracking-tight font-bold">Logging Dashboard</h2>
            {!isLogging && (
              <button 
                onClick={() => setIsLogging(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                New Log
              </button>
            )}
        </div>
        
        {/* Animated iOS Glass Logging Modal */}
        {isLogging && (
            <div className="ios-glass-panel p-6 flex flex-col gap-6 animate-ios-fade-in relative z-10">
               <button 
                 onClick={() => {
                     setIsLogging(false);
                     props.setLogActivePlanId(null);
                 }} 
                 className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
               >
                 <span className="material-symbols-outlined text-[20px]">close</span>
               </button>

               <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">track_changes</span> Session Telemetry
               </h3>

               <div className="flex flex-col gap-2">
                   <label className="text-xs text-primary font-bold tracking-wider uppercase">Telemetry AI Auto-Fill</label>
                   <div className="flex gap-2">
                       <input type="text" value={autoFillInput} onChange={e => setAutoFillInput(e.target.value)} placeholder="e.g., Physics block 45 mins pages 10 to 20 retention 8" className="flex-1 ios-glass-input px-4 py-3 text-sm" />
                       <button onClick={handleExtractAI} disabled={isExtracting || !autoFillInput.trim()} className="px-5 bg-primary text-white rounded-xl text-xs font-bold transition-all hover:bg-emerald-600 active:scale-95 cursor-pointer">{isExtracting ? 'Parsing...' : 'Process'}</button>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject Area</label>
                       <select value={props.logSubject} onChange={e => props.setLogSubject(e.target.value as SubjectKey)} className="w-full ios-glass-input p-3.5 text-sm">
                           {props.userSettings.activeSubjects.map(sub => (
                               <option key={sub} value={sub} className="bg-[#0a0f18]">{getSubjectConfig(sub).name}</option>
                           ))}
                       </select>
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Session Modality</label>
                       <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5">
                           {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(m => (
                               <button key={m} onClick={() => props.logType !== m && props.setLogType(m)} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${props.logType === m ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>{m}</button>
                           ))}
                       </div>
                   </div>
               </div>

               <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Topic</label>
                   <input type="text" value={props.logTopic} onChange={e => props.setLogTopic(e.target.value)} placeholder="Syllabus entry node..." className="w-full ios-glass-input p-3.5 text-sm" />
               </div>

               {props.logType === 'Revise' && (
                   <div className="flex flex-col gap-2 animate-ios-fade-in">
                       <label className="text-xs font-bold tracking-wider uppercase text-sky-400">Revision Horizon</label>
                       <div className="flex bg-sky-500/10 p-1.5 rounded-2xl border border-sky-500/20">
                           {['Quick Recap', 'Standard Review', 'Deep Dive'].map(depth => (
                               <button key={depth} onClick={() => setRevisionDepth(depth)} className={`flex-1 py-2 text-xs rounded-xl transition-all cursor-pointer ${revisionDepth === depth ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>{depth}</button>
                           ))}
                       </div>
                   </div>
               )}

               {props.logType !== 'Exercise' ? (
                   <div className="grid grid-cols-2 gap-5">
                       <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Page</label>
                           <input type="number" value={props.logStartPage} onChange={e => props.setLogStartPage(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm" />
                       </div>
                       <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">End Page</label>
                           <input type="number" value={props.logEndPage} onChange={e => props.setLogEndPage(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm" />
                       </div>
                   </div>
               ) : (
                   <div className="grid grid-cols-3 gap-3">
                       <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">VSAQ</label>
                           <input type="number" value={props.logVsa} onChange={e => props.setLogVsa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                       </div>
                       <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SAQ</label>
                           <input type="number" value={props.logSa} onChange={e => props.setLogSa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                       </div>
                       <div className="flex flex-col gap-2">
                           <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LAQ</label>
                           <input type="number" value={props.logLa} onChange={e => props.setLogLa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                       </div>
                   </div>
               )}

               <div className="grid grid-cols-4 gap-3">
                   <div className="flex flex-col gap-1">
                       <label className="text-[10px] uppercase text-zinc-400 font-bold">Active</label>
                       <input type="number" value={props.logActive} onChange={e => props.setLogActive(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-primary" />
                   </div>
                   <div className="flex flex-col gap-1">
                       <label className="text-[10px] uppercase text-zinc-400 font-bold">Distract</label>
                       <input type="number" value={props.logDistract} onChange={e => props.setLogDistract(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-error" />
                   </div>
                   <div className="flex flex-col gap-1">
                       <label className="text-[10px] uppercase text-zinc-400 font-bold">Recover</label>
                       <input type="number" value={props.logRecover} onChange={e => props.setLogRecover(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-sky-400" />
                   </div>
                   <div className="flex flex-col gap-1">
                       <label className="text-[10px] uppercase text-zinc-400 font-bold">Retention</label>
                       <input type="number" min="1" max="10" value={props.logRetention} onChange={e => props.setLogRetention(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-amber-400" />
                   </div>
               </div>

               <div className="flex flex-col gap-0 mt-2">
                   <div className="flex items-center justify-between bg-amber-500/10 p-4 rounded-t-2xl border border-amber-500/20 border-b-0">
                       <label className="text-xs text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
                           <span className="material-symbols-outlined text-[16px]">gavel</span>
                           Friction Point Analysis *
                       </label>
                       <button type="button" onClick={() => setShowScratchpad(true)} className="flex items-center gap-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold cursor-pointer border border-amber-500/20">
                           <span className="material-symbols-outlined text-[14px]">draw</span>
                           Scratchpad
                       </button>
                   </div>
                   <textarea rows={2} value={frictionText} onChange={e => setFrictionText(e.target.value)} placeholder="Pinpoint equation breakdowns or concepts that cost time (Min 10 characters)..." className="w-full bg-black/40 border border-amber-500/20 focus:border-amber-400/50 rounded-b-2xl p-4 text-sm outline-none text-white transition-colors" />
               </div>

               <div className="flex flex-col gap-2">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Notes</label>
                   <textarea rows={2} value={props.logNotes} onChange={e => props.setLogNotes(e.target.value)} placeholder="General log annotations..." className="w-full ios-glass-input p-4 text-sm" />
               </div>

               <button onClick={handleSaveLog} className="w-full rounded-xl py-4 mt-2 text-white font-bold text-sm tracking-wide bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] cursor-pointer">Commit Logs to Database Pipeline</button>
            </div>
        )}

        {/* Floating Digital Scratchpad Canvas Modal */}
        {showScratchpad && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-ios-fade-in text-zinc-100">
                <div className="ios-glass-panel w-full max-w-4xl h-[75vh] flex flex-col overflow-hidden relative shadow-2xl">
                    <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/20">
                        <div className="flex items-center gap-2 text-primary font-bold">
                            <span className="material-symbols-outlined">draw</span> Cognitive Scratchpad
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={clearCanvas} className="text-xs bg-white/5 px-5 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10 font-bold">Clear Canvas</button>
                            <button type="button" onClick={() => setShowScratchpad(false)} className="text-zinc-400 hover:text-white cursor-pointer p-2 transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                    </div>
                    <canvas 
                        ref={canvasRef} 
                        onPointerDown={(e) => {
                            if (!canvasRef.current) return;
                            isDrawing.current = true;
                            const rect = canvasRef.current.getBoundingClientRect();
                            const ctx = canvasRef.current.getContext('2d');
                            if (ctx) {
                                ctx.beginPath();
                                ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                            }
                        }}
                        onPointerMove={(e) => {
                            if (!isDrawing.current || !canvasRef.current) return;
                            const rect = canvasRef.current.getBoundingClientRect();
                            const ctx = canvasRef.current.getContext('2d');
                            if (ctx) {
                                ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                                ctx.stroke();
                            }
                        }}
                        onPointerUp={() => { isDrawing.current = false; }}
                        onPointerLeave={() => { isDrawing.current = false; }}
                        className="flex-1 w-full cursor-crosshair touch-none" 
                    />
                </div>
            </div>
        )}

        {/* Clean Log Feed Rendering */}
        <div className="flex flex-col gap-4 mt-2">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Confirmed Logs</h3>
            {props.loggedSessions.length === 0 ? (
                <div className="ios-glass-card-nested p-8 text-center border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[32px] text-zinc-600">history</span>
                    <p className="text-sm text-zinc-500 font-medium">No activity logs recorded. Complete a session to see it here.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                   {props.loggedSessions.map((log) => {
                       const conf = getSubjectConfig(log.subject);
                       const score = getFocusScore(log);
                       let metricsText = '';
                       if (log.startPage || log.endPage) metricsText = `Pages: ${log.startPage || 0}-${log.endPage || 0}`;
                       if (log.vsaCount || log.saCount) metricsText = `VSAQ: ${log.vsaCount || 0} | SAQ: ${log.saCount || 0} | LAQ: ${log.laCount || 0}`;
                       
                       return (
                          <div key={log.id} className="ios-glass-card-nested p-5 flex items-start gap-4 relative overflow-hidden transition-all duration-300">
                              <div className={`w-1.5 rounded-full self-stretch ${conf.bg}`}></div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-start mb-3">
                                      <div className="flex items-center gap-2">
                                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${conf.bg} text-black tracking-widest`}>{conf.name}</span>
                                          <span className="text-xs text-zinc-400 font-mono bg-black/30 border border-white/5 px-2.5 py-1 rounded-lg">{log.sessionType}</span>
                                      </div>
                                      <span className="text-xs font-bold text-zinc-400 bg-black/20 border border-white/5 px-3 py-1.5 rounded-lg">Score: <span className="text-primary">{score}%</span></span>
                                  </div>
                                  <h4 className="text-zinc-100 font-semibold text-lg mb-2">{log.topic}</h4>
                                  
                                  {log.frictionAnalysis && (
                                      <p className="text-xs text-amber-300 bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 leading-relaxed mb-3 mt-1">
                                          <strong className="text-amber-400">Friction:</strong> {log.frictionAnalysis}
                                      </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-5 text-sm text-zinc-400 mt-1 font-medium">
                                      {metricsText && <span className="flex items-center gap-1.5 font-semibold text-zinc-300"><span className="material-symbols-outlined text-[16px] text-primary">menu_book</span> {metricsText}</span>}
                                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">timer</span> {log.activeMins}m Active</span>
                                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">warning</span> {log.distractionMins}m Dist</span>
                                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">psychology</span> Ret: {log.retentionScore}/10</span>
                                  </div>
                              </div>
                          </div>
                       );
                   })}
                </div>
            )}
        </div>
    </section>
  );
}
