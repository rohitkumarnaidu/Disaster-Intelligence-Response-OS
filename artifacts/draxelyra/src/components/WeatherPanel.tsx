import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Droplets, Thermometer, AlertTriangle, Minus, Activity, Eye } from 'lucide-react';

interface WeatherPanelProps {
  lat: number;
  lng: number;
}

interface WeatherData {
  temperature: number;
  description: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
}

interface AQIData {
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
}

interface FloodData {
  riskLevel: 'Normal' | 'Elevated' | 'High';
  discharge: number;
}

export function WeatherPanel({ lat, lng }: WeatherPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<AQIData | null>(null);
  const [flood, setFlood] = useState<FloodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [weatherRes, aqiRes, floodRes] = await Promise.all([
          fetch(`/api/weather/current/${lat}/${lng}`, { credentials: 'include' }),
          fetch(`/api/weather/air-quality/${lat}/${lng}`, { credentials: 'include' }),
          fetch(`/api/weather/flood/${lat}/${lng}`, { credentials: 'include' })
        ]);

        if (weatherRes.ok) setWeather(await weatherRes.json());
        if (aqiRes.ok) setAqi(await aqiRes.json());
        if (floodRes.ok) setFlood(await floodRes.json());
      } catch (error) {
        console.error('Failed to fetch weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [lat, lng]);

  const getAqiColor = (category?: string) => {
    switch (category) {
      case 'Good': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Moderate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Unhealthy': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Hazardous': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getFloodColor = (risk?: string) => {
    switch (risk) {
      case 'Normal': return 'text-emerald-400';
      case 'Elevated': return 'text-amber-400 font-bold';
      case 'High': return 'text-rose-500 font-bold animate-pulse';
      default: return 'text-slate-400';
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute top-3 right-3 z-30">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="p-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl hover:bg-slate-800 transition-all focus-visible:ring-2 focus-visible:ring-teal-500 outline-none"
          title="Show Local Weather"
          aria-label="Expand local weather panel"
        >
          <CloudRain className="w-4 h-4 text-teal-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-30 w-[calc(100%-1.5rem)] sm:w-72 max-w-[300px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border-b border-slate-800">
        <h3 className="text-xs font-mono-ui font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <CloudRain className="w-3.5 h-3.5 text-teal-400" />
          Live Weather & Telemetry
        </h3>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
          title="Minimize panel"
          aria-label="Collapse weather panel"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5">
        {loading ? (
          <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-xs font-mono-ui">
            <Activity className="w-4 h-4 text-teal-400 animate-spin" />
            <span>Telemetry Loading...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-mono-ui font-light text-white tracking-tight flex items-start">
                  {weather?.temperature ?? '--'}
                  <span className="text-sm font-sans text-slate-400 ml-1">°C</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 capitalize font-medium">
                  {weather?.description ?? 'Environmental Sensor Feed'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-teal-400" />
              </div>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-0.5">
                <span className="text-[10px] font-mono-ui uppercase text-slate-400 flex items-center gap-1">
                  <Wind className="w-3 h-3 text-slate-400" /> Wind
                </span>
                <span className="font-semibold text-slate-200">
                  {weather?.windSpeed ?? '--'} km/h {weather?.windDirection}
                </span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2 flex flex-col gap-0.5">
                <span className="text-[10px] font-mono-ui uppercase text-slate-400 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-slate-400" /> Humidity
                </span>
                <span className="font-semibold text-slate-200">
                  {weather?.humidity ?? '--'}%
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-300">Air Quality</span>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono-ui font-semibold border ${getAqiColor(aqi?.category)}`}>
                  {aqi?.aqi ?? '--'} {aqi?.category ?? 'Good'}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80">
                <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" /> Flood Threat
                </span>
                <span className={`text-[11px] font-mono-ui uppercase ${getFloodColor(flood?.riskLevel)}`}>
                  {flood?.riskLevel ?? 'Normal'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
