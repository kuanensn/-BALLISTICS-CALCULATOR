import React, { useState } from 'react';
import { BallisticInput } from '../types';

interface Props {
  inputs: BallisticInput;
  onChange: (newInputs: BallisticInput) => void;
}

interface LocalWeather {
  location: string;
  temp: number;
  humidity: number;
  rainProb: number;
  uvIndex: number;
  weatherDesc: string;
  advice: string;
}

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
  subLabel,
  highlight = false
}: { 
  label: string, 
  value?: string | number, 
  children?: React.ReactNode, 
  last?: boolean,
  subLabel?: string,
  highlight?: boolean
}) => (
  <div className={`flex items-center justify-between p-4 bg-[#1c1c1e] ${!last ? 'border-b border-white/10' : ''}`}>
    <div className="flex flex-col justify-center">
        <span className={`text-[15px] font-medium ${highlight ? 'text-red-500' : 'text-white'}`}>{label}</span>
        {subLabel && <span className="text-zinc-500 text-[11px] leading-tight mt-0.5">{subLabel}</span>}
    </div>
    <div className="flex items-center gap-3">
      {value !== undefined && <span className={`text-[15px] ${highlight ? 'text-red-500 font-bold' : 'text-zinc-400'}`}>{value}</span>}
      {children}
    </div>
  </div>
);

const Stepper = ({ value, onChange, step = 1, min = 0, fmt, suffix = '' }: { value: number, onChange: (v: number) => void, step?: number, min?: number, fmt?: (v:number) => string, suffix?: string }) => (
  <div className="flex items-center bg-[#2c2c2e] rounded-lg p-0.5">
    <button 
      onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
      className="w-8 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#3a3a3c] rounded-md transition-colors"
    >−</button>
    <span className="text-white min-w-[3rem] text-center text-[13px] font-bold">{fmt ? fmt(value) : value}{suffix}</span>
    <button 
      onClick={() => onChange(Number((value + step).toFixed(2)))}
      className="w-8 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#3a3a3c] rounded-md transition-colors"
    >+</button>
  </div>
);

const HopUpVisualizer = ({ level }: { level: number }) => {
  const t = (level - 60) / 20; 
  const curveY = 20 + (t * 22);

  return (
    <div className="w-full h-24 bg-[#000] rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border border-white/5">
       <svg width="100%" height="100%" viewBox="0 0 200 80">
          <line x1="0" y1="20" x2="80" y2="20" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="120" y1="20" x2="200" y2="20" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          <line x1="0" y1="60" x2="200" y2="60" stroke="#333" strokeWidth="2" strokeLinecap="round" />
          
          <circle cx="100" cy="40" r="19" fill="#e4e4e7" />
          
          <g transform={`rotate(${-t * 360} 100 40)`} opacity={0.5}>
             <path d="M 100 30 L 100 28 M 100 50 L 100 52" stroke="black" strokeWidth="1" />
             <path d="M 90 40 L 88 40 M 110 40 L 112 40" stroke="black" strokeWidth="1" />
          </g>

          <path d={`M 80 20 Q 100 ${curveY} 120 20`} fill="#ef4444" fillOpacity={0.4} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
       </svg>
    </div>
  );
};

