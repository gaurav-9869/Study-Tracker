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

export default function DailyLedger(props: DailyLedgerProps) {
  const [autoFillInput, setAutoFillInput] = React.useState('');
  const [isExtracting, setIsExtracting] = React.useState(false);
  const [frictionText, setFrictionText] = React.useState('');
  const [revisionDepth, setRevisionDepth] = React.useState('Standard Review');

  // --- DIGITAL SCRATCHPAD BACKGROUND ENGINE ---
  const [showScratchpad, setShowScratchpad] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!showScratchpad || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Premium Stylus Rendering Config
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#10B981'; // Emerald Green
    ctx.lineWidth = 3;

    let drawing = false;

    const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e && e.touches.length > 0) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        const mouseEvent = e as MouseEvent;
        return { x: mouseEvent.clientX - rect.left, y: mouseEvent.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
        drawing = true;
        const { x, y } = getPos(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const move = (e: MouseEvent | TouchEvent) => {
        if (!drawing) return;
        if (e.cancelable) e.preventDefault(); // Lock tablet viewports during handwriting loops
        const { x, y } = getPos(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stop = () => { drawing = false; };

    // Direct Browser Event Injectors (Bypasses compilation hurdles perfectly)
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);
    canvas.addEventListener('touchcancel', stop);

    return () => {
        canvas.removeEventListener('mousedown', start);
        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('mouseup', stop);
        canvas.removeEventListener('mouseleave', stop);
        canvas.removeEventListener('touchstart', start);
        canvas.removeEventListener('touchmove', move);
        canvas.removeEventListener('touchend', stop);
        canvas.removeEventListener('touchcancel', stop);
    };
  }, [showScratchpad]);

  const clearCanvas = () => {
      if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
  };
  // --- END OF BACKGROUND ENGINE ---

  const handleSaveLog = () => {
      if (!props.logTopic.trim()) return;
      
      if (!frictionText.trim() || frictionText.trim().length < 10) {
          alert("Metacognitive Review: Please log your Friction Point Analysis (min 10 characters) detailing any conceptual blockages before submitting.");
          return;
      }

      const newLog: LogItem = {
          id: nanoid(),
          associatedPlanId: props.logActivePlanId || undefined,
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
    <section className="flex flex-col gap-6 w-full fade-in">
        <h2 className="font-headline text-headline-md text-on-surface font-bold">Logging Dashboard</h2>
        
        {/* Glassmorphism Implementation Container */}
        <div className="glass-panel ghost-border p-6 bg-surface-container-low flex flex-col gap-6 rounded-3xl">
           <div className="flex flex-col gap-2">
               <label className="text-xs text-primary font-bold tracking-wider uppercase">Telemetry AI Auto-Fill</label>
               <div className="flex gap-2">
                   <input type="text" value={autoFillInput} onChange={e => setAutoFillInput(e.target.value)} placeholder="e.g., Physics block 45 mins pages 10 to 20 retention 8" className="flex-1 bg-surface-container-lowest border border-white/5 rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/50 transition-colors" />
                   <button onClick={handleExtractAI} disabled={isExtracting || !autoFillInput.trim()} className="px-4 bg-primary text-on-primary-fixed rounded-xl text-xs font-bold transition-all hover:bg-primary-container active:scale-95 cursor-pointer">{isExtracting ? 'Parsing...' : 'Process'}</button>
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex flex-col gap-2">
                   <label className="text-xs text-on-surface-variant font-semibold">Subject Area</label>
                   <select value={props.logSubject} onChange={e => props.setLogSubject(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary/50">
                       {props.userSettings.activeSubjects.map(sub => (
                           <option key={sub} value={sub}>{getSubjectConfig(sub).name}</option>
                       ))}
                   </select>
               </div>
               <div className="flex flex-col gap-2">
                   <label className="text-xs text-on-surface-variant font-semibold">Session Modality</label>
                   <div className="grid grid-cols-3 bg-surface-container-lowest p-1 rounded-xl border border-white/5">
                       {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(m => (
                           <button key={m} onClick={() => props.logType !== m && props.setLogType(m)} className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${props.logType === m ? 'bg-primary text-on-primary-fixed shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}>{m}</button>
                       ))}
                   </div>
               </div>
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-xs text-on-surface-variant font-semibold">Topic</label>
               <input type="text" value={props.logTopic} onChange={e => props.setLogTopic(e.target.value)} placeholder="Syllabus entry node..." className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary/50" />
           </div>

           {props.logType === 'Revise' && (
               <div className="flex flex-col gap-2 fade-in">
                   <label className="text-xs text-tertiary font-bold tracking-wider uppercase">Revision Horizon</label>
                   <div className="grid grid-cols-3 bg-surface-container-lowest p-1 rounded-xl border border-white/5">
                       {['Quick Recap', 'Standard Review', 'Deep Dive'].map(depth => (
                           <button key={depth} onClick={() => setRevisionDepth(depth)} className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${revisionDepth === depth ? 'bg-tertiary/20 text-tertiary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}>{depth}</button>
                       ))}
                   </div>
               </div>
           )}

           {props.logType !== 'Exercise' ? (
               <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                       <label className="text-xs text-on-surface-variant font-semibold">Start Page</label>
                       <input type="number" value={props.logStartPage} onChange={e => props.setLogStartPage(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-primary/50" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs text-on-surface-variant font-semibold">End Page</label>
                       <input type="number" value={props.logEndPage} onChange={e => props.setLogEndPage(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-sm outline-none focus:border-primary/50" />
                   </div>
               </div>
           ) : (
               <div className="grid grid-cols-3 gap-2">
                   <div className="flex flex-col gap-2">
                       <label className="text-xs text-on-surface-variant font-semibold">VSAQ</label>
                       <input type="number" value={props.logVsa} onChange={e => props.setLogVsa(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-xs text-center outline-none focus:border-primary/50" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs text-on-surface-variant font-semibold">SAQ</label>
                       <input type="number" value={props.logSa} onChange={e => props.setLogSa(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-xs text-center outline-none focus:border-primary/50" />
                   </div>
                   <div className="flex flex-col gap-2">
                       <label className="text-xs text-on-surface-variant font-semibold">LAQ</label>
                       <input type="number" value={props.logLa} onChange={e => props.setLogLa(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-xs text-center outline-none focus:border-primary/50" />
                   </div>
               </div>
           )}

           <div className="grid grid-cols-4 gap-2">
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-on-surface-variant font-bold">Active</label>
                   <input type="number" value={props.logActive} onChange={e => props.setLogActive(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-sm text-center font-bold text-primary focus:border-primary/50" />
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-on-surface-variant font-bold">Distract</label>
                   <input type="number" value={props.logDistract} onChange={e => props.setLogDistract(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-sm text-center font-bold text-error focus:border-error/50" />
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-on-surface-variant font-bold">Recover</label>
                   <input type="number" value={props.logRecover} onChange={e => props.setLogRecover(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-sm text-center font-bold text-tertiary focus:border-tertiary/50" />
               </div>
               <div className="flex flex-col gap-1">
                   <label className="text-[10px] uppercase text-on-surface-variant font-bold">Retention</label>
                   <input type="number" min="1" max="10" value={props.logRetention} onChange={e => props.setLogRetention(e.target.value)} className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-2 text-sm text-center font-bold text-amber-400 focus:border-amber-400/50" />
               </div>
           </div>

           {/* Upgraded Amber Warning UI for Friction Analysis Grid Layout */}
           <div className="flex flex-col gap-2 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 relative">
               <div className="flex items-center justify-between">
                   <label className="text-xs text-amber-400 font-bold tracking-wider uppercase flex items-center gap-1">
                       <span className="material-symbols-outlined text-[16px]">gavel</span>
                       Friction Point Analysis *
                   </label>
                   <button onClick={() => setShowScratchpad(true)} className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors font-bold cursor-pointer border border-amber-500/20">
                       <span className="material-symbols-outlined text-[14px]">draw</span>
                       Digital Scratchpad
                   </button>
               </div>
               <textarea rows={2} value={frictionText} onChange={e => setFrictionText(e.target.value)} placeholder="Pinpoint equation breakdowns or concepts that cost time (Min 10 characters)..." className="w-full bg-surface-container-lowest border border-amber-400/20 focus:border-amber-400/50 rounded-xl p-3 text-sm outline-none text-on-surface transition-colors" />
           </div>

           <div className="flex flex-col gap-2">
               <label className="text-xs text-on-surface-variant font-semibold">Notes</label>
               <textarea rows={2} value={props.logNotes} onChange={e => props.setLogNotes(e.target.value)} placeholder="General log annotations..." className="w-full bg-surface-container-lowest border border-white/5 rounded-xl p-3 text-sm text-on-surface outline-none" />
           </div>

           <button onClick={handleSaveLog} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary-fixed font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.99] cursor-pointer">Commit Logs to Database Pipeline</button>
        </div>

        {/* Floating Digital Scratchpad Interactive Model Canvas Layer */}
        {showScratchpad && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm fade-in">
                <div className="glass-panel w-full max-w-2xl h-[60vh] rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-2xl relative bg-[#0a0f18]">
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-surface-container-lowest">
                        <div className="flex items-center gap-2 text-primary font-bold">
        
