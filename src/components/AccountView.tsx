import React, { useState, useEffect } from 'react';
import { UserSettings, getSubjectConfig } from '../types';

declare var google: any;

interface AccountViewProps {
    userSettings: UserSettings;
    setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export default function AccountView({ userSettings, setUserSettings }: AccountViewProps) {
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
             // Token expired
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
                     localStorage.setItem('gcal_token_expires', Date.now() + response.expires_in * 1000);
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
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto fade-in">
        <h2 className="font-headline text-headline-md text-on-surface font-bold">Account Profile</h2>
        
        <div className="glass-panel ghost-border p-6 flex flex-col gap-6 bg-surface-container-low">
             <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2">User Identity</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Name</label>
                    <input 
                       type="text" 
                       value={userSettings.name} 
                       onChange={e => setUserSettings(prev => ({...prev, name: e.target.value}))} 
                       className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-on-surface focus:border-primary/50 focus:outline-none transition-colors" 
                       placeholder="e.g. Rahul"
                    />
                 </div>
                 <div>
                    <label className="block text-sm text-on-surface-variant mb-1">Class / Target Year</label>
                    <input 
                       type="text" 
                       value={userSettings.className} 
                       onChange={e => setUserSettings(prev => ({...prev, className: e.target.value}))} 
                       className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-on-surface focus:border-primary/50 focus:outline-none transition-colors" 
                       placeholder="e.g. 11th"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm text-on-surface-variant mb-1">Gemini API Key</label>
                    <input 
                       type="password" 
                       value={geminiKey} 
                       onChange={handleGeminiKeyChange} 
                       className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3 text-on-surface focus:border-primary/50 focus:outline-none transition-colors" 
                       placeholder="AI features require an API Key. Key stored locally."
                    />
                 </div>
             </div>

             <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2 mt-4">Subject Manager</h3>
             
             <div>
                <label className="block text-sm text-on-surface-variant mb-2">Subject Filter (Uncheck to remove from Planner & Logger)</label>
                <div className="flex flex-wrap gap-3 mb-4">
                    {allKnownSubjects.map(sub => {
                        const isChecked = userSettings.activeSubjects.includes(sub);
                        const conf = getSubjectConfig(sub);
                        return (
                           <label key={sub} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'bg-primary/20 border-primary ' + conf.text : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant'}`}>
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
                               <span className="font-medium text-sm capitalize">{conf.name}</span>
                           </label>
                        );
                    })}
                </div>
                <div className="flex gap-2 max-w-sm">
                    <input 
                        type="text" 
                        value={newSubjectName} 
                        onChange={e => setNewSubjectName(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                        className="flex-1 bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none transition-colors" 
                        placeholder="Add new subject..."
                    />
                    <button 
                        onClick={handleAddSubject}
                        className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/10 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface"
                    >
                        Add
                    </button>
                </div>
             </div>
             
             <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2 mt-4">Google Account</h3>
             
             <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-surface-container-lowest rounded-xl border border-white/5 gap-4">
                 <div className="flex items-center gap-4">
                     {userProfile ? (
                         <img src={userProfile.picture} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-primary" />
                     ) : (
                         <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
                         </div>
                     )}
                     
                     <div>
                         <h4 className="font-bold text-on-surface text-lg">{userProfile ? userProfile.name : 'Sign In with Google'}</h4>
                         <p className="text-sm text-on-surface-variant flex items-center gap-1">
                             {hasToken ? <><span className="text-tertiary-container text-xs">●</span> {userProfile?.email || 'Connected'}</> : 'Sync calendar and save progress remotely.'}
                         </p>
                     </div>
                 </div>
                 {hasToken ? (
                     <button onClick={handleDisconnect} className="text-sm px-6 py-3 rounded-full border border-error text-error hover:bg-error/10 cursor-pointer transition-colors font-medium">Sign Out</button>
                 ) : (
                     <button onClick={handleConnect} className="text-sm px-6 py-3 rounded-full bg-primary text-on-primary-fixed hover:bg-primary-fixed hover:shadow-lg hover:shadow-primary/20 cursor-pointer transition-all font-bold">Sign In & Sync</button>
                 )}
             </div>

             <h3 className="font-headline text-lg text-on-surface font-medium border-b border-white/5 pb-2 mt-4">Data Management</h3>
             
             <div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-xl border border-white/5">
                 <div>
                     <h4 className="font-bold text-on-surface">Export All Data</h4>
                     <p className="text-xs text-on-surface-variant">Download a JSON copy of all your plans, logs, and settings.</p>
                 </div>
                 <button onClick={exportData} className="text-sm px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 cursor-pointer transition-colors flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">download</span> Export
                 </button>
             </div>
        </div>
    </div>
  );
}
