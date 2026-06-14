import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
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

  // Core Glass Styling Depth States
  const [glassBlur, setGlassBlur] = useState(24);
  const [glassOpacity, setGlassOpacity] = useState(0.45);
  const [wallpaperStyle, setWallpaperStyle] = useState('');

  // Fixed Wallpaper Engine Loading Cycles
  useLayoutEffect(() => {
    const customUrl = localStorage.getItem('custom_wallpaper_url');
    const customColor = localStorage.getItem('custom_wallpaper_color');
    const savedBlur = localStorage.getItem('ios_glass_blur');
    const savedOpacity = localStorage.getItem('ios_glass_opacity');
    
    if (savedBlur) setGlassBlur(Number(savedBlur));
    if (savedOpacity) setGlassOpacity(Number(savedOpacity));

    const root = document.documentElement;
    if (!root) return;
    
    if (customUrl) {
       setWallpaperStyle(customUrl);
       root.style.setProperty('--wallpaper-url', `url(${customUrl})`);
    } else {
       root.style.setProperty('--wallpaper-url', 'radial-gradient(circle at top left, #1e1b4b 0%, #0a0f18 100%)');
    }
    
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
    } catch (e) { console.error(e); }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const today = getLocalDateString(0);
    localStorage.setItem(`pcbm_plan_${today}`, JSON.stringify(morningPlan || []));
    localStorage.setItem(`pcbm_log_${today}`, JSON.stringify(loggedSessions || []));
    localStorage.setItem('pcbm_settings', JSON.stringify(userSettings));
  }, [morningPlan, loggedSessions, userSettings, isLoaded]);

  // Consistent spelling formatting applied globally
  const getHeaderTitle = () => {
      switch(currentTab) {
          case 'archive': return 'Archive';
          case 'account': return 'My Account';
          case 'analysis': return 'Analytics';
          default: return 'Tracker';
      }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden relative text-zinc-100 bg-[#060a12]">
      
      {/* Structural wallpaper connector fixes rendering lag */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center transition-all duration-500" 
        style={{ 
          backgroundImage: wallpaperStyle ? `url(${wallpaperStyle})` : 'radial-gradient(circle at top left, #121026 0%, #05080f 100%)' 
        }} 
      />

      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        profileImg={profileImg}
        userSettings={userSettings}
      />

      <div className="flex-1 flex flex-col relative z-10 min-w-0 md:ml-64 transition-all duration-300">
        
        <header className="bg-black/20 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-zinc-300 hover:text-white p-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight text-white animate-fade-in" key={currentTab}>
                {getHeaderTitle()}
            </h1>
          </div>

          {/* User Profile Ring with the built-in Settings Gear Indicator overlay */}
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-full border border-white/10 relative flex items-center justify-center cursor-pointer group hover:border-white/30 transition-all bg-black/40" 
              onClick={() => setCurrentTab('account')}
            >
               <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-200 overflow-hidden rounded-full">
                 {profileImg ? (
                     <img src={profileImg} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                 ) : (
                     userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'U'
                 )}
               </div>
               
               {/* Aesthetic floating micro gear matches target profile alignment requirements */}
               <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-zinc-900 border border-white/20 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors shadow-md z-10">
                 <span className="material-symbols-outlined text-[11px]">settings</span>
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 flex flex-col overflow-y-auto min-w-0">
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
            {currentTab === 'analysis' && <AnalysisView loggedSessions={loggedSessions} />}
            {currentTab === 'account' && (
              <AccountView 
                userSettings={userSettings} 
                setUserSettings={setUserSettings}
                glassBlur={glassBlur}
                setGlassBlur={setGlassBlur}
                glassOpacity={glassOpacity}
                setGlassOpacity={setGlassOpacity}
                setWallpaperStyle={setWallpaperStyle}
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
