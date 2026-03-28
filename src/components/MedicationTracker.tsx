import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Trash2, 
  Bell, 
  BellOff,
  ChevronRight,
  History,
  Activity,
  Zap,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm } from '../services/geminiService';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  notes: string;
  reminders: boolean;
  adherence: Record<string, boolean>; // date string -> taken
  refillCount?: number;
}

interface MedicationTrackerProps {
  medications: Medication[];
  onAdd: (med: Omit<Medication, 'id' | 'adherence'>) => void;
  onDelete: (id: string) => void;
  onToggleAdherence: (id: string, date: string) => void;
  onToggleReminders: (id: string) => void;
  terms: MedicalTerm[]; // For interaction awareness
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({ 
  medications, 
  onAdd, 
  onDelete, 
  onToggleAdherence,
  onToggleReminders,
  terms 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'Daily',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    reminders: true,
    refillCount: 30
  });

  const [activeView, setActiveView] = useState<'list' | 'schedule' | 'adherence'>('list');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name) return;
    onAdd(newMed);
    setNewMed({
      name: '',
      dosage: '',
      frequency: 'Daily',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
      reminders: true,
      refillCount: 30
    });
    setShowAddForm(false);
  };

  // Simple interaction awareness logic
  const getInteractions = (medName: string) => {
    const interactions: string[] = [];
    const name = medName.toLowerCase();
    
    if (name.includes('aspirin') || name.includes('warfarin') || name.includes('clopidogrel')) {
      if (terms.some(t => t.term.toLowerCase().includes('platelet') && t.severity !== 'Normal')) {
        interactions.push("Potential interaction with platelet count findings. Monitor for bruising or bleeding.");
      }
    }
    
    if (name.includes('metformin') || name.includes('insulin')) {
      if (terms.some(t => t.term.toLowerCase().includes('glucose') && t.severity === 'Critical')) {
        interactions.push("Critical glucose levels detected. Medication dosage may need clinical review.");
      }
    }

    if (name.includes('statin') || name.includes('atorvastatin') || name.includes('simvastatin')) {
      if (terms.some(t => t.term.toLowerCase().includes('alt') || t.term.toLowerCase().includes('ast'))) {
        interactions.push("Monitor liver enzymes (ALT/AST) as per clinical guidelines for statin therapy.");
      }
    }

    return interactions;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-oxford-blue tracking-tight">Medication Management</h2>
          <p className="text-slate-400 font-medium mt-1">Track adherence and monitor interactions</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              onClick={() => setActiveView('list')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeView === 'list' ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" : "text-slate-400 hover:text-oxford-blue"
              )}
            >
              List
            </button>
            <button 
              onClick={() => setActiveView('schedule')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeView === 'schedule' ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" : "text-slate-400 hover:text-oxford-blue"
              )}
            >
              Schedule
            </button>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="p-3 bg-oxford-blue text-white rounded-2xl shadow-lg shadow-oxford-blue/20 hover:scale-105 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-oxford-blue/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative z-10 border border-slate-100"
            >
              <h3 className="text-2xl font-black text-oxford-blue mb-8 tracking-tight">Add New Medication</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medication Name</label>
                    <input 
                      type="text" 
                      required
                      value={newMed.name}
                      onChange={e => setNewMed({...newMed, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue outline-none focus:ring-4 focus:ring-oxford-blue/5 transition-all"
                      placeholder="e.g. Metformin"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
                    <input 
                      type="text" 
                      value={newMed.dosage}
                      onChange={e => setNewMed({...newMed, dosage: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue outline-none focus:ring-4 focus:ring-oxford-blue/5 transition-all"
                      placeholder="e.g. 500mg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                    <select 
                      value={newMed.frequency}
                      onChange={e => setNewMed({...newMed, frequency: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue outline-none focus:ring-4 focus:ring-oxford-blue/5 transition-all"
                    >
                      <option>Daily</option>
                      <option>Twice Daily</option>
                      <option>Weekly</option>
                      <option>As Needed</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                      type="date" 
                      value={newMed.startDate}
                      onChange={e => setNewMed({...newMed, startDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue outline-none focus:ring-4 focus:ring-oxford-blue/5 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Instructions</label>
                  <textarea 
                    value={newMed.notes}
                    onChange={e => setNewMed({...newMed, notes: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue outline-none focus:ring-4 focus:ring-oxford-blue/5 transition-all h-24 resize-none"
                    placeholder="e.g. Take with food"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-8 py-3 text-sm font-black text-slate-400 uppercase tracking-widest hover:text-oxford-blue"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-10 py-4 bg-oxford-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-oxford-blue/20 hover:scale-105 transition-transform"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Views */}
      <AnimatePresence mode="wait">
        {activeView === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {medications.length === 0 ? (
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Pill className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-oxford-blue mb-2">No Medications Tracked</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Add your current medications to monitor adherence and potential clinical interactions.</p>
              </div>
            ) : (
              medications.map((med, i) => {
                const interactions = getInteractions(med.name);
                const isTakenToday = med.adherence[today];

                return (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-oxford-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-oxford-blue/20">
                          <Pill className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-oxford-blue tracking-tight">{med.name}</h4>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onToggleReminders(med.id)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all",
                            med.reminders ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-300"
                          )}
                        >
                          {med.reminders ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => onDelete(med.id)}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Interaction Alerts */}
                    {interactions.length > 0 && (
                      <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                        {interactions.map((msg, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-red-600 leading-tight">{msg}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adherence Quick Action */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isTakenToday ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-white text-slate-300 border border-slate-200"
                        )}>
                          {isTakenToday ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Today</p>
                          <p className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            isTakenToday ? "text-green-500" : "text-slate-400"
                          )}>
                            {isTakenToday ? 'Taken' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onToggleAdherence(med.id, today)}
                        className={cn(
                          "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          isTakenToday ? "bg-white text-slate-400 border border-slate-200" : "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20"
                        )}
                      >
                        {isTakenToday ? 'Undo' : 'Mark Taken'}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Refill In</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-oxford-blue">{med.refillCount || 0}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Adherence</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-green-500">
                            {Math.round((Object.values(med.adherence).filter(Boolean).length / 7) * 100)}%
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">7d</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeView === 'schedule' && (
          <motion.div 
            key="schedule"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-oxford-blue tracking-tight">Daily Schedule</h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <Calendar className="w-4 h-4 text-oxford-blue" />
                <span className="text-xs font-black text-oxford-blue uppercase tracking-widest">
                  {new Date().toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {['Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                <div key={time} className="relative pl-12 pb-8 last:pb-0">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-100" />
                  <div className="absolute left-[-6px] top-0 w-3.5 h-3.5 rounded-full bg-white border-4 border-oxford-blue shadow-sm" />
                  
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{time}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {medications.length === 0 ? (
                      <p className="text-xs text-slate-300 font-bold italic">No medications scheduled</p>
                    ) : (
                      medications.map(med => (
                        <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-oxford-blue shadow-sm">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-oxford-blue leading-none mb-1">{med.name}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{med.dosage}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => onToggleAdherence(med.id, today)}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                              med.adherence[today] ? "bg-green-500 text-white" : "bg-white text-slate-200 border border-slate-100"
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
