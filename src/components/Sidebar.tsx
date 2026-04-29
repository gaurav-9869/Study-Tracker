import React from 'react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ currentTab, setTab, isOpen, setIsOpen }: SidebarProps) {
  const tabs = [
    { id: 'command', icon: 'dashboard', label: 'Command Center' },
    { id: 'archive', icon: 'history', label: 'Archive' }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 w-64 bg-surface-container-low border-r border-white/5 shadow-2xl z-[70] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-3xl">hub</span>
             <h2 className="font-headline font-bold text-xl text-on-surface">Study Tracker</h2>
          </div>
          <button 
            className="md:hidden text-on-surface-variant hover:text-on-surface cursor-pointer p-1"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close_fullscreen</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setTab(tab.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all cursor-pointer font-medium ${currentTab === tab.id ? 'bg-primary/20 text-primary-fixed shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
           <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-3 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => { setTab('account'); setIsOpen(false); }}>
               <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary-fixed">
                   A
               </div>
               <div>
                   <p className="text-sm font-semibold text-on-surface">User Profile</p>
                   <p className="text-xs text-on-surface-variant">View Account</p>
               </div>
           </div>
        </div>
      </aside>
    </>
  );
}
