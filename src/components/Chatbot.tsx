import React, { useState, useRef, useEffect } from 'react';
import { PlanItem, LogItem, getSubjectConfig } from '../types';
import { nanoid } from 'nanoid'; // Goal #12: Added missing import to fix unhandled reference crash!

interface ChatbotProps {
  morningPlan: PlanItem[];
  setMorningPlan: React.Dispatch<React.SetStateAction<PlanItem[]>>;
  loggedSessions: LogItem[];
  setLoggedSessions: React.Dispatch<React.SetStateAction<LogItem[]>>;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
}

export default function Chatbot({ morningPlan, setMorningPlan, loggedSessions, setLoggedSessions }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'assistant', text: "Hi! I can help you adjust your tracker plans or summarize your history logs. Type or paste your study notes here." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert("Please add your Gemini API Key inside your Account profile settings first.");
      return;
    }

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const contextPrompt = `
        You are a supportive, direct personal study assistant. Talk naturally like a helpful classmate—never use complex technical jargon or rigid "AI phrases".
        
        Current context status:
        - Planned items: ${JSON.stringify(morningPlan)}
        - Completed session records: ${JSON.stringify(loggedSessions)}

        Capabilities:
        You can help organize timelines or log metrics. If the user describes a task to add or log, reply normally, but you MUST also add a raw JSON block at the very end of your response so the app can update the form values automatically.

        JSON commands options (only include if requested by user text):
        To add a plan: :::{"command": "add_plan", "subject": "bio"|"phys"|"chem"|"math", "topic": "string", "mins": number, "units": number}:::
        To update a log: :::{"command": "add_log", "subject": "bio"|"phys"|"chem"|"math", "topic": "string", "activeMins": number, "distractionMins": number, "startPage": number, "endPage": number}:::

        Keep responses conversational, concise, and focused.
      `;

      const reqBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${contextPrompt}\n\nUser request: "${userText}"` }]
          }
        ]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) throw new Error(`Status: ${res.status}`);

      const data = await res.json();
      let assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's try rephrasing that request.";

      // Text parsing gate
      const jsonRegex = /:::(.*?):::/s;
      const match = assistantText.match(jsonRegex);

      if (match && match[1]) {
        try {
          const commandData = JSON.parse(match[1].trim());
          
          if (commandData.command === 'add_plan') {
             const newPlan: PlanItem = {
                 id: nanoid(),
                 subject: commandData.subject || 'bio',
                 topic: commandData.topic || 'Untitled Entry',
                 sessionType: 'Study',
                 targetUnits: commandData.units || 0,
                 targetMins: commandData.mins || 0,
                 status: 'pending'
             };
             setMorningPlan(prev => [...prev, newPlan]);
          }
          assistantText = assistantText.replace(jsonRegex, '').trim();
        } catch (jsonErr) {
          console.error("JSON bypass handled", jsonErr);
        }
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: assistantText }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', text: "Connection anomaly encountered. Please check your API key or rephrase your input sentence." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Goal #12: Primary circle matches your dynamic wallpaper extracted tone accent dynamically */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-50"
        style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}
      >
        <span className="material-symbols-outlined text-[24px]">{isOpen ? 'close' : 'chat_bubble'}</span>
      </button>

      {/* Goal #7 & #8: Tint-free neutral glass modal panel container */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[480px] bg-black/40 backdrop-blur-md border border-white/10 flex flex-col overflow-hidden z-50 rounded-[28px] shadow-2xl">
          
          {/* Goal #13: Pruned away redundant labels. Clean header alignment */}
          <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}></span>
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Assistant Node</h3>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[82%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'text-white ml-auto rounded-tr-none shadow-md' 
                    : 'bg-black/20 text-zinc-200 mr-auto rounded-tl-none border border-white/5'
                }`}
                style={{ backgroundColor: msg.sender === 'user' ? 'var(--theme-primary, #10B981)' : undefined }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-black/20 text-zinc-500 mr-auto rounded-2xl rounded-tl-none border border-white/5 p-3 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-black/20 flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message..."
              className="flex-1 bg-black/40 border border-white/10 focus:border-white/20 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition-colors resize-none font-medium max-h-[120px] leading-normal"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2.5 text-white rounded-xl shadow-md disabled:opacity-30 transition-all cursor-pointer flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--theme-primary, #10B981)' }}
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </div>

        </div>
      )}
    </>
  );
}
