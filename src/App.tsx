/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ShieldCheck, Stethoscope, Activity, Info, Languages, Upload, 
  Zap,
  Printer, Award, BookOpen, Apple, Moon, Dumbbell, Heart, 
  Pill, CheckSquare, AlertTriangle, AlertCircle, ChevronDown, ChevronUp,
  FileText, Image as ImageIcon, Loader2, Bookmark, BookmarkCheck,
  Languages as LangIcon, RefreshCw, X, Eye, EyeOff, ExternalLink,
  Search, ClipboardList, HeartPulse, Menu, CheckCircle2, LogOut,
  Gamepad2, Settings as SettingsIcon, User, Bell, Shield, Palette
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { extractMedicalData, suggestExtraQuestions, translateContent, type MedicalTerm, type ExecutiveSummary, type AIInsight } from './services/geminiService';
import { Sidebar } from './components/Sidebar';
import { HealthScore } from './components/HealthScore';
import { WellnessBadges } from './components/WellnessBadges';
import { InsightCards } from './components/InsightCards';
import { OrganMap } from './components/OrganMap';
import { KeyMetrics } from './components/KeyMetrics';
import { PastReports } from './components/PastReports';
import { MedicationTracker, type Medication } from './components/MedicationTracker';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './components/AuthPage';

// --- Colors ---
const SEVERITY_COLORS = {
  Normal: '#059669',
  Borderline: '#D97706',
  Concern: '#DC2626',
  Critical: '#991B1B',
  Informational: '#3B82F6'
};

const SEVERITY_ICONS = {
  Normal: ShieldCheck,
  Borderline: AlertCircle,
  Concern: AlertTriangle,
  Critical: AlertTriangle,
  Informational: Info
};

const CATEGORY_COLORS = {
  Diagnosis: 'bg-red-50 text-red-700 border-red-100',
  'Lab Value': 'bg-slate-50 text-oxford-blue border-slate-100',
  Medication: 'bg-slate-50 text-oxford-blue border-slate-100',
  Procedure: 'bg-slate-50 text-oxford-blue border-slate-100',
  Anatomy: 'bg-slate-50 text-oxford-blue border-slate-100',
  Abbreviation: 'bg-slate-50 text-oxford-blue border-slate-100'
};

