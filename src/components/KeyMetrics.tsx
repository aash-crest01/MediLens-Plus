import React from 'react';
import { motion } from 'motion/react';
import { 
  Droplets, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm } from '../services/geminiService';

interface KeyMetricsProps {
  terms: MedicalTerm[];
}

const KEY_METRICS = [
  'Glucose', 'Hemoglobin', 'Cholesterol', 'Blood Pressure', 
  'HbA1c', 'Creatinine', 'TSH', 'Vitamin D', 'Iron', 'Potassium'
];

export const KeyMetrics: React.FC<KeyMetricsProps> = ({ terms }) => {
  const findMetric = (name: string) => {
    return terms.find(t => t.term.toLowerCase().includes(name.toLowerCase()));
  };

  const metricsToShow = KEY_METRICS.map(name => findMetric(name)).filter(Boolean) as MedicalTerm[];

  if (metricsToShow.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-oxford-blue tracking-tight">Key Metrics Spotlight</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Clinically Significant Markers <span className="text-oxford-blue/40 ml-2">• Based on Lab Report</span>
          </p>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-black text-oxford-blue uppercase tracking-widest">
            {metricsToShow.length} Critical Markers Tracked
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricsToShow.map((metric, i) => {
          const isHigh = metric.value > (metric.reference_max || Infinity);
          const isLow = metric.value < (metric.reference_min || -Infinity);
          const isNormal = !isHigh && !isLow;
          
          // Calculate position percentage within reference range
          let position = 50;
          if (metric.reference_min !== null && metric.reference_max !== null) {
            const range = metric.reference_max - metric.reference_min;
            position = ((metric.value - metric.reference_min) / range) * 100;
            position = Math.max(0, Math.min(100, position));
          }

          return (
            <motion.div
              key={metric.term}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-sm font-black text-oxford-blue uppercase tracking-tight leading-none mb-1">
                    {metric.term}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {metric.unit}
                  </p>
                </div>
                <div className={cn(
                  "p-2 rounded-xl",
                  isNormal ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {isNormal ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-black text-oxford-blue tracking-tighter">
                  {metric.value}
                </span>
                <div className="flex items-center gap-1">
                  {isHigh && <ArrowUp className="w-4 h-4 text-red-500" />}
                  {isLow && <ArrowDown className="w-4 h-4 text-red-500" />}
                  {isNormal && <Minus className="w-4 h-4 text-green-500" />}
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isNormal ? "text-green-500" : "text-red-500"
                  )}>
                    {isNormal ? 'Normal' : isHigh ? 'High' : 'Low'}
                  </span>
                </div>
              </div>

              {/* Reference Range Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{metric.reference_min}</span>
                  <span>Range</span>
                  <span>{metric.reference_max}</span>
                </div>
                <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                  {/* Reference Zone */}
                  <div className="absolute inset-y-0 left-[20%] right-[20%] bg-green-200/50" />
                  {/* Marker */}
                  <motion.div 
                    initial={{ left: 0 }}
                    animate={{ left: `${position}%` }}
                    className={cn(
                      "absolute top-0 bottom-0 w-1 shadow-lg z-10",
                      isNormal ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>
              
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
