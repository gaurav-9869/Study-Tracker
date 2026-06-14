import React, { useState, useEffect } from 'react';
import { LogItem, getFocusScore, getSubjectConfig, SubjectKey } from '../types';

interface AnalysisViewProps {
  loggedSessions: LogItem[];
}

export default function AnalysisView({ loggedSessions }: AnalysisViewProps) {
  const [insights, setInsights] = useState({
    frictionSpotlight: 'Click "Run Cognitive Analysis" to evaluate historical friction trends.',
    trendCalibration: 'Awaiting log matrix telemetry ingestion...',
    retentionAlerts: 'Awaiting historical score calibration checks...'
  });
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);

  // --- PRE-MADE CHART 1: SUBJECT DISTRIBUTION GRAPH MATH ---
  const subjectDistribution = { bio: 0, phys: 0, chem: 0, math: 0 };
  loggedSessions.forEach(log => {
    if (subjectDistribution[log.subject] !== undefined) {
      subjectDistribution[log.subject] += log.activeMins;
    }
  });
  const totalActiveMins = Object.values(subjectDistribution).reduce((a, b) => a + b, 0) || 1;

  // --- PRE-MADE CHART 2: FOCUS VS DISTRACTION RATIOS ---
  let totalStudy = 0, totalDistract = 0, totalRecover = 0;
  loggedSessions.forEach(log => {
    totalStudy += log.activeMins;
    totalDistract += log.distractionMins;
    totalRecover += log.recoveryMins;
  });
  const totalTimeMatrix = totalStudy + totalDistract + totalRecover || 1;

  // --- PRE-MADE CHART 3: PEAK PERFORMANCE HOURS BY TIME BLOCK ---
  // Simple mapping bucket system to evaluate time performance tags cleanly
  const hourBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const hourCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  
  loggedSessions.forEach(log => {
    const score = getFocusScore(log);
    // Simple mock heuristic split to simulate timeline variations based on log intervals
    const idNum = parseInt(log.id.replace(/\D/g, '')) || 12;
    const estimatedHour = idNum % 24;

    if (estimatedHour >= 5 && estimatedHour < 12) { hourBuckets.morning += score; hourCounts.morning++; }
    else if (estimatedHour >= 12 && estimatedHour < 17) { hourBuckets.afternoon += score; hourCounts.afternoon++; }
    else if (estimatedHour >= 17 && estimatedHour < 22) { hourBuckets.evening += score; hourCounts.evening++; }
    else { hourBuckets.night += score; hourCounts.night++; }
  });

  const avgHours = {
    morning: hourCounts.morning ? Math.round(hourBuckets.morning / hourCounts.morning) : 0,
    afternoon: hourCounts.afternoon ? Math.round(hourBuckets.afternoon / hourCounts.afternoon) : 0,
    evening: hourCounts.evening ? Math.round(hourBuckets.evening / hourCounts.evening) : 0,
    night: hourCounts.night ? Math.round(hourBuckets.night / hourCounts.night) : 0,
  };

  const handleRunLLMAnalysis = async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert("Please add your Gemini API Key in the Settings tab first.");
      return;
    }

    setIsRunningAnalysis(true);
    try {
      // Process minimal textual weight context matrix from 2-year archival schemas
      const structuralContextPayload = loggedSessions.map(l => ({
        subject: l.subject,
        topic: l.topic,
        type: l.sessionType,
        focus: getFocusScore(l),
        retention: l.retentionScore || 5,
        friction: l.frictionAnalysis || 'None'
      })).slice(-30); // Grab last 30 nodes for compact text balance window constraints

      const reqBody = {
        contents: [{
          parts: [{
            text: `Analyze this study log array history data: ${JSON.stringify(structuralContextPayload)}. 
            Identify patterns, recurring topics, and obstacles. 
            Output format MUST be raw JSON format matching this shape exactly: 
            { "frictionSpotlight": "string brief paragraph summary", "trendCalibration": "string brief paragraph summary", "retentionAlerts": "string brief paragraph summary" }`
          }]
        }]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanJson = JSON.parse(textResponse.replace(/```json|```/g, '').trim());

      setInsights({
        frictionSpotlight: cleanJson.frictionSpotlight || 'No clear structural bottlenecks discovered.',
        trendCalibration: cleanJson.trendCalibration || 'Focus levels are tracking normally.',
        retentionAlerts: cleanJson.retentionAlerts || 'No immediate repeat retention loops flagged.'
      });
    } catch (e) {
      alert("Cognitive analysis frame dropped. Verify your key structure or try re-running.");
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-ios-fade-in text-zinc-100 transition-all duration-500">
      
      {/* Top Pre-Made Graphic Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph 1: Subject Time Allocation Proportions */}
        <div className="ios-glass-panel p-5 flex flex-col gap-4" style={glassStyle}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2">Subject Distribution</h3>
          <div className="flex flex-col gap-3.5 justify-center h-full">
            {(['bio', 'phys', 'chem', 'math'] as SubjectKey[]).map(sub => {
              const config = getSubjectConfig(sub);
              const percentage = Math.round((subjectDistribution[sub] / totalActiveMins) * 100);
              return (
                <div key={sub} className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={config.text}>{config.name}</span>
                    <span className="font-mono text-zinc-400">{percentage}%</span>
                  </div>
                  <div className="w-full bg-black/30 h-2 border border-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-current rounded-full transition-all duration-1000" style={{ width: `${percentage}%`, color: config.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 2: Focus / Distraction Split Matrix */}
        <div className="ios-glass-panel p-5 flex flex-col gap-4" style={glassStyle}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2">Attention Ratio Profile</h3>
          <div className="flex items-center justify-center h-full gap-5">
            <div className="flex flex-col gap-2 text-xs font-medium w-full">
              <div className="flex items-center justify-between">
                <span className="text-primary flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Active Study</span>
                <span className="font-mono text-zinc-400">{Math.round((totalStudy / totalTimeMatrix) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-error flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" /> Distraction</span>
                <span className="font-mono text-zinc-400">{Math.round((totalDistract / totalTimeMatrix) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sky-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /> Recovery Break</span>
                <span className="font-mono text-zinc-400">{Math.round((totalRecover / totalTimeMatrix) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Graph 3: Peak Efficiency Velocity Hours Block */}
        <div className="ios-glass-panel p-5 flex flex-col gap-4" style={glassStyle}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2">Peak Velocity Hours</h3>
          <div className="grid grid-cols-4 gap-2 items-end h-32 pt-4">
            {Object.entries(avgHours).map(([block, val]) => (
              <div key={block} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-primary/20 border border-primary/30 rounded-t-lg transition-all duration-1000 relative group flex items-end justify-center" style={{ height: `${Math.max(val, 15)}%` }}>
                  <span className="absolute -top-6 text-[10px] font-mono font-bold text-primary">{val}%</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 truncate max-w-full">{block}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Cognitive Insights Control Center Block */}
      <div className="ios-glass-panel p-6 flex flex-col gap-6 w-full" style={glassStyle}>
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
            <h3 className="text-base font-bold text-white tracking-tight">Gemini Strategy Diagnostics</h3>
          </div>
          <button 
            onClick={handleRunLLMAnalysis} 
            disabled={isRunningAnalysis || loggedSessions.length === 0}
            className="px-5 py-2.5 bg-primary hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">autorenew</span>
            {isRunningAnalysis ? 'Compiling Archive Trends...' : 'Run Cognitive Analysis'}
          </button>
        </div>

        {/* Analytical Output Card Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          
          <div className="bg-black/15 border border-white/[0.04] p-4 rounded-xl flex flex-col gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">gavel</span> Friction Spotlight
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium mt-1">{insights.frictionSpotlight}</p>
          </div>

          <div className="bg-black/15 border border-white/[0.04] p-4 rounded-xl flex flex-col gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">trending_up</span> Trend Calibration
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium mt-1">{insights.trendCalibration}</p>
          </div>

          <div className="bg-black/15 border border-white/[0.04] p-4 rounded-xl flex flex-col gap-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">notification_important</span> Retention Alerts
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium mt-1">{insights.retentionAlerts}</p>
          </div>

        </div>
      </div>

    </div>
  );
}
