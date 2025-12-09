
import React, { useState, useRef, useEffect } from 'react';
import { generateBallisticAdvice } from '../services/geminiService';
import { BallisticInput, TrajectoryPoint, ChatMessage } from '../types';

interface Props {
  inputs: BallisticInput;
  data: TrajectoryPoint[];
}

export const AIAdvisor: React.FC<Props> = ({ inputs, data }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'I can analyze your Airsoft setup. Ask about best BB weight for your FPS, or how to adjust your hop-up for maximum range.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateBallisticAdvice(inputs, data, userMsg.text, messages);
    
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full bg-zinc-900 rounded-[2rem] flex flex-col border border-zinc-800 shadow-2xl overflow-hidden mb-24">
       <div className="p-5 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur sticky top-0 z-10">
        <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></span>
            Tactical Advisor
        </h3>
        <p className="text-[11px] text-zinc-500 ml-4 mt-0.5">Powered by Gemini AI</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-black/20" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-[14px] leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-amber-600 text-white rounded-br-sm' 
                : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex justify-start">
             <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-5 py-3 text-xs text-zinc-500 italic flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
               <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
             </div>
           </div>
        )}
      </div>

      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about range, wind, or ammo..."
            className="flex-1 bg-zinc-800 border-none rounded-full px-5 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none placeholder-zinc-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="w-11 h-11 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-black shadow-lg shadow-amber-900/30 disabled:opacity-50 transition-transform active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
