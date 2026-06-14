import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyLedger from './components/DailyLedger';
import BatchPlanner from './components/BatchPlanner';
import ConceptVelocity from './components/ConceptVelocity';
import ArchiveView from './components/ArchiveView';
import CommandView from './components/CommandView';
import AnalysisView from './components/AnalysisView';
import SettingsView from './components/SettingsView';
import AccountView from './components/AccountView';
import Chatbot from './components/Chatbot';
import { PlanItem, LogItem, UserSettings, ActiveViewKey } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveViewKey>('dashboard');
  const [morningPlan, setMorningPlan] = useState<PlanItem[]>(() => {
    const saved = localStorage.getItem('axion_morning_plan');
    return saved ? JSON.parse(saved) : [];
  });
  const [loggedSessions, setLoggedSessions] = useState<LogItem[]>(() => {
    const saved = localStorage.getItem('axion_logged_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('axion_user_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      glassBlur: 24,
      glassOpacity: 0.45,
      activeSubjects: ['bio', 'phys', 'chem', 'math']
    };
  });
  const [logActivePlanId, setLogActivePlanId] = useState<string | null>(null);
  const [prefilledPlan, setPrefilledPlan] = useState<PlanItem | null>(null);

  useEffect(() => {
    localStorage.setItem('axion_morning_plan', JSON.stringify(morningPlan));
  }, [morningPlan]);

  useEffect(() => {
    localStorage.setItem('axion_logged_sessions', JSON.stringify(loggedSessions));
  }, [loggedSessions]);

  useEffect(() => {
    localStorage.setItem('axion_user_settings', JSON.stringify(userSettings));
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${userSettings.glassBlur}px`);
    root.style.setProperty('--glass-opacity', `${userSettings.glassOpacity}`);
  }, [userSettings]);

  const selectPlanForLogging = (plan: PlanItem) => {
    setLogActivePlanId(plan.id);
    setPrefilledPlan(plan);
    setActiveView('dashboard');
  };

  const handleClearPrefill = () => {
    setLogActivePlanId(null);
    setPrefilledPlan(null);
  };

  return (
    <div className="flex h-screen w-screen bg-[#070a12] font-['Plus_Jakarta_Sans'] overflow-hidden text-zinc-100">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 z-10">
        {activeView === 'dashboard' && (
          <DailyLedger 
            loggedSessions={loggedSessions} 
            setLoggedSessions={setLoggedSessions}
            prefilledPlan={prefilledPlan}
            onClearPrefill={handleClearPrefill}
            morningPlan={morningPlan}
            setMorningPlan={setMorningPlan}
            userSettings={userSettings}
          />
        )}
        {activeView === 'planner' && (
          <BatchPlanner 
            morningPlan={morningPlan} 
            setMorningPlan={setMorningPlan}
            logActivePlanId={logActivePlanId}
            selectPlanForLogging={selectPlanForLogging}
            userSettings={userSettings}
          />
        )}
        {activeView === 'velocity' && (
          <ConceptVelocity loggedSessions={loggedSessions} />
        )}
        {activeView === 'archive' && (
          <ArchiveView loggedSessions={loggedSessions} setLoggedSessions={setLoggedSessions} />
        )}
        {activeView === 'command' && (
          <CommandView />
        )}
        {activeView === 'analysis' && (
          <AnalysisView loggedSessions={loggedSessions} />
        )}
        {activeView === 'settings' && (
          <SettingsView userSettings={userSettings} setUserSettings={setUserSettings} />
        )}
        {activeView === 'account' && (
          <AccountView />
        )}
      </main>

      <Chatbot 
        morningPlan={morningPlan}
        setMorningPlan={setMorningPlan}
        loggedSessions={loggedSessions}
        setLoggedSessions={setLoggedSessions}
      />
    </div>
  );
}
