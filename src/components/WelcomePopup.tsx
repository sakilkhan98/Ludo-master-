import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { 
  Sparkles, 
  Bug, 
  X, 
  Send, 
  CheckCircle, 
  ShieldCheck, 
  ChevronRight, 
  Share2, 
  Heart, 
  Copy, 
  Info, 
  Gift, 
  ArrowRight,
  Flame,
  Volume2,
  Tv,
  Gamepad2,
  Tv2
} from 'lucide-react';
import sakilVibesBanner from '../assets/images/ns_sakil_vibes_banner_1782984889470.jpg';

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportType, setReportType] = useState('bug'); // 'bug', 'suggestion', 'other'
  const [reportText, setReportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);

  // Pre-written invite message for copy-sharing
  const shareMessage = `🎮 *LUDO MASTER ONLINE (Pro V2)* 🎲\n\nHey! Check out this awesome, high-quality, real-time online multiplayer Ludo game designed by SakiL Khan (Rio). It has Ludo King style heavy sound effects, smart AI bots, rapid live chat, and a beautiful premium interface!\n\n👉 Join Telegram: https://t.me/Sharechat_ns_098\n👉 Play Now: ${window.location.origin}\n\nLet's roll the dice and have a match! 🏆🏆`;

  useEffect(() => {
    // Show on mount (resets seen flag only when version changes, to keep it pristine)
    const hasSeen = localStorage.getItem('hasSeenWelcome_v2_0_pro');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSkipAndContinue = () => {
    localStorage.setItem('hasSeenWelcome_v2_0_pro', 'true');
    setIsOpen(false);
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(shareMessage);
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 2500);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    setIsSubmitting(true);
    try {
      const reportId = 'rep_' + Date.now() + Math.random().toString(36).substring(2, 7);
      const reportRef = doc(collection(db, 'bug_reports'), reportId);
      
      await setDoc(reportRef, {
        reportId,
        type: reportType,
        description: reportText,
        createdAt: new Date().toISOString(),
        status: 'pending',
        platform: 'web-ai-studio'
      });

      setSubmitSuccess(true);
      setReportText('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReportForm(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to submit bug report:', err);
      alert('দুঃখিত, রিপোর্ট পাঠানো সম্ভব হয়নি। ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="welcome-popup-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl select-none overflow-y-auto"
        >
          {/* Main Card with Ultra Premium Pro V2 Animations */}
          <motion.div
            id="welcome-popup-card"
            initial={{ opacity: 0, scale: 0.8, y: 60, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -40, rotateX: -10 }}
            transition={{ type: 'spring', damping: 20, stiffness: 120 }}
            className="relative w-full max-w-sm md:max-w-md bg-gradient-to-b from-slate-900 via-[#121228] to-slate-950 border-2 border-indigo-500/30 rounded-[36px] p-6 text-center shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col gap-4 my-8"
          >
            {/* Pulsing and spinning lighting rings in the background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-600/20 blur-[100px] pointer-events-none rounded-full animate-pulse" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-amber-500/10 blur-[80px] pointer-events-none rounded-full" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/15 blur-[60px] pointer-events-none rounded-full" />

            {/* Glowing animated scanlines or particles */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] opacity-60 pointer-events-none" />

            {/* Sparkles */}
            <div className="absolute top-6 left-6 text-indigo-400 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="absolute top-20 right-8 text-amber-400 animate-bounce delay-500">
              <Sparkles className="w-4 h-4" />
            </div>

            {/* 1. Developer Photo Banner - SakiL Khan (NS SAKIL VIBES) - Same to Same, No Changes, Ultra Pro V2 Widescreen Showcase */}
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950/80 p-1 border border-slate-800 shadow-[0_0_25px_rgba(99,102,241,0.15)] mt-2 select-none group">
              {/* Vibrant Ambient Glow Effects in background matching left red / right blue colors of banner */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-24 h-20 bg-red-600/30 blur-[30px] rounded-full animate-pulse pointer-events-none" />
              <div className="absolute top-1/2 right-0 -translate-y-1/2 w-24 h-20 bg-blue-500/30 blur-[30px] rounded-full animate-pulse delay-75 pointer-events-none" />

              {/* Multi-gradient rotating border around the banner */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-1 bg-gradient-to-r from-red-500 via-transparent to-blue-500 opacity-40 rounded-2xl pointer-events-none"
              />

              {/* Exact Banner Container */}
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl border-2 border-slate-950 bg-slate-900 shadow-inner flex items-center justify-center">
                <img 
                  src={sakilVibesBanner} 
                  alt="NS SAKIL VIBES" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Animated Glass Shine Reflection Sweep over the banner */}
                <motion.div 
                  initial={{ x: '-150%', skewX: -25 }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', repeatDelay: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                />

                {/* Left Fire Sparks */}
                <div className="absolute top-2 left-2 text-red-500 animate-ping opacity-75">
                  <Flame className="w-3 h-3 fill-red-500" />
                </div>
                {/* Right Gaming Controller Glow */}
                <div className="absolute bottom-2 right-2 text-blue-400 animate-pulse">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Floating Banner Title Badge */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-950 border border-indigo-400/50 py-0.5 px-3.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
                <span className="text-[9px] text-white font-black tracking-widest uppercase">NS SAKIL VIBES</span>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              </div>
            </div>

            {/* 2. Welcome Title with High-Impact Premium Typography */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-[10px] text-indigo-300 font-bold uppercase tracking-widest animate-pulse">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Premium Pro V2 Build</span>
              </div>
              
              <h2 className="text-2xl md:text-3xl font-black font-sans tracking-tight leading-tight mt-1">
                <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">WELCOME TO THE </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">LUDO MASTER</span>
              </h2>
              
              <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-xs mx-auto mt-1">
                লুডো মাস্টার গেমে আপনাকে স্বাগতম! প্র্যাকটিস করুন এবং রিয়েল-টাইমে গেমের রাজা হয়ে উঠুন।
              </p>
            </div>

            {/* 3. About & Community Info section */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-left text-xs text-slate-300 space-y-1.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl pointer-events-none" />
              <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>ডেভেলপার ডায়েরি (Developer Note)</span>
              </p>
              <p className="leading-relaxed">
                আমাদের প্রিয় লিড ডেভেলপার <span className="text-amber-400 font-bold">SakiL Khan (Rio)</span> এর হাত ধরে প্রস্তুত করা হয়েছে এই আকর্ষণীয় গেমিং প্ল্যাটফর্ম। এটি সম্পূর্ণ বিজ্ঞাপন-মুক্ত, অতি চমৎকার এবং রিয়েল-টাইম রেসপন্সিভ অভিজ্ঞতা সম্পন্ন।
              </p>
            </div>

            {/* 4. Upcoming Features & Changelog */}
            <div className="grid grid-cols-2 gap-2 text-left text-[11px]">
              {/* Release Features */}
              <div className="bg-slate-950/40 border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-1 relative">
                <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-bold tracking-wide border border-emerald-500/30">Stable v2.0</span>
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Installed Features</span>
                </div>
                <ul className="text-slate-400 space-y-1 leading-normal">
                  <li className="flex items-center gap-1 text-slate-300 font-medium">• Ludo King Style Sound 🔊</li>
                  <li>• Smart Offline AI (Fixed) 🤖</li>
                  <li>• Ultra-low delay chat 💬</li>
                  <li>• Ultra Smooth Board 🎲</li>
                </ul>
              </div>

              {/* Upcoming releases */}
              <div className="bg-slate-950/40 border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-1 relative">
                <span className="absolute -top-1.5 right-2 px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded-full text-[8px] font-bold tracking-wide border border-indigo-500/30">Next Month</span>
                <div className="flex items-center gap-1 text-indigo-400 font-bold">
                  <Flame className="w-3.5 h-3.5 shrink-0" />
                  <span>Roadmap Features</span>
                </div>
                <ul className="text-slate-400 space-y-1 leading-normal">
                  <li>• Private tournaments 🏆</li>
                  <li>• Voice Chat in Lobby 🎙️</li>
                  <li>• 3D Dice physics 🎲</li>
                  <li>• Custom table skins ✨</li>
                </ul>
              </div>
            </div>

            {/* 5. SMS Invite Message & Copy-Share Feature */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 text-left space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Share2 className="w-3 h-3" />
                  <span>Invite Friends & Support</span>
                </span>
                <button
                  id="copy-invite-sms-btn"
                  onClick={copyShareMessage}
                  className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-bold transition-all px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
                >
                  {smsCopied ? (
                    <>
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy SMS Text</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-[10px] text-slate-400 leading-relaxed max-h-12 overflow-y-auto pr-1 select-text bg-slate-900/40 p-1.5 rounded border border-slate-800/40">
                {shareMessage}
              </div>
            </div>

            {/* 6. Skip & Continue Gradient Button */}
            <div className="flex flex-col gap-2 mt-1">
              <button
                id="skip-welcome-btn-pro"
                onClick={handleSkipAndContinue}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-400/20"
              >
                <span>SKIP & CONTINUE (চালিয়ে যান 🎲)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Options */}
              <div className="flex items-center justify-between px-2 text-[11px] text-slate-500">
                <button
                  id="open-report-problem-btn-pro"
                  onClick={() => setShowReportForm(true)}
                  className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>Report a Problem</span>
                </button>
                <div className="flex items-center gap-1">
                  <span>Dev: SakiL Khan</span>
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* Report Problem Overlay Modal */}
      {showReportForm && (
        <div 
          id="report-problem-overlay"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
        >
          <motion.div
            id="report-problem-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl text-left"
          >
            {/* Close button */}
            <button
              id="close-report-form-btn"
              onClick={() => setShowReportForm(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Report a Problem</h3>
                <p className="text-[11px] text-slate-400">সমস্যা বা মতামত সরাসরি ডেভেলপারকে জানান</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Type Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Issue Type (ধরনের ত্রুটি)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bug', label: 'Bug / ত্রুটি' },
                    { id: 'suggestion', label: 'Suggestion' },
                    { id: 'other', label: 'Other / অন্য' }
                  ].map((t) => (
                    <button
                      id={`report-type-btn-${t.id}`}
                      key={t.id}
                      type="button"
                      onClick={() => setReportType(t.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                        reportType === t.id 
                          ? 'bg-slate-800 border-indigo-500 text-indigo-400 shadow' 
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-950'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Describe the Issue (বিস্তারিত)</label>
                <textarea
                  id="report-issue-textarea"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="এখানে আপনার গেম বা সাউন্ড সংক্রান্ত কোনো ত্রুটির কথা বিস্তারিত লিখুন..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none transition-all"
                  required
                />
              </div>

              {/* Submit Status */}
              {submitSuccess ? (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl animate-bounce">
                  <CheckCircle className="w-5 h-5" />
                  <span>রিপোর্ট সফলভাবে পাঠানো হয়েছে! ধন্যবাদ।</span>
                </div>
              ) : (
                <button
                  id="submit-report-btn"
                  type="submit"
                  disabled={isSubmitting || !reportText.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Report (রিপোর্ট পাঠান)</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
