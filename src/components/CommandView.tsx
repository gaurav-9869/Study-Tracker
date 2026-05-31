import React, { useState } from 'react';
import { PlanItem, LogItem, SubjectKey, SessionMode, UserSettings } from '../types';
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
  
  // Universal telemetry hooks
  const [logActive, setLogActive] = useState('0');
  const [logDistract, setLogDistract] = useState('0');
  const [logRecover, setLogRecover] = useState('0');
  const [logRetention, setLogRetention] = useState('5');
  const [logNotes, setLogNotes] = useState('');

  // Mode specific data slots
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
    setLogActive(plan.targetMins.toString()); // Pre-fill target timing allocation
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Primary Dashboard Row Split System (Widescreen Tablet Layout Optimization) */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side Column Block: Batch Task Planner Wrapper */}
        <div className="w-full h-full">
          <BatchPlanner 
            morningPlan={morningPlan} 
            setMorningPlan={setMorningPlan}
            logActivePlanId={logActivePlanId}
            selectPlanForLogging={selectPlanForLogging}
            userSettings={userSettings}
          />
        </div>
        
        {/* Right Side Column Block: Daily Telemetry Ledger Panel */}
        <div className="w-full h-full">
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
      </div>

      {/* Analytics Baseline Workspace Overlay */}
      <div className="w-full mt-2 ios-glass-panel p-6 bg-opacity-30">
        <h3 className="font-headline font-bold text-md text-zinc-300 mb-4 tracking-tight uppercase text-xs">Concept Performance Metrics</h3>
        <ConceptVelocity loggedSessions={loggedSessions} />
      </div>
    </div>
  );
}
