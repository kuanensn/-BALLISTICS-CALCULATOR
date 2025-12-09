import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { SimulationResult } from '../types';

interface Props {
  results: SimulationResult[];
  targetSize: number;
  shooterHeight: number; // passed from inputs in cm
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const mainPoint = payload.find((p: any) => p.dataKey === 'heightMain');
    if (!mainPoint) return null;

    return (
      <div className="bg-[#1c1c1e]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-lg min-w-[120px]">
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
            <span className="text-white font-bold text-xs">{mainPoint.payload.name}</span>
        </div>
        <div className="flex flex-col gap-1 text-[11px] text-zinc-300">
            <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Weight</span>
                <span className="font-bold">{mainPoint.payload.name}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Dist</span>
                <span className="font-bold">{Number(label).toFixed(1)}m</span>
            </div>
            <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Height</span>
                <span className="font-bold text-white">{Number(mainPoint.value).toFixed(1)}m</span>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

export const BallisticChart: React.FC<Props> = ({ results, targetSize, shooterHeight }) => {
  const mainData = results[1];
  const lighterData = results[0];
  const heavierData = results[2];
  const shooterHeightM = shooterHeight / 100;
  
  // Determine max range for chart scaling
  const maxSimRange = Math.max(mainData.maxRange, heavierData.maxRange);
  const chartMaxX = maxSimRange > 100 ? Math.ceil(maxSimRange / 10) * 10 : 100;
  
  // Generate ticks dynamically
  const ticks = [];
  for (let i = 0; i <= chartMaxX; i += 10) {
      ticks.push(i);
  }

  const chartData = mainData.points.map((p, i) => {
    return {
        range: p.distance,
        name: mainData.label,
        heightMain: (shooterHeight + p.drop) / 100,
        heightLight: lighterData.points[i] ? (shooterHeight + lighterData.points[i].drop) / 100 : null,
        heightHeavy: heavierData.points[i] ? (shooterHeight + heavierData.points[i].drop) / 100 : null,
    };
  });

  return (
    <div className="w-full h-[320px] relative px-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 10, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
          
          <XAxis 
            dataKey="range" 
            stroke="#71717a" 
            tick={{fill: '#71717a', fontSize: 10, fontWeight: 500}} 
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            type="number"
            domain={[0, chartMaxX]}
            ticks={ticks}
            tickFormatter={(val) => val.toFixed(0)}
            label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: '#71717a', fontSize: 10 }}
          />
          
          <YAxis 
            width={35}
            stroke="#71717a" 
            tick={{fill: '#71717a', fontSize: 10, fontWeight: 500}}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            domain={[0, 3]} 
            ticks={[0, 1, 2, 3]}
            allowDataOverflow={true}
            tickFormatter={(val) => val.toFixed(1)}
            label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', offset: 12, fill: '#71717a', fontSize: 10 }}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeOpacity: 0.5 }} />
          
          <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />
          <ReferenceLine y={shooterHeightM} stroke="#dc2626" strokeDasharray="4 4" strokeOpacity={0.4} strokeWidth={1} />
          <ReferenceArea y1={shooterHeightM - (targetSize/100)/2} y2={shooterHeightM + (targetSize/100)/2} fill="#22c55e" fillOpacity={0.05} />

          <Line type="monotone" dataKey="heightLight" stroke="#52525b" strokeWidth={1} dot={false} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="heightHeavy" stroke="#52525b" strokeWidth={1} dot={false} strokeDasharray="4 4" />
          <Line 
            type="monotone" 
            dataKey="heightMain" 
            stroke="#dc2626" 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 5, fill: '#dc2626', stroke: '#000', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-1">
         <div className="flex items-center gap-1.5">
             <div className="w-4 border-b border-zinc-500 border-dashed"></div>
             <span className="text-[10px] text-zinc-500 uppercase font-medium">
                {lighterData.label} / {heavierData.label}
             </span>
         </div>
         <div className="flex items-center gap-1.5">
             <div className="w-2 h-[2px] bg-red-600"></div>
             <span className="text-[10px] text-red-500 uppercase font-bold">{mainData.label}</span>
         </div>
      </div>
    </div>
  );
};