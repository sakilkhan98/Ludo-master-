import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Sparkles, Coins, RefreshCw, Trophy, Flame } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LuckyChestPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LuckyChestPopup({ isOpen, onClose }: LuckyChestPopupProps) {
  const { userStats, currentUser, guestUser, triggerVibration } = useGame();
  
  const [chestState, setChestState] = useState<'closed' | 'shaking' | 'open'>('closed');
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0); // remaining seconds
  const [isSaving, setIsSaving] = useState(false);

  const activeUid = currentUser?.uid || guestUser?.uid;
  const isGuest = !currentUser && !!guestUser;

  // Retrieve cooldown on mount/open
  useEffect(() => {
    if (isOpen && activeUid) {
      const lastClaimed = localStorage.getItem(`ludo_chest_claimed_${activeUid}`);
      if (lastClaimed) {
        const timePassed = Date.now() - parseInt(lastClaimed, 10);
        const cooldownMs = 60 * 1000; // 1-minute short cooldown for easy AI Studio review/testing!
        if (timePassed < cooldownMs) {
          setCooldownTime(Math.ceil((cooldownMs - timePassed) / 1000));
          setChestState('open'); // already opened recently
          setRewardAmount(250); // mock amount shown in opened state
        } else {
          setCooldownTime(0);
          setChestState('closed');
          setRewardAmount(null);
        }
      } else {
        setCooldownTime(0);
        setChestState('closed');
        setRewardAmount(null);
      }
    }
  }, [isOpen, activeUid]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setChestState('closed');
            setRewardAmount(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handleOpenChest = async () => {
    if (chestState !== 'closed' || cooldownTime > 0 || isSaving || !activeUid) return;

    setChestState('shaking');
    
    // Play dice shake sound pattern if available via vibration / micro-feedback
    if (navigator.vibrate) {
      navigator.vibrate([40, 100, 40, 100, 50]);
    }

    // Wait 1.5s for shake animation before opening
    setTimeout(async () => {
      // Pick random rewarding coins amount
      const amounts = [150, 250, 500, 800, 1000];
      const selectedReward = amounts[Math.floor(Math.random() * amounts.length)];
      setRewardAmount(selectedReward);
      setChestState('open');

      setIsSaving(true);
      try {
        if (currentUser && userStats) {
          // Google Auth - save to Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const updatedStats = {
            ...userStats,
            ranking: (userStats.ranking || 1000) + selectedReward
          };
          await setDoc(userRef, updatedStats, { merge: true });
          // Force profile updates/sync locally in memory
          Object.assign(userStats, updatedStats);
        } else if (isGuest && guestUser) {
          // Guest mode - save locally to custom key or ranking state
          const guestClaimedKey = `ludo_guest_ranking_${guestUser.uid}`;
          const currentRanking = parseInt(localStorage.getItem(guestClaimedKey) || '1000', 10);
          localStorage.setItem(guestClaimedKey, (currentRanking + selectedReward).toString());
          
          // Also dispatch custom storage event to notify other components instantly
          window.dispatchEvent(new Event('storage'));
        }

        // Record cooldown timestamp
        localStorage.setItem(`ludo_chest_claimed_${activeUid}`, Date.now().toString());
        setCooldownTime(60); // 1-minute countdown
        
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 150]);
        }
      } catch (err) {
        console.error('Failed to save claimed chest reward:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="lucky-chest-popup-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl select-none"
        >
          {/* Main Card Container */}
          <motion.div
            id="lucky-chest-popup-card"
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-[#100e2e] to-slate-950 border-2 border-amber-500/30 rounded-[32px] p-6 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col items-center"
          >
            {/* Rays rays background on Open state */}
            {chestState === 'open' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(245,158,11,0.06)_70%)] pointer-events-none"
              >
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-conic-gradient(from 0deg, rgba(245,158,11,0.1) 0deg 15deg, transparent 15deg 30deg)'
                }} />
              </motion.div>
            )}

            {/* Glowing dots background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-10 left-10 text-amber-500 animate-pulse"><Sparkles className="w-4 h-4" /></div>
              <div className="absolute bottom-12 right-12 text-yellow-400 animate-bounce"><Sparkles className="w-5 h-5" /></div>
            </div>

            {/* Close Button */}
            <button
              id="close-lucky-chest-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition active:scale-90 border border-white/10 z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="mt-4 mb-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Gift className="w-3.5 h-3.5" /> Lucky Daily Reward
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-3">
                {chestState === 'open' ? 'CONGRATULATIONS!' : 'DAILY TREASURE CHEST'}
              </h2>
              <p className="text-xs text-white/40 mt-1 leading-relaxed max-w-[240px] mx-auto">
                {chestState === 'open' 
                  ? 'Your reward has been claimed successfully!' 
                  : 'Open the golden lucky chest to claim your daily bonus of Ludo Gold Coins!'}
              </p>
            </div>

            {/* Interactive Animated Chest representation */}
            <div className="w-full aspect-[4/3] max-h-48 relative flex items-center justify-center my-4 z-10">
              {/* Shake keyframe styling using custom tailwind class or inline motion style */}
              <motion.div
                animate={
                  chestState === 'shaking' 
                    ? { 
                        x: [0, -8, 8, -8, 8, -6, 6, -4, 4, 0],
                        y: [0, 4, -4, 4, -4, 3, -3, 2, -2, 0],
                        rotate: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0]
                      }
                    : { y: [0, -6, 0] }
                }
                transition={
                  chestState === 'shaking'
                    ? { duration: 1.2, repeat: Infinity }
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                className="relative w-36 h-36 flex items-center justify-center cursor-pointer"
                onClick={handleOpenChest}
              >
                {/* 3D Styled Treasure Chest (HTML/Tailwind Illustration) */}
                <div className="relative w-28 h-24">
                  {/* Rays of sparkling light behind the open chest */}
                  {chestState === 'open' && (
                    <div className="absolute -inset-8 bg-amber-500/20 rounded-full blur-xl animate-pulse -z-10" />
                  )}

                  {/* Lid (Top Half) */}
                  <motion.div 
                    animate={chestState === 'open' ? { y: -20, rotateX: -65 } : { y: 0, rotateX: 0 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-2xl border-b-[3px] border-slate-950 shadow-md relative origin-bottom z-10 flex items-center justify-center"
                  >
                    {/* Golden metal bands */}
                    <div className="absolute left-3 inset-y-0 w-3 bg-gradient-to-r from-yellow-400 to-yellow-600" />
                    <div className="absolute right-3 inset-y-0 w-3 bg-gradient-to-r from-yellow-400 to-yellow-600" />
                    <div className="absolute top-1 w-6 h-2 bg-yellow-400 rounded-full shadow-inner" />
                  </motion.div>

                  {/* Body (Bottom Half) */}
                  <div className="absolute bottom-0 inset-x-0 h-14 bg-gradient-to-b from-amber-800 to-[#4d2800] rounded-b-xl border-t border-amber-900 shadow-xl flex items-center justify-center relative">
                    {/* Golden metal corners */}
                    <div className="absolute left-0 bottom-0 w-4 h-full bg-gradient-to-tr from-yellow-500 to-yellow-600 rounded-bl-xl" />
                    <div className="absolute right-0 bottom-0 w-4 h-full bg-gradient-to-tl from-yellow-500 to-yellow-600 rounded-br-xl" />
                    <div className="absolute left-3 bottom-0 w-3 h-full bg-yellow-500/75" />
                    <div className="absolute right-3 bottom-0 w-3 h-full bg-yellow-500/75" />

                    {/* Central Gold lock */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-7 bg-gradient-to-b from-yellow-400 to-yellow-600 border border-amber-600 rounded flex flex-col items-center justify-center shadow-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      <div className="w-0.5 h-2 bg-slate-950" />
                    </div>
                  </div>
                </div>

                {/* Floating Coins inside or popping out of chest */}
                {chestState === 'open' && (
                  <motion.div
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: [0, 1.2, 1], y: -45 }}
                    className="absolute z-20 flex flex-col items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Coins className="w-5 h-5 text-white animate-bounce" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Action Area */}
            <div className="w-full mt-4 z-10">
              <AnimatePresence mode="wait">
                {cooldownTime > 0 ? (
                  <motion.div
                    key="cooldown-active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {rewardAmount !== null && (
                      <div className="text-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 max-w-[250px] mx-auto animate-pulse">
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider font-extrabold block">You Won</span>
                        <span className="text-xl font-black text-amber-300 font-mono tracking-tight flex items-center justify-center gap-1">
                          + {rewardAmount} <Coins className="w-5 h-5" />
                        </span>
                      </div>
                    )}
                    
                    <button
                      id="chest-cooldown-display"
                      disabled
                      className="w-full py-4 bg-slate-800/80 text-white/50 border border-white/5 font-extrabold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                      Next Reward: {cooldownTime}s
                    </button>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider">
                      * Testing Mode: Short 1-minute claim cycle enabled!
                    </p>
                  </motion.div>
                ) : (
                  <motion.button
                    key="claim-active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    id="open-treasure-chest-btn"
                    onClick={handleOpenChest}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-yellow-300/40"
                  >
                    <Coins className="w-5 h-5 fill-slate-950" />
                    OPEN CHEST NOW
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
