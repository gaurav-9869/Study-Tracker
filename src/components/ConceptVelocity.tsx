import React from 'react';
import { LogItem } from '../types';

interface ConceptVelocityProps {
  loggedSessions: LogItem[];
}

const HARDCODED_TOPICS = [
  'Cell Cycle', 
  'Kinematics', 
  'Chemical Bonding', 
  'Calculus Fundamentals', 
  'Genetics', 
  'Thermodynamics', 
  'Atomic Structure'
];

export default function ConceptVelocity({ loggedSessions }: ConceptVelocityProps) {
  // Aggregate unique topics that match the syllabus array
  const masteredTopics = new Set<string>();
  
  loggedSessions.forEach(log => {
      // Very simple matching check
      const logTopicNormal = log.topic.toLowerCase().trim();
      HARDCODED_TOPICS.forEach(t => {
          if (t.toLowerCase() === logTopicNormal) {
              masteredTopics.add(t);
          }
      });
  });

  const total = HARDCODED_TOPICS.length;
  const current = masteredTopics.size;
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <section className="w-full fade-in">
        <h2 className="font-headline text-headline-md text-on-surface font-bold mb-6">Concept Velocity Dashboard</h2>
        
        <div className="glass-panel ghost-border p-8 flex flex-col gap-6 bg-surface-container-low max-w-2xl">
           <div className="flex justify-between items-end">
               <div>
                  <h3 className="text-xl font-headline font-bold text-on-surface">High-Yield Topics Mastered</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">Syllabus Completion</p>
               </div>
               <span className="text-3xl font-black text-primary">{current} <span className="text-xl text-on-surface-variant font-medium">/ {total}</span></span>
           </div>

           <div className="w-full h-4 bg-surface-container-lowest rounded-full overflow-hidden shadow-inner border border-white/5">
                <div 
                    className="h-full bg-gradient-to-r from-primary to-tertiary-container transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${percentage}%` }}
                ></div>
           </div>
           
           <div className="flex gap-2 flex-wrap mt-2">
               {HARDCODED_TOPICS.map(topic => {
                   const isMastered = masteredTopics.has(topic);
                   return (
                       <span key={topic} className={`text-xs px-3 py-1.5 rounded-md font-medium border ${isMastered ? 'bg-primary/20 text-primary border-primary/30' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 opacity-50'}`}>
                           {topic}
                       </span>
                   )
               })}
           </div>
        </div>
    </section>
  );
}
