import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb, ArrowRight, Apple, Dumbbell, Moon, Pill, Heart, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm } from '../services/geminiService';

interface InsightCardsProps {
  terms: MedicalTerm[];
}

export const InsightCards: React.FC<InsightCardsProps> = ({ terms }) => {
  const insights = [
    { 
      id: 'iron', 
      label: 'Iron Intake', 
      icon: Apple, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('iron') && (x.severity === 'Concern' || x.severity === 'Critical')),
      advice: 'Consider adding more iron-rich foods like spinach, lentils, and red meat to your diet.'
    },
    { 
      id: 'cholesterol', 
      label: 'Heart Health', 
      icon: Heart, 
      color: 'text-red-500', 
      bg: 'bg-red-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('cholesterol') && (x.severity === 'Concern' || x.severity === 'Critical')),
      advice: 'Focus on healthy fats like avocados and nuts, and try to incorporate 30 minutes of cardio daily.'
    },
    { 
      id: 'hemoglobin', 
      label: 'Energy Levels', 
      icon: Zap, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('hemoglobin') && (x.severity === 'Concern' || x.severity === 'Critical')),
      advice: 'Low hemoglobin can cause fatigue. Ensure you are getting enough Vitamin B12 and Folate.'
    },
    { 
      id: 'wbc', 
      label: 'Immune Support', 
      icon: ShieldCheck, 
      color: 'text-green-500', 
      bg: 'bg-green-50',
      condition: (t: MedicalTerm[]) => t.some(x => x.term.toLowerCase().includes('wbc') && (x.severity === 'Concern' || x.severity === 'Critical')),
      advice: 'Your immune system may be under stress. Prioritize sleep and consider a Vitamin C supplement.'
    },
  ];

  const relevantInsights = insights.filter(i => i.condition(terms));

  if (relevantInsights.length === 0) return (
    <div className="glass-card rounded-[2rem] p-8 text-center">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShieldCheck className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-black text-oxford-blue mb-2">You're on Track!</h3>
      <p className="text-slate-500 text-sm font-medium">No urgent health insights detected. Keep up your current wellness routine.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2 px-4">
        <Lightbulb className="w-6 h-6 text-oxford-blue" />
        <h3 className="text-lg font-black text-oxford-blue uppercase tracking-tight">Actionable Insights</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {relevantInsights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "glass-card rounded-[2rem] p-6 border-l-4 transition-all hover:shadow-2xl",
              insight.bg,
              insight.color.replace('text-', 'border-')
            )}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("p-3 rounded-xl", insight.color.replace('text-', 'bg-').replace('-500', '-100'))}>
                <insight.icon className={cn("w-6 h-6", insight.color)} />
              </div>
              <h4 className="text-lg font-black text-oxford-blue">{insight.label}</h4>
            </div>
            <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
              {insight.advice}
            </p>
            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-oxford-blue hover:gap-3 transition-all">
              Learn More <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
