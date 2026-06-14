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
  const [isAiPopulated, setIsAiPopulated] = useState(false);

  // --- DIGITAL SCRATCHPAD ENGINE WITH ERASE CONTROLS ---
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [canvasDrawingData, setCanvasDrawingData] = useState<string | undefined>(undefined);
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
            ctx.shadowBlur = 1;
            ctx.lineWidth = isEraserMode ? 16 : 3;
            ctx.strokeStyle = isEraserMode ? 'rgba(10,15,24,1)' : '#10B981';
        }
        // Load existing drawing onto canvas if present
        if (canvasDrawingData) {
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = canvasDrawingData;
        }
    }
  }, [showScratchpad, isEraserMode]);

  const clearCanvas = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setCanvasDrawingData(undefined);
      }
  };

  const syncCanvasDataString = () => {
      if (canvasRef.current) {
          const dataUrl = canvasRef.current.toDataURL();
          setCanvasDrawingData(dataUrl);
      }
  };

  const handleSaveLog = () => {
      if (!props.logTopic.trim()) return;
      
      if (!frictionText.trim() || frictionText.trim().length < 10) {
          alert("Friction Analysis: Please describe what slowed you down or felt difficult (minimum 10 characters).");
          return;
      }

      const newLog: LogItem = {
          id: nanoid(),
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
          synced: false,
          scratchpadImage: canvasDrawingData // Persists scratchpad layout data directly inside log matrix
      };

      props.setLoggedSessions(prev => [...prev, newLog]);
      
      if (props.logActivePlanId && props.setMorningPlan) {
          props.setMorningPlan(prev => prev.map(p => p.id === props.logActivePlanId ? { ...p, status: 'completed' } : p));
      }

      // Reset standard values
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
      props.setLogRetention('5');
      setCanvasDrawingData(undefined);
      setIsAiPopulated(false);
  };

  const handleExtractAI = async () => {
      if (!autoFillInput.trim()) return;
      const apiKey = localStorage.getItem('gemini_api_key');
      if (!apiKey) {
          alert("Please add your Gemini API Key in the Settings tab first.");
          return;
      }
      
      setIsExtracting(true);
      try {
          const reqBody = {
              contents: [{ parts: [{ text: `Analyze this study description: "${autoFillInput}". Extract data fields. Output format raw JSON only: { "topic": "string", "activeMins": number, "distractionMins": number, "startPage": number, "endPage": number, "vsaqCount": number, "saqCount": number, "laqCount": number, "retentionScore": number, "frictionPoint": "string" }.` }] }]
          };
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
          });
          const data = await res.json();
          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(textResponse.replace(/```json|```/g, '').trim());
          
          // Populate visible text fields instead of auto-saving instantly
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
          
          setIsAiPopulated(true); // Switches Retention input display format safely
          setAutoFillInput('');
      } catch(e) {
          alert("AI could not extract fields. Try formatting your sentence clearer.");
      } finally {
          setIsExtracting(false);
      }
  };

  return (
    <section className="flex flex-col gap-6 w-full animate-ios-fade-in text-zinc-100">
        <div className="ios-glass-panel p-6 flex flex-col gap-6">
           
           {/* Auto-Fill Reader */}
           <div className="flex flex-col gap-2">
               <label className="text-xs text-primary font-bold tracking-wider uppercase">Paste Session Text / Voice Transcription</label>
               <div className="flex gap-2">
                   <input type="text" value={autoFillInput} onChange={e => setAutoFillInput(e.target.value)} placeholder="e.g., Biology study 40 mins pages 20 to 35 retention score 8" className="flex-1 ios-glass-input px-4 py-3 text-sm" />
                   <button onClick={handleExtractAI} disabled={isExtracting || !autoFillInput.trim()} className="px-5 bg-primary text-white rounded-xl text-xs font-bold transition-all hover:bg-emerald-600 active:scale-95 cursor-pointer">{isExtracting ? 'Analyzing...' : 'Fill Form'}</button>
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
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Session Type</label>
                   <div className="grid grid-cols-3 ios-glass-input p-1.5">
                       {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(m => (
                           <button key={m} onClick={() => props.logType !== m && props.setLogType(m)} className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${props.logType === m ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}>{m}</button>
                       ))}
                   </div>
               </div>
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Chapter / Topic Name</label>
               <input type="text" value={props.logTopic} onChange={e => props.setLogTopic(e.target.value)} placeholder="Topic entry link..." className="w-full ios-glass-input p-3.5 text-sm" />
           </div>

           {props.logType === 'Revise' && (
               <div className="flex flex-col gap-2 animate-ios-fade-in">
                   <label className="text-xs font-bold tracking-wider uppercase text-sky-400">Revision Horizon</label>
                   <div className="grid grid-cols-3 ios-glass-input p-1.5">
                       {['Quick Recap', 'Standard Review', 'Deep Dive'].map(depth => (
                           <button key={depth} onClick={() => setRevisionDepth(depth)} className={`py-2 text-xs rounded-xl transition-all cursor-pointer ${revisionDepth === depth ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-zinc-400 hover:text-white'}`}>{depth}</button>
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
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">VSAQ Count</label>
                       <input type="number" value={props.logVsa} onChange={e => props.setLogVsa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SAQ Count</label>
                       <input type="number" value={props.logSa} onChange={e => props.setLogSa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">LAQ Count</label>
                       <input type="number" value={props.logLa} onChange={e => props.setLogLa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center" />
                   </div>
               </div>
           )}

           <div className="grid grid-cols-3 gap-4">
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-zinc-400 font-bold">Active Mins</label>
                   <input type="number" value={props.logActive} onChange={e => props.setLogActive(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-primary" />
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-zinc-400 font-bold">Distraction Mins</label>
                   <input type="number" value={props.logDistract} onChange={e => props.setLogDistract(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-error" />
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-zinc-400 font-bold">Recovery Mins</label>
                   <input type="number" value={props.logRecover} onChange={e => props.setLogRecover(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-sky-400" />
               </div>
           </div>

           {/* SMART RETENTION AREA: Range Slider for Manual, Raw Text container for AI */}
           <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Retention Score</label>
                   <span className="text-xs font-mono font-bold bg-black/40 border border-white/5 px-2.5 py-1 rounded text-amber-400">{props.logRetention} / 10</span>
               </div>
               {isAiPopulated ? (
                   <div className="w-full p-3.5 bg-black/30 border border-white/5 rounded-xl text-sm font-semibold text-zinc-300">
                       Extracted by AI analysis node. Click and drag the slider if you wish to overwrite.
                   </div>
               ) : null}
               <input 
                   type="range" min="1" max="10" step="1"
                   value={props.logRetention}
                   onChange={e => {
                       props.setLogRetention(e.target.value);
                       setIsAiPopulated(false); // Relinquish AI locks if user manual adjust runs
                   }}
                   className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer mt-1"
               />
           </div>

           <div className="flex flex-col gap-0 mt-2">
               <div className="flex items-center justify-between bg-amber-500/10 p-4 rounded-t-2xl border border-amber-500/20 border-b-0">
                   <label className="text-xs text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">gavel</span>
                       Friction Review *
                   </label>
                   <button type="button" onClick={() => setShowScratchpad(true)} className="flex items-center gap-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition-colors font-bold cursor-pointer border border-amber-500/20">
                       <span className="material-symbols-outlined text-[14px]">draw</span>
                       Open Scratchpad
                   </button>
               </div>
               <textarea rows={2} value={frictionText} onChange={e => setFrictionText(e.target.value)} placeholder="What concepts, equations, or items cost you time? (Minimum 10 characters)..." className="w-full bg-black/40 border border-amber-500/20 focus:border-amber-400/50 rounded-b-2xl p-4 text-sm outline-none text-white transition-colors" />
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Study Notes</label>
               <textarea rows={2} value={props.logNotes} onChange={e => props.setLogNotes(e.target.value)} placeholder="General study log annotations..." className="w-full ios-glass-input p-4 text-sm" />
           </div>

           <button onClick={handleSaveLog} className="w-full py-4 mt-2 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] cursor-pointer">Save Session Entry Log</button>
        </div>

        {/* Dynamic Scratchpad Canvas Modal Frame */}
        {showScratchpad && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-ios-fade-in">
                <div className="ios-glass-panel w-full max-w-4xl h-[75vh] flex flex-col overflow-hidden relative shadow-2xl">
                    <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/20">
                        <div className="flex items-center gap-4 text-primary font-bold text-sm uppercase tracking-wider">
                            <span className="material-symbols-outlined">draw</span> Scratchpad Canvas
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                               type="button" 
                               onClick={() => setIsEraserMode(!isEraserMode)} 
                               className={`text-xs px-4 py-2.5 rounded-xl border transition-all font-bold cursor-pointer ${isEraserMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px]">{isEraserMode ? 'edit' : 'ink_eraser'}</span>
                                    {isEraserMode ? 'Switch to Pen' : 'Switch to Eraser'}
                                </span>
                            </button>
                            <button type="button" onClick={clearCanvas} className="text-xs bg-white/5 px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer border border-white/10 font-bold">Clear All</button>
                            <button type="button" onClick={() => { syncCanvasDataString(); setShowScratchpad(false); }} className="bg-primary text-white text-xs px-5 py-2.5 rounded-xl font-bold cursor-pointer shadow-md">Save & Close</button>
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
                        onPointerUp={() => { isDrawing.current = false; syncCanvasDataString(); }}
                        onPointerLeave={() => { isDrawing.current = false; }}
                        className="flex-1 w-full bg-[#0a0f18] cursor-crosshair touch-none" 
                    />
                </div>
            </div>
        )}
    </section>
  );
}
