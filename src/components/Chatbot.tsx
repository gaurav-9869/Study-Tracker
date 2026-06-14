import React, { useState, useRef, useEffect } from 'react';
import { PlanItem, LogItem } from '../types';
import { nanoid } from 'nanoid'; // Added missing import to fix compilation crash

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
    { sender: 'assistant', text: 'Hi! I can help you quickly adjust your study plans or organize your logs. Just type or paste your notes here.' }
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
      alert("Please add your Gemini API Key in the Settings tab first.");
      return;
    }

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const contextPrompt = `
        You are Axion AI, a supportive, direct personal learning strategist. Talk naturally like a helpful classmate—never use complex technical jargon or rigid "AI phrases."
        
        Current context status:
        - Planned items: ${JSON.stringify(morningPlan)}
        - Completed session records: ${JSON.stringify(loggedSessions)}

        Capabilities:
        You can help the user organize their day or log metrics. If they describe a task to add or log, reply normally, but you MUST also add a raw JSON block at the very end of your response so the app can update the form values automatically.

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

      // Updated endpoint to secure stable production handshakes
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) throw new Error(`Network response error: ${res.status}`);

      const data = await res.json();
      let assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request. Let's try again.";

      const jsonRegex = /:::(.*?):::/s;
      const match = assistantText.match(jsonRegex);

      if (match && match[1]) {
        try {
          const commandData = JSON.parse(match[1].trim());
          
          if (commandData.command === 'add_plan') {
             const newPlan: PlanItem = {
                 id: nanoid(),
                 subject: commandData.subject || 'bio',
                 topic: commandData.topic || 'Untitled Topic',
                 sessionType: 'Study',
                 targetMins: commandData.mins || 45,
                 status: 'pending'
             };
             setMorningPlan(prev => [...prev, newPlan]);
          }

          assistantText = assistantText.replace(jsonRegex, '').trim();
        } catch (jsonErr) {
          console.error("Pipeline text extraction bypass triggered", jsonErr);
        }
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: assistantText }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', text: "The network connection dropped. Please double-check your key or try rephrasing your message." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const glassStyle = {
    backdropFilter: 'blur(var(--glass-blur, 24px))',
    WebkitBackdropFilter: 'blur(var(--glass-blur, 24px))',
    backgroundColor: 'rgba(10, 15, 24, var(--glass-opacity, 0.45))'
  };

  return (
    <>
      {/* Floating Chat Trigger Bubble Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-[80] border border-white/10"
        >
          <span className="material-symbols-outlined text-[24px]">psychology</span>
        </button>
      )}

      {/* Slide-out Glass Chat Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] flex flex-col overflow-hidden z-[80] rounded-2xl border border-white/[0.06] shadow-2xl animate-ios-fade-in" style={glassStyle}>
          
          {/* Header Panel Bar */}
          <div className="px-4 py-3.5 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Axion Assistant
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-black/10">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary/20 text-primary ml-auto rounded-tr-none border border-primary/20' 
                    : 'bg-white/5 text-zinc-300 mr-auto rounded-tl-none border border-white/[0.04]'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white/5 text-zinc-500 mr-auto rounded-2xl rounded-tl-none px-4 py-2.5 text-xs font-medium animate-pulse border border-white/[0.04]">
                Thinking...
              </div>
            )}
          </div>

          {/* Smart Expanding Input Tray */}
          <div className="p-3 bg-black/20 border-t border-white/5 flex items-end gap-2">
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
              placeholder="Ask a question or adjust your dashboard..."
              className="flex-1 bg-black/20 border border-white/[0.06] text-white text-xs px-4 py-3 rounded-xl outline-none focus:border-primary/40 placeholder:text-zinc-600 font-medium resize-none max-h-[140px] leading-normal"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-primary disabled:opacity-40 text-white rounded-xl shadow-md cursor-pointer flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>

        </div>
      )}
    </>
  );
}
