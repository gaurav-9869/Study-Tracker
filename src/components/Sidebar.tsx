import React from 'react';
import { UserSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  profileImg: string | null;
  userSettings: UserSettings;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen, profileImg, userSettings }: SidebarProps) {
  
  // Minimalist, high-end tab navigation mappings
  const navItems: NavItem[] = [
    { id: 'command', label: 'Command Center', icon: 'dashboard' },
    { id: 'planner', label: 'Planner', icon: 'calendar_today' },
    { id: 'archive', label: 'History', icon: 'history' },
    { id: 'analysis', label: 'Analysis', icon: 'analytics' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay Blur */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Main Premium Frosted Sidebar Panel Container */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 z-50 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) border-r border-white/[0.06] bg-black/20 flex flex-col justify-between p-4 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          backdropFilter: 'blur(var(--glass-blur, 24px))',
          WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
          backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
        }}
      >
        <div className="flex flex-col gap-8 w-full">
          
          {/* Header Branding Area with the Embedded Vector Logo */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.05]">
            <svg className="w-8 h-8 text-primary transition-colors duration-500" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M76 164 L112 74 C115 66, 125 66, 128 74 L140 104" stroke="currentColor" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M164 164 L120 54 L102 96" stroke="#FFFFFF" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M92 126 L148 126" stroke="currentColor" strokeWidth="16" strokeLinecap="round" opacity="0.8"/>
            </svg>
            <span className="text-xl font-black tracking-wider text-white font-headline">AXION</span>
          </div>

          {/* Navigation Button Menu Items Grid */}
          <nav className="flex flex-col gap-1.5 w-full">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-500 text-sm font-semibold tracking-wide border cursor-pointer relative group overflow-hidden ${
                    isActive 
                      ? 'bg-primary/15 border-primary/30 text-primary font-bold shadow-sm' 
                      : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Slow Accent Shift Highlights */}
                  {isActive && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-md animate-pulse" />
                  )}
                  <span className={`material-symbols-outlined text-[20px] transition-transform duration-500 group-hover:scale-105 ${isActive ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Minimalist Profile Footer Deck routing directly to Account settings */}
        <div className="border-t border-white/[0.05] pt-4 mt-auto w-full">
          <button 
            onClick={() => {
              setTab('account');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 p-2 rounded-xl border transition-all duration-500 cursor-pointer text-left hover:bg-white/[0.02] ${currentTab === 'account' ? 'bg-white/[0.04] border-white/10' : 'border-transparent'}`}
          >
            <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-black/40 shadow-inner flex items-center justify-center shrink-0">
               {profileImg ? (
                   <img src={profileImg} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
               ) : (
                   <span className="text-sm font-bold text-zinc-300 uppercase">
                     {userSettings.name ? userSettings.name.charAt(0).toUpperCase() : 'A'}
                   </span>
               )}
            </div>
            <div className="flex flex-col overflow-hidden">
               <span className="text-sm font-bold text-white tracking-tight truncate">
                 {userSettings.name || 'Set Profile Name'}
               </span>
               <span className="text-[11px] text-zinc-500 truncate font-medium">
                 {userSettings.className || 'Manage Account'}
               </span>
            </div>
          </button>
        </div>

      </aside>
    </>
  );
}
