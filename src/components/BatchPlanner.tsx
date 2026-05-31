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
  const [planSubject, setPlanSubject] = useState<SubjectKey>(userSettings.activeSubjects[0] || 'bio');
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
  };

  return (
    <section className="flex flex-col gap-6 w-full animate-fade-in">
      <h2 className="font-headline text-2xl tracking-tight text-zinc-100 font-bold">Session Architect</h2>
      
      {/* iOS Liquid Glass Panel Application */}
      <div className="ios-glass-panel p-6 flex flex-col gap-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject</label>
            <select value={planSubject} onChange={e => setPlanSubject(e.target.value as SubjectKey)} className="w-full ios-glass-input p-3.5 text-sm">
              {userSettings.activeSubjects.map(sub => (
                <option key={sub} value={sub} className="bg-[#0a0f18]">{getSubjectConfig(sub).name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Modality</label>
            <div className="grid grid-cols-3 ios-glass-input p-1.5">
              {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(m => (
                <button 
                  key={m} 
                  onClick={() => setPlanType(m)} 
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${planType === m ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Focus Topic</label>
          <input 
            type="text" 
            value={planTopic} 
            onChange={e => setPlanTopic(e.target.value)} 
            placeholder="Target concept..." 
            className="w-full ios-glass-input p-3.5 text-sm" 
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Units</label>
            <input type="number" value={planTarget} onChange={e => setPlanTarget(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Mins</label>
            <input type="number" value={planMins} onChange={e => setPlanMins(e.target.value)} className="w-full ios-glass-input p-3.5 text-sm" />
          </div>
        </div>

        <button onClick={handleAddPlan} className="w-full py-4 mt-2 rounded-xl bg-primary text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98] cursor-pointer">
          Add to Deployment Plan
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h3 className="font-headline text-lg font-bold text-zinc-100">Tactical Deployment Queue</h3>
        {morningPlan.length === 0 ? (
           <div className="ios-glass-card-nested p-8 text-center border-dashed border-white/10">
               <p className="text-sm text-zinc-500 font-medium italic">No sessions planned for today's deployment yet.</p>
           </div>
        ) : (
           <div className="flex flex-col gap-4">
             {morningPlan.map((plan) => {
                const conf = getSubjectConfig(plan.subject);
                const isActive = logActivePlanId === plan.id;
                const isCompleted = plan.status === 'completed';
                
                return (
                  <div key={plan.id} className={`p-5 ios-glass-card-nested flex gap-4 transition-all duration-300 ${isCompleted ? 'opacity-50' : ''} ${isActive ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                    <div className={`w-1.5 rounded-full ${conf.bg}`} />
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${conf.bg} text-black tracking-wide`}>{conf.name}</span>
                        <span className="text-xs text-zinc-400 font-mono bg-black/30 border border-white/5 px-2.5 py-1 rounded-md">{plan.sessionType}</span>
                      </div>
                      <h4 className={`text-zinc-100 font-semibold text-lg mb-1 ${isCompleted ? 'line-through' : ''}`}>{plan.topic}</h4>
                      <div className="flex gap-5 text-sm text-zinc-400 mb-4 mt-2">
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">task_alt</span> {plan.targetUnits} units</span>
                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">schedule</span> {plan.targetMins} mins</span>
                      </div>
                      
                      {!isCompleted && (
                        <button 
                          onClick={() => selectPlanForLogging(plan)}
                          className={`text-xs px-4 py-2.5 rounded-xl font-bold cursor-pointer transition-all ${isActive ? 'bg-primary text-white' : 'bg-black/30 text-primary hover:bg-black/50 border border-primary/20'}`}
                        >
                          {isActive ? 'Session Active' : 'Start Session'}
                        </button>
                      )}
                      {isCompleted && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full self-start">Completed</span>
                      )}
                    </div>
                  </div>
                )
            })}
          </div>
        )}
      </div>
    </section>
  );
}
