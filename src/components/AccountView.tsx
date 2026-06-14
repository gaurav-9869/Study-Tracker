import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';

interface AccountViewProps {
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export default function AccountView({ userSettings, setUserSettings }: AccountViewProps) {
  const [gcalConnected, setGcalConnected] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('gcal_token');
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setGcalConnected(!!token);
    setApiKeyInput(savedKey);
  }, []);

  const handleProfileChange = (field: keyof UserSettings, value: string) => {
    setUserSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKeyInput.trim());
    alert('Gemini API Key saved locally.');
  };

  const handleConnectGoogleCalendar = () => {
    try {
      const client = (window as any).google?.accounts?.oauth2?.initTokenClient({
        client_id: '868114092040-421bphuod8v48pve5juh7q601daj824g.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.access_token) {
            localStorage.setItem('gcal_token', tokenResponse.access_token);
            setGcalConnected(true);
            
            // Fetch profile data seamlessly in background
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
              });
              if (res.ok) {
                const profileData = await res.json();
                localStorage.setItem('gcal_profile', JSON.stringify(profileData));
              }
            } catch (e) {}
            
            alert('Google Calendar connection established successfully!');
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      alert('Google API script not loaded completely.');
    }
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('gcal_token');
    localStorage.removeItem('gcal_profile');
    setGcalConnected(false);
    alert('Google Calendar credentials removed safely.');
  };

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <div className="ios-glass-panel p-6 flex flex-col gap-6 w-full max-w-2xl mx-auto animate-ios-fade-in text-zinc-100" style={glassStyle}>
      
      {/* Profile Section */}
      <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
         <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">account_circle</span>
            Profile Info
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
               <label className="text-xs text-zinc-400 font-medium">Your Name</label>
               <input 
                 type="text" 
                 value={userSettings.name} 
                 onChange={(e) => handleProfileChange('name', e.target.value)}
                 className="ios-glass-input p-3.5 text-sm rounded-xl bg-black/10 border-white/[0.06] outline-none text-white focus:border-primary/30"
                 placeholder="Name..."
               />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs text-zinc-400 font-medium">Class / Stream</label>
               <input 
                 type="text" 
                 value={userSettings.className} 
                 onChange={(e) => handleProfileChange('className', e.target.value)}
                 className="ios-glass-input p-3.5 text-sm rounded-xl bg-black/10 border-white/[0.06] outline-none text-white focus:border-primary/30"
                 placeholder="e.g., 11th Grade PCBM"
               />
            </div>
         </div>
      </div>

      {/* API Integrations and Data Bridges */}
      <div className="flex flex-col gap-4 bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
         <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">sync_alt</span>
            Bridges & Integrations
         </h3>

         <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 font-medium">Gemini API Key</label>
            <div className="flex gap-2">
               <input 
                 type="password" 
                 value={apiKeyInput} 
                 onChange={(e) => setApiKeyInput(e.target.value)}
                 className="flex-1 ios-glass-input p-3.5 text-sm rounded-xl bg-black/10 border-white/[0.06] outline-none text-white focus:border-primary/30"
                 placeholder="AI Studio Token Access Key..."
               />
               <button onClick={handleSaveApiKey} className="px-5 bg-sky-500 text-white text-xs font-bold rounded-xl hover:bg-sky-600 transition-all cursor-pointer shadow-md">
                  Save
               </button>
            </div>
         </div>

         <div className="flex flex-col gap-2 mt-3 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${gcalConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></div>
                  <span className="text-zinc-300 font-medium">{gcalConnected ? 'Google Cloud Online' : 'Google Cloud Offline'}</span>
               </div>
               {gcalConnected ? (
                  <button onClick={handleDisconnectGoogle} className="text-xs text-error font-bold hover:underline cursor-pointer">Disconnect</button>
               ) : (
                  <button onClick={handleConnectGoogleCalendar} className="text-xs text-primary font-bold hover:underline cursor-pointer">Connect Calendar</button>
               )}
            </div>
         </div>
      </div>

    </div>
  );
}
