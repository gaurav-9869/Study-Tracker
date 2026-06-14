import React from 'react';
import { UserSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  profileImg?: string | null;
  userSettings?: UserSettings;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen, profileImg, userSettings }: SidebarProps) {
  
  // Goal #2, #3, #4: Splitting Settings, Simplifying "Tracker", and removing redundant "History"
  const navItems: NavItem[] = [
    { id: 'command', label: 'Tracker', icon: 'dashboard' },
    { id: 'planner', label: 'Planner', icon: 'calendar_today' },
    { id: 'archive', label: 'Archive', icon: 'inventory_2' },
    { id: 'analysis', label: 'Analysis', icon: 'analytics' },
    { id: 'settings', label: 'Settings', icon: 'tune' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] md:hidden transition-opacity"
        />
      )}

      {/* Goal #7 & #9: Modernized, aesthetic glass menu bar without the blue tint */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 z-[70] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-r border-white/5 bg-black/40 flex flex-col justify-between p-4 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
        }}
      >
        <div className="flex flex-col gap-6 w-full">
          
          {/* Goal #1: Custom Geometric Axion Logo */}
          <div className="flex items-center gap-3 px-2 py-3 border-b border-white/10">
            <svg className="w-8 h-8 text-emerald-400 transition-colors duration-500" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M76 164 L112 74 C115 66, 125 66, 128 74 L140 104" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M164 164 L120 54 L102 96" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M92 126 L148 126" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.8"/>
            </svg>
            <span className="text-xl font-black tracking-widest text-white uppercase">AXION</span>
          </div>

          {/* Navigation Matrix */}
          <nav className="flex flex-col gap-2 w-full">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-semibold tracking-wide border cursor-pointer group ${
                    isActive 
                      ? 'bg-white/10 border-white/20 text-white shadow-inner' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Goal #2: Dedicated Account Routing Footer */}
        <div className="border-t border-white/10 pt-4 mt-auto w-full">
          <button 
            onClick={() => {
              setTab('account');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer text-left hover:bg-white/10 ${currentTab === 'account' ? 'bg-white/10 border-white/20' : 'border-transparent bg-black/20'}`}
          >
            <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
               {profileImg ? (
                   <img src={profileImg} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
               ) : (
                   <span className="text-sm font-bold text-zinc-300 uppercase">
                     {userSettings?.name ? userSettings.name.charAt(0).toUpperCase() : 'A'}
                   </span>
               )}
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-bold text-white tracking-tight truncate">
                 {userSettings?.name || 'My Account'}
               </span>
               <span className="text-[11px] text-zinc-400 truncate font-medium">
                 Manage Profile
               </span>
            </div>
          </button>
        </div>

      </aside>
    </>
  );
}
