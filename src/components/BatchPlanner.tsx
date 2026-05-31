import React, { useState } from 'react';
import { nanoid } from 'nanoid';
import { SubjectKey, SessionMode, PlanItem, UserSettings, getSubjectConfig } from '../types';

interface BatchPlannerProps {
  morningPlan: PlanItem[];
  setMorningPlan: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  logActivePlanId: string | null;
  selectPlanForLogging: (plan: PlanItem) => void;
  userSettings: UserSettings;
}

export default function BatchPlanner({ morningPlan, setMorningPlan, logActivePlanId, selectPlanForLogging, userSettings }: BatchPlannerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [planSubject, setPlanSubject] = useState<SubjectKey>('bio');
  const [planTopic, setPlanTopic] = useState('');
  const [planType, setPlanType] = useState<SessionMode>('Study');
  const [planTarget, setPlanTarget] = useState('0');
  const [planMins, setPlanMins] = useState('0');

  const handleAddPlan = () => {
    if (!planTopic.trim()) return;
    setMorningPlan(prev => [...prev, {
        id: nanoid(),
        subject: planSubject || 'General',
        topic: planTopic.trim(),
        sessionType: planType,
        targetUnits: Number(planTarget) || 0,
        targetMins: Number(planMins) || 0
    }]);
    setPlanTopic('');
    setPlanTarget('0');
    setPlanMins('0');
    setIsAdding(false); // Auto-closes the modal pane after successful creation
  };

  return (
    <section className="flex flex-col gap-6 w-full animate-ios-fade-in text-zinc-100">
      
      {/* Dynamic Header & Modal Trigger */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-2xl tracking-tight font-bold">Session Architect</h2>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Task
          </button>
        )}
      </div>
      
      {/* Animated iOS Glass Creation Modal */}
      {isAdding && (
        <div className="ios-glass-panel p-6 flex flex-col gap-6 animate-ios-fade-in relative z-10">
          <button 
            onClick={() => setIsAdding(false)} 
            className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-1 flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">edit_document</span> Create Deployment
          </h3>
          
          <div className="bg-black/30 p-1.5 rounded-2xl flex justify-between border border-white/5">
            {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(type => (
               <button 
                 key={type}
                 onClick={() => setPlanType(type)}
                 className={`flex-1 py-2.5 px-2 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${planType === type ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                 {type}
               </button>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject</label>
                <select
                  value={planSubject} 
                  onChange={(e) => setPlanSubject(e.target.value as SubjectKey)}
                  className="w-full ios-glass-input p-3.5 text-sm"
                >
                  {userSettings.activeSubjects.map(sub => (
                    <option key={sub} value={sub} className="bg-[#0a0f18]">{getSubjectConfig(sub).name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Mins</label>
                <input 
                  type="number" 
                  value={planMins}
                  onChange={(e) => setPlanMins(e.target.value)}
                  className="w-full ios-glass-input p-3.5 text-sm" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Focus Topic</label>
              <input 
                type="text" 
                value={planTopic}
                onChange={(e) => setPlanTopic(e.target.value)}
                className="w-full ios-glass-input p-3.5 text-sm placeholder:text-zinc-600" 
                placeholder="e.g. Cellular Respiration" />
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Units/MCQs</label>
                <input 
                  type="number" 
                  value={planTarget}
                  onChange={(e) => setPlanTarget(e.target.value)}
                  className="w-full ios-glass-input p-3.5 text-sm" />
            </div>
          </div>

          <button 
            onClick={handleAddPlan}
            className="w-full rounded-xl py-4 mt-2 text-white font-bold text-sm tracking-wide bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] cursor-pointer">
            Commit to Plan
          </button>
        </div>
      )}

      {/* Clean Queue Rendering */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Tactical Queue</h3>
        {morningPlan.length === 0 && (
            <div className="ios-glass-card-nested p-8 text-center border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
                <span className="material-symbols-outlined text-[32px] text-zinc-600">assignment</span>
                <p className="text-sm text-zinc-500 font-medium">No active sessions planned. Add a task to begin.</p>
            </div>
        )}
        
        {morningPlan.map(plan => {
            const conf = getSubjectConfig(plan.subject);
            const isActive = logActivePlanId === plan.id;
            const isCompleted = plan.status === 'completed';
            return (
              <div key={plan.id} 
                className={`ios-glass-card-nested p-5 flex items-start gap-4 relative overflow-hidden transition-all duration-300 ${isActive ? 'border-primary bg-white/10 shadow-xl shadow-primary/20 scale-[1.02]' : ''} ${isCompleted ? 'opacity-40 grayscale' : ''}`}>
                
                {/* Structural Subject Color Bar */}
                <div className={`w-1.5 rounded-full self-stretch ${conf.bg}`}></div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${conf.bg} text-black tracking-widest`}>{conf.name}</span>
                    <span className="text-xs text-zinc-400 font-mono bg-black/30 border border-white/5 px-2.5 py-1 rounded-lg">{plan.sessionType}</span>
                  </div>
                  <h4 className={`text-zinc-100 font-semibold text-lg mb-2 ${isCompleted ? 'line-through text-zinc-500' : ''}`}>{plan.topic}</h4>
                  
                  <div className="flex gap-5 text-sm text-zinc-400 mb-4 mt-1 font-medium">
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">task_alt</span> {plan.targetUnits} units</span>
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-zinc-500">schedule</span> {plan.targetMins} mins</span>
                  </div>
                  
                  {!isCompleted && (
                    <button 
                      onClick={() => selectPlanForLogging(plan)}
                      className={`w-full text-xs py-3 rounded-xl font-bold cursor-pointer transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-black/30 text-primary hover:bg-black/50 border border-primary/20 hover:border-primary/50'}`}
                    >
                      {isActive ? 'Active Target' : 'Initiate Session'}
                    </button>
                  )}
                  {isCompleted && (
                      <div className="w-full text-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 py-2.5 rounded-xl">Mission Accomplished</div>
                  )}
                </div>
              </div>
            )
        })}
      </div>
    </section>
  );
}
