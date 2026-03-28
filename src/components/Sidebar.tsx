import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Stethoscope, 
  Settings, 
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ClipboardList,
  History,
  Pill,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'My Reports', icon: FileText },
    { id: 'insights', label: 'Health Insights', icon: Activity },
    { id: 'history', label: 'Past Reports', icon: History },
    { id: 'meds', label: 'Medications', icon: Pill },
    { id: 'physician', label: 'AI Insights', icon: Zap },
    { id: 'care', label: 'Care Plan', icon: ClipboardList },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-oxford-blue p-2 rounded-xl shadow-lg shadow-oxford-blue/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-oxford-blue tracking-tight">MediLens</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                  activeTab === item.id 
                    ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-slate-100 space-y-2">
            <button 
              onClick={() => {
                setActiveTab('settings');
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                activeTab === 'settings' 
                  ? "bg-oxford-blue text-white shadow-lg shadow-oxford-blue/20" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm">Settings</span>
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
