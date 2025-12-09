import React from 'react';
import { SimulationResult } from '../types';

interface Props {
  result: SimulationResult;
}

export const BallisticTable: React.FC<Props> = ({ result }) => {
  const points = result.points.filter(p => Math.floor(p.distance) % 5 === 0);

  return (
    <div className="w-full flex flex-col h-full bg-black">
       
       <div className="px-5 py-3 border-b border-white/10 bg-black/95 sticky top-0 z-20 flex justify-between items-center">
            <span className="text-zinc-500 text-xs font-medium uppercase tracking-wide">Ballistic Log (5m Interval)</span>
            <span className="text-red-500 font-bold text-xs bg-red-900/10 px-2 py-1 rounded-md">{result.label}</span>
       </div>
      
      <div className="overflow-auto flex-1 no-scrollbar px-2">
        <table className="w-full text-left">
          <thead className="text-[11px] text-zinc-500 font-medium sticky top-0 bg-black">
            <tr>
              <th className="pl-4 py-3 font-medium">DIST<br/>距離</th>
              <th className="px-2 py-3 text-center font-medium">DROP<br/>高度</th>
              <th className="px-2 py-3 text-center font-medium">VELOCITY<br/>剩餘速度</th>
              <th className="pr-4 pl-2 py-3 text-right font-medium">ENERGY<br/>動能</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-[14px]">
            {points.map((point) => (
              <tr key={point.distance}>
                <td className="pl-4 py-3 font-medium text-white">{point.distance.toFixed(0)}m</td>
                <td className={`px-2 py-3 text-center font-medium ${point.drop > 0 ? 'text-blue-400' : (point.drop < -20 ? 'text-red-500' : 'text-zinc-500')}`}>
                    {point.drop > 0 ? '+' : ''}{point.drop.toFixed(1)}
                </td>
                <td className="px-2 py-3 text-zinc-500 text-center text-xs">{point.velocity.toFixed(0)}</td>
                <td className="pr-4 pl-2 py-3 text-zinc-300 text-right font-medium">{point.energy.toFixed(2)}J</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};