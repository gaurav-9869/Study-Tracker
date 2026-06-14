import React from 'react';

interface SettingsViewProps {
  glassBlur: number;
  setGlassBlur: (v: number) => void;
  glassOpacity: number;
  setGlassOpacity: (v: number) => void;
}

export default function SettingsView({ glassBlur, setGlassBlur, glassOpacity, setGlassOpacity }: SettingsViewProps) {
  
  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    if (url) {
      localStorage.setItem('custom_wallpaper_url', url);
      // Trigger live refresh across the background canvas DOM node
      const root = document.documentElement;
      root.style.setProperty('--wallpaper-url', `url(${url})`);
      
      // Attempt color extraction handshake across the new target file
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 10;
          canvas.height = 10;
          ctx.drawImage(img, 0, 0, 10, 10);
          try {
            const rgb = ctx.getImageData(5, 5, 1, 1).data;
            const extractedHex = `#${rgb[0].toString(16).padStart(2,'0')}${rgb[1].toString(16).padStart(2,'0')}${rgb[2].toString(16).padStart(2,'0')}`;
            if (rgb[0] > 30 || rgb[1] > 30) {
              root.style.setProperty('--theme-primary', extractedHex);
              localStorage.setItem('custom_wallpaper_color', extractedHex);
            }
          } catch (err) {}
        }
      };
      img.src = url;
    }
  };

  const clearWallpaper = () => {
    localStorage.removeItem('custom_wallpaper_url');
    localStorage.removeItem('custom_wallpaper_color');
    const root = document.documentElement;
    root.style.setProperty('--wallpaper-url', 'radial-gradient(circle at top left, #1c1917 0%, #070a12 100%)');
    root.style.setProperty('--theme-primary', '#10B981');
    alert("Wallpaper configurations reset to clean baseline style.");
  };

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <div className="ios-glass-panel p-6 flex flex-col gap-6 w-full max-w-2xl mx-auto animate-ios-fade-in text-zinc-100" style={glassStyle}>
      
      <div className="border-b border-white/5 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">palette</span>
          Appearance Settings
        </h3>
      </div>

      {/* Wallpaper Input Form */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Custom Background Wallpaper URL</label>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Paste direct high-res link image path..." 
            onChange={handleWallpaperChange}
            className="flex-1 ios-glass-input px-4 py-3 text-sm rounded-xl bg-black/10 border-white/[0.06] outline-none text-white focus:border-primary/30"
          />
          <button 
            onClick={clearWallpaper}
            className="px-4 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Frosted Background Blur Slider Matrix */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Background Blur Depth</label>
          <span className="text-xs font-mono font-bold text-primary">{glassBlur}px</span>
        </div>
        <input 
          type="range" min="0" max="40" step="2"
          value={glassBlur}
          onChange={(e) => setGlassBlur(Number(e.target.value))}
          className="w-full accent-primary h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Dynamic Panel Opacity Controller */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Panel Transparency Opacity</label>
          <span className="text-xs font-mono font-bold text-primary">{Math.round(glassOpacity * 100)}%</span>
        </div>
        <input 
          type="range" min="0.10" max="0.85" step="0.05"
          value={glassOpacity}
          onChange={(e) => setGlassOpacity(Number(e.target.value))}
          className="w-full accent-primary h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
      </div>

    </div>
  );
}
