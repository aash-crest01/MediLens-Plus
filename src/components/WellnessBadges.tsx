import React from 'react';
import { motion } from 'motion/react';
import { Award, Zap, Heart, ShieldCheck, Dumbbell, Apple } from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm } from '../services/geminiService';

interface WellnessBadgesProps {
  terms: MedicalTerm[];
}

export const WellnessBadges: React.FC<WellnessBadgesProps> = ({ terms }) => {
  const badges = [
    { 
      id: 'iron', 
      label: 'Iron Pro', 
      icon: Dumbbell, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('iron') && x.severity === 'Normal')
    },
    { 
      id: 'heart', 
      label: 'Heart Hero', 
      icon: Heart, 
      color: 'text-red-500', 
      bg: 'bg-red-50',
      condition: (t: MedicalTerm[]) => t.some(x => (x.term.toLowerCase().includes('cholesterol') || x.term.toLowerCase().includes('hdl')) && x.severity === 'Normal')
    },
    { 
      id: 'energy', 
      label: 'Energy Boost', 
      icon: Zap, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('hemoglobin') && x.severity === 'Normal')
    },
    { 
      id: 'immunity', 
      label: 'Immunity Shield', 
      icon: ShieldCheck, 
      color: 'text-green-500', 
      bg: 'bg-green-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('wbc') && x.severity === 'Normal')
    },
  ];

  const earnedBadges = badges.filter(b => b.condition(terms));

  if (earnedBadges.length === 0) return null;

  return (
    <div className="glass-card rounded-[2rem] p-8">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-oxford-blue" />
        <h3 className="text-lg font-black text-oxford-blue uppercase tracking-tight">Wellness Achievements</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {earnedBadges.map((badge, idx) => (
          <motion.div
            key={badge.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "badge-glow flex flex-col items-center justify-center p-4 rounded-2xl border border-white/20 shadow-sm transition-transform hover:scale-105",
              badge.bg
            )}
          >
            <badge.icon className={cn("w-8 h-8 mb-2", badge.color)} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest text-center", badge.color)}>
              {badge.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
