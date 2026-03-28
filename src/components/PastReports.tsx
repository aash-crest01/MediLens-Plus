import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Download,
  Share2,
  Trash2,
  PlusCircle,
  BarChart3,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { MedicalTerm, ExecutiveSummary, AIInsight } from '../services/geminiService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

interface PastReport {
  id: string;
  date: string;
  type: string;
  vitalityIndex: number;
  summary: ExecutiveSummary;
  aiInsights: AIInsight;
  terms: MedicalTerm[];
  fullText: string;
}

interface PastReportsProps {
  reports: PastReport[];
  onDelete: (id: string) => void;
  onSelect: (report: PastReport) => void;
}

export const PastReports: React.FC<PastReportsProps> = ({ reports, onDelete, onSelect }) => {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'compare' | 'trends'>('list');
  const [selectedMarkerForTrend, setSelectedMarkerForTrend] = useState<string | null>(null);

  const handleCompareToggle = (id: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  };

  const getComparisonData = () => {
    if (selectedForComparison.length !== 2) return null;
    const report1 = reports.find(r => r.id === selectedForComparison[0])!;
    const report2 = reports.find(r => r.id === selectedForComparison[1])!;
    
    // Sort by date to ensure chronological comparison
    const [older, newer] = [report1, report2].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const sharedTerms = newer.terms.filter(nt => older.terms.some(ot => ot.term === nt.term));
    
    return { older, newer, sharedTerms };
  };

  const getTrendData = (markerName: string) => {
    return reports
      .filter(r => r.terms.some(t => t.term === markerName))
      .map(r => ({
        date: new Date(r.date).toLocaleDateString(),
        value: r.terms.find(t => t.term === markerName)?.value || 0,
        min: r.terms.find(t => t.term === markerName)?.reference_min || 0,
        max: r.terms.find(t => t.term === markerName)?.reference_max || 100,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const comparison = getComparisonData();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-oxford-blue tracking-tight">Health History</h2>
          <p className="text-slate-400 font-medium mt-1">Longitudinal tracking and clinical comparisons</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              viewMode === 'list' ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" : "text-slate-400 hover:text-oxford-blue"
            )}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Timeline
            </div>
          </button>
          <button 
            onClick={() => setViewMode('compare')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              viewMode === 'compare' ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" : "text-slate-400 hover:text-oxford-blue"
            )}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Compare
            </div>
          </button>
          <button 
            onClick={() => setViewMode('trends')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              viewMode === 'trends' ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" : "text-slate-400 hover:text-oxford-blue"
            )}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Trends
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 gap-4"
          >
            {reports.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-oxford-blue mb-2">No Reports Yet</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Upload your first medical report to start tracking your health journey.</p>
              </div>
            ) : (
              reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-oxford-blue group-hover:text-white transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                          {new Date(report.date).toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="text-2xl font-black leading-none">
                          {new Date(report.date).getDate()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-lg font-black text-oxford-blue tracking-tight">{report.type}</h4>
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {report.terms.length} Findings
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium line-clamp-1 max-w-md">
                          {report.summary?.overview || "AI-generated clinical summary of your health report."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vitality Index</div>
                        <div className={cn(
                          "text-2xl font-black tracking-tighter",
                          report.vitalityIndex >= 80 ? "text-green-500" : report.vitalityIndex >= 60 ? "text-amber-500" : "text-red-500"
                        )}>
                          {report.vitalityIndex}%
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCompareToggle(report.id)}
                          className={cn(
                            "p-3 rounded-xl border transition-all",
                            selectedForComparison.includes(report.id) 
                              ? "bg-oxford-blue border-oxford-blue text-white shadow-lg" 
                              : "border-slate-100 text-slate-400 hover:bg-slate-50"
                          )}
                          title="Select for comparison"
                        >
                          <Activity className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onSelect(report)}
                          className="p-3 bg-slate-50 text-oxford-blue rounded-xl hover:bg-oxford-blue hover:text-white transition-all shadow-sm"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => onDelete(report.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {viewMode === 'compare' && (
          <motion.div 
            key="compare"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {selectedForComparison.length < 2 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-oxford-blue mb-2">Select Two Reports</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Click the comparison icon on any two reports in the timeline to see how your health is trending.</p>
              </div>
            ) : comparison && (
              <div className="space-y-8">
                {/* Comparison Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">Older Baseline</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Report A</h4>
                    <div className="text-2xl font-black text-oxford-blue mb-1">{comparison.older.type}</div>
                    <div className="text-sm text-slate-400 font-bold">{new Date(comparison.older.date).toLocaleDateString()}</div>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-oxford-blue tracking-tighter">{comparison.older.vitalityIndex}%</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vitality</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="px-4 py-1.5 bg-oxford-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest">Newer Analysis</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Report B</h4>
                    <div className="text-2xl font-black text-oxford-blue mb-1">{comparison.newer.type}</div>
                    <div className="text-sm text-slate-400 font-bold">{new Date(comparison.newer.date).toLocaleDateString()}</div>
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-oxford-blue tracking-tighter">{comparison.newer.vitalityIndex}%</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vitality</span>
                      <div className={cn(
                        "ml-4 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black",
                        comparison.newer.vitalityIndex >= comparison.older.vitalityIndex ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {comparison.newer.vitalityIndex >= comparison.older.vitalityIndex ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(comparison.newer.vitalityIndex - comparison.older.vitalityIndex)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Markers Comparison */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                  <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-8">Marker Comparison</h3>
                  <div className="space-y-4">
                    {comparison.sharedTerms.map((term, i) => {
                      const olderTerm = comparison.older.terms.find(ot => ot.term === term.term)!;
                      const delta = (term.value || 0) - (olderTerm.value || 0);
                      const isImprovement = term.severity === 'Normal' && olderTerm.severity !== 'Normal';
                      const isDecline = term.severity !== 'Normal' && olderTerm.severity === 'Normal';

                      return (
                        <div key={term.term} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                          <div className="flex-1">
                            <h5 className="text-sm font-black text-oxford-blue uppercase tracking-tight mb-1">{term.term}</h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{term.unit}</p>
                          </div>

                          <div className="flex items-center gap-12 flex-1 justify-center">
                            <div className="text-center">
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Was</div>
                              <div className="text-lg font-black text-slate-400">{olderTerm.value}</div>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <ArrowRight className="w-5 h-5 text-slate-300 mb-1" />
                              <div className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                delta > 0 ? "bg-blue-100 text-blue-600" : delta < 0 ? "bg-amber-100 text-amber-600" : "bg-slate-200 text-slate-500"
                              )}>
                                {delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? delta.toFixed(1) : 'No Change'}
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Now</div>
                              <div className={cn(
                                "text-lg font-black",
                                term.severity === 'Normal' ? "text-green-500" : term.severity === 'Critical' ? "text-red-500" : "text-amber-500"
                              )}>
                                {term.value}
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 flex justify-end">
                            <div className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest",
                              isImprovement ? "bg-green-100 text-green-600" : isDecline ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                            )}>
                              {isImprovement ? <TrendingUp className="w-4 h-4" /> : isDecline ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                              {isImprovement ? 'Improved' : isDecline ? 'Declined' : 'Stable'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'trends' && (
          <motion.div 
            key="trends"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-oxford-blue tracking-tight">Longitudinal Trends</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Select a marker to view its history</p>
                </div>
                
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-oxford-blue outline-none focus:ring-2 focus:ring-oxford-blue/10"
                  onChange={(e) => setSelectedMarkerForTrend(e.target.value)}
                  value={selectedMarkerForTrend || ''}
                >
                  <option value="">Select Marker...</option>
                  {Array.from(new Set(reports.flatMap(r => r.terms.map(t => t.term)))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {selectedMarkerForTrend ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getTrendData(selectedMarkerForTrend)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1d2d50', 
                          border: 'none', 
                          borderRadius: '1rem', 
                          color: '#fff',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1d2d50" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#1d2d50', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, fill: '#1d2d50', strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-slate-300">
                  <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Select a marker to visualize trends</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
