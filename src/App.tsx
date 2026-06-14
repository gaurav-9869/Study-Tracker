import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
import SettingsView from './components/SettingsView'; // Newly broken out separate tab
import AnalysisView from './components/AnalysisView'; // Advanced LLM + Charts tab
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

  // Dynamic Frosted Glass Configuration Parameters
  const [glassBlur, setGlassBlur] = useState(24);
  const [glassOpacity, setGlassOpacity] = useState(0.45);

  // Dynamic Wallpaper Color Extraction Routine
  const extractAndApplyColors = (url: string) => {
    if (!url) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      try {
        const imgData = ctx.getImageData(5, 5, 1, 1).data;
        // Convert to high-end vibrant hex representation string
        const r = String(imgData[0]).padStart(2, '0');
        const g = String(imgData[1]).padStart(2, '0');
        const b = String(imgData[2]).padStart(2, '0');
        const extractedHex = `#${Number(r).toString(16)}${Number(g).toString(16)}${Number(b).toString(16)}`;
        
        // Safety baseline check to make sure color doesn't wash out into black
        if (imgData[0] > 30 || imgData[1] > 30) {
          document.documentElement.style.setProperty('--theme-primary', extractedHex);
          localStorage.setItem('custom_wallpaper_color', extractedHex);
        }
      } catch (e) {
        console.warn("Cross-origin canvas coloring bypassed safely.", e);
      }
    };
    img.src = url;
  };

  // Synchronous Paint Hook: Eliminates Theme Flicker
  useLayoutEffect(() => {
    const customUrl = localStorage.getItem('custom_wallpaper_url');
    const customColor = localStorage.getItem('custom_wallpaper_color');
    const savedBlur = localStorage.getItem('ios_glass_blur');
    const savedOpacity = localStorage.getItem('ios_glass_opacity');
    
    if (savedBlur) setGlassBlur(Number(savedBlur));
    if (savedOpacity) setGlassOpacity(Number(savedOpacity));

    const root = document.documentElement;
    
    if (customUrl) {
       root.style.setProperty('--wallpaper-url', `url(${customUrl})`);
       extractAndApplyColors(customUrl);
    } else {
       root.style.setProperty('--wallpaper-url', 'radial-gradient(circle at top left, #1c1917 0%, #070a12 100%)');
    }
    
    if (customColor) {
       root.style.setProperty('--theme-primary', customColor);
    } else {
       root.style.setProperty('--theme-primary', '#10B981'); // Elegant Axion green starting accent
    }

    root.style.setProperty('--glass-blur', `${savedBlur || 24}px`);
    root.style.setProperty('--glass-opacity', savedOpacity || '0.45');
  }, []);

  // Sync sliders to CSS custom layers instantly
  useEffect(() => {
    if (!isLoaded) return;
    const root = document.documentElement;
    root.style.setProperty('--glass-blur', `${glassBlur}px`);
    root.style.setProperty('--glass-opacity', String(glassOpacity));
    
    localStorage.setItem('ios_glass_blur', String(glassBlur));
    localStorage.setItem('ios_glass_opacity', String(glassOpacity));
  }, [glassBlur, glassOpacity, isLoaded]);

  // Load persistence layers on application boot up
  useEffect(() => {
    const today = getLocalDateString(0);
    try {
        const savedPlan = localStorage.getItem(`pcbm_plan_${today}`);
        const savedLog = localStorage.getItem(`pcbm_log_${today}`);
        const savedSettings = localStorage.getItem('pcbm_settings');
        
        // PERMANENT LOGGED IN FIX: Keep profile active indefinitely from local memory caches
        const savedProfile = localStorage.getItem('gcal_profile');
        if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            if (parsedProfile && parsedProfile.picture) {
                setProfileImg(parsedProfile.picture);
            }
        }
        
        if (savedPlan) setMorningPlan(JSON.parse(savedPlan));
        if (savedLog) setLoggedSessions(JSON.parse(savedLog));

        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (!parsed.activeSubjects) parsed.activeSubjects = ['bio', 'phys', 'chem', 'math'];
            if (!parsed.subjectGoals) parsed.subjectGoals = {};
            setUserSettings(parsed);
        }
    } catch (e) {
        console.error("Failed loading local memory structures", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const today = getLocalDateString(0);
    localStorage.setItem(`pcbm_plan_${today}`, JSON.stringify(morningPlan));
    localStorage.setItem(`pcbm_log_${today}`, JSON.stringify(loggedSessions));
    localStorage.setItem('pcbm_settings', JSON.stringify(userSettings));
  }, [morningPlan, loggedSessions, userSettings, isLoaded]);

  const [isSyncing, setIsSyncing] = useState(false);

  // CONSOLIDATED BATCH CALENDAR SYNC ENGINE
  const pushBatchEventToGoogle = async (token: string, log: LogItem) => {
    const todayNum = new Date().getDate();
    const todayDay = new Date().getDay();
    const subjectName = getSubjectConfig(log.subject).name;
    
    let targetOffset = 0;
    let targetTitle = `Weekly Summary - ${subjectName}`;
    let calendarColorId = "10"; // Basil Green default for baseline study tracking nodes

    // Map strict explicit colorId indices based on logging categories
    if (log.isMissed) {
      calendarColorId = "8"; // Graphite muted gray
      targetTitle = `Missed Targets - ${subjectName}`;
    } else if (log.sessionType === 'Exercise') {
      calendarColorId = "6"; // Tangerine Orange
      targetTitle = `Practice Workbooks - ${subjectName}`;
    } else if (log.sessionType === 'Revise') {
      calendarColorId = "1"; // Lavender Blue
      targetTitle = `Revision Series - ${subjectName}`;
    } else if (log.planId === 'monthly') {
      calendarColorId = "3"; // Grape Purple for monthly deep reviews
      targetTitle = `Monthly Mastery - ${subjectName}`;
    } else if (log.id.includes('follow')) {
      calendarColorId = "2"; // Sage Mint
      targetTitle = `Follow-Up Blocks - ${subjectName}`;
    }

    // Determine structural window ranges
    if (log.planId === 'monthly') {
       let d28 = new Date();
       if (todayNum > 25) d28.setMonth(d28.getMonth() + 1);
       d28.setDate(28);
       targetOffset = Math.max(0, Math.ceil((d28.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    } else {
       targetOffset = (7 - todayDay) % 7 || 7; // Syncs cleanly to upcoming Sunday container
    }

    const dateStr = getLocalDateString(targetOffset);
    const endStr = getLocalDateString(targetOffset + 1);
    const uniqueBatchHash = `axion_batch_${log.subject}_${dateStr}`;

    let existingEvent: any = null;
    try {
      const searchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?privateExtendedProperty=axionHash=${uniqueBatchHash}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items && searchData.items.length > 0) {
           existingEvent = searchData.items[0];
        }
      }
    } catch (e) {}

    let sourceMetrics = '';
    if (log.sessionType === 'Exercise') {
       sourceMetrics = `Questions Logged: ${log.vsaCount || 0} VSAQ, ${log.saCount || 0} SAQ, ${log.laCount || 0} LAQ`;
    } else {
       sourceMetrics = `Material Scanned: Pages ${log.startPage || 0} to ${log.endPage || 0}`;
    }

    const itemDetailsText = `
• Topic: ${log.topic}
  [${sourceMetrics}]
  Focus Rating: ${getFocusScore(log)}% | Retention: ${log.retentionScore || 'N/A'}/10
  Notes: ${log.notes || 'None'}
  ${log.frictionAnalysis ? `Friction Point: ${log.frictionAnalysis}` : ''}
    `.trim();

    if (existingEvent) {
       // Update text appending logic into existing description container block safely
       const updatedDescription = `${existingEvent.description || 'Axion Unified Session Matrix:\n'}\n${itemDetailsText}`;
       await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEvent.id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
              ...existingEvent,
              description: updatedDescription
          })
       });
    } else {
       // Create fresh container structural card
       const initialDescription = `Axion Unified Session Matrix:\n\n${itemDetailsText}`;
       await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
              summary: targetTitle,
              description: initialDescription,
              start: { date: dateStr },
              end: { date: endStr },
              colorId: calendarColorId,
              extendedProperties: {
                  private: { axionHash: uniqueBatchHash }
              }
          })
       });
    }
  };

  const handleCloseDay = async () => {
    setIsSyncing(true);
    let finalLogs = [...loggedSessions];
    const token = localStorage.getItem('gcal_token');
    
    if (!token) {
        alert("Authorization connection missing. Please link your Google profile inside the Account section.");
        setIsSyncing(false);
        return;
    }

    let successCount = 0;
    try {
        for (let i = 0; i < finalLogs.length; i++) {
            if (!finalLogs[i].synced) {
                await pushBatchEventToGoogle(token, finalLogs[i]);
                finalLogs[i].synced = true;
                successCount++;
            }
        }
        setLoggedSessions([...finalLogs]);
        if(successCount > 0) alert(`Axion Synced: Successfully batched ${successCount} entries into your master calendar views!`);
        else alert("All current records are completely up to date.");
    } catch(err: any) {
        alert("Sync pipeline paused. If your authorization token expired, simply refresh your connection in the Account panel.");
    } finally {
        setIsSyncing(false);
    }
  };

  const getHeaderTitle = () => {
      switch(currentTab) {
          case 'planner': return 'Planner';
          case 'archive': return 'History';
          case 'analysis': return 'Analysis Center';
          case 'account': return 'Account Management';
          case 'settings': return 'System Settings';
          default: return 'Command Center';
      }
  };

  return (
    <div className="flex min-h-screen relative w-full text-zinc-100 font-sans selection:bg-primary/30">
      
      {/* Background Wallpaper Container */}
      <div className="ios-wallpaper-canvas fixed inset-0 z-0 bg-cover bg-center transition-all duration-700 ease-in-out" />

      <Sidebar 
        currentTab={currentTab} 
        setTab={setCurrentTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        profileImg={profileImg}
        userSettings={userSettings}
      />

      <div className={`flex-1 flex flex-col transition-all duration-500 min-h-screen z-10 md:ml-64 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Universal Top Header Grid */}
        <header className="ios-glass-panel rounded-t-none rounded-b-[24px] border-x-0 border-t-0 bg-opacity-30 flex justify-between items-center w-[calc(100%-2rem)] mx-4 mt-4 px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-primary hover:bg-white/10 transition-all p-2 rounded-full cursor-pointer">
              <span className="material-symbols-outlined">menu</span>
            </button>
            
            {/* Embedded Premium Axion Vector Logo replacing the old atom icon */}
            <div className="flex items-center gap-2.5">
              <svg className="w-7 h-7 text-primary" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M76 164 L112 74 C115 66, 125 66, 128 74 L140 104" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M164 164 L120 54 L102 96" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M92 126 L148 126" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.8"/>
              </svg>
              <h1 className="text-lg font-bold tracking-tight text-white transition-all duration-500">
                  {getHeaderTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Top Right Action Settings Buttons */}
            <button 
              onClick={() => setCurrentTab('settings')}
              className={`p-2 rounded-xl transition-all cursor-pointer hover:bg-white/5 ${currentTab === 'settings' ? 'text-primary bg-white/5' : 'text-zinc-400 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[22px]">settings</span>
            </button>

            <div 
              className="w-9 h-9 rounded-full border border-white/10 relative flex items-center justify-center overflow-hidden ios-glass-card-nested shadow-inner cursor-pointer" 
              onClick={() => setCurrentTab('account')}
            >
               <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-200 bg-black/40">
                 {profileImg ? (
                     <img src={profileImg} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                 ) : (
                     userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'A'
                 )}
               </div>
            </div>
          </div>
        </header>

        {/* Multi-Tab Rendering Pipeline Frame Router */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 flex flex-col justify-start transition-all duration-500">
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

        {currentTab === 'command' && (
            <footer className="ios-glass-panel rounded-b-none rounded-t-[28px] border-x-0 border-b-0 w-[calc(100%-2rem)] mx-4 py-4 flex flex-col justify-center items-center gap-2 mt-auto bg-opacity-40">
              <button 
                onClick={handleCloseDay} 
                disabled={isSyncing}
                className={`text-primary font-bold hover:underline text-sm tracking-wide transition-all ${isSyncing ? 'opacity-50 cursor-wait' : 'cursor-pointer active:opacity-70'}`}>
                 {isSyncing ? 'Consolidating records...' : 'Commit Balanced Records & Sync'}
              </button>
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
