import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { SubjectKey, SessionMode, LogItem, PlanItem, UserSettings, getSubjectConfig } from '../types';

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
  const [frictionText, setFrictionText] = useState('');
  const [revisionDepth, setRevisionDepth] = useState('Standard Review');

  // --- REENGINEERED IMMERSIVE SCRATCHPAD LAYER ---
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [inkColor, setInkColor] = useState('var(--theme-primary)');
  const [canvasDrawingData, setCanvasDrawingData] = useState<string | undefined>(undefined);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (showScratchpad && canvasRef.current) {
        const canvas = canvasRef.current;
        // Make the canvas fluidly fill the client screen dimension boundaries
        canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
        canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = isEraserMode ? 24 : 4;
            ctx.strokeStyle = isEraserMode ? '#070a12' : inkColor;
        }
        if (canvasDrawingData) {
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = canvasDrawingData;
        }
    }
  }, [showScratchpad, isEraserMode, inkColor, canvasDrawingData]);

  const clearCanvas = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setCanvasDrawingData(undefined);
      }
  };

  const syncCanvasDataString = () => {
      if (canvasRef.current) {
          setCanvasDrawingData(canvasRef.current.toDataURL());
      }
  };

  const handleSaveLog = () => {
      if (!props.logTopic.trim()) return;
      
      if (!frictionText.trim() || frictionText.trim().length < 10) {
          alert("Friction Review: Please append a concise conceptual bottleneck summary (min 10 letters).");
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
          scratchpadImage: canvasDrawingData
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
      props.setLogRetention('5');
      setCanvasDrawingData(undefined);
  };

  return (
    <section className="flex flex-col gap-6 w-full text-zinc-100 transition-all duration-500">
        <div className="ios-glass-panel p-6 flex flex-col gap-6"
             style={{
               backdropFilter: 'blur(var(--glass-blur, 24px))',
               WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
               backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
             }}>
           
           {/* Primary Metadata Selectors */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="flex flex-col gap-2">
                   <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Subject</label>
                   <select value={props.logSubject} onChange={e => props.setLogSubject(e.target.value as SubjectKey)} className="w-full ios-glass-input p-3.5 text-sm bg-[#0a0f18]/80 border-white/[0.06] outline-none rounded-xl">
                       {props.userSettings.activeSubjects.map(sub => (
                           <option key={sub} value={sub} className="bg-[#0a0f18] text-white">{getSubjectConfig(sub).name}</option>
                       ))}
                   </select>
               </div>
               <div className="flex flex-col gap-2">
                   <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                   <div className="grid grid-cols-3 bg-black/20 p-1 border border-white/[0.05] rounded-xl">
                       {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(m => (
                           <button key={m} onClick={() => props.logType !== m && props.setLogType(m)} className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${props.logType === m ? 'bg-primary text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>{m}</button>
                       ))}
                   </div>
               </div>
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Chapter / Topic</label>
               <input type="text" value={props.logTopic} onChange={e => props.setLogTopic(e.target.value)} placeholder="Enter active topic vector..." className="w-full ios-glass-input p-3.5 text-sm rounded-xl border-white/[0.06] bg-black/10 focus:border-primary/40 outline-none" />
           </div>

           {props.logType === 'Revise' && (
               <div className="flex flex-col gap-2 animate-ios-fade-in">
                   <label className="text-[11px] font-bold tracking-widest uppercase text-sky-400">Revision Horizon</label>
                   <div className="grid grid-cols-3 bg-black/20 p-1 border border-white/[0.05] rounded-xl">
                       {['Quick Recap', 'Standard Review', 'Deep Dive'].map(depth => (
                           <button key={depth} onClick={() => setRevisionDepth(depth)} className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${revisionDepth === depth ? 'bg-sky-500/20 text-sky-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}>{depth}</button>
                       ))}
                   </div>
               </div>
           )}

           {/* Metrics Quantifiers Matrix */}
           {props.logType !== 'Exercise' ? (
               <div className="grid grid-cols-2 gap-5">
                   <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Start Page</label>
                       <input type="number" value={props.logStartPage} onChange={e => props.setLogStartPage(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm rounded-xl border-white/[0.06] bg-black/10 outline-none" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">End Page</label>
                       <input type="number" value={props.logEndPage} onChange={e => props.setLogEndPage(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm rounded-xl border-white/[0.06] bg-black/10 outline-none" />
                   </div>
               </div>
           ) : (
               <div className="grid grid-cols-3 gap-3">
                   <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">VSAQ</label>
                       <input type="number" value={props.logVsa} onChange={e => props.setLogVsa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center rounded-xl border-white/[0.06] bg-black/10 outline-none" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">SAQ</label>
                       <input type="number" value={props.logSa} onChange={e => props.setLogSa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center rounded-xl border-white/[0.06] bg-black/10 outline-none" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">LAQ</label>
                       <input type="number" value={props.logLa} onChange={e => props.setLogLa(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm text-center rounded-xl border-white/[0.06] bg-black/10 outline-none" />
                   </div>
               </div>
           )}

           {/* Time Distribution Fields */}
           <div className="grid grid-cols-3 gap-4">
               <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-center">Active</label>
                   <input type="number" value={props.logActive} onChange={e => props.setLogActive(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-primary rounded-xl border-white/[0.06] bg-black/10 outline-none" />
               </div>
               <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-center">Distracted</label>
                   <input type="number" value={props.logDistract} onChange={e => props.setLogDistract(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-error rounded-xl border-white/[0.06] bg-black/10 outline-none" />
               </div>
               <div className="flex flex-col gap-1.5">
                   <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider text-center">Recovery</label>
                   <input type="number" value={props.logRecover} onChange={e => props.setLogRecover(e.target.value)} className="w-full ios-glass-input p-3 text-sm text-center font-bold text-sky-400 rounded-xl border-white/[0.06] bg-black/10 outline-none" />
               </div>
           </div>

           {/* Precision Retention Range Dial */}
           <div className="flex flex-col gap-2">
               <div className="flex justify-between items-center">
                   <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Retention</label>
                   <span className="text-xs font-mono font-bold bg-black/40 border border-white/[0.05] px-2.5 py-1 rounded-lg text-amber-400">{props.logRetention} / 10</span>
               </div>
               <input 
                   type="range" min="1" max="10" step="1"
                   value={props.logRetention}
                   onChange={e => props.setLogRetention(e.target.value)}
                   className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer mt-1"
               />
           </div>

           {/* Friction Review & Scratchpad Entry Trigger */}
           <div className="flex flex-col gap-0 mt-2">
               <div className="flex items-center justify-between bg-amber-500/5 p-3.5 rounded-t-2xl border border-white/[0.06] border-b-0">
                   <label className="text-[11px] text-amber-400 font-bold tracking-wider uppercase flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">gavel</span>
                       Friction Review
                   </label>
                   <button type="button" onClick={() => setShowScratchpad(true)} className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors font-bold cursor-pointer border border-amber-500/20">
                       <span className="material-symbols-outlined text-[15px]">draw</span>
                       Canvas
                   </button>
               </div>
               <textarea rows={2} value={frictionText} onChange={e => setFrictionText(e.target.value)} placeholder="Identify and capture conceptual friction components (Minimum 10 characters)..." className="w-full bg-black/20 border border-white/[0.06] focus:border-amber-400/30 rounded-b-2xl p-4 text-sm outline-none text-white transition-colors placeholder:text-zinc-600" />
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
               <textarea rows={2} value={props.logNotes} onChange={e => props.setLogNotes(e.target.value)} placeholder="Study logs annotations..." className="w-full bg-black/20 border border-white/[0.06] focus:border-primary/30 rounded-xl p-4 text-sm outline-none text-white transition-colors" />
           </div>

           <button onClick={handleSaveLog} className="w-full py-4 mt-2 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-primary/20 transition-all duration-500 active:scale-[0.99] cursor-pointer">Save Entry Log</button>
        </div>

        {/* --- PREMIUM IMMERSIVE FULL-SCREEN TAKEOVER CANVAS MODAL --- */}
        {showScratchpad && (
            <div className="fixed inset-0 z-[100] flex flex-col bg-[#070a12]/95 backdrop-blur-xl transition-all duration-500 animate-ios-fade-in animate-duration-500">
                
                {/* Minimalist Header Container with Symbolic Controls Only */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.06] bg-black/30">
                    
                    {/* Active Ink Color Dots Row Selection Layer */}
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setIsEraserMode(false); setInkColor('var(--theme-primary)'); }} className={`w-6 h-6 rounded-full bg-primary border-2 transition-all ${!isEraserMode && inkColor === 'var(--theme-primary)' ? 'border-white scale-110' : 'border-transparent opacity-60'}`} />
                        <button onClick={() => { setIsEraserMode(false); setInkColor('#EF4444'); }} className={`w-6 h-6 rounded-full bg-red-500 border-2 transition-all ${!isEraserMode && inkColor === '#EF4444' ? 'border-white scale-110' : 'border-transparent opacity-60'}`} />
                        <button onClick={() => { setIsEraserMode(false); setInkColor('#FFFFFF'); }} className={`w-6 h-6 rounded-full bg-white border-2 transition-all ${!isEraserMode && inkColor === '#FFFFFF' ? 'border-white scale-110' : 'border-transparent opacity-60'}`} />
                        <button onClick={() => { setIsEraserMode(false); setInkColor('#F59E0B'); }} className={`w-6 h-6 rounded-full bg-amber-500 border-2 transition-all ${!isEraserMode && inkColor === '#F59E0B' ? 'border-white scale-110' : 'border-transparent opacity-60'}`} />
                    </div>

                    {/* Toolbar Functional Actions Row utilizing Symbol Icons only */}
                    <div className="flex items-center gap-4">
                        <button 
                           type="button" 
                           onClick={() => setIsEraserMode(!isEraserMode)} 
                           className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${isEraserMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-zinc-400 border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">{isEraserMode ? 'edit' : 'ink_eraser'}</span>
                        </button>
                        
                        <button type="button" onClick={clearCanvas} className="p-2.5 bg-white/5 rounded-xl text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        
                        <button type="button" onClick={() => { syncCanvasDataString(); setShowScratchpad(false); }} className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/20 transition-all cursor-pointer flex items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        </button>
                    </div>
                </div>

                {/* Infinite Canvas Drawing Grid Plane */}
                <div className="flex-1 w-full h-full relative bg-[#070a12]">
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
                        className="w-full h-full cursor-crosshair touch-none" 
                    />
                </div>
            </div>
        )}
    </section>
  );
}
