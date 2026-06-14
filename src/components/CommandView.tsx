import React, { useState } from 'react';
import { PlanItem, LogItem, SubjectKey, SessionMode, UserSettings, getFocusScore } from '../types';
import BatchPlanner from './BatchPlanner';
import DailyLedger from './DailyLedger';
import ConceptVelocity from './ConceptVelocity';

interface CommandViewProps {
  morningPlan: PlanItem[];
  setMorningPlan: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  loggedSessions: LogItem[];
  setLoggedSessions: React.Dispatch<React.SetStateAction<LogItem[]>>;
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export default function CommandView({ morningPlan, setMorningPlan, loggedSessions, setLoggedSessions, userSettings, setUserSettings }: CommandViewProps) {
  const [logActivePlanId, setLogActivePlanId] = useState<string | null>(null);
  const [logSubject, setLogSubject] = useState<SubjectKey>(userSettings.activeSubjects[0] || 'bio');
  const [logTopic, setLogTopic] = useState('');
  const [logType, setLogType] = useState<SessionMode>('Study');
  
  const [logActive, setLogActive] = useState('0');
  const [logDistract, setLogDistract] = useState('0');
  const [logRecover, setLogRecover] = useState('0');
  const [logRetention, setLogRetention] = useState('5');
  const [logNotes, setLogNotes] = useState('');

  const [logStartPage, setLogStartPage] = useState('0');
  const [logEndPage, setLogEndPage] = useState('0');
  const [logVsa, setLogVsa] = useState('0');
  const [logSa, setLogSa] = useState('0');
  const [logLa, setLogLa] = useState('0');

  const selectPlanForLogging = (plan: PlanItem) => {
    setLogActivePlanId(plan.id);
    setLogSubject(plan.subject);
    setLogTopic(plan.topic);
    setLogType(plan.sessionType);
    setLogActive(plan.targetMins.toString());
  };

  // Metric Math Logic Array Calculations
  const totalPlanned = morningPlan.length;
  const completedPlanned = morningPlan.filter(p => p.status === 'completed').length;
  const progressPercent = totalPlanned === 0 ? 0 : Math.round((completedPlanned / totalPlanned) * 100);

  const averageFocus = loggedSessions.length === 0 
    ? 0 
    : Math.round(loggedSessions.reduce((acc, log) => acc + getFocusScore(log), 0) / loggedSessions.length);

  const revisionDueCount = morningPlan.filter(p => p.sessionType === 'Revise' && p.status !== 'completed').length;

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <div className="flex flex-col gap-10 w-full animate-ios-fade-in text-zinc-100 transition-all duration-500">
      
      {/* Header Summary Deck */}
      <div className="flex flex-col gap-6 w-full">
         <div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
              Welcome back, {userSettings.name || 'User'}
            </h2>
            <p className="text-sm text-zinc-400">Current performance overview metrics.</p>
         </div>

         {/* Dashboard Cards Grid Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
            
            <div className="ios-glass-card-nested p-6 flex flex-col gap-2 relative overflow-hidden group" style={glassStyle}>
               <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Progress</span>
                  <span className="material-symbols-outlined text-[18px] text-primary">trending_up</span>
               </div>
               <div className="text-4xl font-bold text-white tracking-tight">{progressPercent}%</div>
               <div className="w-full bg-black/30 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
               </div>
            </div>

            <div className="ios-glass-card-nested p-6 flex flex-col gap-2 relative overflow-hidden group" style={glassStyle}>
               <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Revision Due</span>
                  <span className="material-symbols-outlined text-[18px] text-sky-400">menu_book</span>
               </div>
               <div className="text-4xl font-bold text-white tracking-tight">{revisionDueCount} <span className="text-xl text-zinc-500 font-medium">tasks</span></div>
               <p className="text-xs text-zinc-500 mt-2 font-medium">Pending structural repetitions.</p>
            </div>

            <div className="ios-glass-card-nested p-6 flex flex-col gap-2 relative overflow-hidden group" style={glassStyle}>
               <div className="flex justify-between items-center text-zinc-400 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Focus Score</span>
                  <span className="material-symbols-outlined text-[18px] text-amber-400">radar</span>
               </div>
               <div className="text-4xl font-bold text-white tracking-tight">{averageFocus}%</div>
               <p className="text-xs text-zinc-500 mt-2 font-medium">Attention efficiency index.</p>
            </div>

         </div>
      </div>

      {/* Main Core Form Content Splits */}
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-10 items-start">
        <BatchPlanner 
          morningPlan={morningPlan} 
          setMorningPlan={setMorningPlan}
          logActivePlanId={logActivePlanId}
          selectPlanForLogging={selectPlanForLogging}
          userSettings={userSettings}
        />
        
        <DailyLedger 
          morningPlan={morningPlan}
          setMorningPlan={setMorningPlan}
          loggedSessions={loggedSessions}
          setLoggedSessions={setLoggedSessions}
          logSubject={logSubject}
          setLogSubject={setLogSubject}
          logTopic={logTopic}
          setLogTopic={setLogTopic}
          logType={logType}
          setLogType={setLogType}
          logActive={logActive}
          setLogActive={setLogActive}
          logDistract={logDistract}
          setLogDistract={setLogDistract}
          logRecover={logRecover}
          setLogRecover={setLogRecover}
          logRetention={logRetention}
          setLogRetention={setLogRetention}
          logNotes={logNotes}
          setLogNotes={setLogNotes}
          logActivePlanId={logActivePlanId}
          setLogActivePlanId={setLogActivePlanId}
          logStartPage={logStartPage}
          setLogStartPage={setLogStartPage}
          logEndPage={logEndPage}
          setLogEndPage={setLogEndPage}
          logVsa={logVsa}
          setLogVsa={setLogVsa}
          logSa={logSa}
          setLogSa={setLogSa}
          logLa={logLa}
          setLogLa={setLogLa}
          userSettings={userSettings}
          setUserSettings={setUserSettings}
        />
      </div>
      
      {/* Dynamic Activity Visual Chart Tray */}
      <div className="w-full mt-4 p-6 bg-opacity-30 rounded-2xl border border-white/[0.06]" style={glassStyle}>
         <ConceptVelocity loggedSessions={loggedSessions} />
      </div>

    </div>
  );
}
