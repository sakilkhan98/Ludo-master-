import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Coins, Sparkles, RefreshCw, Star, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const WHEEL_SECTOR_COLORS = [
  '#dc2626', // Red
  '#16a34a', // Green
  '#d97706', // Yellow
  '#2563eb', // Blue
  '#9333ea', // Purple
  '#0891b2'  // Cyan
];

const SECTORS = [
  { value: 50, label: '50 Gold' },
  { value: 200, label: '200 Gold' },
  { value: 500, label: '500 Gold' },
  { value: 100, label: '100 Gold' },
  { value: 1000, label: '1000 Gold' },
  { value: 300, label: '300 Gold' }
];

export default function LeaderboardScreen() {
  const { resetToMenu, userStats, currentUser, guestUser } = useGame();

  const [spinRotation, setSpinRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const activeUid = currentUser?.uid || guestUser?.uid;
  const isGuest = !currentUser && !!guestUser;

  // Retrieve spin cooldown on mount
  useEffect(() => {
    if (activeUid) {
      const lastSpun = localStorage.getItem(`ludo_spin_claimed_${activeUid}`);
      if (lastSpun) {
        const timePassed = Date.now() - parseInt(lastSpun, 10);
        const cooldownMs = 60 * 1000; // 1-minute testing cooldown!
        if (timePassed < cooldownMs) {
          setCooldownTime(Math.ceil((cooldownMs - timePassed) / 1000));
        } else {
          setCooldownTime(0);
        }
      }
    }
  }, [activeUid]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setWonAmount(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handleSpinWheel = async () => {
    if (isSpinning || cooldownTime > 0 || isSaving || !activeUid) return;

    setIsSpinning(true);
    setWonAmount(null);

    // Pick random sector index
    const sectorIndex = Math.floor(Math.random() * SECTORS.length);
    const selectedSector = SECTORS[sectorIndex];

    // Compute target rotation angle: 
    // Add 5 full spins (1800 deg) for suspense, then subtract sector angle to align pointer
    const sectorAngle = 360 / SECTORS.length;
    // Align so sector lands precisely at top 12 o'clock pointer (90 degree offset correction)
    const targetAngle = 1800 + (360 - (sectorIndex * sectorAngle)) + (sectorAngle / 2);
    
    setSpinRotation(targetAngle);

    // Vibrate patterns on spin start
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    // Wait 4 seconds for slow ease-out spin to complete
    setTimeout(async () => {
      setIsSpinning(false);
      setWonAmount(selectedSector.value);

      setIsSaving(true);
      try {
        if (currentUser && userStats) {
          // Google user stats - Save directly to Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const updatedStats = {
            ...userStats,
            ranking: (userStats.ranking || 1000) + selectedSector.value
          };
          await setDoc(userRef, updatedStats, { merge: true });
          // Assign back in-memory so values reflect instantly
          Object.assign(userStats, updatedStats);
        } else if (isGuest && guestUser) {
          // Guest User - Save to localStorage
          const guestClaimedKey = `ludo_guest_ranking_${guestUser.uid}`;
          const currentRanking = parseInt(localStorage.getItem(guestClaimedKey) || '1000', 10);
          localStorage.setItem(guestClaimedKey, (currentRanking + selectedSector.value).toString());

          // Dispatch storage update so UI profile reflects it
          window.dispatchEvent(new Event('storage'));
        }

        // Set cooldown timestamp
        localStorage.setItem(`ludo_spin_claimed_${activeUid}`, Date.now().toString());
        setCooldownTime(60); // 1-minute countdown
        
        if (navigator.vibrate) {
          navigator.vibrate([150, 80, 200]);
        }
      } catch (err) {
        console.error('Spin save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 4200);
  };

  return (
    <div id="leaderboard-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          id="back-from-leaderboard-btn"
          onClick={resetToMenu}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold font-sans tracking-wide flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" /> Lucky Spin & Win
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4">
        {/* Intro */}
        <div className="text-center mb-6">
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-black animate-pulse">
            ★ Fortune Reward Spinner ★
          </p>
          <h2 className="text-2xl font-black text-white mt-1">SPIN THE WHEEL</h2>
          <p className="text-xs text-white/55 max-w-[260px] mx-auto mt-1 leading-relaxed">
            Roll the lucky reward spinner once every minute to collect free Gold Coins!
          </p>
        </div>

        {/* Spinner Wheel Arena */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-6">
          
          {/* External Golden Glowing Frame */}
          <div className="absolute inset-0 rounded-full border-[8px] border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.4),inset_0_0_20px_rgba(0,0,0,0.6)] z-10 pointer-events-none" />
          
          {/* External Glowing Frame Lights */}
          <div className="absolute inset-[-4px] rounded-full border-2 border-white/20 z-10 pointer-events-none animate-pulse" />

          {/* Pointer Peg at top 12 o'clock */}
          <div className="absolute top-[-16px] left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex flex-col items-center">
            <div className="w-5 h-6 bg-red-600 rounded-b-full border-t border-x border-red-700 shadow-md transform origin-top rotate-180" />
            <div className="w-3 h-3 rounded-full bg-white border border-red-500 -mt-1 shadow-inner" />
          </div>

          {/* Rotating Wheel Body */}
          <motion.div
            id="spin-wheel-body"
            animate={{ rotate: spinRotation }}
            transition={
              isSpinning 
                ? { duration: 4, ease: [0.2, 0.8, 0.2, 1] } 
                : { duration: 0 }
            }
            className="w-full h-full rounded-full overflow-hidden relative shadow-2xl bg-[#090724] border border-black/30 flex items-center justify-center"
          >
            {/* Draw Slices / Sectors using pure CSS rotated items */}
            {SECTORS.map((sec, idx) => {
              const angle = 360 / SECTORS.length;
              const rotation = idx * angle;
              const color = WHEEL_SECTOR_COLORS[idx % WHEEL_SECTOR_COLORS.length];
              
              return (
                <div 
                  key={idx}
                  className="absolute inset-0 origin-center flex items-center justify-center"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  {/* Visual Slice Divider Line */}
                  <div className="absolute inset-y-0 left-1/2 w-[2px] bg-[#1e1a4f]/45 transform -translate-x-1/2 -z-10" />

                  {/* Sector content (Text oriented outwards) */}
                  <div 
                    className="absolute top-8 flex flex-col items-center justify-start origin-center"
                    style={{ transform: 'rotate(0deg)' }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-1 text-white border border-white/20 shadow-lg text-sm"
                      style={{ backgroundColor: color }}
                    >
                      🪙
                    </div>
                    <span className="text-[11px] font-black tracking-tight text-white/95 uppercase drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]">
                      {sec.value}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Subtle inner concentric circular lines */}
            <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute inset-20 rounded-full border border-white/5 pointer-events-none" />
          </motion.div>

          {/* Central Spin Trigger Knob */}
          <button
            id="center-spin-wheel-trigger"
            onClick={handleSpinWheel}
            disabled={isSpinning || cooldownTime > 0}
            className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-18 md:h-18 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-[3.5px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.8),inset_0_-2.5px_5px_rgba(0,0,0,0.4)] z-20 flex flex-col items-center justify-center active:scale-95 disabled:scale-100 disabled:opacity-90 hover:brightness-110 cursor-pointer transition"
          >
            <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest -mb-0.5 select-none font-sans">
              {isSpinning ? 'SPIN' : 'SPIN'}
            </span>
            <span className="text-[9px] font-extrabold text-slate-900/70 select-none">NOW</span>
          </button>
        </div>

        {/* Cooldown/Reward Status Feedback */}
        <div className="w-full max-w-[260px] text-center mt-4">
          <AnimatePresence mode="wait">
            {cooldownTime > 0 ? (
              <motion.div
                key="wheel-claimed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {wonAmount !== null && (
                  <div className="inline-flex flex-col items-center justify-center p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl w-full">
                    <span className="text-[9px] text-amber-400 font-extrabold tracking-widest uppercase">Landed On</span>
                    <span className="text-lg font-black text-amber-300 tracking-tight flex items-center gap-1.5 font-mono mt-0.5">
                      + {wonAmount} Ludo Gold <Coins className="w-4.5 h-4.5 text-amber-400" />
                    </span>
                  </div>
                )}
                
                <button
                  id="spin-cooldown-display"
                  disabled
                  className="w-full py-3.5 bg-slate-800/80 border border-white/5 rounded-xl text-white/50 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  Spin Ready: {cooldownTime}s
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="wheel-ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                id="big-wheel-spin-now-btn"
                onClick={handleSpinWheel}
                disabled={isSpinning}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white border border-white/10 font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Star className="w-4.5 h-4.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                PLAY LUCKY SPIN
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
