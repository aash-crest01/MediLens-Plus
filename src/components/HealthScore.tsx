import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

interface HealthScoreProps {
  score: number;
}

export const HealthScore: React.FC<HealthScoreProps> = ({ score }) => {
  const getStatus = () => {
    if (score >= 80) return { label: 'Optimal', color: 'text-vitality-green', bg: 'bg-vitality-green/10', icon: ShieldCheck };
    if (score >= 50) return { label: 'Moderate', color: 'text-vitality-amber', bg: 'bg-vitality-amber/10', icon: Activity };
    return { label: 'Critical', color: 'text-vitality-red', bg: 'bg-vitality-red/10', icon: AlertTriangle };
  };

  const status = getStatus();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className={cn(
        "absolute -top-20 -right-20 w-64 h-64 blur-[100px] opacity-20 transition-colors duration-1000",
        status.color.replace('text-', 'bg-')
      )} />

      <div className="relative w-48 h-48 mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle 
            cx="50" cy="50" r={radius} 
            fill="none" stroke="#F1F5F9" strokeWidth="8" 
          />
          <motion.circle 
            cx="50" cy="50" r={radius} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className={cn("transition-colors duration-1000", status.color)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl font-black text-oxford-blue tracking-tighter"
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Vitality Index</span>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className={cn(
          "px-6 py-2 rounded-full flex items-center gap-2 border border-white/20 shadow-sm",
          status.bg, status.color
        )}
      >
        <status.icon className="w-4 h-4" />
        <span className="text-sm font-black uppercase tracking-widest">{status.label} Status</span>
      </motion.div>

      <p className="mt-6 text-slate-500 text-sm font-medium max-w-[200px] leading-relaxed">
        Your health vitality is based on {score}% of markers being within optimal ranges.
      </p>
    </div>
  );
};
