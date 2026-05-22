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
  };

  return (
    <section className="flex flex-col gap-6 w-full fade-in">
      <h2 className="font-headline text-headline-md text-on-surface font-bold">Batch Planner</h2>
      
      <div className="glass-panel ghost-border p-6 flex flex-col gap-6 bg-surface-container-low">
        <div className="bg-surface-container-lowest p-1 rounded-full flex justify-between">
          {(['Study', 'Revise', 'Exercise'] as SessionMode[]).map(type => (
             <button 
               key={type}
               onClick={() => setPlanType(type)}
               className={`flex-1 py-2 px-1 text-center rounded-full text-xs md:text-sm font-medium transition-colors cursor-pointer ${planType === type ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-high/50'}`}>
               {type}
             </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Subject</label>
            <input
              list="planner-subjects"
              value={planSubject} 
              onChange={(e) => setPlanSubject(e.target.value)}
              placeholder="Select or type subject"
              className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors"
            />
            <datalist id="planner-subjects">
              {userSettings.activeSubjects.map(sub => (
                <option key={sub} value={sub}>{getSubjectConfig(sub).name}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-variant mb-2">Topic</label>
            <input 
              type="text" 
              value={planTopic}
              onChange={(e) => setPlanTopic(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/50" 
              placeholder="e.g. Cellular Respiration" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-2 truncate">Target Units/MCQs</label>
              <input 
                type="number" 
                value={planTarget}
                onChange={(e) => setPlanTarget(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-2">Target Mins</label>
              <input 
                type="number" 
                value={planMins}
                onChange={(e) => setPlanMins(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-4 text-on-surface focus:border-primary/50 focus:ring-0 focus:outline-none transition-colors" />
            </div>
          </div>
        </div>

        <button 
          onClick={handleAddPlan}
          className="w-full rounded-full py-4 text-on-primary-fixed font-bold text-lg bg-gradient-to-r from-primary-container to-surface-container-high shadow-[0_0_20px_rgba(0,191,255,0.2)] hover:shadow-[0_0_30px_rgba(0,191,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined">add</span>
          Add to Plan
        </button>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h3 className="font-headline text-lg text-on-surface-variant font-medium">Pending Plan</h3>
        {morningPlan.length === 0 && <p className="text-on-surface-variant text-sm border border-dashed border-white/10 rounded-xl p-4 text-center">No plans for today yet.</p>}
        
        {morningPlan.map(plan => {
            const conf = getSubjectConfig(plan.subject);
            const isActive = logActivePlanId === plan.id;
            const isCompleted = plan.status === 'completed';
            return (
              <div key={plan.id} 
                className={`glass-panel ghost-border p-5 flex items-center gap-4 relative overflow-hidden transition-all ${isActive ? 'bg-surface-container-high ring-1 ring-primary/50 shadow-md' : 'bg-surface-container-highest shadow-sm'} ${isCompleted ? 'opacity-50' : ''}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${conf.bg}`}></div>
                <div className="flex-1 pl-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold ${conf.text} uppercase tracking-wider`}>{conf.name}</span>
                    <span className="text-xs text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded-md">{plan.sessionType}</span>
                  </div>
                  <h4 className={`text-on-surface font-semibold text-lg mb-1 ${isCompleted ? 'line-through' : ''}`}>{plan.topic}</h4>
                  <div className="flex gap-4 text-sm text-on-surface-variant mb-3">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">task_alt</span> {plan.targetUnits} units</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span> {plan.targetMins} mins</span>
                  </div>
                  
                  {!isCompleted && (
                    <button 
                      onClick={() => selectPlanForLogging(plan)}
                      className={`text-xs px-4 py-2 rounded-lg font-bold cursor-pointer transition-colors ${isActive ? 'bg-primary text-on-primary-fixed' : 'bg-surface-container-lowest text-primary hover:bg-white/5 border border-primary/20'}`}
                    >
                      {isActive ? 'Session Active' : 'Start Session'}
                    </button>
                  )}
                  {isCompleted && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">Completed</span>
                  )}
                </div>
              </div>
            )
        })}
      </div>
    </section>
  );
}
