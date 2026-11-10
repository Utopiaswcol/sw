import React from 'react';
import { Vector5D, DimensionKey } from '../types';
import { DIMENSIONS } from '../data';
import { Sliders, Info } from 'lucide-react';

interface VectorEditorProps {
  title: string;
  subtitle?: string;
  badgeBg?: string;
  badgeText?: string;
  vector: Vector5D;
  onChange: (updated: Vector5D) => void;
  accentColor?: 'rose' | 'indigo' | 'purple' | 'emerald';
}

export const VectorEditor: React.FC<VectorEditorProps> = ({
  title,
  subtitle,
  badgeBg = 'bg-slate-800',
  badgeText = 'text-slate-300',
  vector,
  onChange,
  accentColor = 'rose'
}) => {
  const handleSliderChange = (key: DimensionKey, value: number) => {
    onChange({
      ...vector,
      [key]: value
    });
  };

  const getAccentClass = () => {
    switch (accentColor) {
      case 'indigo': return 'accent-indigo-500 text-indigo-400';
      case 'purple': return 'accent-purple-500 text-purple-400';
      case 'emerald': return 'accent-emerald-500 text-emerald-400';
      default: return 'accent-rose-500 text-rose-400';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className={`w-4 h-4 ${getAccentClass()}`} />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full font-mono border border-slate-700/50 ${badgeBg} ${badgeText}`}>
            [-1.0, +1.0]
          </span>
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          {DIMENSIONS.map((dim) => {
            const val = vector[dim.key];
            const formattedVal = val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);

            return (
              <div key={dim.key} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {dim.code}
                    </span>
                    {dim.shortLabel}
                  </span>
                  <span className={`text-xs font-bold font-mono ${val > 0.3 ? 'text-emerald-400' : val < -0.3 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {formattedVal}
                  </span>
                </div>

                {/* Slider input */}
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={val}
                  onChange={(e) => handleSliderChange(dim.key, parseFloat(e.target.value))}
                  className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${getAccentClass()}`}
                />

                {/* Labels below slider */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-sans">
                  <span className="truncate max-w-[45%] text-slate-400">{dim.minLabel}</span>
                  <span className="truncate max-w-[45%] text-slate-400 text-right">{dim.maxLabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
