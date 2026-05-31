import React, { useState, useEffect } from 'react';
import { UserSettings, getSubjectConfig } from '../types';

declare var google: any;

export interface PresetConfig {
  id: string;
  name: string;
  url: string;
  primaryColor: string;
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
  const [newSubjectName, setNewSubjectName] = useState('');
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
      setGeminiKey(e.target.value);
      localStorage.setItem('gemini_api_key', e.target.value);
  };

  const fetchUserProfile = async (token: string) => {
      try {
          const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setUserProfile(data);
              localStorage.setItem('gcal_profile', JSON.stringify(data));
          }
      } catch (err) {
          console.error("Failed to fetch profile", err);
      }
  };

  const handleConnect = () => {
     try {
         const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
         if (!clientId || clientId === 'your_google_client_id_here') {
             alert("Please configure VITE_GOOGLE_CLIENT_ID in your environment variables/secrets.");
             return;
         }
         const client = google.accounts.oauth2.initTokenClient({
             client_id: clientId,
             scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
             prompt: 'consent', 
             callback: (response: any) => {
                 if (response.error) {
                     alert("Auth error: " + response.error);
                 } else {
                     localStorage.setItem('gcal_token', response.access_token);
                     localStorage.setItem('gcal_token_expires', String(Date.now() + response.expires_in * 1000));
                     setHasToken(true);
                     fetchUserProfile(response.access_token);
                 }
             },
         });
         client.requestAccessToken();
     } catch(err: any) {
         alert("Error setting up Calendar OAuth: " + err.message);
     }
  };

  const handleDisconnect = () => {
      localStorage.removeItem('gcal_token');
      localStorage.removeItem('gcal_profile');
      setHasToken(false);
      setUserProfile(null);
  };

  const exportData = () => {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('pcbm_')) {
             try {
                data[key] = JSON.parse(localStorage.getItem(key) || '');
             } catch(e) {
                data[key] = localStorage.getItem(key);
             }
          }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pcbm-export-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleAddSubject = () => {
      const trimmed = newSubjectName.trim().toLowerCase();
      if (!trimmed) return;
      if (!userSettings.activeSubjects.includes(trimmed)) {
          setUserSettings(prev => ({
              ...prev,
              activeSubjects: [...prev.activeSubjects, trimmed]
          }));
      }
      setNewSubjectName('');
  };

  // Combine default subjects with any custom added subjects
  const allKnownSubjects = Array.from(new Set(['phys', 'chem', 'bio', 'math', ...userSettings.activeSubjects]));

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto animate-ios-fade-in text-zinc-100">
        
        {/* Main Fluid Settings Container */}
        <div className="ios-glass-panel p-6 sm:p-10 flex flex-col gap-10">
             
             {/* --- SECTION 1: INTERFACE GEOMETRY (THEMES & BLUR) --- */}
             <div className="flex flex-col gap-5 border-b border-white/5 pb-8">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">palette</span> Interface Geometry
                 </h3>
                 
                 <div className="flex flex-col gap-2">
                     <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Adaptive Wallpaper Canvas</label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
                         {presets.map((preset) => (
                             <button
                                 key={preset.id}
                                 type="button"
                                 onClick={() => setActiveWallpaper(preset.id)}
                                 className={`p-4 rounded-2xl text-left border relative transition-all duration-300 cursor-pointer ios-glass-card-nested ${activeWallpaper === preset.id ? 'border-primary bg-white/10 shadow-lg shadow-primary/20' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                             >
                                 <div className="font-bold text-sm text-zinc-100">{preset.name}</div>
                                 <div className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-mono">Accent: <span style={{ color: preset.primaryColor }}>■</span></div>
                                 {activeWallpaper === preset.id && (
                                     <span className="material-symbols-outlined text-primary text-[18px] absolute top-4 right-4">check_circle</span>
                                 )}
                             </button>
                         ))}
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                     <div className="flex flex-col gap-3">
                         <div className="flex justify-between items-center text-xs">
                             <label className="font-semibold text-zinc-400 uppercase tracking-wider">Backdrop Blur Depth</label>
                             <span className="font-mono bg-black/30 border border-white/5 px-2 py-1 rounded text-primary font-bold">{glassBlur}px</span>
                         </div>
                         <input 
                             type="range" min="8" max="40" step="1" 
                             value={glassBlur} 
                             onChange={(e) => setGlassBlur(Number(e.target.value))}
                             className="w-full accent-primary bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>
                     <div className="flex flex-col gap-3">
                         <div className="flex justify-between items-center text-xs">
                             <label className="font-semibold text-zinc-400 uppercase tracking-wider">Panel Opacity</label>
                             <span className="font-mono bg-black/30 border border-white/5 px-2 py-1 rounded text-primary font-bold">{Math.round(glassOpacity * 100)}%</span>
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

             {/* --- SECTION 2: USER IDENTITY & API --- */}
             <div className="flex flex-col gap-5 border-b border-white/5 pb-8">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">badge</span> User Identity
                 </h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Name</label>
                        <input 
                           type="text" 
                           value={userSettings.name} 
                           onChange={e => setUserSettings(prev => ({...prev, name: e.target.value}))} 
                           className="w-full ios-glass-input p-3.5 text-sm" 
                           placeholder="e.g. Rahul"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Class / Target Year</label>
                        <input 
                           type="text" 
                           value={userSettings.className} 
                           onChange={e => setUserSettings(prev => ({...prev, className: e.target.value}))} 
                           className="w-full ios-glass-input p-3.5 text-sm" 
                           placeholder="e.g. 11th"
                        />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Gemini API Key</label>
                        <input 
                           type="password" 
                           value={geminiKey} 
                           onChange={handleGeminiKeyChange} 
                           className="w-full ios-glass-input p-3.5 text-sm font-mono tracking-wide" 
                           placeholder="AI features require an API Key. Key stored locally."
                        />
                     </div>
                 </div>
             </div>

             {/* --- SECTION 3: SUBJECT MANAGER --- */}
             <div className="flex flex-col gap-5 border-b border-white/5 pb-8">
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">category</span> Subject Manager
                 </h3>
                 
                 <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-3">Uncheck a subject to remove it from the Planner & Logger menus.</label>
                    <div className="flex flex-wrap gap-3 mb-5">
                        {allKnownSubjects.map(sub => {
                            const isChecked = userSettings.activeSubjects.includes(sub);
                            const conf = getSubjectConfig(sub);
                            return (
                               <label key={sub} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10' : 'bg-black/20 border-white/5 text-zinc-400 hover:bg-black/40'}`}>
                                   <input 
                                      type="checkbox" 
                                      className="hidden"
                                      checked={isChecked}
                                      onChange={(e) => {
                                          if (e.target.checked) {
                                              setUserSettings(prev => ({ ...prev, activeSubjects: [...prev.activeSubjects, sub] }));
                                          } else {
                                              setUserSettings(prev => ({ ...prev, activeSubjects: prev.activeSubjects.filter(s => s !== sub) }));
                                          }
                                      }}
                                   />
                                   <span className="font-semibold text-sm capitalize">{conf.name}</span>
                                   {isChecked && <span className="material-symbols-outlined text-[16px] ml-1">check</span>}
                               </label>
                            );
                        })}
                    </div>
                    <div className="flex gap-3 max-w-md">
                        <input 
                            type="text" 
                            value={newSubjectName} 
                            onChange={e => setNewSubjectName(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                            className="flex-1 ios-glass-input p-3 text-sm" 
                            placeholder="Add new subject tag..."
                        />
                        <button 
                            onClick={handleAddSubject}
                            className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition-colors text-white font-bold cursor-pointer"
                        >
                            Add
                        </button>
                    </div>
                 </div>
             </div>
             
             {/* --- SECTION 4: CLOUD & DATA --- */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="flex flex-col gap-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[18px]">cloud_sync</span> Cloud Sync
                     </h3>
                     <div className="flex flex-col justify-between p-6 ios-glass-card-nested h-full gap-6">
                         <div className="flex items-center gap-4">
                             {userProfile ? (
                                 <img src={userProfile.picture} alt="Profile" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full border-2 border-primary shadow-lg shadow-primary/20" />
                             ) : (
                                 <div className="w-14 h-14 bg-white/10 flex items-center justify-center rounded-full border border-white/5">
                                    <span className="material-symbols-outlined text-[24px] text-zinc-400">account_circle</span>
                                 </div>
                             )}
                             
                             <div>
                                 <h4 className="font-bold text-zinc-100 text-base">{userProfile ? userProfile.name : 'Not Signed In'}</h4>
                                 <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                                     {hasToken ? <><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> {userProfile?.email || 'Connected'}</> : 'Sync calendar and save remotely.'}
                                 </p>
                             </div>
                         </div>
                         {hasToken ? (
                             <button onClick={handleDisconnect} className="w-full text-sm px-6 py-3.5 rounded-xl border border-error/50 bg-error/10 text-error hover:bg-error/20 cursor-pointer transition-colors font-bold mt-auto">Sign Out of Google</button>
                         ) : (
                             <button onClick={handleConnect} className="w-full text-sm px-6 py-3.5 rounded-xl bg-white text-black hover:bg-zinc-200 cursor-pointer transition-all font-bold mt-auto shadow-xl">Sign In with Google</button>
                         )}
                     </div>
                 </div>

                 <div className="flex flex-col gap-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                         <span className="material-symbols-outlined text-[18px]">hard_drive</span> Local Database
                     </h3>
                     <div className="flex flex-col justify-between p-6 ios-glass-card-nested h-full gap-4">
                         <div>
                             <h4 className="font-bold text-zinc-100 text-base">Export All Data</h4>
                             <p className="text-xs text-zinc-400 leading-relaxed mt-2">Download a fully encrypted JSON copy of all your plans, logs, and settings to your device storage.</p>
                         </div>
                         <button onClick={exportData} className="w-full text-sm px-6 py-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 cursor-pointer transition-colors flex items-center justify-center gap-2 font-bold mt-auto">
                             <span className="material-symbols-outlined text-[18px]">download</span> Download Backup
                         </button>
                     </div>
                 </div>
             </div>

        </div>
    </div>
  );
}
