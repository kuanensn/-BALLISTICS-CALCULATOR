import React, { useState, useMemo } from 'react';
import { BallisticForm } from './components/BallisticForm';
import { BallisticTable } from './components/BallisticTable';
import { BallisticChart } from './components/BallisticChart';
import { MuzzleControl } from './components/MuzzleControl';
import { DEFAULT_INPUTS } from './constants';
import { calculateAirsoftTrajectory } from './services/physicsEngine';
import { BallisticInput } from './types';

enum Tab {
  SIMULATE = 'Simulate',
  DATA = 'Data',
  TEAM = 'Team'
}

function App() {
  const [inputs, setInputs] = useState<BallisticInput>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SIMULATE);
  
  const results = useMemo(() => calculateAirsoftTrajectory(inputs), [inputs]);
  const mainResult = results[1];

  return (
    <div className="min-h-screen bg-black flex justify-center lg:py-10 text-white font-sans overflow-hidden">
      
      {/* Main Mobile Container */}
      <div className="w-full lg:max-w-[400px] lg:h-[850px] h-[100dvh] bg-black relative flex flex-col lg:rounded-[3rem] lg:border-[8px] lg:border-[#1c1c1e] overflow-hidden lg:shadow-2xl">
        
        {/* iOS Header */}
        <header className="pt-14 pb-4 px-5 bg-black/80 backdrop-blur-xl sticky top-0 z-50 border-b border-white/10">
            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-graffiti text-red-600 leading-none">
                        MAGA <span className="text-white">STUDIO</span>
                    </h1>
                    <span className="text-[11px] font-bold text-zinc-500 tracking-[0.2em] mt-1 font-tactical uppercase">
                        彈道計算器 BALLISTICS CALCULATOR
                    </span>
                </div>
                
                {/* Energy Badge */}
                <div className="flex flex-col items-end">
                     <span className="text-[10px] text-zinc-500 uppercase font-bold mb-0.5 font-tactical">Muzzle Energy</span>
                    <div className="px-6 py-2 min-w-[140px] justify-center bg-[#1c1c1e] rounded-xl flex items-baseline gap-1.5 shadow-inner border border-white/5">
                        <span className="text-3xl font-bold text-white font-tactical leading-none tracking-wide">{mainResult.muzzleEnergy.toFixed(2)}</span>
                        <span className="text-xl text-red-600 font-tactical font-medium">J</span>
                    </div>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col bg-black">
            
            {activeTab === Tab.SIMULATE && (
                <div className="flex flex-col gap-6 pb-32 pt-2 animate-fade-in">
                    <MuzzleControl inputs={inputs} onChange={setInputs} />
                    <BallisticChart results={results} targetSize={inputs.targetSize} shooterHeight={inputs.shooterHeight} />
                    <BallisticForm inputs={inputs} onChange={setInputs} />
                </div>
            )}

            {activeTab === Tab.DATA && (
                <div className="flex-1 flex flex-col animate-fade-in h-full pb-24">
                    <BallisticTable result={mainResult} />
                </div>
            )}

            {activeTab === Tab.TEAM && (
                <div className="p-6 h-full animate-fade-in flex flex-col items-center justify-center pb-32">
                    <div className="w-full bg-[#1c1c1e] rounded-3xl p-8 flex flex-col items-center text-center shadow-lg">
                        <div className="w-24 h-24 rounded-full bg-black mb-6 overflow-hidden border-2 border-white/10 flex flex-col items-center justify-center shadow-lg shadow-red-900/20">
                            <h1 className="text-xl font-graffiti text-red-600 leading-none">
                                MAGA
                            </h1>
                            <span className="text-[10px] font-graffiti text-white leading-none mt-1">
                                STUDIO
                            </span>
                        </div>
                        
                        <h4 className="text-2xl font-bold text-white mb-1 font-tactical tracking-wide">Oscar Kuan</h4>
                        <span className="text-xs text-red-500 font-bold uppercase tracking-widest mb-6">Lead Developer</span>
                        
                        <a href="mailto:oscardevtsix@gmail.com" className="w-full bg-[#2c2c2e] text-zinc-300 text-xs py-3 rounded-xl font-medium hover:bg-[#3a3a3c] transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            oscardevtsix@gmail.com
                        </a>
                        
                        <div className="mt-8 pt-6 border-t border-white/5 w-full">
                             <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">MAGA STUDIO &copy; 2025</p>
                        </div>
                    </div>
                </div>
            )}

        </main>

        {/* iOS Tab Bar */}
        <nav className="absolute bottom-0 w-full bg-black/85 backdrop-blur-md border-t border-white/10 pb-8 pt-2 px-6 z-50">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setActiveTab(Tab.SIMULATE)}
                    className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                        activeTab === Tab.SIMULATE ? 'text-red-500' : 'text-zinc-500'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-[10px] font-medium">Simulate</span>
                </button>

                <button
                    onClick={() => setActiveTab(Tab.DATA)}
                    className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                        activeTab === Tab.DATA ? 'text-red-500' : 'text-zinc-500'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-medium">Data</span>
                </button>

                <button
                    onClick={() => setActiveTab(Tab.TEAM)}
                    className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-colors ${
                        activeTab === Tab.TEAM ? 'text-red-500' : 'text-zinc-500'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-[10px] font-medium">Team</span>
                </button>
            </div>
        </nav>
      </div>
    </div>
  );
}

export default App;