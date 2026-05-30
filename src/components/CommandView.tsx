import React, { useState, useEffect } from 'react';
import { PlanItem, LogItem, SubjectKey, SessionMode, UserSettings, getSubjectConfig } from '../types';
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
  
  // Universal
  const [logActive, setLogActive] = useState('0');
  const [logDistract, setLogDistract] = useState('0');
  const [logRecover, setLogRecover] = useState('0');
  const [logRetention, setLogRetention] = useState('5');
  const [logNotes, setLogNotes] = useState('');

  // Mode specific
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
    setLogActive(plan.targetMins.toString()); // Pre-fill
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
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
      <ConceptVelocity loggedSessions={loggedSessions} />
    </div>
  );
}
