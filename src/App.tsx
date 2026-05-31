import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import { nanoid } from 'nanoid';

// --- ADAPTIVE THEME CONFIGURATION ---
export interface WallpaperConfig {
  id: string;
  name: string;
  url: string;
  primaryColor: string;
}

export const WALLPAPER_PRESETS: WallpaperConfig[] = [
  {
    id: 'midnightNebula',
    name: 'Midnight Nebula',
    url: 'radial-gradient(circle at top left, #1e1b4b 0%, #0a0f18 100%)',
    primaryColor: '#10B981', // Emerald Green
  },
  {
    id: 'crimsonSunset',
    name: 'Crimson Sunset',
    url: 'linear-gradient(135deg, #4c0519 0%, #0f172a 100%)',
    primaryColor: '#F43F5E', // Rose
  },
  {
    id: 'auroraBoreal',
    name: 'Aurora Borealis',
    url: 'radial-gradient(circle at bottom right, #064e3b 0%, #020617 100%)',
    primaryColor: '#38BDF8', // Sky Blue
  }
];

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

  // Identity and Theme State
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [activeWallpaper, setActiveWallpaper] = useState('midnightNebula');
  const [glassBlur, setGlassBlur] = useState(24);
  const [glassOpacity, setGlassOpacity] = useState(0.45);

  // useLayoutEffect runs BEFORE the browser paints the screen, eliminating the "Blue to Red" color flicker!
  useLayoutEffect(() => {
    const savedWallpaper = localStorage.getItem('ios_glass_wallpaper') || 'midnightNebula';
    const savedBlur = localStorage.getItem('ios_glass_blur');
    const savedOpacity = localStorage.getItem('ios_glass_opacity');
    
    if (savedWallpaper) setActiveWallpaper(savedWallpaper);
    if (savedBlur) setGlassBlur(Number(savedBlur));
    if (savedOpacity) setGlassOpacity(Number(savedOpacity));

    const root = document.documentElement;
    const activeConfig = WALLPAPER_PRESETS.find(w => w.id === savedWallpaper) || WALLPAPER_PRESETS[0];
    root.style.setProperty('--wallpaper-url', activeConfig.url);
    root.style.setProperty('--theme-primary', activeConfig.primaryColor);
    root.style.setProperty('--glass-blur', `${savedBlur || 24}px`);
    root.style.setProperty('--glass-opacity', savedOpacity || '0.45');
  }, []);

  // Update root CSS variables when theme state changes
  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    const activeConfig = WALLPAPER_PRESETS.find(w => w.id === activeWallpaper) || WALLPAPER_PRESETS[0];
    root.style.setProperty('--wallpaper-url', activeConfig.url);
    root.style.setProperty('--theme-primary', activeConfig.primaryColor);
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    root.style.setProperty('--glass-opacity', String(glassOpacity));
    
    localStorage.setItem('ios_glass_wallpaper', activeWallpaper);
    localStorage.setItem('ios_glass_blur', String(glassBlur));
    localStorage.setItem('ios_glass_opacity', String(glassOpacity));
  }, [activeWallpaper, glassBlur, glassOpacity, isLoaded]);

  // Load core data from local storage
  useEffect(() => {
    const today = getLocalDateString(0);
    try {
        const savedPlan = localStorage.getItem(`pcbm_plan_${today}`);
        const savedLog = localStorage.getItem(`pcbm_log_${today}`);
        const savedSettings = localStorage.getItem('pcbm_settings');
        const savedImg = localStorage.getItem('google_profile_img');
        
        if (savedPlan) setMorningPlan(JSON.parse(savedPlan));
        if (savedLog) setLoggedSessions(JSON.parse(savedLog));
        if (savedImg) setProfileImg(savedImg);

        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (!parsed.activeSubjects) parsed.activeSubjects = ['bio', 'phys', 'chem', 'math'];
            if (!parsed.subjectGoals) parsed.subjectGoals = {};
            setUserSettings(parsed);
        }
    } catch (e) {
        console.error("Failed loading data", e);
    }
    setIsLoaded(true);
  }, []);

  // Save core data to local storage
  useEffect(() => {
    if (!isLoaded) return;
    const today = getLocalDateString(0);
    localStorage.setItem(`pcbm_plan_${today}`, JSON.stringify(morningPlan));
    localStorage.setItem(`pcbm_log_${today}`, JSON.stringify(loggedSessions));
    localStorage.setItem('pcbm_settings', JSON.stringify(userSettings));
  }, [morningPlan, loggedSessions, userSettings, isLoaded]);

  const [isSyncing, setIsSyncing] = useState(false);
  const hasUnsyncedLogs = loggedSessions.some(l => !l.synced);

  // Original sync functions kept intact
  const createEventsForLog = async (token: string, log: LogItem) => {
    const datesToSchedule: { offset: number; type: string }[] = [];
    const todayNum = new Date().getDate();
    const todayDay = new Date().getDay();

    if (log.isMissed) {
        datesToSchedule.push({ offset: 0, type: 'MISSED' });
    } else if (log.sessionType === 'Study') {
        datesToSchedule.push({ offset: 0, type: 'STUDY' });
        datesToSchedule.push({ offset: 1, type: 'FOLLOW_UP' });

        const daysToNextSunday = (7 - todayDay) % 7 || 7;
        datesToSchedule.push({ offset: daysToNextSunday, type: 'WEEKLY_CONCLUSION' });

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
        datesToSchedule.push({ offset: 0, type: log.sessionType === 'Revise' ? 'REVIISED' : 'PRACTICE' });
    }

    for (const schedule of datesToSchedule) {
        const dateStr = getLocalDateString(schedule.offset);
        const endStr = getLocalDateString(schedule.offset + 1); 
        const eventHash = `pcbmlog_${log.id}_${schedule.offset}`;
        
        try {
            const listRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=pcbmHash=${eventHash}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (listRes.ok) {
                const listData = await listRes.json();
                if (listData.items && listData.items.length > 0) {
                    continue;
                }
            }
        } catch (e) {
            console.error(e);
        }

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
                description: log.isMissed ? 'Failed to log planned session node.' : `${targetUnits}\n\nFocus Score: ${getFocusScore(log)}%\nRetention Score: ${log.retentionScore || 'N/A'}/10\n\nNotes:\n${log.notes}`,
                start: { date: dateStr },
                end: { date: endStr },
                extendedProperties: {
                    private: { pcbmHash: eventHash }
                }
            })
        });
        if (!res.ok) throw new Error("API status: " + res.status);
    }
  };

  const handleCloseDay = async () => {
    setIsSyncing(true);
    let finalLogs = [...loggedSessions];
    const loggedPlanIds = new Set(finalLogs.map(l => l.planId).filter(Boolean));
    let hasPenalties = false;

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
        alert("Google Calendar authentication expired. Please re-verify inside the Account panel.");
        setIsSyncing(false);
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
        if(successCount > 0) alert(`Successfully committed ${successCount} session logs!`);
        else alert("Data is already synchronized.");
    } catch(err: any) {
        if (err.message.includes('401')) {
            localStorage.removeItem('gcal_token');
            alert("Google Calendar token invalid. Re-authenticate inside Account panel.");
        } else {
            alert("Pipeline error: " + err.message);
        }
    } finally {
        setIsSyncing(false);
    }
  };

  // Dynamic Header Title Mapping (Fixes the stuck header bug)
  const getHeaderTitle = () => {
      switch(currentTab) {
          case 'archive': return 'Archive & History';
          case 'account': return 'System Preferences';
          default: return 'Command Center';
      }
  };

  return (
    <div className="flex min-h-screen relative w-full text-zinc-100">
      
      {/* Background Liquid Canvas */}
      <div className="ios-wallpaper-canvas" />

      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-64 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Dynamic Translucent Header */}
        <header className="ios-glass-panel rounded-t-none rounded-b-[24px] border-x-0 border-t-0 bg-opacity-30 flex justify-between items-center w-[calc(100%-2rem)] mx-4 mt-4 px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-primary hover:bg-white/10 transition-all p-2 rounded-full cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white animate-ios-fade-in" key={currentTab}>
                {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync Status Beacon & Profile Identity */}
            <div 
              className="w-10 h-10 rounded-full border border-white/10 relative flex items-center justify-center overflow-hidden ios-glass-card-nested shadow-inner cursor-pointer" 
              onClick={() => setCurrentTab('account')}
            >
               <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-200">
                 {profileImg ? (
                     <img src={profileImg} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                     userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'A'
                 )}
               </div>
               
               {/* Pulse Indicator */}
               <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0f18] transition-colors duration-500 ${hasUnsyncedLogs ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Container */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-24 flex flex-col animate-ios-fade-in">
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
            {currentTab === 'account' && (
              <AccountView 
                userSettings={userSettings} 
                setUserSettings={setUserSettings}
                
                // We pass these down so AccountView can manipulate them, but it won't break if AccountView is the old original file.
                // We'll update AccountView in Step 3 to use these.
                activeWallpaper={activeWallpaper}
                setActiveWallpaper={setActiveWallpaper}
                glassBlur={glassBlur}
                setGlassBlur={setGlassBlur}
                glassOpacity={glassOpacity}
                setGlassOpacity={setGlassOpacity}
                presets={WALLPAPER_PRESETS as any}
              />
            )}
        </main>

        {currentTab === 'command' && (
            <footer className="ios-glass-panel rounded-b-none rounded-t-[28px] border-x-0 border-b-0 w-[calc(100%-2rem)] mx-4 py-4 flex flex-col justify-center items-center gap-3 mt-auto">
              <button 
                onClick={handleCloseDay} 
                disabled={isSyncing}
                className={`text-primary font-bold hover:underline font-headline text-sm tracking-wide transition-all ${isSyncing ? 'opacity-50 cursor-wait' : 'cursor-pointer active:opacity-70'}`}>
                 {isSyncing ? 'Synchronizing Operations...' : 'Close Tactical Deployment & Sync'}
              </button>
              <p className="text-error/90 font-medium text-[11px] px-6 text-center max-w-xl bg-error/5 border border-error/10 py-1.5 rounded-xl">
                Accountability Warning: Unlogged items score 0% and commit permanently as MISSED.
              </p>
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
