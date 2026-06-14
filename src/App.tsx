import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
import SettingsView from './components/SettingsView';
import BatchPlanner from './components/BatchPlanner';
import AnalysisView from './components/AnalysisView';
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
  const [profileImg, setProfileImg] = useState<string | null>(null);

  // Goal #11: Dynamic Depth Controllers
  const [glassBlur, setGlassBlur] = useState(24);
  const [glassOpacity, setGlassOpacity] = useState(0.45);

  useLayoutEffect(() => {
    const customUrl = localStorage.getItem('custom_wallpaper_url');
    const customColor = localStorage.getItem('custom_wallpaper_color');
    const savedBlur = localStorage.getItem('ios_glass_blur');
    const savedOpacity = localStorage.getItem('ios_glass_opacity');
    
    if (savedBlur) setGlassBlur(Number(savedBlur));
    if (savedOpacity) setGlassOpacity(Number(savedOpacity));

    const root = document.documentElement;
    if (!root) return;
    
    root.style.setProperty('--wallpaper-url', customUrl ? `url(${customUrl})` : 'radial-gradient(circle at top left, #1e1b4b 0%, #0a0f18 100%)');
    root.style.setProperty('--theme-primary', customColor || '#10B981');
    root.style.setProperty('--glass-blur', `${savedBlur ? Number(savedBlur) : 24}px`);
    root.style.setProperty('--glass-opacity', savedOpacity ? String(savedOpacity) : '0.45');
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    if (!root) return;
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    root.style.setProperty('--glass-opacity', String(glassOpacity));
    localStorage.setItem('ios_glass_blur', String(glassBlur));
    localStorage.setItem('ios_glass_opacity', String(glassOpacity));
  }, [glassBlur, glassOpacity, isLoaded]);

  const safeParseArray = (dataStr: string | null) => {
    if (!dataStr) return [];
    try { const parsed = JSON.parse(dataStr); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  };

  useEffect(() => {
    const today = getLocalDateString(0);
    try {
        const savedPlan = localStorage.getItem(`pcbm_plan_${today}`);
        const savedLog = localStorage.getItem(`pcbm_log_${today}`);
        const savedSettings = localStorage.getItem('pcbm_settings');
        const savedProfile = localStorage.getItem('gcal_profile');
        
        setMorningPlan(safeParseArray(savedPlan));
        setLoggedSessions(safeParseArray(savedLog));

        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') {
                setUserSettings({
                    name: parsed.name || '',
                    className: parsed.className || '',
                    activeSubjects: Array.isArray(parsed.activeSubjects) ? parsed.activeSubjects : ['bio', 'phys', 'chem', 'math'],
                    subjectGoals: parsed.subjectGoals || {}
                });
            }
        }
        
        if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            if (parsedProfile?.picture) setProfileImg(parsedProfile.picture);
        }
    } catch (e) {
        console.error("Safe load failed", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const today = getLocalDateString(0);
    localStorage.setItem(`pcbm_plan_${today}`, JSON.stringify(morningPlan || []));
    localStorage.setItem(`pcbm_log_${today}`, JSON.stringify(loggedSessions || []));
    localStorage.setItem('pcbm_settings', JSON.stringify(userSettings));
  }, [morningPlan, loggedSessions, userSettings, isLoaded]);

  const hasUnsyncedLogs = Array.isArray(loggedSessions) && loggedSessions.some(l => l && !l.synced);

  // Goal #3, #4: Simplification of Titles mapped to correct IDs
  const getHeaderTitle = () => {
      switch(currentTab) {
          case 'archive': return 'Archive';
          case 'account': return 'My Account';
          case 'settings': return 'System Settings';
          case 'planner': return 'Daily Planner';
          case 'analysis': return 'Analytics';
          default: return 'Tracker';
      }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen relative w-full text-zinc-100 bg-black">
      
      {/* Background Canvas */}
      <div className="ios-wallpaper-canvas fixed inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: 'var(--wallpaper-url)' }} />

      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        profileImg={profileImg}
        userSettings={userSettings}
      />

      {/* Goal #7 & #8: Removed blue tints, utilizing strict responsive layouts (md:ml-64) to fix tablet zoom */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-500 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-64'}`}>
        
        <header className="bg-black/30 backdrop-blur-md border-b border-white/10 flex justify-between items-center px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-zinc-300 hover:text-white transition-colors p-2 cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white animate-fade-in" key={currentTab}>
                {getHeaderTitle()}
            </h1>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 flex flex-col animate-fade-in overflow-x-hidden">
            {currentTab === 'command' && (
              <CommandView 
                morningPlan={morningPlan} 
                setMorningPlan={setMorningPlan}
                loggedSessions={loggedSessions}
                setLoggedSessions={setLoggedSessions}
                userSettings={userSettings}
              />
            )}
            {currentTab === 'planner' && (
              <BatchPlanner 
                morningPlan={morningPlan} 
                setMorningPlan={setMorningPlan} 
              />
            )}
            {currentTab === 'archive' && <ArchiveView />}
            {currentTab === 'analysis' && (
              <AnalysisView loggedSessions={loggedSessions} />
            )}
            {currentTab === 'account' && (
              <AccountView 
                userSettings={userSettings} 
                setUserSettings={setUserSettings}
              />
            )}
            {currentTab === 'settings' && (
              <SettingsView 
                glassBlur={glassBlur}
                setGlassBlur={setGlassBlur}
                glassOpacity={glassOpacity}
                setGlassOpacity={setGlassOpacity}
              />
            )}
        </main>

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
