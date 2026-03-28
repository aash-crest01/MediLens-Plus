import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Wind, 
  Droplets, 
  Zap, 
  Activity, 
  Shield, 
  Brain, 
  Bone, 
  Dumbbell,
  Stethoscope
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm } from '../services/geminiService';

interface OrganMapProps {
  terms: MedicalTerm[];
  onFilterBySystem: (system: string | null) => void;
  selectedSystem: string | null;
}

const SYSTEMS = [
  { id: 'Cardiovascular', icon: Heart, label: 'Heart & Blood' },
  { id: 'Respiratory', icon: Wind, label: 'Lungs' },
  { id: 'Digestive', icon: Activity, label: 'Digestive' },
  { id: 'Endocrine', icon: Zap, label: 'Hormones' },
  { id: 'Nervous', icon: Brain, label: 'Nervous' },
  { id: 'Musculoskeletal', icon: Bone, label: 'Bones & Muscle' },
  { id: 'Renal', icon: Droplets, label: 'Kidneys' },
  { id: 'Hematologic', icon: Stethoscope, label: 'Blood' },
  { id: 'Immune', icon: Shield, label: 'Immune' },
];

export const OrganMap: React.FC<OrganMapProps> = ({ terms, onFilterBySystem, selectedSystem }) => {
  const getSystemSeverity = (systemId: string) => {
    const systemTerms = terms.filter(t => t.organ_system === systemId);
    if (systemTerms.length === 0) return 'None';
    if (systemTerms.some(t => t.severity === 'Critical')) return 'Critical';
    if (systemTerms.some(t => t.severity === 'Concern')) return 'Concern';
    if (systemTerms.some(t => t.severity === 'Borderline')) return 'Borderline';
    return 'Normal';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white shadow-red-200';
      case 'Concern': return 'bg-amber-500 text-white shadow-amber-200';
      case 'Borderline': return 'bg-blue-400 text-white shadow-blue-100';
      case 'Normal': return 'bg-green-500 text-white shadow-green-100';
      default: return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-oxford-blue tracking-tight">Organ System Map</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Affected Systems Analysis</p>
        </div>
        {selectedSystem && (
          <button 
            onClick={() => onFilterBySystem(null)}
            className="text-[10px] font-black text-oxford-blue uppercase tracking-widest hover:underline"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {SYSTEMS.map((system) => {
          const severity = getSystemSeverity(system.id);
          const isSelected = selectedSystem === system.id;
          
          return (
            <motion.button
              key={system.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onFilterBySystem(isSelected ? null : system.id)}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-3xl transition-all border-2",
                isSelected ? "border-oxford-blue ring-4 ring-oxford-blue/10" : "border-transparent",
                getSeverityColor(severity)
              )}
            >
              <system.icon className={cn("w-6 h-6 mb-2", severity === 'None' ? 'opacity-30' : 'opacity-100')} />
              <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight">
                {system.label}
              </span>
              {severity !== 'None' && (
                <div className="mt-2 px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black">
                  {terms.filter(t => t.organ_system === system.id).length} Findings
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="flex flex-wrap gap-4 justify-center">
          {['Critical', 'Concern', 'Borderline', 'Normal'].map(sev => (
            <div key={sev} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", getSeverityColor(sev).split(' ')[0])} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sev}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
