import React, { useState, useEffect } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import { nanoid } from 'nanoid';

export default function App() {
  const [currentTab, setCurrentTab] = useState('command');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [morningPlan, setMorningPlan] = useState<PlanItem[]>([]);
  const [loggedSessions, setLoggedSessions] = useState<LogItem[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
      name: '',
      className: '',
      activeSubjects: ['bio', 'phys', 'chem', 'math'],
      subjectGoals: {}
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const today = getLocalDateString(0);
    try {
        const savedPlan = localStorage.getItem(`pcbm_plan_${today}`);
        const savedLog = localStorage.getItem(`pcbm_log_${today}`);
        const savedSettings = localStorage.getItem('pcbm_settings');
        if (savedPlan) setMorningPlan(JSON.parse(savedPlan));
        if (savedLog) setLoggedSessions(JSON.parse(savedLog));
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (!parsed.activeSubjects) parsed.activeSubjects = ['bio', 'phys', 'chem', 'math'];
            if (!parsed.subjectGoals) parsed.subjectGoals = {};
            setUserSettings(parsed);
        }
    } catch (e) {
        console.error("Failed parsing storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isLoaded) return;
    const today = getLocalDateString(0);
    localStorage.setItem(`pcbm_plan_${today}`, JSON.stringify(morningPlan));
    localStorage.setItem(`pcbm_log_${today}`, JSON.stringify(loggedSessions));
    localStorage.setItem('pcbm_settings', JSON.stringify(userSettings));
  }, [morningPlan, loggedSessions, userSettings, isLoaded]);


  // Google Calendar Integration
  const createEventsForLog = async (token: string, log: LogItem) => {
    const datesToSchedule: { offset: number; type: string }[] = [];
    const todayNum = new Date().getDate();
    const todayDay = new Date().getDay();

    if (log.isMissed) {
        datesToSchedule.push({ offset: 0, type: 'MISSED' });
    } else if (log.sessionType === 'Study') {
        datesToSchedule.push({ offset: 0, type: 'STUDY' });
        datesToSchedule.push({ offset: 1, type: 'FOLLOW_UP' });

        // Next Sunday
        const daysToNextSunday = (7 - todayDay) % 7 || 7;
        datesToSchedule.push({ offset: daysToNextSunday, type: 'WEEKLY_CONCLUSION' });

        // Monthly (28th)
        let monthlyOffset = 0;
        let d28 = new Date();
        if (todayNum > 25) {
            d28.setMonth(d28.getMonth() + 1);
        }
        d28.setDate(28);
        monthlyOffset = Math.max(0, Math.ceil((d28.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
        if (monthlyOffset > 0) {
           datesToSchedule.push({ offset: monthlyOffset, type: 'MONTHLY_CONCLUSION' });
        }
    } else {
        // Exercise/Revision: only today
        datesToSchedule.push({ offset: 0, type: log.sessionType === 'Revise' ? 'REVIISED' : 'PRACTICE' });
    }

    for (const schedule of datesToSchedule) {
        const dateStr = getLocalDateString(schedule.offset);
        const endStr = getLocalDateString(schedule.offset + 1); 

        let title = '';
        const subjectName = getSubjectConfig(log.subject).name;

        if (schedule.type === 'MISSED') {
            title = `MISSED: ${subjectName} - ${log.topic}`;
        } else if (schedule.type === 'FOLLOW_UP') {
            title = `Follow-up: ${subjectName} - ${log.topic}`;
        } else if (schedule.type === 'WEEKLY_CONCLUSION') {
            title = `Weekly Practice & Conclusion: ${subjectName} - ${log.topic}`;
        } else if (schedule.type === 'MONTHLY_CONCLUSION') {
            title = `Monthly Revision & Concept Mastery: ${subjectName} - ${log.topic}`;
        } else if (schedule.type === 'REVIISED') {
            title = `[REVISED] (${log.revisionType || 'Standard Review'}) ${subjectName} - ${log.topic}`;
        } else if (schedule.type === 'PRACTICE') {
            title = `[PRACTICE] ${subjectName} - ${log.topic}`;
        } else {
            title = `STUDY: ${subjectName} - ${log.topic}`;
        }

        // Generate Target Units description
        let targetUnits = '';
        if (log.sessionType === 'Exercise') {
            const vsa = log.vsaCount || 0;
            const sa = log.saCount || 0;
            const la = log.laCount || 0;
            targetUnits = `Target Units: ${vsa + sa + la} Questions (${vsa} VSA, ${sa} SA, ${la} LA)`;
        } else {
            targetUnits = `Target Units: p.${log.startPage || 0} to p.${log.endPage || 0}`;
        }

        const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                summary: title,
                description: log.isMissed ? 'Failed to log this planned session.' : `${targetUnits}\n\nFocus Score: ${getFocusScore(log)}%\nRetention Score: ${log.retentionScore || 'N/A'}/10\n\nNotes:\n${log.notes}`,
                start: { date: dateStr },
                end: { date: endStr }
            })
        });
        if (!res.ok) throw new Error("API responded with " + res.status);
    }
  };

  const handleCloseDay = async () => {
    let finalLogs = [...loggedSessions];
    const loggedPlanIds = new Set(finalLogs.map(l => l.planId).filter(Boolean));
    let hasPenalties = false;

    // Accountability Audit
    morningPlan.forEach((plan) => {
        if (!loggedPlanIds.has(plan.id)) {
            hasPenalties = true;
            finalLogs.push({
                id: nanoid(),
                planId: plan.id,
                subject: plan.subject,
                topic: plan.topic,
                sessionType: plan.sessionType,
                activeMins: 0,
                distractionMins: 0,
                recoveryMins: 0,
                notes: '',
                isMissed: true,
                synced: false
            });
        }
    });

    if (hasPenalties) {
        setLoggedSessions([...finalLogs]);
    }

    const token = localStorage.getItem('gcal_token');
    const expires = localStorage.getItem('gcal_token_expires');
    
    if (!token || !expires || Date.now() > Number(expires)) {
        localStorage.removeItem('gcal_token');
        alert("Google Calendar session expired. Please re-authenticate in Account tab.");
        return;
    }

    let successCount = 0;
    try {
        for (let i = 0; i < finalLogs.length; i++) {
            if (!finalLogs[i].synced) {
                await createEventsForLog(token, finalLogs[i]);
                finalLogs[i].synced = true;
                successCount++;
            }
        }
        setLoggedSessions([...finalLogs]);
        if(successCount > 0) alert(`Successfully synced ${successCount} sessions to Google Calendar!`);
        else alert("All sessions are already synced for today.");
    } catch(err: any) {
        if (err.message.includes('401')) {
            localStorage.removeItem('gcal_token');
            alert("Google Calendar token expired or invalid. Please re-authenticate in Account tab.");
        } else {
            alert("Error syncing events: " + err.message);
        }
    }
  };

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-64 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <header className="bg-white/5 backdrop-blur-lg dark:bg-zinc-950/40 docked full-width top-0 border-b border-white/10 shadow-2xl flex justify-between items-center w-full px-6 py-4 sticky z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-sky-400 dark:text-sky-400 hover:bg-white/10 transition-colors p-2 rounded-full cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline tracking-tight text-headline-md font-bold text-zinc-100">Study Tracker</h1>
          </div>
          <div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high relative flex items-center justify-center overflow-hidden">
               <div className="w-full h-full bg-surface-container-highest flex items-center justify-center font-bold text-xs cursor-pointer" onClick={() => setCurrentTab('account')}>
                 {userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'A'}
               </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary-container rounded-full border-2 border-background"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-24 flex flex-col">
            {currentTab === 'command' && (
              <CommandView 
                morningPlan={morningPlan} 
                setMorningPlan={setMorningPlan}
                loggedSessions={loggedSessions}
                setLoggedSessions={setLoggedSessions}
                userSettings={userSettings}
                setUserSettings={setUserSettings}
              />
            )}
            {currentTab === 'archive' && <ArchiveView />}
            {currentTab === 'account' && <AccountView userSettings={userSettings} setUserSettings={setUserSettings} />}
        </main>

        {currentTab === 'command' && (
            <footer className="bg-zinc-900/80 backdrop-blur-md w-full py-4 border-t border-emerald-500/20 flex flex-col justify-center items-center gap-4 mt-auto">
              <button onClick={handleCloseDay} className="text-emerald-400 font-bold underline font-['Inter'] text-sm cursor-pointer active:opacity-70 hover:text-emerald-300 transition-all">
                 Close Day & Sync
              </button>
              <p className="text-error font-body text-xs px-6 text-center max-w-2xl">
                Warning: Unlogged plans will be permanently penalized with a 0% score and logged as MISSED.
              </p>
              <div className="text-zinc-500 font-['Inter'] text-xs font-semibold">Study Tracker © 2024</div>
            </footer>
        )}

        <Chatbot 
          morningPlan={morningPlan}
          setMorningPlan={setMorningPlan}
          loggedSessions={loggedSessions}
          setLoggedSessions={setLoggedSessions}
        />
      </div>
    </div>
  );
}