export const BallisticForm: React.FC<Props> = ({ inputs, onChange }) => {
  const [weather, setWeather] = useState<LocalWeather | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [errorWeather, setErrorWeather] = useState('');

  const update = (field: keyof BallisticInput, value: any) => {
    onChange({ ...inputs, [field]: value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorWeather("Geolocation not supported");
      return;
    }
    setLoadingWeather(true);
    setErrorWeather('');

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&daily=uv_index_max,precipitation_probability_max&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        const address = geoData.address;
        const city = address.city || address.town || address.village || address.county || "Unknown Location";
        const current = weatherData.current;
        const daily = weatherData.daily;
        const code = current.weather_code;
        const uv = daily.uv_index_max[0];
        
        let weatherStr = "Unknown";
        if (code === 0) weatherStr = "Clear (晴朗)";
        else if (code <= 3) weatherStr = "Cloudy (多雲)";
        else if (code <= 48) weatherStr = "Foggy (霧)";
        else if (code <= 67) weatherStr = "Rain (雨)";
        else if (code <= 77) weatherStr = "Snow (雪)";
        else if (code <= 82) weatherStr = "Heavy Rain (大雨)";
        else weatherStr = "Storm (暴風雨)";

        let advice = "No protection needed";
        if (uv >= 3 && uv < 6) advice = "Hat/Sunscreen";
        else if (uv >= 6 && uv < 8) advice = "High Protection";
        else if (uv >= 8) advice = "Avoid Sun";

        setWeather({
          location: city,
          temp: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          rainProb: daily.precipitation_probability_max[0],
          uvIndex: uv,
          weatherDesc: weatherStr,
          advice: advice
        });
      } catch (err) {
        setErrorWeather("Failed to fetch data");
      } finally {
        setLoadingWeather(false);
      }
    }, (err) => {
      setErrorWeather("Permission denied");
      setLoadingWeather(false);
    });
  };

  return (
    <div className="">
      
      <IOSSection title="Trajectory Control / 彈道控制">
        <div className="p-4 border-b border-white/10">
             <div className="flex justify-between mb-4 items-end">
                <span className="text-white font-medium text-[15px]">Hop-Up Adjustment</span>
                <span className="text-zinc-500 text-[13px]">下壓程度</span>
             </div>
             
             <HopUpVisualizer level={inputs.hopUpLevel} />

             {/* IOS Slider */}
             <div className="relative h-8 w-full flex items-center">
                <input 
                    type="range" 
                    min="60" 
                    max="80" 
                    step="1"
                    value={inputs.hopUpLevel} 
                    onChange={(e) => update('hopUpLevel', parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-600 rounded-full appearance-none cursor-pointer accent-red-600"
                />
             </div>
             
             <div className="flex justify-between mt-1 text-[11px] text-zinc-500 font-medium">
                <span>Light</span>
                <span>Heavy</span>
             </div>
        </div>
        <IOSRow label="Shooter Height / 射手高度" subLabel="Muzzle to ground" last={true}>
            <div className="flex items-center gap-1">
                <input 
                    type="number" 
                    value={inputs.shooterHeight}
                    onChange={(e) => update('shooterHeight', parseFloat(e.target.value))}
                    className="bg-transparent text-right text-white font-bold w-12 outline-none text-[15px] placeholder-zinc-700"
                />
                <span className="text-zinc-500 text-[13px]">cm</span>
            </div>
        </IOSRow>
      </IOSSection>

      <IOSSection title="Environment / 環境變數">
         <IOSRow label="Temperature / 氣溫" subLabel="Celsius">
            <Stepper value={inputs.temperature} onChange={(v) => update('temperature', v)} step={1} suffix="°" />
         </IOSRow>
         <IOSRow label="Humidity / 濕度" subLabel="Air Density" last={true}>
            <Stepper value={inputs.humidity} onChange={(v) => update('humidity', v)} step={5} min={0} suffix="%" />
         </IOSRow>
      </IOSSection>

      <IOSSection title="Local Conditions / 現場狀況">
         <div className="p-4 border-b border-white/10">
            {!weather && !loadingWeather ? (
               <button 
                  onClick={handleGetLocation}
                  className="w-full py-2.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl text-red-500 font-medium flex items-center justify-center gap-2 transition-colors text-[15px]"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Acquire GPS Location
               </button>
            ) : loadingWeather ? (
                <div className="w-full py-3 flex justify-center text-zinc-500 text-sm">
                   Locating...
                </div>
            ) : weather ? (
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-white font-bold text-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                     </svg>
                     {weather.location}
                  </div>
                  <button 
                    onClick={() => {
                        update('temperature', Math.round(weather.temp));
                        update('humidity', Math.round(weather.humidity));
                    }}
                    className="text-xs bg-red-600/10 text-red-500 border border-red-600/20 py-2 rounded-lg font-bold uppercase tracking-wide"
                  >
                    Apply Weather Data
                  </button>
               </div>
            ) : null}
         </div>

         {weather && (
            <>
               <IOSRow label="Condition" value={weather.weatherDesc} />
               <IOSRow label="Temperature" value={`${weather.temp}°C`} />
               <IOSRow label="Humidity" value={`${weather.humidity}%`} />
               <IOSRow label="Rain Prob." value={`${weather.rainProb}%`} highlight={weather.rainProb > 40} />
               <IOSRow label="UV Index" value={weather.uvIndex.toFixed(1)} highlight={weather.uvIndex > 6} />
               <IOSRow label="Advisory" last={true}>
                  <span className="text-[11px] text-red-400 font-medium px-2 py-1 bg-red-900/20 rounded-md">
                     {weather.advice}
                  </span>
               </IOSRow>
            </>
         )}
      </IOSSection>
    </div>
  );
};