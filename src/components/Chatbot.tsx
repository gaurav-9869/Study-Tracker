import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { nanoid } from 'nanoid';
import { PlanItem, LogItem, getLocalDateString } from '../types';

interface ChatbotProps {
  morningPlan: PlanItem[];
  setMorningPlan: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  loggedSessions: LogItem[];
  setLoggedSessions: React.Dispatch<React.SetStateAction<LogItem[]>>;
}

const ChatInputBox = React.memo(({ onSend }: { onSend: (text: string) => void }) => {
  const [chatInput, setChatInput] = useState('');
  
  return (
    <form onSubmit={e => { e.preventDefault(); if (chatInput.trim()) { onSend(chatInput); setChatInput(''); } }} className="relative flex items-center">
      <input 
        type="text" 
        value={chatInput}
        onChange={e => setChatInput(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-3 px-5 pr-12 text-sm text-on-surface focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-on-surface-variant/40 font-body" 
        placeholder="Command the system..." />
      <button disabled={!chatInput.trim()} type="submit" className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary text-on-primary-fixed rounded-full hover:shadow-[0_0_15px_rgba(0,191,255,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <span className="material-symbols-outlined text-[18px]">send</span>
      </button>
    </form>
  );
});

export default function Chatbot({ morningPlan, setMorningPlan, loggedSessions, setLoggedSessions }: ChatbotProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
      {role: 'assistant', text: 'Greetings, Commander. I can help you plan your sessions. Try saying "Study Physics for 45 mins" or "Log 40 mins of Chemistry".'}
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleChatSuggest = async (input: string) => {
    setChatMessages(prev => [...prev, {role: 'user', text: input}]);
    
    try {
        const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `You are the Aetheric Assistant for a student's PCBM (Physics, Chemistry, Biology, Math) study Command Center.
Current Date: ${getLocalDateString(0)}
Current Plan: ${JSON.stringify(morningPlan.map(p => ({id: p.id, subject: p.subject, topic: p.topic})))}
Current Logs: ${JSON.stringify(loggedSessions.map(l => ({subject: l.subject, topic: l.topic})))}

When the user asks you to plan or log, extract actions. 
Valid Subjects: "bio", "phys", "chem", "math".
Valid Types: "Study (SR)", "Exercise (No SR)", "Revision (No SR)".

Return exactly a JSON block wrapped in \`\`\`json \`\`\` with schema:
{
  "actions": [
    { "type": "ADD_PLAN", "subject": "phys", "topic": "Topic", "sessionType": "Study (SR)", "targetUnits": 0, "targetMins": 45 },
    { "type": "ADD_LOG", "planId": "id-if-match-found-in-plan", "subject": "bio", "topic": "Topic", "sessionType": "Revision (No SR)", "activeMins": 30, "distractionMins": 0, "recoveryMins": 0, "notes": "..." }
  ],
  "reply": "Message to show user"
}
If no action, send {"actions": [], "reply": "response"}. User input: "${input}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        const text = response.text || '';
        const match = text.match(/```json([\s\S]*?)```/);
        let replyText = "Processed your command.";
        
        if (match) {
            const parsed = JSON.parse(match[1]);
            replyText = parsed.reply || replyText;
            
            if (parsed.actions && parsed.actions.length > 0) {
                parsed.actions.forEach((act: any) => {
                    if (act.type === 'ADD_PLAN') {
                        setMorningPlan(prev => [...prev, {
                            id: nanoid(),
                            subject: act.subject || 'bio',
                            topic: act.topic || 'Untitled',
                            sessionType: act.sessionType || 'Study (SR)',
                            targetUnits: Number(act.targetUnits) || 0,
                            targetMins: Number(act.targetMins) || 0
                        }]);
                    } else if (act.type === 'ADD_LOG') {
                        setLoggedSessions(prev => [...prev, {
                            id: nanoid(),
                            planId: act.planId || undefined,
                            subject: act.subject || 'bio',
                            topic: act.topic || 'Untitled',
                            sessionType: act.sessionType || 'Study (SR)',
                            activeMins: Number(act.activeMins) || 0,
                            distractionMins: Number(act.distractionMins) || 0,
                            recoveryMins: Number(act.recoveryMins) || 0,
                            notes: act.notes || '',
                            isMissed: false
                        }]);
                    }
                });
            }
        } else {
            replyText = text;
        }
        setChatMessages(prev => [...prev, {role: 'assistant', text: replyText}]);

    } catch(err: any) {
        setChatMessages(prev => [...prev, {role: 'assistant', text: `Error: ${err.message}. Ensure your Gemini API Key is saved in the Account tab.`}]);
    }
  };

  return (
    <div className="fixed bottom-28 md:bottom-8 right-6 z-[60] flex flex-col items-end gap-4">
      <div className={`w-[350px] max-w-[90vw] h-[500px] glass-panel bg-surface-container-high border border-white/10 shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-4 duration-300 ${chatOpen ? '' : 'hidden'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-headline font-bold text-on-surface">Aetheric Assistant</h3>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors" onClick={() => setChatOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-body">
          {chatMessages.map((msg, i) => (
              <div key={i} className={`max-w-[80%] p-3 rounded-2xl border ${msg.role === 'assistant' ? 'self-start bg-surface-container-lowest border-white/5 rounded-tl-none' : 'self-end bg-primary/20 border-primary/20 rounded-tr-none'}`}>
                <p className="text-sm text-on-surface-variant whitespace-pre-line">{msg.text}</p>
              </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-surface-container-lowest/50 border-t border-white/10">
          <ChatInputBox onSend={handleChatSuggest} />
        </div>
      </div>

      <button 
         onClick={() => setChatOpen(!chatOpen)}
         className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary-fixed shadow-[0_8px_32px_rgba(0,191,255,0.3)] hover:shadow-[0_8px_40px_rgba(0,191,255,0.5)] hover:scale-105 transition-all flex items-center justify-center active:scale-95 group cursor-pointer">
        <span className="material-symbols-outlined text-[28px] group-hover:rotate-12 transition-transform">smart_toy</span>
      </button>
    </div>
  );
}
