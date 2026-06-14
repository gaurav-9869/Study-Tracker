import React, { useState, useRef, useEffect } from 'react';
import { PlanItem, LogItem, getSubjectConfig } from '../types';

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

  // Auto-scroll context to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Adjust textarea frame height dynamically based on typed text volume
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
        You are a supportive, direct personal study assistant. Talk naturally like a helpful classmate—never use complex technical jargon or rigid "AI phrases."
        
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

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });

      if (!res.ok) throw new Error(`Network response error: ${res.status}`);

      const data = await res.json();
      let assistantText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request. Let's try again.";

      // --- ROBUST INTERCEPTION PIPELINE: Prevents Structural JSON Crashes ---
      const jsonRegex = /:::(.*?):::/s;
      const match = assistantText.match(jsonRegex);

      if (match && match[1]) {
        try {
          const commandData = JSON.parse(match[1].trim());
          
          // Execute commands clean and transparently
          if (commandData.command === 'add_plan') {
             const newPlan: PlanItem = {
                 id: nanoid(),
                 subject: commandData.subject || 'bio',
                 topic: commandData.topic || 'Untitled Topic',
                 sessionType: 'Study',
                 targetUnits: commandData.units || 0,
                 targetMins: commandData.mins || 0
             };
             setMorningPlan(prev => [...prev, newPlan]);
          }

          // Clean command markers out of conversational view bubble text
          assistantText = assistantText.replace(jsonRegex, '').trim();
        } catch (jsonErr) {
          console.error("Pipeline text extraction bypass triggered", jsonErr);
        }
      }

      setMessages(prev => [...prev, { sender: 'assistant', text: assistantText }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', text: "Sorry, the network connection dropped. Please double-check your key or try rephrasing your message." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Bubble */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-50"
      >
        <span className="material-symbols-outlined text-[24px]">{isOpen ? 'close' : 'chat_bubble'}</span>
      </button>

      {/* Slide-out Glass Chat Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[500px] ios-glass-panel flex flex-col overflow-hidden z-50 animate-ios-fade-in bg-opacity-80">
          
          {/* Header Panel */}
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Study Assistant</h3>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white ml-auto rounded-tr-none shadow-md' 
                    : 'bg-white/5 text-zinc-200 mr-auto rounded-tl-none border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white/5 text-zinc-400 mr-auto rounded-2xl rounded-tl-none border border-white/5 p-3.5 text-xs font-medium flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                 <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Smart Expanding Input Tray */}
          <div className="p-3 border-t border-white/5 bg-black/20 flex items-end gap-2">
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
              className="flex-1 bg-black/40 border border-white/5 focus:border-primary/40 rounded-xl px-3.5 py-2.5 text-sm outline-none text-white transition-colors resize-none font-medium max-h-[140px] leading-normal"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-primary disabled:opacity-30 disabled:scale-100 text-white rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>

        </div>
      )}
    </>
  );
}
