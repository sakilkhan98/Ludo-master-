import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpCircle, Info, RefreshCw, AlertTriangle, MessageCircle, ExternalLink } from 'lucide-react';

export const CURRENT_VERSION = "2.0.0";

interface AppStatus {
  latestVersion: string;
  forceUpdate: boolean;
  updateMessage: string;
  updateUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export default function VersionUpdateModal() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);

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
          setShowUpdate(false);
        }

        // Check if maintenance mode is active
        if (data.maintenanceMode) {
          setShowMaintenance(true);
        } else {
          setShowMaintenance(false);
        }
      } else {
        // Document does not exist yet, let's auto-create it with default values so the developer can edit it in Firestore!
        const defaultStatus: AppStatus = {
          latestVersion: CURRENT_VERSION,
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
    if (status?.updateUrl) {
      window.open(status.updateUrl, '_blank', 'noopener,noreferrer');
    }
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

      {/* 2. Update Popup (Force update blocks background; non-force allows close) */}
      {showUpdate && status && (
        <motion.div
          id="update-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9998] flex items-center justify-center p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            className="bg-slate-900 border border-indigo-500/30 p-8 rounded-3xl max-w-sm w-full shadow-2xl shadow-indigo-500/10 relative overflow-hidden"
          >
            {/* Beautiful Ambient Light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl -z-10" />

            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ArrowUpCircle className="w-8 h-8 animate-pulse" />
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
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Update Game Now
              </button>

              {/* If NOT forced update, show a skip/close button */}
              {!status.forceUpdate ? (
                <button
                  id="modal-update-skip-btn"
                  onClick={() => setShowUpdate(false)}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 font-semibold py-2 px-6 rounded-xl transition text-xs"
                >
                  Later / পরে করব
                </button>
              ) : (
                <p className="text-[10px] text-red-400/60 font-medium mt-1">
                  * This is a critical update. You must update to continue playing.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
