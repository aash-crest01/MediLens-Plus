import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Users, 
  Camera, 
  ArrowRight, 
  ChevronRight,
  UserPlus,
  LogIn,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const { login, signup, continueAsGuest } = useAuth();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    signup({ fullName, email, dob, gender, photo: photo || undefined });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-oxford-blue/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-oxford-blue/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row border border-slate-100 relative z-10"
      >
        {/* Left Side: Branding & Info */}
        <div className="w-full md:w-[40%] bg-oxford-blue p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-20 right-[-20%] w-60 h-60 border-4 border-white rounded-full" />
            <div className="absolute bottom-20 left-[-20%] w-40 h-40 border-4 border-white rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="bg-white p-2 rounded-xl">
                <ShieldCheck className="w-8 h-8 text-oxford-blue" />
              </div>
              <span className="text-2xl font-black tracking-tight">MediLens</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl font-black leading-tight">
                Your Health, <br />
                <span className="text-slate-400">Decoded.</span>
              </h1>
              <p className="text-slate-300 font-medium leading-relaxed">
                Transform complex medical reports into clear, actionable health insights using advanced AI technology.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Privacy First</p>
                <p className="text-[10px] text-slate-300">Your data is encrypted and never shared.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="w-full md:w-[60%] p-12 relative">
          <div className="flex justify-between items-center mb-10">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setMode('signin')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  mode === 'signin' ? "bg-white text-oxford-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button 
                onClick={() => setMode('signup')}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  mode === 'signup' ? "bg-white text-oxford-blue shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
            </div>
            
            <button 
              onClick={continueAsGuest}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-oxford-blue transition-colors flex items-center gap-1 group"
            >
              Continue as Guest
              <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'signin' ? (
              <motion.div
                key="signin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-oxford-blue tracking-tight mb-2">Welcome Back</h2>
                  <p className="text-slate-400 font-medium">Please enter your details to sign in.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                      <button type="button" className="text-[10px] font-black uppercase tracking-widest text-oxford-blue hover:underline">Forgot?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all"
                      />
                    </div>
                  </div>

                  {/* Remember me removed as per user request to show login page every time */}

                  <button 
                    type="submit"
                    className="w-full bg-oxford-blue text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-oxford-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-oxford-blue tracking-tight mb-2">Create Account</h2>
                  <p className="text-slate-400 font-medium">Join MediLens to start tracking your health.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 group hover:border-oxford-blue transition-colors">
                        {photo ? (
                          <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-12 h-12 text-slate-300" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-oxford-blue rounded-xl flex items-center justify-center text-white shadow-lg">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3">Profile Photo (Optional)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date of Birth</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                        <input 
                          type="date" 
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                      <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-oxford-blue transition-colors" />
                        <select 
                          required
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-oxford-blue/10 focus:border-oxford-blue transition-all appearance-none"
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-oxford-blue text-white rounded-2xl py-4 font-black text-sm shadow-xl shadow-oxford-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                  >
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
