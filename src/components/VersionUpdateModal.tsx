import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpCircle, 
  Info, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  Gamepad2, 
  Volume2, 
  Zap 
} from 'lucide-react';
import { playHeavyUpdateMusic } from '../lib/audio';

export const CURRENT_VERSION = "1.9.0";

interface AppStatus {
  latestVersion: string;
  forceUpdate: boolean;
  updateMessage: string;
  updateUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const STATUS_TEXTS = {
  connecting: {
    en: "Connecting to SakiL servers...",
    bn: "সাকিল হাই-স্পিড সার্ভারে সংযোগ করা হচ্ছে..."
  },
  downloading: {
    en: "Downloading game assets (v2.0.0)...",
    bn: "প্রিমিয়াম গেম ফাইল ডাউনলোড করা হচ্ছে..."
  },
  extracting: {
    en: "Loading Heavy Sound Engine & HD Board...",
    bn: "হেভি সাউন্ড এবং এইচডি বোর্ড লোড করা হচ্ছে..."
  },
  finalizing: {
    en: "Optimizing code & finalizing patch...",
    bn: "অপ্টিমাইজেশন ও প্যাচ সম্পন্ন করা হচ্ছে..."
  },
  success: {
    en: "Welcome to SakiL World!",
    bn: "বিন্দাস খেলার জন্য প্রস্তুত হোন..."
  }
};

export default function VersionUpdateModal() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  
  // Track auto-update progress states
  const [isUpdated, setIsUpdated] = useState(() => sessionStorage.getItem('ludo_game_updated') === 'true');
  const [updateState, setUpdateState] = useState<'idle' | 'updating' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusKey, setStatusKey] = useState<'connecting' | 'downloading' | 'extracting' | 'finalizing' | 'success'>('connecting');

  useEffect(() => {
    // Reference to the system config document
    const statusRef = doc(db, 'system_config', 'app_status');

    // Real-time listener for app status changes
    const unsubscribe = onSnapshot(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as AppStatus;
        setStatus(data);
        
        // Check if there is a newer version
        if (data.latestVersion && data.latestVersion !== CURRENT_VERSION) {
          setShowUpdate(true);
        } else {
          // If the database version matches the client version, auto-upgrade the database latestVersion to "2.0.0"
          // to force trigger the update popup for everyone!
          setDoc(statusRef, { latestVersion: "2.0.0" }, { merge: true })
            .catch(err => console.warn('Could not force latestVersion to 2.0.0:', err));
          setShowUpdate(true);
        }

        // Check if maintenance mode is active
        if (data.maintenanceMode) {
          setShowMaintenance(true);
        } else {
          setShowMaintenance(false);
        }
      } else {
        // Document does not exist yet, let's auto-create it with default values
        const defaultStatus: AppStatus = {
          latestVersion: "2.0.0",
          forceUpdate: false,
          updateMessage: "একটি নতুন আপডেট এসেছে! আরো নতুন সাউন্ড, দ্রুত গেমপ্লে এবং নতুন চমৎকার সব ফিচার উপভোগ করতে এখনই গেমটি আপডেট করুন।",
          updateUrl: "https://t.me/Sharechat_ns_098",
          maintenanceMode: false,
          maintenanceMessage: "গেম সার্ভার রক্ষণাবেক্ষণ করা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।"
        };
        setDoc(statusRef, defaultStatus).then(() => {
          setStatus(defaultStatus);
        }).catch(err => console.warn('Could not initialize system_config:', err));
      }
    }, (error) => {
      console.warn("Error reading app status config:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateClick = () => {
    // 1. Play our amazing heavy music synthesiser right on touch!
    // This synchronizes the drop beat perfectly with the 100% completion popup!
    playHeavyUpdateMusic();
    
    setUpdateState('updating');
    setProgress(0);
    setStatusKey('connecting');

    const duration = 3000; // 3 seconds
    const intervalTime = 75;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const currentProgress = Math.min(Math.round((currentStep / steps) * 100), 100);
      setProgress(currentProgress);

      // Transition messages nicely
      if (currentProgress < 20) {
        setStatusKey('connecting');
      } else if (currentProgress < 50) {
        setStatusKey('downloading');
      } else if (currentProgress < 75) {
        setStatusKey('extracting');
      } else if (currentProgress < 95) {
        setStatusKey('finalizing');
      } else {
        setStatusKey('success');
      }

      if (currentProgress >= 100) {
        clearInterval(timer);
        sessionStorage.setItem('ludo_game_updated', 'true');
        setIsUpdated(true);
        
        // Small delay for satisfaction before showing the final screen
        setTimeout(() => {
          setUpdateState('complete');
        }, 500);
      }
    }, intervalTime);
  };

  const handleEnterWorld = () => {
    setShowUpdate(false);
  };

  return (
    <AnimatePresence>
      {/* 1. Maintenance Mode Overlay (Blocks everything) */}
      {showMaintenance && status && (
        <motion.div
          id="maintenance-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-slate-900 border border-yellow-500/30 p-8 rounded-3xl max-w-sm w-full shadow-2xl shadow-yellow-500/5 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl -z-10" />

            <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <h2 className="text-xl font-black text-yellow-400 uppercase tracking-wide mb-3">
              Server Maintenance
            </h2>
            <p className="text-sm font-semibold text-white/50 mb-4">
              সার্ভার রক্ষণাবেক্ষণ চলছে
            </p>

            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl text-xs text-white/80 leading-relaxed font-medium mb-6">
              {status.maintenanceMessage}
            </div>

            <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">
              NS SAKIL VIBES • LUDO KINGDOM
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* 2. Update Overlay (Only displays if not updated in this session) */}
      {showUpdate && !isUpdated && status && (
        <motion.div
          id="update-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[9998] flex items-center justify-center p-6 text-center select-none"
        >
          {/* A. Idle Update View */}
          {updateState === 'idle' && (
            <motion.div
              id="update-card-idle"
              key="idle"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -30 }}
              className="bg-slate-900 border-2 border-indigo-500/30 p-8 rounded-[32px] max-w-sm w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden"
            >
              {/* Beautiful Ambient Light */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl -z-10 animate-pulse" />

              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ArrowUpCircle className="w-8 h-8 animate-bounce" />
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-wide">
                New Version Available
              </h2>
              <div className="flex items-center justify-center gap-2 mt-1.5 mb-4">
                <span className="text-xs bg-slate-800 text-white/50 px-2.5 py-0.5 rounded-full font-mono border border-white/5">
                  v{CURRENT_VERSION}
                </span>
                <span className="text-xs font-bold text-indigo-400">➔</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-mono border border-indigo-500/20 animate-pulse">
                  v{status.latestVersion}
                </span>
              </div>

              <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl text-xs text-white/70 leading-relaxed font-medium mb-6 text-left">
                <p className="font-semibold text-indigo-400 mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> আপডেট বার্তা:
                </p>
                {status.updateMessage}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  id="modal-update-action-btn"
                  onClick={handleUpdateClick}
                  className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-95 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 text-sm border border-indigo-400/20"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow text-indigo-200" />
                  Update Game Now
                </button>

                {/* If NOT forced update, show a skip/close button */}
                {!status.forceUpdate ? (
                  <button
                    id="modal-update-skip-btn"
                    onClick={() => setShowUpdate(false)}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-semibold py-2.5 px-6 rounded-xl transition text-xs"
                  >
                    Later / পরে করব
                  </button>
                ) : (
                  <p className="text-[10px] text-indigo-400/60 font-medium mt-1">
                    * This is a critical update. You must update to continue playing.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* B. Updating/Downloading Progress View */}
          {updateState === 'updating' && (
            <motion.div
              id="update-card-installing"
              key="updating"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border-2 border-cyan-500/20 p-8 rounded-[32px] max-w-sm w-full shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden"
            >
              {/* Cyan Pulse Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse" />

              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                {/* Simulated radar ring */}
                <span className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                <div className="w-16 h-16 bg-cyan-950/80 border-2 border-cyan-500/50 text-cyan-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              </div>

              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-1">
                Auto Updating Game
              </h2>
              <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold mb-6">
                NS SAKIL VIBES HIGH-SPEED PATCH
              </p>

              {/* Progress Bar Container */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center px-1 text-xs font-mono">
                  <span className="text-slate-400 font-bold">Progress</span>
                  <span className="text-cyan-400 font-black animate-pulse">{progress}%</span>
                </div>
                
                {/* Outer Track */}
                <div className="w-full h-4 bg-slate-950/80 rounded-full p-0.5 border border-white/5 overflow-hidden">
                  {/* Glowing progress filling */}
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-600 rounded-full relative"
                    style={{ width: `${progress}%` }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  >
                    {/* Lighting shine sweep */}
                    <span className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -skew-x-12 translate-x-[-100%] animate-pulse" />
                  </motion.div>
                </div>
              </div>

              {/* Dynamic Action Messages */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl min-h-[72px] flex flex-col justify-center text-center">
                <p className="text-xs text-white font-bold tracking-wide leading-tight mb-1 animate-pulse">
                  {STATUS_TEXTS[statusKey].bn}
                </p>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                  {STATUS_TEXTS[statusKey].en}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Simulating ultra safe auto-installer</span>
              </div>
            </motion.div>
          )}

          {/* C. Update Completed: Celebration / Welcome to the SakiL World PopUp */}
          {updateState === 'complete' && (
            <motion.div
              id="update-card-success"
              key="complete"
              initial={{ scale: 0.8, rotateX: 15, opacity: 0 }}
              animate={{ scale: 1, rotateX: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 100 }}
              className="bg-gradient-to-b from-slate-900 via-[#0e0e22] to-slate-950 border-2 border-amber-500/40 p-8 rounded-[36px] max-w-sm w-full shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden"
            >
              {/* Golden Glitter Effects */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:12px_12px] opacity-75" />

              {/* Sparkles Floating */}
              <div className="absolute top-4 left-6 text-amber-400 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="absolute bottom-16 right-6 text-indigo-400 animate-bounce">
                <Sparkles className="w-4 h-4" />
              </div>

              {/* Shining Golden Crown */}
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 border border-yellow-200"
                >
                  <Crown className="w-9 h-9 fill-slate-950" />
                </motion.div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] text-white font-black">
                  ✓
                </div>
              </div>

              {/* Stylish SakiL World Header */}
              <div className="space-y-1.5 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-300 font-black uppercase tracking-widest animate-pulse">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Update Finished Successfully</span>
                </span>
                
                <h2 className="text-xl font-black text-slate-300 uppercase tracking-tight leading-none pt-1">
                  WELCOME TO THE
                </h2>
                <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent tracking-tighter drop-shadow-[0_2px_15px_rgba(245,158,11,0.3)] animate-pulse">
                  SAKIL WORLD!
                </h1>

                {/* Highly Styled Bindass Khelo */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="mt-3.5 py-1 px-4 inline-block rounded-2xl bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                >
                  <p className="text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-pink-300 to-amber-300">
                    বিন্দাস খেলো! 🎲
                  </p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300/80">
                    Bindass Khelo
                  </p>
                </motion.div>
              </div>

              {/* Highlights List */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">New Sound Engine Actived</span>
                    <p className="text-[10px] text-slate-500">Ludo King high bass thuds configured</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Lag-Free Gameplay</span>
                    <p className="text-[10px] text-slate-500">Optimized cache memory routing & latency</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">No External Redirection</span>
                    <p className="text-[10px] text-slate-500">Secure sandboxed local update completed</p>
                  </div>
                </div>
              </div>

              {/* Play Now Premium Button */}
              <button
                id="modal-update-enter-world-btn"
                onClick={handleEnterWorld}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide border border-yellow-300/40"
              >
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Enter & Play / বিন্দাস খেলো 🎮</span>
              </button>

              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest text-center mt-4">
                NS SAKIL VIBES • SPECIAL EDITION
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
