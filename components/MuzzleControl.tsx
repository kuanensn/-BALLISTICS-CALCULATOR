import React from 'react';
import { BallisticInput } from '../types';

interface Props {
  inputs: BallisticInput;
  onChange: (newInputs: BallisticInput) => void;
}

const STANDARD_WEIGHTS = [0.20, 0.25, 0.28, 0.30, 0.32, 0.36, 0.40, 0.43, 0.45, 0.48];

const IOSSection = ({ title, children }: { title?: string, children?: React.ReactNode }) => (
  <div className="mb-6 px-4">
    {title && (
        <h3 className="text-zinc-500 text-[13px] uppercase font-medium ml-4 mb-2 tracking-wide font-tactical">{title}</h3>
    )}
    <div className="bg-[#1c1c1e] rounded-[14px] overflow-hidden">
      {children}
    </div>
  </div>
);

const IOSRow = ({ 
  label, 
  value, 
  children, 
  last = false,
  subLabel
}: { 
  label: string, 
  value?: string | number, 
  children?: React.ReactNode, 
  last?: boolean,
  subLabel?: string
}) => (
  <div className={`flex items-center justify-between p-4 bg-[#1c1c1e] ${!last ? 'border-b border-white/10' : ''}`}>
    <div className="flex flex-col justify-center">
        <span className="text-white text-[15px] font-medium">{label}</span>
        {subLabel && <span className="text-zinc-500 text-[11px] leading-tight mt-0.5">{subLabel}</span>}
    </div>
    <div className="flex items-center gap-3">
      {value !== undefined && <span className="text-zinc-400 text-[15px]">{value}</span>}
      {children}
    </div>
  </div>
);

export const MuzzleControl: React.FC<Props> = ({ inputs, onChange }) => {
  const update = (field: keyof BallisticInput, value: any) => {
    onChange({ ...inputs, [field]: value });
  };

  const toggleUnit = (toMetric: boolean) => {
    if (inputs.isMetric === toMetric) return;
    
    const newVelocity = toMetric 
      ? inputs.velocity * 0.3048 
      : inputs.velocity / 0.3048; 
    
    onChange({
      ...inputs,
      isMetric: toMetric,
      velocity: parseFloat(newVelocity.toFixed(1))
    });
  };

  const convertedValue = inputs.isMetric 
    ? Math.round(inputs.velocity / 0.3048) 
    : Math.round(inputs.velocity * 0.3048); 
  
  const convertedUnit = inputs.isMetric ? 'FPS' : 'm/s';

  return (
    <div className="pt-4">
      <IOSSection title="Weapon System / 系統設定">
        <IOSRow label="Unit / 單位" last={false}>
          <div className="flex bg-[#2c2c2e] rounded-lg p-0.5">
             <button 
                onClick={() => toggleUnit(false)}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-[6px] transition-all ${!inputs.isMetric ? 'bg-[#636366] text-white shadow-sm' : 'text-zinc-400'}`}
             >FPS</button>
             <button 
                onClick={() => toggleUnit(true)}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-[6px] transition-all ${inputs.isMetric ? 'bg-[#636366] text-white shadow-sm' : 'text-zinc-400'}`}
             >M/S</button>
          </div>
        </IOSRow>
        
        <IOSRow label="Velocity / 初速">
            <div className="flex flex-col items-end">
                <input 
                    type="number" 
                    value={inputs.velocity}
                    onChange={(e) => update('velocity', parseFloat(e.target.value))}
                    className="bg-transparent text-right text-red-500 font-bold w-24 outline-none text-xl placeholder-zinc-700"
                />
                <span className="text-zinc-500 text-[11px] font-medium mt-1">
                    ≈ {convertedValue} {convertedUnit}
                </span>
            </div>
        </IOSRow>

        <div className="p-4 bg-[#1c1c1e]">
             <div className="flex justify-between mb-3 items-end">
                <span className="text-white font-medium text-[15px]">Ammo Weight / 彈重</span>
                <span className="text-zinc-400 font-bold text-sm">{inputs.bulletWeight.toFixed(2)}g</span>
             </div>
             <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                {STANDARD_WEIGHTS.map(w => (
                    <button
                        key={w}
                        onClick={() => update('bulletWeight', w)}
                        className={`flex-shrink-0 px-3 py-2 text-[13px] font-bold rounded-lg transition-all min-w-[50px] ${
                            Math.abs(inputs.bulletWeight - w) < 0.001 
                            ? 'bg-red-600 text-white' 
                            : 'bg-[#2c2c2e] text-zinc-400 hover:bg-[#3a3a3c]'
                        }`}
                    >
                        {w.toFixed(2)}
                    </button>
                ))}
             </div>
        </div>
      </IOSSection>
    </div>
  );
};