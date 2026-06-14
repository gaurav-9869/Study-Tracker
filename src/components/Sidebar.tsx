import React from 'react';
import { getSubjectConfig, SubjectKey } from '../types';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { id: 'command', icon: 'dashboard', label: 'Daily Tracker' },
    { id: 'archive', icon: 'history', label: 'History Archive' },
    { id: 'account', icon: 'settings', label: 'Settings' }
  ];

  // Helper to ensure we never crash when reading a subject name
  const safeSubjectName = (key: string | undefined) => {
      const config = getSubjectConfig(key);
      return config ? config.name : 'Unknown Subject';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="h-full flex flex-col ios-glass-panel rounded-none md:rounded-r-[32px] border-y-0 border-l-0 overflow-hidden">
          
          {/* Logo Header */}
          <div className="p-8 pb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/80 to-primary/20 flex items-center justify-center ios-glass-card-nested shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-xl tracking-tighter">A</span>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white/90">Axion</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Workspace</p>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden ml-auto text-white/50 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-white/10 text-white ios-glass-card-nested shadow-inner border border-white/5' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                    }`}
                >
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Status Footer */}
          <div className="p-6 mt-auto border-t border-white/5">
            <div className="flex items-center gap-3 ios-glass-card-nested p-3 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
              <span className="text-xs font-medium text-white/60 tracking-wider uppercase">System Active</span>
            </div>
          </div>

        </div>
      </aside>
    </>
  );
}
