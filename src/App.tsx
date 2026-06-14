import React, { useState, useEffect, useLayoutEffect, Component, ReactNode, ErrorInfo } from 'react';
import { PlanItem, LogItem, UserSettings, getLocalDateString, getFocusScore, getSubjectConfig } from './types';
import CommandView from './components/CommandView';
import ArchiveView from './components/ArchiveView';
import AccountView from './components/AccountView';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import { nanoid } from 'nanoid';

// ==========================================
// 1. COMPONENT ISOLATOR
// If a component crashes, it becomes a red box, but the rest of the app survives!
// ==========================================
class SafeBlock extends Component<{componentName: string, children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {componentName: string, children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '15px', backgroundColor: '#450a0a', color: '#fca5a5', borderRadius: '12px', border: '1px solid #ef4444', margin: '10px' }}>
          <h3 style={{ fontWeight: 'bold', fontSize: '16px' }}>🚨 Crash isolated in: {this.props.componentName}.tsx</h3>
          <p style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '8px' }}>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 2. THE MAIN APPLICATION LOGIC
// ==========================================
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

  const safeParseArray = (dataStr: string | null) => {
    if (!dataStr) return [];
    try { const parsed = JSON.parse(dataStr); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  };

  useEffect(() => {
    const today = getLocalDateString(0);
    const savedPlan = localStorage.getItem(`pcbm_plan_${today}`);
    const savedLog = localStorage.getItem(`pcbm_log_${today}`);
    const savedSettings = localStorage.getItem('pcbm_settings');
    const savedProfile = localStorage.getItem('gcal_profile');
    
    setMorningPlan(safeParseArray(savedPlan));
    setLoggedSessions(safeParseArray(savedLog));

    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            if (parsed && typeof parsed === 'object') {
                setUserSettings({
                    name: parsed.name || '',
                    className: parsed.className || '',
                    activeSubjects: Array.isArray(parsed.activeSubjects) ? parsed.activeSubjects : ['bio', 'phys', 'chem', 'math'],
                    subjectGoals: parsed.subjectGoals || {}
                });
            }
        } catch (e) { console.error(e); }
    }

    if (savedProfile) {
        try {
            const parsedProfile = JSON.parse(savedProfile);
            if (parsedProfile?.picture) setProfileImg(parsedProfile.picture);
        } catch (e) {}
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

  const getHeaderTitle = () => {
      switch(currentTab) {
          case 'archive': return 'History Archive';
          case 'account': return 'Settings';
          default: return 'Daily Tracker';
      }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex min-h-screen relative w-full text-zinc-100">
      <div className="ios-wallpaper-canvas" />

      {/* Isolating the Sidebar */}
      <SafeBlock componentName="Sidebar">
        <Sidebar 
          currentTab={currentTab} 
          setTab={setCurrentTab} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
        />
      </SafeBlock>

      <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-64 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        
        {/* Isolating the Header */}
        <SafeBlock componentName="Header Region">
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
              <div 
                className="w-10 h-10 rounded-full border border-white/10 relative flex items-center justify-center overflow-hidden ios-glass-card-nested shadow-inner cursor-pointer" 
                onClick={() => setCurrentTab('account')}
              >
                 <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-200 bg-black/40">
                   {profileImg ? (
                       <img src={profileImg} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                   ) : (
                       userSettings?.name ? String(userSettings.name).charAt(0).toUpperCase() : 'U'
                   )}
                 </div>
                 <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0f18] transition-colors duration-500 ${hasUnsyncedLogs ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              </div>
            </div>
          </header>
        </SafeBlock>

        <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-24 flex flex-col animate-ios-fade-in">
            {/* Isolating the Views */}
            {currentTab === 'command' && (
              <SafeBlock componentName="CommandView">
                <CommandView 
                  morningPlan={morningPlan} 
                  setMorningPlan={setMorningPlan}
                  loggedSessions={loggedSessions}
                  setLoggedSessions={setLoggedSessions}
                  userSettings={userSettings}
                  setUserSettings={setUserSettings}
                />
              </SafeBlock>
            )}
            {currentTab === 'archive' && (
              <SafeBlock componentName="ArchiveView">
                <ArchiveView />
              </SafeBlock>
            )}
            {currentTab === 'account' && (
              <SafeBlock componentName="AccountView">
                <AccountView 
                  userSettings={userSettings} 
                  setUserSettings={setUserSettings}
                  activeWallpaper={''}
                  setActiveWallpaper={() => {}}
                  glassBlur={glassBlur}
                  setGlassBlur={setGlassBlur}
                  glassOpacity={glassOpacity}
                  setGlassOpacity={setGlassOpacity}
                  presets={[]}
                />
              </SafeBlock>
            )}
        </main>

        <SafeBlock componentName="Chatbot">
          <Chatbot 
            morningPlan={morningPlan}
            setMorningPlan={setMorningPlan}
            loggedSessions={loggedSessions}
            setLoggedSessions={setLoggedSessions}
          />
        </SafeBlock>
      </div>
    </div>
  );
}
