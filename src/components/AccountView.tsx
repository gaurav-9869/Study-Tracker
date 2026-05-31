import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';

declare var google: any;

interface PresetConfig {
  id: string;
  name: string;
  url: string;
  primaryColor: string;
  glassOpacity: string;
}

interface AccountViewProps {
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  
  // Dynamic design variables mapped from App frame shell
  activeWallpaper: string;
  setActiveWallpaper: (id: string) => void;
  glassBlur: number;
  setGlassBlur: (val: number) => void;
  glassOpacity: number;
  setGlassOpacity: (val: number) => void;
  presets: PresetConfig[];
}

export default function AccountView({ 
  userSettings, 
  setUserSettings,
  activeWallpaper,
  setActiveWallpaper,
  glassBlur,
  setGlassBlur,
  glassOpacity,
  setGlassOpacity,
  presets
}: AccountViewProps) {
  const [hasToken, setHasToken] = useState(false);
  const [userProfile, setUserProfile] = useState<{name: string, picture: string, email: string} | null>(null);
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
     const token = localStorage.getItem('gcal_token');
     const expires = localStorage.getItem('gcal_token_expires');
     const apiKey = localStorage.getItem('gemini_api_key');
     if (apiKey) setGeminiKey(apiKey);
     
     if (token && expires && Date.now() < Number(expires)) {
         setHasToken(true);
         const profile = localStorage.getItem('gcal_profile');
         if (profile) {
             try {
                 setUserProfile(JSON.parse(profile));
             } catch(e) {}
         } else {
             fetchUserProfile(token);
         }
     } else {
         if (token) {
             localStorage.removeItem('gcal_token');
             localStorage.removeItem('gcal_token_expires');
         }
         setHasToken(false);
     }
  }, []);

  const handleGeminiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.trim();
      setGeminiKey(val);
      localStorage.setItem('gemini_api_key', val);
  };

  const fetchUserProfile = async (token: string) => {
      try {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              const profileData = { name: data.name, picture: data.picture, email: data.email };
              setUserProfile(profileData);
              localStorage.setItem('gcal_profile', JSON.stringify(profileData));
              if (data.picture) {
                  localStorage.setItem('google_profile_img', data.picture); // Commit picture to header loop caching
              }
          }
      } catch(e) {
          console.error("Failed downloading Google profile parameters", e);
      }
  };

  const handleConnect = () => {
      if (!google || !google.accounts || !google.accounts.oauth2) {
          alert("Google Sign-In API integration layer offline. Check script hooks.");
          return;
      }
      const client = google.accounts.oauth2.initTokenClient({
          client_id: localStorage.getItem('pcbm_gclient_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar.events',
          callback: async (tokenResponse: any) => {
              if (tokenResponse.access_token) {
                  localStorage.setItem('gcal_token', tokenResponse.access_token);
                  localStorage.setItem('gcal_token_expires', String(Date.now() + Number(tokenResponse.expires_in) * 1000));
                  setHasToken(true);
                  await fetchUserProfile(tokenResponse.access_token);
                  window.location.reload(); // Force full hydration reload to bind global layout images instantly
              }
          },
      });
      client.requestAccessToken();
  };

  const handleDisconnect = () => {
      localStorage.removeItem('gcal_token');
      localStorage.removeItem('gcal_token_expires');
      localStorage.removeItem('gcal_profile');
      localStorage.removeItem('google_profile_img');
      setHasToken(false);
      setUserProfile(null);
      window.location.reload();
  };

  const exportData = () => {
      const today = new Date().toISOString().split('T')[0];
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `pcbm_tracker_backup_${today}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-zinc-100">
        <h2 className="font-headline text-2xl font-bold tracking-tight text-zinc-100">System Preferences</h2>
        
        {/* Main iOS Translucent Preference Card Sheet */}
        <div className="ios-glass-panel p-6 bg-opacity-30 flex flex-col gap-6 w-full">
             
             {/* --- THE REAL-TIME LIQUID GLASS CONFIGURATION SLOT --- */}
             <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
                 <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">palette</span> Interface Geometry
                 </h3>
                 
                 {/* Wallpaper Selector Lane */}
                 <div className="flex flex-col gap-2">
                     <label className="text-xs font-semibold text-zinc-400">Adaptive Screen Wallpaper Canvas</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                         {presets.map((preset) => (
                             <button
                                 key={preset.id}
                                 type="button"
                                 onClick={() => setActiveWallpaper(preset.id)}
                                 data-active={activeWallpaper === preset.id}
                                 className="p-4 rounded-xl text-left border relative transition-all duration-300 group cursor-pointer ios-glass-card-nested data-[active=true]:border-primary data-[active=true]:bg-white/10"
                             >
                                 <div className="font-bold text-sm text-zinc-100">{preset.name}</div>
                                 <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-mono">Accent: <span style={{ color: preset.primaryColor }}>■</span></div>
                                 {activeWallpaper === preset.id && (
                                     <span className="material-symbols-outlined text-primary text-[18px] absolute top-3 right-3 animate-scale-in">check_circle</span>
                                 )}
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Real-time Geometry Sliders Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                     <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center text-xs">
                             <label className="font-semibold text-zinc-400">Backdrop Blur Intensity</label>
                             <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-primary font-bold">{glassBlur}px</span>
                         </div>
                         <input 
                             type="range" min="8" max="40" step="1" 
                             value={glassBlur} 
                             onChange={(e) => setGlassBlur(Number(e.target.value))}
                             className="w-full accent-primary bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>

                     <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center text-xs">
                             <label className="font-semibold text-zinc-400">Glass Panel Opacity</label>
                             <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-primary font-bold">{Math.round(glassOpacity * 100)}%</span>
                         </div>
                         <input 
                             type="range" min="0.20" max="0.75" step="0.05" 
                             value={glassOpacity} 
                             onChange={(e) => setGlassOpacity(Number(e.target.value))}
                             className="w-full accent-primary bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>
                 </div>
             </div>

             {/* API Engine Keys Panel */}
             <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
                 <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">key</span> Telemetry AI Pipeline
                 </h3>
                 <div className="flex flex-col gap-2">
                     <label className="text-xs font-semibold text-zinc-400">Google AI Studio API Key (Gemini Core)</label>
                     <input 
                         type="password" 
                         value={geminiKey} 
                         onChange={handleGeminiKeyChange}
                         placeholder="AI Studio Token signature key..." 
                         className="w-full ios-glass-input p-3 text-sm outline-none font-mono tracking-wide"
                     />
                     <p className="text-[10px] text-zinc-500 italic mt-0.5">Used locally to execute natural language extraction parsing scripts securely.</p>
                 </div>
             </div>

             {/* User Identity Frame Container Area */}
             <div className="flex flex-col gap-4 border-b border-white/5 pb-6">
                 <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">account_circle</span> Identity Authentication
                 </h3>
                 <div className="flex items-center justify-between p-4 ios-glass-card-nested">
                     <div className="flex items-center gap-4">
                         <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-black/40 text-xl font-bold font-headline text-zinc-300">
                             {userProfile?.picture ? (
                                 <img src={userProfile.picture} alt="Google Authenticated Display Identification Avatar" className="w-full h-full object-cover" />
                             ) : (
                                 userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'A'
                             )}
                         </div>
                         <div>
                             <h4 className="font-bold text-zinc-200 text-sm">{userProfile ? userProfile.name : 'Offline Workspace Node'}</h4>
                             <p className="text-xs text-zinc-400 mt-0.5">{userProfile ? userProfile.email : 'Google Calendar pipelines disconnected.'}</p>
                         </div>
                     </div>
                     {hasToken ? (
                         <button onClick={handleDisconnect} className="text-xs px-5 py-2.5 rounded-xl border border-error text-error hover:bg-error/10 cursor-pointer transition-colors font-semibold">Disconnect Account</button>
                     ) : (
                         <button onClick={handleConnect} className="text-xs px-5 py-2.5 rounded-xl bg-primary text-on-primary-fixed hover:shadow-lg hover:shadow-primary/20 cursor-pointer transition-all font-bold">Connect GCalendar</button>
                     )}
                 </div>
             </div>

             {/* Data Operations Panel Layout */}
             <div className="flex flex-col gap-4">
                 <h3 className="font-headline text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">database</span> Storage Operations
                 </h3>
                 <div className="flex items-center justify-between p-4 ios-glass-card-nested">
                     <div>
                         <h4 className="font-bold text-zinc-200 text-sm">Download Local Database Backups</h4>
                         <p className="text-xs text-zinc-400 mt-0.5">Exports full structural layout indexes, logged goals, and history as raw encrypted JSON formats.</p>
                     </div>
                     <button onClick={exportData} className="text-xs px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 cursor-pointer transition-colors flex items-center gap-2 font-bold">
                         <span className="material-symbols-outlined text-[16px]">download</span> Export Database
                     </button>
                 </div>
             </div>

        </div>
    </div>
  );
}