const HighlightedTerm = ({ term, text, onToggleExpand, onSetActiveStep, expandedTerms }: { term: MedicalTerm, text: string, onToggleExpand: (t: string) => void, onSetActiveStep: (s: any) => void, expandedTerms: Set<string>, key?: React.Key }) => {
  const [position, setPosition] = useState<'center' | 'left' | 'right'>('center');

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const padding = 160; // half of w-72 + some margin
    if (rect.left < padding) setPosition('left');
    else if (window.innerWidth - rect.right < padding) setPosition('right');
    else setPosition('center');
  };

  return (
    <span 
      className="relative group bg-slate-100 border-b-2 border-oxford-blue cursor-pointer hover:bg-slate-200 transition-colors px-0.5 rounded-sm font-medium text-oxford-blue inline-block"
      onMouseEnter={handleMouseEnter}
      onClick={() => {
        onSetActiveStep('insights');
        setTimeout(() => {
          const el = document.getElementById(`term-${term.term}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (!expandedTerms.has(term.term)) onToggleExpand(term.term);
        }, 100);
      }}
    >
      {text}
      <div className={cn(
        "absolute bottom-full mb-3 w-72 p-4 bg-oxford-blue text-white text-xs rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 shadow-2xl border border-white/10 translate-y-2 group-hover:translate-y-0",
        position === 'center' && "left-1/2 -translate-x-1/2",
        position === 'left' && "left-0 translate-x-0",
        position === 'right' && "right-0 translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-black uppercase tracking-widest text-[9px] opacity-60 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            {term.category}
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
            term.severity === 'Normal' ? "bg-green-500/20 text-green-400" : 
            term.severity === 'Borderline' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
          )}>
            {term.severity}
          </div>
        </div>
        <div className="font-black text-sm mb-1.5 tracking-tight">{term.term}</div>
        <div className="opacity-80 leading-relaxed font-medium mb-3">
          {term.plain_english}
        </div>
        {term.value !== null && (
          <div className="pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="opacity-50 font-black uppercase tracking-widest text-[8px]">Result</span>
            <span className="font-mono font-black text-sm">{term.value} {term.unit}</span>
          </div>
        )}
        {/* Arrow */}
        <div className={cn(
          "absolute top-full border-[8px] border-transparent border-t-oxford-blue",
          position === 'center' && "left-1/2 -translate-x-1/2",
          position === 'left' && "left-4",
          position === 'right' && "right-4"
        )} />
      </div>
    </span>
  );
};

function MainApp() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [vitalityIndex, setVitalityIndex] = useState<number>(0);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight | null>(null);
  const [doctorQuestions, setDoctorQuestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [activeStep, setActiveStep] = useState<'dashboard' | 'insights' | 'summary' | 'physician' | 'care' | 'history' | 'meds' | 'reports' | 'report' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGameMode, setIsGameMode] = useState(() => {
    const saved = localStorage.getItem('medilens_gamemode');
    return saved === 'true';
  });
  const [settingsTab, setSettingsTab] = useState<'general' | 'profile' | 'notifications' | 'security' | 'appearance'>('general');
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    reports: true,
    medications: true
  });
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    accentColor: 'blue',
    compactMode: false
  });
  const [wellnessPoints, setWellnessPoints] = useState(() => {
    const saved = localStorage.getItem('medilens_xp');
    return saved ? parseInt(saved) : 0;
  });
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [pastReports, setPastReports] = useState<any[]>(() => {
    const saved = localStorage.getItem('medilens_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [medications, setMedications] = useState<any[]>(() => {
    const saved = localStorage.getItem('medilens_meds');
    return saved ? JSON.parse(saved) : [];
  });
  const [userLevel, setUserLevel] = useState(1);
  const [achievements, setAchievements] = useState<Set<string>>(new Set());
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());
  const [savedTerms, setSavedTerms] = useState<Set<string>>(new Set());
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());
  const [extraQuestions, setExtraQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isTranslating, setIsTranslating] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('medilens_history', JSON.stringify(pastReports));
  }, [pastReports]);

  useEffect(() => {
    localStorage.setItem('medilens_meds', JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem('medilens_xp', wellnessPoints.toString());
  }, [wellnessPoints]);

  useEffect(() => {
    localStorage.setItem('medilens_gamemode', isGameMode.toString());
  }, [isGameMode]);

  const addXp = (amount: number) => {
    setWellnessPoints(prev => prev + amount);
  };

  const processingSteps = [
    "Reading file...",
    "Identifying medical terms...",
    "Building your report..."
  ];

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setIsProcessing(true);
    setProcessingStep(0);
    setError(null);
    
    try {
      setProcessingStep(1); // Reading
      const reader = new FileReader();
      const isText = file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.doc') || file.name.endsWith('.docx');
      
      const fileData = await new Promise<string>((resolve, reject) => {
        if (isText) {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      setFileType(file.type);
      if (!isText) {
        setFilePreview(fileData);
      } else {
        setFilePreview(null);
      }

      setProcessingStep(2); // Analyzing
      const { 
        terms: extractedTerms, 
        fullText, 
        vitality_index, 
        executive_summary, 
        ai_insights, 
        doctor_questions 
      } = await extractMedicalData(fileData, file.type, isText);
      
      setProcessingStep(3); // Finalizing
      if (extractedTerms.length === 0) {
        setTerms([]);
        setOriginalText(fullText || "No medical terms identified in this document.");
        setVitalityIndex(0);
        setExecutiveSummary(null);
        setAiInsights(null);
        setDoctorQuestions([]);
      } else {
        setTerms(extractedTerms);
        setOriginalText(fullText);
        setVitalityIndex(vitality_index);
        setExecutiveSummary(executive_summary);
        setAiInsights(ai_insights);
        setDoctorQuestions(doctor_questions);
        
        // Add to history
        const newReport = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: file.type.includes('image') ? "Image Scan" : "Document Analysis",
          vitalityIndex: vitality_index,
          summary: executive_summary,
          aiInsights: ai_insights,
          terms: extractedTerms,
          fullText: fullText
        };
        setPastReports(prev => [newReport, ...prev]);
        
        // Gamification: Points for uploading
        addXp(100);
        const nextAchievements = new Set(achievements);
        nextAchievements.add('Report Pioneer');
        setAchievements(nextAchievements);
        setActiveStep('summary');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('quota') || err.message?.includes('429')) {
        setError("AI Quota Exceeded. Please wait 1-2 minutes and try again.");
      } else {
        setError("Failed to process report. Please try again with a clearer file.");
      }
      setTerms([]);
      setOriginalText(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleExpand = (term: string) => {
    const next = new Set(expandedTerms);
    if (next.has(term)) {
      next.delete(term);
    } else {
      next.add(term);
      // Gamification: Points for learning
      setWellnessPoints(prev => prev + 10);
    }
    setExpandedTerms(next);
  };

  const toggleSave = (term: string) => {
    const next = new Set(savedTerms);
    if (next.has(term)) {
      next.delete(term);
    } else {
      next.add(term);
      // Gamification: Points for saving
      setWellnessPoints(prev => prev + 5);
    }
    setSavedTerms(next);
  };

  const toggleQuestion = (q: string) => {
    const next = new Set(checkedQuestions);
    if (next.has(q)) {
      next.delete(q);
    } else {
      next.add(q);
      // Gamification: Points for prepping
      setWellnessPoints(prev => prev + 5);
    }
    setCheckedQuestions(next);
  };

  // Leveling logic
  useEffect(() => {
    const newLevel = Math.floor(wellnessPoints / 100) + 1;
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      // Achievement for leveling up
      const nextAchievements = new Set(achievements);
      nextAchievements.add(`Level ${newLevel} Achieved`);
      setAchievements(nextAchievements);
    }
  }, [wellnessPoints, userLevel, achievements]);

  const handleGenerateExtraQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const qs = await suggestExtraQuestions(terms);
      setExtraQuestions(qs);
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('quota') || err.message?.includes('429')) {
        alert("AI Quota Exceeded. Please wait 1-2 minutes and try again.");
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    setSelectedLanguage(lang);
    if (lang === 'English') return;
    setIsTranslating(true);
    try {
      const contentToTranslate = terms.map(t => t.suggestion).join("\n");
      const translated = await translateContent(contentToTranslate, lang);
      // In a real app we'd update the terms state with translated suggestions
      // For this demo we'll just show a toast or similar
      console.log("Translated content:", translated);
    } catch (err: any) {
      console.error(err);
      if (err.message?.toLowerCase().includes('quota') || err.message?.includes('429')) {
        alert("AI Quota Exceeded. Please wait 1-2 minutes and try again.");
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const displayTerms = useMemo(() => {
    // Include all terms in the Insights tab, but we'll render them differently
    return terms;
  }, [terms]);

  const highlightedReport = useMemo(() => {
    if (!originalText) return null;

    // Pre-format text to ensure headers are on new lines for better structure
    const headers = [
      'LABORATORY REPORT', 'Patient Name', 'DOB/Age/Gender', 'Bill Date', 
      'Patient ID', 'Sample Collected', 'Referred By', 'Sample Received', 
      'Sample Type', 'Report Date', 'Barcode No', 'Report Status', 
      'Test Description', 'HEMATOLOGY REPORT', 'Blood Count', 'RBC PARAMETERS',
      'Method:', 'DIFFERENTIAL LEUCOCYTE COUNT', 'Absolute leukocyte counts',
      'Hemoglobin', 'RBC Count', 'PCV', 'MCV', 'MCH', 'MCHC', 'RDW', 'TLC',
      'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'
    ];
    
    let text = originalText;
    headers.forEach(header => {
      const regex = new RegExp(`(?<!\\n)${header}`, 'g');
      text = text.replace(regex, `\n${header}`);
    });

    // Clean up multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    
    // Sort terms by length descending to avoid partial matches
    const sortedTerms = [...displayTerms].sort((a, b) => b.term.length - a.term.length);
    
    let parts: (string | React.ReactNode)[] = [text];

    sortedTerms.forEach(term => {
      const newParts: (string | React.ReactNode)[] = [];
      parts.forEach((part, partIndex) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        
        const regex = new RegExp(`(${term.term})`, 'gi');
        const split = part.split(regex);
        
        split.forEach((s, i) => {
          if (s.toLowerCase() === term.term.toLowerCase()) {
            newParts.push(
              <HighlightedTerm 
                key={`${term.term}-${partIndex}-${i}`}
                term={term}
                text={s}
                onToggleExpand={toggleExpand}
                onSetActiveStep={setActiveStep}
                expandedTerms={expandedTerms}
              />
            );
          } else if (s !== '') {
            newParts.push(s);
          }
        });
      });
      parts = newParts;
    });
    
    return parts;
  }, [originalText, displayTerms, expandedTerms]);

  const healthScore = useMemo(() => {
    if (vitalityIndex > 0) return vitalityIndex;
    if (terms.length === 0) return 100; // Default to 100 if no terms (or maybe 0 if no report?)
    
    const criticalCount = terms.filter(t => t.severity === 'Critical').length;
    const concernCount = terms.filter(t => t.severity === 'Concern').length;
    const borderlineCount = terms.filter(t => t.severity === 'Borderline').length;
    
    // Multiplicative approach for more realistic medical scoring
    // A single critical finding should significantly impact the score
    let score = 100;
    
    // Deduct for each severity type
    // Critical: -35% each
    // Concern: -15% each
    // Borderline: -5% each
    for (let i = 0; i < criticalCount; i++) score *= 0.65;
    for (let i = 0; i < concernCount; i++) score *= 0.85;
    for (let i = 0; i < borderlineCount; i++) score *= 0.95;
    
    return Math.round(score);
  }, [terms, vitalityIndex]);

  const healthScoreAnalysis = useMemo(() => {
    const critical = terms.filter(t => t.severity === 'Critical');
    const concern = terms.filter(t => t.severity === 'Concern');
    const borderline = terms.filter(t => t.severity === 'Borderline');
    const normal = terms.filter(t => t.severity === 'Normal');

    return {
      critical,
      concern,
      borderline,
      normal,
      total: terms.length,
      impact: {
        critical: critical.length > 0 ? `Significant impact from ${critical.length} critical finding${critical.length > 1 ? 's' : ''}` : null,
        concern: concern.length > 0 ? `Moderate impact from ${concern.length} concern${concern.length > 1 ? 's' : ''}` : null,
        borderline: borderline.length > 0 ? `Minor impact from ${borderline.length} borderline value${borderline.length > 1 ? 's' : ''}` : null,
      }
    };
  }, [terms]);

  const readProgress = useMemo(() => {
    if (terms.length === 0) return 0;
    return Math.round((expandedTerms.size / terms.length) * 100);
  }, [expandedTerms, terms]);

  const analyticsData = useMemo(() => {
    return terms
      .filter(t => t.value !== null)
      .map(t => ({
        name: t.term,
        value: t.value,
        min: t.reference_min,
        max: t.reference_max,
        unit: t.unit
      }));
  }, [terms]);

  const severityDistribution = useMemo(() => {
    const counts: Record<string, number> = { Normal: 0, Borderline: 0, Concern: 0, Critical: 0, Informational: 0 };
    terms.forEach(t => counts[t.severity]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [terms]);

  const deviationData = useMemo(() => {
    return terms
      .filter(t => t.value !== null && t.reference_min !== null && t.reference_max !== null && t.severity !== 'Informational')
      .map(t => {
        const mid = (t.reference_min! + t.reference_max!) / 2;
        const range = t.reference_max! - t.reference_min!;
        // Assuming reference range is +/- 2 SD (95% interval), so range = 4 SD
        const sd = range / 4;
        const deviation = sd !== 0 ? (t.value! - mid) / sd : 0;
        
        // Percentage relative to reference range (0 = min, 100 = max)
        const percent = range !== 0 ? ((t.value! - t.reference_min!) / range) * 100 : 50;

        return {
          name: t.term,
          deviation: parseFloat(deviation.toFixed(2)),
          percent: parseFloat(percent.toFixed(1)),
          actual: t.value,
          unit: t.unit,
          min: t.reference_min,
          max: t.reference_max,
          severity: t.severity
        };
      })
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  }, [terms]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    terms.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [terms]);

  return (
    <div className="min-h-screen bg-clinic-calm pb-20 font-sans text-base">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 text-oxford-blue hover:bg-slate-50 rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-oxford-blue p-2.5 rounded-2xl shadow-lg shadow-oxford-blue/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-oxford-blue leading-none tracking-tight">MediLens</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Clinical Decision Support</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsGameMode(!isGameMode)}
              className={cn(
                "p-2.5 rounded-xl transition-all border shadow-sm flex items-center gap-2",
                isGameMode 
                  ? "bg-amber-400 border-amber-500 text-oxford-blue font-black text-[10px] uppercase tracking-widest" 
                  : "bg-white border-slate-100 text-slate-400 hover:text-oxford-blue"
              )}
              title={isGameMode ? "Disable Game Mode" : "Enable Game Mode"}
            >
              <Gamepad2 className={cn("w-5 h-5", isGameMode && "animate-bounce")} />
              {isGameMode && <span className="hidden sm:inline">Game Mode ON</span>}
            </button>

            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
              <div className="relative">
                <div className="w-10 h-10 bg-oxford-blue rounded-xl flex items-center justify-center text-white font-black text-sm overflow-hidden">
                  {user?.photo ? (
                    <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    user?.fullName.charAt(0) || userLevel
                  )}
                </div>
                {!user?.isGuest && (
                  <motion.div 
                    key={userLevel}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-oxford-blue text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white"
                  >
                    LVL {userLevel}
                  </motion.div>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-oxford-blue uppercase tracking-widest truncate max-w-[80px]">
                    {user?.fullName || 'Health XP'}
                  </span>
                  {user?.isGuest && (
                    <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Guest</span>
                  )}
                </div>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <motion.div 
                    className="h-full bg-oxford-blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${wellnessPoints % 100}%` }}
                  />
                </div>
              </div>
            </div>

            {terms.length > 0 && (
              <button 
                onClick={() => {
                  setTerms([]);
                  setOriginalText(null);
                  setFilePreview(null);
                  setFileName(null);
                  setFileType(null);
                  setVitalityIndex(0);
                  setExecutiveSummary(null);
                  setAiInsights(null);
                  setDoctorQuestions([]);
                  setExpandedTerms(new Set());
                  setSavedTerms(new Set());
                  setCheckedQuestions(new Set());
                  setExtraQuestions([]);
                  setActiveStep('dashboard');
                }}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Clear Report"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        <Sidebar 
          activeTab={activeStep} 
          setActiveTab={setActiveStep} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          onLogout={() => setShowLogoutConfirm(true)}
        />

        <main className="flex-1 overflow-y-auto bg-clinic-calm p-4 sm:p-6 lg:p-8">
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center">
              <div className="relative w-32 h-32 mb-12">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-slate-100 rounded-[2.5rem]"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-4 border-dashed border-oxford-blue/30 rounded-[2rem]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className="w-12 h-12 text-oxford-blue animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-oxford-blue mb-4 tracking-tight">
                {processingStep === 1 ? 'Reading Document...' : 
                 processingStep === 2 ? 'AI Analysis in Progress...' : 
                 'Finalizing Insights...'}
              </h2>
              <p className="text-slate-500 font-medium mb-12">
                Our advanced AI is decoding your medical report to provide clear, actionable insights.
              </p>

              <div className="w-full space-y-4">
                {[
                  { step: 1, label: 'Text Extraction', icon: FileText },
                  { step: 2, label: 'Medical Entity Recognition', icon: Activity },
                  { step: 3, label: 'Insight Synthesis', icon: Zap },
                ].map((s) => (
                  <div 
                    key={s.step}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                      processingStep >= s.step ? "bg-white border-slate-100 shadow-sm" : "opacity-40 border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      processingStep >= s.step ? "bg-oxford-blue text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <span className="font-black text-sm text-oxford-blue">{s.label}</span>
                    {processingStep === s.step && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className="flex-1 h-1 bg-slate-100 rounded-full ml-4 overflow-hidden"
                      >
                        <motion.div 
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="w-1/2 h-full bg-oxford-blue"
                        />
                      </motion.div>
                    )}
                    {processingStep > s.step && (
                      <div className="ml-auto text-green-500">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : terms.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-12 border border-slate-100">
                <div className="mb-8 flex justify-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                    <ShieldCheck className="w-12 h-12 text-oxford-blue" />
                  </div>
                </div>
                <h2 className="text-4xl font-black text-oxford-blue mb-4 tracking-tight">Welcome to MediLens</h2>
                <p className="text-lg text-slate-500 mb-12 max-w-md mx-auto leading-relaxed">
                  Clinical Decision Support for medical reports. Upload a document to begin your analysis.
                </p>
                
                {error && (
                  <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-700 text-sm animate-in fade-in slide-in-from-top-4">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    </div>
                    <p className="font-semibold text-left flex-1">{error}</p>
                    <button 
                      onClick={() => setError(null)} 
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 transition-all hover:border-oxford-blue hover:bg-slate-50 cursor-pointer group relative overflow-hidden"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) handleFileUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-oxford-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-xl font-bold text-oxford-blue">Drop your report here</p>
                    <p className="text-sm text-slate-400 mt-3 font-medium">Supports PDF, Images, CSV, Text, and Word docs</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Dashboard View */}
              {activeStep === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Game Mode Quests */}
              {isGameMode && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2.5rem] p-8 shadow-xl shadow-amber-200/50 text-oxford-blue relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Gamepad2 className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/30 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                        <Zap className="w-3 h-3 fill-current" />
                        Active Health Quest
                      </div>
                      <h3 className="text-3xl font-black tracking-tight leading-none">The Insight Seeker</h3>
                      <p className="text-sm font-bold opacity-80 max-w-md">
                        Review all {terms.length} clinical findings to earn +50 Health XP and reach Level {userLevel + 1}!
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-black tracking-tighter">50</div>
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60">XP REWARD</div>
                      </div>
                      <div className="w-px h-12 bg-oxford-blue/10" />
                      <button className="px-8 py-4 bg-oxford-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-oxford-blue/20 hover:scale-105 transition-all">
                        Start Quest
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Executive Summary Card */}
              {executiveSummary && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <FileText className="w-40 h-40 text-oxford-blue" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-oxford-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-oxford-blue/20">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-oxford-blue tracking-tight">Executive Summary</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Clinical Overview & Insights</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-8">
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Overview</h4>
                          <p className="text-lg text-slate-600 font-medium leading-relaxed">
                            {executiveSummary.overview}
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Key Findings</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {executiveSummary.key_findings.map((finding, i) => (
                              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-5 h-5 bg-oxford-blue rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <p className="text-sm text-slate-600 font-bold leading-snug">{finding}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Clinical Outlook</h4>
                          <p className="text-sm text-slate-600 font-bold leading-relaxed italic">
                            "{executiveSummary.clinical_outlook}"
                          </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <ShieldCheck className="w-5 h-5 text-oxford-blue" />
                            </div>
                            <p className="text-[10px] font-black text-oxford-blue uppercase tracking-widest leading-tight">
                              AI-Powered Clinical <br /> Analysis Engine
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Visual Severity Breakdown & Organ Map */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-8">Severity Breakdown</h3>
                    <div className="flex items-center justify-center h-64 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Critical', value: terms.filter(t => t.severity === 'Critical').length, color: '#EF4444' },
                              { name: 'Concern', value: terms.filter(t => t.severity === 'Concern').length, color: '#F59E0B' },
                              { name: 'Borderline', value: terms.filter(t => t.severity === 'Borderline').length, color: '#3B82F6' },
                              { name: 'Normal', value: terms.filter(t => t.severity === 'Normal').length, color: '#10B981' },
                            ].filter(d => d.value > 0)}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Critical', color: '#EF4444' },
                              { name: 'Concern', color: '#F59E0B' },
                              { name: 'Borderline', color: '#3B82F6' },
                              { name: 'Normal', color: '#10B981' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-oxford-blue">{terms.length}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Findings</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {[
                        { label: 'Critical', count: terms.filter(t => t.severity === 'Critical').length, color: 'bg-red-500', xp: 20 },
                        { label: 'Concern', count: terms.filter(t => t.severity === 'Concern').length, color: 'bg-amber-500', xp: 15 },
                        { label: 'Borderline', count: terms.filter(t => t.severity === 'Borderline').length, color: 'bg-blue-500', xp: 10 },
                        { label: 'Normal', count: terms.filter(t => t.severity === 'Normal').length, color: 'bg-green-500', xp: 5 },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 group relative">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", s.color)} />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-oxford-blue">{s.count}</span>
                            {isGameMode && (
                              <div className="hidden group-hover:flex absolute -top-2 -right-2 bg-amber-400 text-oxford-blue text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white shadow-sm animate-bounce">
                                +{s.xp} XP
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top 3 Priority Findings */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                    <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-8">Priority Findings</h3>
                    <div className="space-y-4">
                      {terms
                        .filter(t => t.severity === 'Critical' || t.severity === 'Concern')
                        .slice(0, 3)
                        .map((t, i) => (
                          <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4 group hover:bg-white hover:shadow-lg transition-all">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                              t.severity === 'Critical' ? "bg-red-500" : "bg-amber-500"
                            )}>
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-oxford-blue uppercase tracking-tight">{t.term}</h4>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                  t.severity === 'Critical' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                )}>
                                  {t.severity}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                {t.plain_english || "Clinical finding requiring medical attention and follow-up."}
                              </p>
                            </div>
                          </div>
                        ))}
                      {terms.filter(t => t.severity === 'Critical' || t.severity === 'Concern').length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10">
                          <CheckCircle2 className="w-12 h-12 text-green-500 mb-4 opacity-20" />
                          <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Critical Findings</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <OrganMap 
                  terms={terms} 
                  selectedSystem={selectedSystem} 
                  onFilterBySystem={setSelectedSystem} 
                />
              </div>

              {/* Standard Deviation Analysis */}
              {deviationData.length > 0 && (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-lg font-black text-oxford-blue uppercase tracking-tight flex items-center gap-2">
                        <Activity className="w-5 h-5 text-oxford-blue" />
                        Result vs. Reference Range
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 font-medium">
                        Visualizing where your results sit relative to the normal range. 
                        <span className="text-green-600 ml-1">0% to 100% is the normal zone.</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "w-full overflow-y-auto pr-2",
                    deviationData.length > 5 ? "h-[500px]" : "h-[300px]"
                  )}>
                    <ResponsiveContainer width="100%" height={Math.max(300, deviationData.length * 40)}>
                      <BarChart 
                        data={deviationData} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                        <XAxis type="number" domain={[-50, 150]} hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 10, fontWeight: 800, fill: '#1D2D50' }}
                          width={100}
                        />
                        <Tooltip 
                          cursor={{ fill: '#F8FAFC' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const isHigh = data.percent > 100;
                              const isLow = data.percent < 0;
                              const isNormal = !isHigh && !isLow;

                              return (
                                <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 text-xs min-w-[220px]">
                                  <p className="font-black text-oxford-blue mb-3 border-b border-slate-100 pb-2 uppercase tracking-wider">{data.name}</p>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Your Result:</span>
                                      <span className="font-black text-oxford-blue">{data.actual} {data.unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400 font-bold uppercase tracking-tighter">Normal Range:</span>
                                      <span className="font-bold text-slate-600">{data.min} – {data.max}</span>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "mt-4 p-2 rounded-xl text-center font-black text-[9px] uppercase tracking-[0.2em]",
                                    isNormal ? "bg-green-50 text-green-700" : 
                                    isHigh ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                                  )}>
                                    {isNormal ? "✓ Within Normal Range" : 
                                     isHigh ? "↑ Above Borderline" : "↓ Below Borderline"}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine x={0} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Min', fill: '#10B981', fontSize: 8 }} />
                        <ReferenceLine x={100} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Max', fill: '#10B981', fontSize: 8 }} />
                        <ReferenceLine x={50} stroke="#E2E8F0" label={{ position: 'bottom', value: 'Mean', fill: '#94A3B8', fontSize: 8 }} />
                        
                        <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={15}>
                          {deviationData.map((entry, index) => {
                            const isNormal = entry.percent >= 0 && entry.percent <= 100;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isNormal ? '#10B981' : '#EF4444'} 
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Structured Findings Table */}
              {terms.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-oxford-blue p-2 rounded-xl shadow-lg shadow-oxford-blue/20">
                      <ClipboardList className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-oxford-blue uppercase tracking-[0.2em]">Structured Clinical Findings</h3>
                  </div>
                  
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Marker</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Result</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trend</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Reference Range</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {terms.map((term, i) => (
                          <tr 
                            key={i} 
                            className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                            onClick={() => {
                              setActiveStep('insights');
                              setTimeout(() => {
                                const el = document.getElementById(`term-${term.term}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", 
                                  term.severity === 'Critical' ? "bg-red-600" : 
                                  term.severity === 'Concern' ? "bg-red-400" : 
                                  term.severity === 'Borderline' ? "bg-amber-500" : "bg-green-600"
                                )} />
                                <span className="font-bold text-oxford-blue group-hover:text-oxford-blue transition-colors">{term.term}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{term.category}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              {term.value !== null ? (
                                <span className="font-mono font-black text-oxford-blue">{term.value} <span className="text-[10px] text-slate-400">{term.unit}</span></span>
                              ) : (
                                <span className="text-slate-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-center">
                              {term.trend ? (
                                <div className="flex flex-col items-center">
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    term.trend.toLowerCase().includes('improving') ? "text-green-600" :
                                    term.trend.toLowerCase().includes('declining') ? "text-red-600" : "text-slate-400"
                                  )}>
                                    {term.trend}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-center">
                              {term.reference_min !== null ? (
                                <span className="text-xs font-bold text-slate-500">{term.reference_min} – {term.reference_max}</span>
                              ) : (
                                <span className="text-slate-300 font-bold">—</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                term.severity === 'Critical' ? "bg-red-50 text-red-700 border-red-100" : 
                                term.severity === 'Concern' ? "bg-red-50 text-red-600 border-red-100" : 
                                term.severity === 'Borderline' ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-green-50 text-green-700 border-green-100"
                              )}>
                                {term.severity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Critical', count: terms.filter(t => t.severity === 'Critical').length, color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'Concern', count: terms.filter(t => t.severity === 'Concern').length, color: 'text-red-400', bg: 'bg-red-50' },
                  { label: 'Borderline', count: terms.filter(t => t.severity === 'Borderline').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Normal', count: terms.filter(t => t.severity === 'Normal').length, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                  <div key={i} className={cn("p-6 rounded-[2rem] border border-white/20 shadow-sm", stat.bg)}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                    <p className={cn("text-3xl font-black", stat.color)}>{stat.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History View */}
          {activeStep === 'history' && (
            <PastReports 
              reports={pastReports} 
              onDelete={(id) => setPastReports(prev => prev.filter(r => r.id !== id))}
              onSelect={(report) => {
                setTerms(report.terms);
                setOriginalText(report.fullText);
                setVitalityIndex(report.vitalityIndex);
                setExecutiveSummary(report.summary);
                setAiInsights(report.aiInsights);
                setActiveStep('summary');
              }}
            />
          )}

          {/* Settings View */}
          {activeStep === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-oxford-blue p-3 rounded-2xl shadow-lg shadow-oxford-blue/20">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-oxford-blue tracking-tight">Settings</h2>
                  <p className="text-slate-400 font-medium">Customize your health experience</p>
                </div>
                <button 
                  onClick={() => setActiveStep('dashboard')}
                  className="px-6 py-3 bg-white border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-oxford-blue hover:shadow-sm transition-all"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-oxford-blue rounded-3xl flex items-center justify-center text-white font-black text-3xl mb-4 shadow-xl shadow-oxford-blue/20 overflow-hidden">
                        {user?.photo ? (
                          <img src={user.photo} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          user?.fullName.charAt(0)
                        )}
                      </div>
                      <h3 className="font-black text-oxford-blue text-lg">{user?.fullName}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.email}</p>
                      <div className="mt-4 px-4 py-1.5 bg-amber-400 text-oxford-blue text-[10px] font-black rounded-full uppercase tracking-widest">
                        Level {userLevel} Health Pioneer
                      </div>
                    </div>
                  </div>

                  <nav className="space-y-2">
                    {[
                      { id: 'general', label: 'General', icon: SettingsIcon },
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'notifications', label: 'Notifications', icon: Bell },
                      { id: 'security', label: 'Security', icon: Shield },
                      { id: 'appearance', label: 'Appearance', icon: Palette },
                    ].map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => setSettingsTab(item.id as any)}
                        className={cn(
                          "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-sm",
                          settingsTab === item.id 
                            ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" 
                            : "text-slate-400 hover:bg-white hover:text-oxford-blue hover:shadow-sm"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="md:col-span-2 space-y-6">
                  {settingsTab === 'general' && (
                    <>
                      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                        <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">General Preferences</h3>
                        
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-black text-oxford-blue text-sm">Game Mode</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Enable gamified health tracking</p>
                            </div>
                            <button 
                              onClick={() => setIsGameMode(!isGameMode)}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                isGameMode ? "bg-oxford-blue" : "bg-slate-200"
                              )}
                            >
                              <motion.div 
                                animate={{ x: isGameMode ? 24 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-black text-oxford-blue text-sm">AI Analysis Depth</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Level of clinical detail in reports</p>
                            </div>
                            <select className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-oxford-blue outline-none focus:ring-2 focus:ring-oxford-blue/20">
                              <option>Standard</option>
                              <option>Deep Analysis</option>
                              <option>Physician Level</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-black text-oxford-blue text-sm">Language</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Interface and report language</p>
                            </div>
                            <select 
                              value={selectedLanguage}
                              onChange={(e) => setSelectedLanguage(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-oxford-blue outline-none focus:ring-2 focus:ring-oxford-blue/20"
                            >
                              <option>English</option>
                              <option>Spanish</option>
                              <option>French</option>
                              <option>German</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                        <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">Privacy & Data</h3>
                        <div className="space-y-4">
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Your medical data is processed using advanced AI. We do not store your reports permanently unless you save them to your history. All processing is encrypted and HIPAA-compliant.
                          </p>
                          <div className="flex gap-4">
                            <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">
                              Export Data
                            </button>
                            <button className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'profile' && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">Profile Settings</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                              type="text" 
                              defaultValue={user?.fullName}
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue focus:ring-2 focus:ring-oxford-blue/20 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                              type="email" 
                              defaultValue={user?.email}
                              disabled
                              className="w-full bg-slate-100 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                            <input 
                              type="date" 
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue focus:ring-2 focus:ring-oxford-blue/20 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Type</label>
                            <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue focus:ring-2 focus:ring-oxford-blue/20 outline-none transition-all">
                              <option>A+</option>
                              <option>A-</option>
                              <option>B+</option>
                              <option>B-</option>
                              <option>O+</option>
                              <option>O-</option>
                              <option>AB+</option>
                              <option>AB-</option>
                            </select>
                          </div>
                        </div>
                        <button className="px-8 py-4 bg-oxford-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-oxford-blue/20 hover:scale-105 transition-all">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'notifications' && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">Notification Preferences</h3>
                      <div className="space-y-4">
                        {[
                          { id: 'email', label: 'Email Notifications', desc: 'Receive report summaries via email' },
                          { id: 'push', label: 'Push Notifications', desc: 'Get instant alerts on your device' },
                          { id: 'reports', label: 'Report Ready Alerts', desc: 'Notify when AI analysis is complete' },
                          { id: 'medications', label: 'Medication Reminders', desc: 'Alerts for scheduled doses' },
                        ].map((pref) => (
                          <div key={pref.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div>
                              <p className="font-black text-oxford-blue text-sm">{pref.label}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{pref.desc}</p>
                            </div>
                            <button 
                              onClick={() => setNotificationSettings(prev => ({ ...prev, [pref.id]: !prev[pref.id as keyof typeof prev] }))}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                notificationSettings[pref.id as keyof typeof notificationSettings] ? "bg-oxford-blue" : "bg-slate-200"
                              )}
                            >
                              <motion.div 
                                animate={{ x: notificationSettings[pref.id as keyof typeof notificationSettings] ? 24 : 4 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === 'security' && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">Security & Privacy</h3>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Change Password</h4>
                          <div className="space-y-4">
                            <input 
                              type="password" 
                              placeholder="Current Password"
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue focus:ring-2 focus:ring-oxford-blue/20 outline-none transition-all"
                            />
                            <input 
                              type="password" 
                              placeholder="New Password"
                              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm font-bold text-oxford-blue focus:ring-2 focus:ring-oxford-blue/20 outline-none transition-all"
                            />
                            <button className="px-8 py-4 bg-oxford-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-oxford-blue/20 hover:scale-105 transition-all">
                              Update Password
                            </button>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                          <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100">
                            <div>
                              <p className="font-black text-oxford-blue text-sm">Two-Factor Authentication</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Add an extra layer of security</p>
                            </div>
                            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-oxford-blue hover:bg-slate-50 transition-all">
                              Enable
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'appearance' && (
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-300">
                      <h3 className="text-xl font-black text-oxford-blue tracking-tight mb-6">Appearance Settings</h3>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Theme Mode</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: 'light', label: 'Light', icon: Eye },
                              { id: 'dark', label: 'Dark', icon: Moon },
                              { id: 'system', label: 'System', icon: RefreshCw },
                            ].map((theme) => (
                              <button 
                                key={theme.id}
                                onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: theme.id }))}
                                className={cn(
                                  "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                                  appearanceSettings.theme === theme.id 
                                    ? "bg-oxford-blue border-oxford-blue text-white shadow-lg" 
                                    : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
                                )}
                              >
                                <theme.icon className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{theme.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4 pt-8 border-t border-slate-100">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Accent Color</h4>
                          <div className="flex gap-4">
                            {['blue', 'emerald', 'violet', 'rose', 'amber'].map((color) => (
                              <button 
                                key={color}
                                onClick={() => setAppearanceSettings(prev => ({ ...prev, accentColor: color }))}
                                className={cn(
                                  "w-10 h-10 rounded-full border-4 transition-all",
                                  appearanceSettings.accentColor === color ? "border-oxford-blue scale-110" : "border-transparent",
                                  color === 'blue' && "bg-blue-500",
                                  color === 'emerald' && "bg-emerald-500",
                                  color === 'violet' && "bg-violet-500",
                                  color === 'rose' && "bg-rose-500",
                                  color === 'amber' && "bg-amber-500"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meds View */}
          {activeStep === 'meds' && (
            <MedicationTracker 
              medications={medications}
              onAdd={(med) => {
                const newMed: Medication = {
                  ...med,
                  id: Date.now().toString(),
                  adherence: {}
                };
                setMedications(prev => [...prev, newMed]);
                addXp(50);
              }}
              onDelete={(id) => setMedications(prev => prev.filter(m => m.id !== id))}
              onToggleAdherence={(id, date) => {
                setMedications(prev => prev.map(m => {
                  if (m.id === id) {
                    const newAdherence = { ...m.adherence };
                    newAdherence[date] = !newAdherence[date];
                    if (newAdherence[date]) addXp(10);
                    return { ...m, adherence: newAdherence };
                  }
                  return m;
                }));
              }}
              onToggleReminders={(id) => {
                setMedications(prev => prev.map(m => 
                  m.id === id ? { ...m, reminders: !m.reminders } : m
                ));
              }}
              terms={terms}
            />
          )}

          {/* Step Content */}
          <div className="max-w-6xl mx-auto space-y-8">
            {activeStep === 'summary' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Bento Grid Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Health Score Card */}
                  <div className="md:col-span-1 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
                    <div className="relative w-40 h-40 mb-6">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#F8FAFC" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" 
                          stroke={healthScore > 80 ? "#059669" : healthScore > 50 ? "#D97706" : "#DC2626"} 
                          strokeWidth="8" 
                          strokeDasharray="283"
                          strokeDashoffset={283 - (283 * healthScore) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-oxford-blue">{healthScore}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-oxford-blue mb-1">Clinical Status</h3>
                    <p className={cn(
                      "text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full inline-block",
                      healthScore > 80 ? "bg-green-50 text-green-700" : 
                      healthScore > 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    )}>
                      {healthScore > 80 ? "Optimal" : healthScore > 50 ? "Moderate" : "Action Required"}
                    </p>
                  </div>

                  {/* Findings Breakdown */}
                  <div className="md:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-oxford-blue uppercase tracking-tight">Findings Analysis</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total: {terms.length} Markers</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Critical', count: terms.filter(t => t.severity === 'Critical').length, color: 'bg-red-600', icon: AlertTriangle },
                        { label: 'Concern', count: terms.filter(t => t.severity === 'Concern').length, color: 'bg-red-400', icon: AlertCircle },
                        { label: 'Borderline', count: terms.filter(t => t.severity === 'Borderline').length, color: 'bg-amber-500', icon: Activity },
                        { label: 'Normal', count: terms.filter(t => t.severity === 'Normal').length, color: 'bg-green-600', icon: ShieldCheck },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                            <s.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className="text-xl font-black text-oxford-blue">{s.count}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lab Deviation Chart */}
                  {deviationData.length > 0 && (
                    <div className="md:col-span-3 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-lg font-black text-oxford-blue uppercase tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-oxford-blue" />
                            Lab Value Analysis
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Visual representation of all lab results relative to their reference ranges.</p>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "w-full overflow-y-auto pr-2",
                        deviationData.length > 8 ? "h-[600px]" : "h-[400px]"
                      )}>
                        <ResponsiveContainer width="100%" height={Math.max(400, deviationData.length * 40)}>
                          <BarChart 
                            data={deviationData} 
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                            <XAxis type="number" domain={[-50, 150]} hide />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              tick={{ fontSize: 10, fontWeight: 800, fill: '#1D2D50' }}
                              width={100}
                            />
                            <Tooltip 
                              cursor={{ fill: '#F8FAFC' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  const isHigh = data.percent > 100;
                                  const isLow = data.percent < 0;
                                  const isNormal = !isHigh && !isLow;

                                  return (
                                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 text-xs min-w-[220px]">
                                      <p className="font-black text-oxford-blue mb-3 border-b border-slate-100 pb-2 uppercase tracking-wider">{data.name}</p>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-bold uppercase tracking-tighter">Your Result:</span>
                                          <span className="font-black text-oxford-blue">{data.actual} {data.unit}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-400 font-bold uppercase tracking-tighter">Normal Range:</span>
                                          <span className="font-bold text-slate-600">{data.min} – {data.max}</span>
                                        </div>
                                      </div>
                                      <div className={cn(
                                        "mt-4 p-2 rounded-xl text-center font-black text-[9px] uppercase tracking-[0.2em]",
                                        isNormal ? "bg-green-50 text-green-700" : 
                                        isHigh ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                                      )}>
                                        {isNormal ? "✓ Within Normal Range" : 
                                         isHigh ? "↑ Above Borderline" : "↓ Below Borderline"}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <ReferenceLine x={0} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Min', fill: '#10B981', fontSize: 8 }} />
                            <ReferenceLine x={100} stroke="#10B981" strokeDasharray="3 3" label={{ position: 'top', value: 'Max', fill: '#10B981', fontSize: 8 }} />
                            <ReferenceLine x={50} stroke="#E2E8F0" label={{ position: 'bottom', value: 'Mean', fill: '#94A3B8', fontSize: 8 }} />
                            
                            <Bar dataKey="percent" radius={[0, 4, 4, 0]} barSize={15}>
                              {deviationData.map((entry, index) => {
                                const isNormal = entry.percent >= 0 && entry.percent <= 100;
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={isNormal ? '#10B981' : '#EF4444'} 
                                  />
                                );
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Top Priorities */}
                  <div className="md:col-span-3 bg-oxford-blue rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Zap className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-400" />
                          Immediate Clinical Priorities
                        </h3>
                        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
                          <ShieldCheck className="w-3 h-3 text-green-400" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Validated Insights</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {terms.filter(t => t.severity === 'Critical' || t.severity === 'Concern').map((term, i) => (
                          <div 
                            key={i} 
                            className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-all cursor-pointer group"
                            onClick={() => {
                              setActiveStep('insights');
                              setTimeout(() => {
                                const el = document.getElementById(`term-${term.term}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }, 100);
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  term.severity === 'Critical' ? "bg-red-500" : "bg-amber-500"
                                )} />
                                <h4 className="font-bold text-sm group-hover:text-amber-400 transition-colors">{term.term}</h4>
                              </div>
                              {term.citation_source && (
                                <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest">{term.citation_source}</span>
                              )}
                            </div>
                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{term.suggestion}</p>
                          </div>
                        ))}
                        {terms.filter(t => t.severity === 'Critical' || t.severity === 'Concern').length === 0 && (
                          <div className="col-span-2 py-8 text-center">
                            <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                            <p className="text-sm font-bold opacity-70">No critical flags identified. Review the full report for details.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(activeStep === 'report' || activeStep === 'reports') && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Original Report View */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                  <div className="bg-slate-50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <h3 className="font-black text-oxford-blue uppercase tracking-[0.2em] text-[10px]">Annotated Clinical Data</h3>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medical Jargon</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Interactive Analysis</span>
                    </div>
                  </div>
                  <div className="p-10">
                    <div className="max-w-none mb-12">
                      {originalText ? (
                        <div className="whitespace-pre-wrap font-serif text-xl leading-[2.2] text-slate-700 bg-slate-50/30 p-12 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-visible tracking-tight">
                          <div className="absolute top-8 right-8 opacity-[0.03] pointer-events-none">
                            <Stethoscope className="w-64 h-64" />
                          </div>
                          <div className="relative z-10 space-y-6">
                            {highlightedReport}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-[2rem] border-2 border-dashed border-slate-200">
                          <Upload className="w-12 h-12 text-slate-300 mb-6" />
                          <h3 className="text-xl font-black text-slate-600 mb-2">No Report Loaded</h3>
                          <p className="text-slate-400 text-sm max-w-xs text-center font-medium">
                            Please upload a document to generate your clinical analysis.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <Info className="w-4 h-4 text-oxford-blue" />
                      <span>Click any highlighted term to jump to clinical insights</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'insights' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Findings Dashboard Line */}
                <div className="bg-white rounded-[1.5rem] shadow-sm p-6 border border-slate-100 flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-oxford-blue p-3 rounded-2xl shadow-lg shadow-oxford-blue/20">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-oxford-blue leading-tight">Clinical Markers</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{terms.length} Terms Identified</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      { label: 'Critical', count: terms.filter(t => t.severity === 'Critical').length, color: 'bg-red-600' },
                      { label: 'Concern', count: terms.filter(t => t.severity === 'Concern').length, color: 'bg-red-400' },
                      { label: 'Borderline', count: terms.filter(t => t.severity === 'Borderline').length, color: 'bg-amber-500' },
                      { label: 'Normal', count: terms.filter(t => t.severity === 'Normal').length, color: 'bg-green-600' },
                    ].filter(s => s.count > 0).map((s, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className={cn("w-2 h-2 rounded-full", s.color)}></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.count} {s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {displayTerms.map((term, idx) => (
                    <div 
                      key={idx}
                      id={`term-${term.term}`}
                      className={cn(
                        "bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500 border-l-[12px]",
                        expandedTerms.has(term.term) ? "ring-4 ring-slate-100" : "hover:shadow-2xl hover:shadow-slate-300/50"
                      )}
                      style={{ borderLeftColor: SEVERITY_COLORS[term.severity] }}
                    >
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-black text-oxford-blue tracking-tight">{term.term}</h3>
                            <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", CATEGORY_COLORS[term.category])}>
                              {term.category}
                            </span>
                            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                              {React.createElement(SEVERITY_ICONS[term.severity], { className: "w-3 h-3" })}
                              {term.severity}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => toggleSave(term.term)}
                              className={cn(
                                "p-3 rounded-2xl transition-all border-2",
                                savedTerms.has(term.term) 
                                  ? "bg-oxford-blue border-oxford-blue text-white shadow-lg shadow-oxford-blue/20" 
                                  : "bg-white border-slate-100 text-slate-300 hover:text-oxford-blue hover:border-oxford-blue"
                              )}
                              aria-label="Save term"
                            >
                              {savedTerms.has(term.term) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => toggleExpand(term.term)}
                              className="p-3 bg-slate-50 text-slate-400 hover:text-oxford-blue hover:bg-slate-100 rounded-2xl transition-all border border-slate-100"
                              aria-label="Expand details"
                            >
                              {expandedTerms.has(term.term) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-600 leading-relaxed mb-8 text-lg font-medium">
                          {term.plain_english}
                        </p>

                        {term.value !== null && (
                          <div className="mb-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-end mb-6">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {term.severity === 'Informational' ? 'Clinical Information' : 'Diagnostic Value'}
                              </span>
                              <div className="text-right">
                                <span className="text-4xl font-mono font-black text-oxford-blue">
                                  {term.value}
                                </span>
                                <span className="text-sm font-bold text-slate-400 ml-2 uppercase tracking-widest">{term.unit}</span>
                              </div>
                            </div>
                            
                            {term.severity !== 'Informational' && term.reference_min !== null && term.reference_max !== null && (
                              <div className="relative group/range mt-8">
                                {/* Reference Range Linear Slider */}
                                <div className="relative h-4">
                                  {/* Background Track */}
                                  <div className="absolute inset-0 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="h-full bg-red-100/50 flex-1 border-r border-white/40" />
                                    <div className="h-full bg-green-100/50 flex-[2] border-r border-white/40" />
                                    <div className="h-full bg-red-100/50 flex-1" />
                                    
                                    {/* Normal Range Highlight */}
                                    <div 
                                      className="absolute h-full bg-green-500/20"
                                      style={{ left: '25%', width: '50%' }}
                                    />
                                  </div>

                                  {/* Value Marker (Outside overflow-hidden) */}
                                  <div 
                                    className="absolute top-0 h-full z-10 transition-all duration-700 ease-out group/marker cursor-help"
                                    style={{ 
                                      left: (() => {
                                        const range = term.reference_max - term.reference_min;
                                        const relativeValue = term.value - term.reference_min;
                                        // Map normal range to 25% - 75% of the slider
                                        const percentage = 25 + (relativeValue / range) * 50;
                                        return `${Math.min(98, Math.max(2, percentage))}%`;
                                      })(),
                                      width: '32px',
                                      transform: 'translateX(-50%)'
                                    }}
                                  >
                                    {/* Visual Line */}
                                    <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1.5 h-full bg-oxford-blue shadow-[0_0_10px_rgba(29,45,80,0.5)]" />
                                    
                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/marker:opacity-100 transition-all duration-300 pointer-events-none z-50 translate-y-2 group-hover/marker:translate-y-0">
                                      <div className="bg-oxford-blue text-white text-[10px] font-black px-4 py-2 rounded-xl whitespace-nowrap shadow-2xl flex flex-col items-center border border-white/10">
                                        <span className="uppercase tracking-widest mb-1 opacity-60 text-[8px]">Your Result</span>
                                        <span className="text-sm">{term.value} {term.unit}</span>
                                        <div className={cn(
                                          "mt-2 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-tighter font-black",
                                          term.severity === 'Normal' ? "bg-green-500/20 text-green-400" : 
                                          term.severity === 'Borderline' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                                        )}>
                                          {term.severity}
                                        </div>
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-oxford-blue" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between mt-3 px-1">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Low</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500/30" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Normal Reference</span>
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">High</span>
                                </div>

                                {/* Reference Values */}
                                <div className="flex justify-between mt-1 px-1 text-[10px] font-mono font-bold text-slate-400">
                                  <div className="flex flex-col items-center" style={{ marginLeft: '25%' }}>
                                    <div className="w-px h-1 bg-slate-300 mb-1" />
                                    <span>{term.reference_min}</span>
                                  </div>
                                  <div className="flex flex-col items-center" style={{ marginRight: '25%' }}>
                                    <div className="w-px h-1 bg-slate-300 mb-1" />
                                    <span>{term.reference_max}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {expandedTerms.has(term.term) && (
                          <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100">
                              <div className="flex items-center gap-3 mb-4 text-oxford-blue">
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                  <Zap className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs">Actionable Tip</span>
                              </div>
                              <p className="text-slate-600 text-sm leading-relaxed font-medium">{term.suggestion}</p>
                            </div>
                            <div className="bg-amber-50/50 rounded-[1.5rem] p-6 border border-amber-100">
                              <div className="flex items-center gap-3 mb-4 text-amber-700">
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                  <Stethoscope className="w-5 h-5" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs">Ask Your Doctor</span>
                              </div>
                              <p className="text-amber-900 text-sm italic font-medium leading-relaxed">"{term.doctor_question}"</p>
                            </div>

                            {/* Source of Truth Citation */}
                            <div className="md:col-span-2 bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl shadow-sm">
                                  <Award className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source of Truth</p>
                                  <p className="text-sm font-bold text-oxford-blue">{term.citation_source || "Medical Database"}</p>
                                </div>
                              </div>
                              {term.citation_url && (
                                <a 
                                  href={term.citation_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold text-oxford-blue border border-slate-200 hover:bg-slate-50 transition-all shadow-sm group"
                                >
                                  Validate Citation
                                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 'physician' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* AI Insights Header Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Zap className="w-96 h-96" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black uppercase tracking-widest">AI Insights</h3>
                          <p className="text-white/50 text-xs font-bold uppercase tracking-[0.3em] mt-1">Deep Clinical Analysis & Lifestyle Impact</p>
                        </div>
                      </div>
                      <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Confidential AI Analysis</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* SBAR Brief */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-amber-400">
                          <Stethoscope className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Clinical SBAR Brief</h4>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/10 font-mono text-sm leading-relaxed whitespace-pre-wrap text-slate-300">
                          {aiInsights?.sbar_brief || "No clinical brief generated."}
                        </div>
                      </div>

                      {/* Lifestyle & Trends */}
                      <div className="space-y-8">
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                          <div className="flex items-center gap-2 text-blue-400 mb-4">
                            <Apple className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Lifestyle Impact</h4>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {aiInsights?.lifestyle_impact || "No lifestyle insights available."}
                          </p>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                          <div className="flex items-center gap-2 text-purple-400 mb-4">
                            <Activity className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Trend Analysis</h4>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            {aiInsights?.trend_analysis || "No trend analysis available."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Nutritional Guidance */}
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 text-green-400 mb-4">
                          <Apple className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Nutritional Guidance</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiInsights?.nutritional_guidance || "No nutritional advice available."}
                        </p>
                      </div>

                      {/* Activity Recommendations */}
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 text-orange-400 mb-4">
                          <Activity className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Activity Recommendations</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiInsights?.activity_recommendations || "No activity suggestions available."}
                        </p>
                      </div>

                      {/* Mental Health Check */}
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                        <div className="flex items-center gap-2 text-pink-400 mb-4">
                          <ShieldCheck className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Mental Health Check</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {aiInsights?.mental_health_check || "No mental health considerations available."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Urgent Actions */}
                      <div className="bg-red-500/10 rounded-3xl p-8 border border-red-500/20">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-6 text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Urgent Next Steps
                        </h4>
                        <div className="space-y-3">
                          {aiInsights?.urgent_actions && aiInsights.urgent_actions.length > 0 ? aiInsights.urgent_actions.map((action, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                              <p className="text-sm font-bold text-red-200/80">{action}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-500 italic">No urgent actions required.</p>
                          )}
                        </div>
                      </div>

                      {/* Clinical Questions */}
                      <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-6 text-white/40 flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Clinical Questions for Provider
                        </h4>
                        <div className="space-y-4">
                          {doctorQuestions.length > 0 ? doctorQuestions.map((q, i) => (
                            <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                              <span className="text-amber-400 font-black text-xs mt-0.5">{i + 1}.</span>
                              <p className="text-sm font-medium text-slate-200">{q}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-slate-500 italic">No specific questions generated.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 'care' && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                  <div className="bg-oxford-blue p-10 text-white flex justify-between items-center relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                      <Stethoscope className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-3xl font-black tracking-tight">Care Plan & Visit Prep</h3>
                      <p className="text-slate-300 mt-2 font-medium">Structured guidance for your clinical follow-up.</p>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all border border-white/10 backdrop-blur-md group"
                      title="Print Checklist"
                    >
                      <Printer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>

                  <div className="p-10">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <CheckSquare className="w-6 h-6 text-oxford-blue" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preparation Status</p>
                          <span className="text-lg font-black text-oxford-blue">
                            {checkedQuestions.size} of {terms.length + extraQuestions.length} Items Reviewed
                          </span>
                        </div>
                      </div>
                      <div className="w-48 bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div 
                          className="bg-oxford-blue h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(29,45,80,0.3)]"
                          style={{ width: `${(checkedQuestions.size / (terms.length + extraQuestions.length)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-12">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Clinical Checklist</h4>
                      {terms.map((term, idx) => (
                        <div 
                          key={idx}
                          onClick={() => toggleQuestion(term.doctor_question)}
                          className={cn(
                            "flex items-start gap-5 p-6 rounded-3xl cursor-pointer transition-all border-2 group",
                            checkedQuestions.has(term.doctor_question) 
                              ? "bg-slate-50 border-oxford-blue/20" 
                              : "bg-white border-slate-50 hover:border-slate-200"
                          )}
                        >
                          <div className={cn(
                            "mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all shadow-sm",
                            checkedQuestions.has(term.doctor_question) ? "bg-oxford-blue border-oxford-blue" : "bg-white border-slate-200 group-hover:border-slate-300"
                          )}>
                            {checkedQuestions.has(term.doctor_question) && <ShieldCheck className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <p className="text-oxford-blue font-bold text-lg leading-relaxed italic">"{term.doctor_question}"</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regarding:</span>
                              <span className="text-[10px] font-black text-oxford-blue uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{term.term}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {extraQuestions.length > 0 && (
                        <>
                          <div className="pt-8 pb-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">AI-Generated Follow-ups</h4>
                          </div>
                          {extraQuestions.map((q, idx) => (
                            <div 
                              key={`extra-${idx}`}
                              onClick={() => toggleQuestion(q)}
                              className={cn(
                                "flex items-start gap-5 p-6 rounded-3xl cursor-pointer transition-all border-2 group",
                                checkedQuestions.has(q) 
                                  ? "bg-slate-50 border-oxford-blue/20" 
                                  : "bg-white border-slate-50 hover:border-slate-200"
                              )}
                            >
                              <div className={cn(
                                "mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all shadow-sm",
                                checkedQuestions.has(q) ? "bg-oxford-blue border-oxford-blue" : "bg-white border-slate-200 group-hover:border-slate-300"
                              )}>
                                {checkedQuestions.has(q) && <ShieldCheck className="w-4 h-4 text-white" />}
                              </div>
                              <div>
                                <p className="text-oxford-blue font-bold text-lg leading-relaxed italic">"{q}"</p>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 block">Clinical Suggestion</span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <button 
                      onClick={handleGenerateExtraQuestions}
                      disabled={isGeneratingQuestions}
                      className="w-full py-5 bg-oxford-blue text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-4 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-oxford-blue/20 group"
                    >
                      {isGeneratingQuestions ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                      )}
                      Generate Smart Follow-ups
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  </div>

      <footer className="fixed bottom-0 w-full bg-oxford-blue text-white text-center py-3 px-6 text-[10px] font-bold uppercase tracking-[0.2em] z-50 border-t border-white/10 backdrop-blur-md bg-oxford-blue/90">
        Clinical Decision Support Tool • For Educational Use Only • Consult a Licensed Physician
      </footer>

      <style>{`
        @keyframes pulseMarker {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          10%, 30% { transform: scale(1.1); }
          20% { transform: scale(1.2); }
        }
        @keyframes shieldGlow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(220, 38, 38, 0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(220, 38, 38, 0.8)); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media print {
          nav, aside, header, footer, .no-print {
            display: none !important;
          }
          .max-w-3xl {
            max-width: 100% !important;
          }
          .bg-oxford-blue {
            background-color: #1D2D50 !important;
            -webkit-print-color-adjust: exact;
          }
          .text-white {
            color: white !important;
          }
        }
      `}</style>
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-oxford-blue/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-oxford-blue tracking-tight mb-3">Sign Out?</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Are you sure you want to sign out? You'll need to sign back in to access your health data.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-red-500 text-white font-black text-sm shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { isAuthenticated } = useAuth();
  
  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AuthPage />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MainApp />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
