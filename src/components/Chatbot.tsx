import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { nanoid } from 'nanoid';
import { PlanItem, LogItem } from '../types';

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
      <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-3 px-5 pr-12 text-sm text-on-surface outline-none" placeholder="Command the system..." />
      <button disabled={!chatInput.trim()} type="submit" className="absolute right-2 w-8 h-8 flex items-center justify-center bg-primary text-on-primary-fixed rounded-full transition-all"><span className="material-symbols-outlined text-[18px]">arrow_upward</span></button>
    </form>
  );
});

export default function Chatbot({ morningPlan, setMorningPlan, loggedSessions, setLoggedSessions }: ChatbotProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
      { role: 'assistant', text: "Systems online. Log study blocks, assign revisions, or query performance metrics directly." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const handleChatSuggest = async (text: string) => {
     setChatMessages(prev => [...prev, { role: 'user', text }]);
     
     const apiKey = localStorage.getItem('gemini_api_key');
     if (!apiKey) {
         setChatMessages(prev => [...prev, { role: 'assistant', text: "Error: Configure your Google AI Studio API key in the profile tab to enable chat pipelines." }]);
         return;
     }

     try {
         const ai = new GoogleGenAI({ apiKey });
         const systemInstruction = `You are the backend operational core of a custom PCBM Study Tracker app.
Analyze user text input and output data mutations exclusively inside a structured block parsing template using this precise configuration layout:

:::JSON_MUTATION
{
  "actions": [
     {
       "type": "ADD_PLAN" | "ADD_LOG",
       "payload": {
          "subject": "bio" | "phys" | "chem" | "math",
          "topic": "string",
          "sessionType": "Study" | "Revise" | "Exercise",
          "revisionType": "Quick Recap" | "Standard Review" | "Deep Dive" | null,
          "activeMins": number,
          "distractionMins": number,
          "recoveryMins": number,
          "startPage": number | null,
          "endPage": number | null,
          "vsaCount": number | null,
          "saCount": number | null,
          "laCount": number | null,
          "retentionScore": number,
          "frictionAnalysis": "string",
          "notes": "string"
       }
     }
  ],
  "reply": "Your conversational summary response here."
}
:::`;

         const response = await ai.models.generateContent({
             model: 'gemini-1.5-flash',
             contents: `Context arrays:\nMorning Plan: ${JSON.stringify(morningPlan)}\nLogs: ${JSON.stringify(loggedSessions)}\n\nUser text input query:\n"${text}"`,
             config: { systemInstruction }
         });

         const resText = response.text || '';
         if (resText.includes(':::JSON_MUTATION')) {
             const jsonStr = resText.split(':::JSON_MUTATION')[1].split(':::')[0].trim();
             const parsed = JSON.parse(jsonStr);
             
             if (parsed.actions && Array.isArray(parsed.actions)) {
                 parsed.actions.forEach((act: any) => {
                     if (act.type === 'ADD_PLAN') {
                         setMorningPlan(p => [...p, { id: nanoid(), ...act.payload }]);
                     } else if (act.type === 'ADD_LOG') {
                         setLoggedSessions(l => [...l, {
                             id: nanoid(),
                             associatedPlanId: act.payload.planId || undefined,
                             subject: act.payload.subject || 'bio',
                             topic: act.payload.topic || 'General Documentation',
                             sessionType: act.payload.sessionType || 'Study',
                             revisionType: act.payload.revisionType || undefined,
                             activeMins: Number(act.payload.activeMins) || 0,
                             distractionMins: Number(act.payload.distractionMins) || 0,
                             recoveryMins: Number(act.payload.recoveryMins) || 0,
                             startPage: act.payload.startPage ? Number(act.payload.startPage) : undefined,
                             endPage: act.payload.endPage ? Number(act.payload.endPage) : undefined,
                             vsaCount: act.payload.vsaCount ? Number(act.payload.vsaCount) : undefined,
                             saCount: act.payload.saCount ? Number(act.payload.saCount) : undefined,
                             laCount: act.payload.laCount ? Number(act.payload.laCount) : undefined,
                             retentionScore: act.payload.retentionScore ? Number(act.payload.retentionScore) : 5,
                             frictionAnalysis: act.payload.frictionAnalysis || 'No major friction logged.',
                             notes: act.payload.notes || '',
                             synced: false
                         }]);
                     }
                 });
             }
             setChatMessages(prev => [...prev, { role: 'assistant', text: parsed.reply || "Operations handled successfully." }]);
         } else {
             setChatMessages(prev => [...prev, { role: 'assistant', text: resText }]);
         }
     } catch (err) {
         setChatMessages(prev => [...prev, { role: 'assistant', text: "Internal processing pipeline breakdown." }]);
     }
  };

  return (
    <>
      <div className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 w-[92vw] md:w-96 h-[500px] bg-surface-container border border-white/10 rounded-3xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${chatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 bg-surface-container-low border-b border-white/5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2"> 
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-headline font-bold text-sm text-on-surface">AI Assistant Engine</h3>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors" onClick={() => setChatOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
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

      <button onClick={() => setChatOpen(!chatOpen)} className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary-fixed shadow-md flex items-center justify-center fixed bottom-6 right-6 z-40 transition-all">
         <span className="material-symbols-outlined text-2xl">{chatOpen ? 'forum' : 'smart_toy'}</span>
      </button>
    </>
  );
}

