import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Edit2, Check, Award, RefreshCw, Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AVATARS = ['👑', '🦊', '🦁', '🐼', '🐨', '🐯', '🦄', '🐉'];

export default function ProfileScreen() {
  const { currentUser, guestUser, userStats, loginAsGuest, resetToMenu } = useGame();
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState(currentUser?.displayName || guestUser?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userStats?.avatar || guestUser?.avatar || '👑');

  const stats = userStats || {
    wins: 3,
    losses: 1,
    ranking: 1050,
    totalGames: 4
  };

  const winRatio = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  const saveProfileUpdates = async () => {
    const activeUid = currentUser?.uid || guestUser?.uid;
    if (activeUid) {
      // Update Firestore user info
      const userRef = doc(db, 'users', activeUid);
      try {
        await setDoc(userRef, {
          userId: activeUid,
          name: customName,
          avatar: selectedAvatar,
          wins: stats.wins,
          losses: stats.losses,
          ranking: stats.ranking,
          totalGames: stats.totalGames,
          createdAt: Date.now()
        }, { merge: true });
        
        // Also update local storage if it's a guest user
        if (guestUser) {
          loginAsGuest(customName, selectedAvatar);
        } else {
          // Force reload page / sync stats
          window.location.reload();
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsEditingName(false);
  };

  const achievementsList = [
    { id: '1', title: 'First Blood', desc: 'Captured an opponent token on track', unlocked: stats.wins > 0, icon: '⚔️' },
    { id: '2', title: 'Victory Lap', desc: 'Completed a token to central home', unlocked: stats.wins > 0, icon: '🏠' },
    { id: '3', title: 'Elite Master', desc: 'Surpassed 1,200 ranking points', unlocked: stats.ranking >= 1200, icon: '💎' },
    { id: '4', title: 'Undefeated', desc: 'Accumulated 10 game victories', unlocked: stats.wins >= 10, icon: '🔥' }
  ];

  return (
    <div id="profile-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          id="back-from-profile-btn"
          onClick={resetToMenu}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-sans tracking-wide">Player Profile</h1>
      </div>

      {/* Profile Header Avatar / Editing */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 text-center mb-6 relative shadow-2xl"
      >
        <div className="text-5xl bg-black/30 w-20 h-20 mx-auto rounded-full flex items-center justify-center border border-white/15 shadow-md">
          {selectedAvatar}
        </div>

        {/* Username editing */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/15 w-full max-w-xs">
              <input 
                id="edit-profile-name-input"
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={14}
                className="bg-transparent text-sm text-center flex-1 focus:outline-none px-2 font-semibold text-white"
              />
              <button 
                id="save-profile-name-btn"
                onClick={saveProfileUpdates}
                className="p-1.5 bg-green-500/80 rounded-lg hover:bg-green-400 text-white border border-white/10 transition"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold tracking-tight text-white">{currentUser?.displayName || guestUser?.name || 'Player'}</h2>
              <button 
                id="edit-profile-name-toggle"
                onClick={() => setIsEditingName(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/55 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Avatar Picker List */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs text-white/40 font-medium mb-2.5">Choose Avatar</p>
          <div className="flex justify-center gap-2.5 flex-wrap">
            {AVATARS.map((av) => (
              <button
                key={av}
                onClick={() => {
                  setSelectedAvatar(av);
                  if (!isEditingName) setIsEditingName(true); // show checkmark to save
                }}
                className={`text-2xl p-2 rounded-xl transition hover:bg-white/10 active:scale-90 ${
                  selectedAvatar === av ? 'bg-blue-500/20 border border-blue-400 scale-110 shadow-lg shadow-blue-500/15' : 'bg-white/5 border border-transparent'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 mb-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Wins</p>
            <p className="text-lg font-black tracking-tight mt-0.5">{stats.wins}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Ranking</p>
            <p className="text-lg font-black tracking-tight mt-0.5">{stats.ranking}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-red-500/15 text-red-500 border border-red-500/30 rounded-xl">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Losses</p>
            <p className="text-lg font-black tracking-tight mt-0.5">{stats.losses}</p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Win Rate</p>
            <p className="text-lg font-black tracking-tight mt-0.5">{winRatio}%</p>
          </div>
        </div>
      </div>

      {/* Achievement List */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h3 className="text-sm font-semibold tracking-wide">Achievement Badges</h3>
        </div>
        
        {achievementsList.map((ach) => (
          <div 
            key={ach.id}
            className={`flex items-center gap-4 p-3.5 rounded-2xl border transition ${
              ach.unlocked 
                ? 'backdrop-blur-md bg-white/5 border-white/10 shadow-lg' 
                : 'bg-white/[0.01] border-white/5 opacity-40'
            }`}
          >
            <div className="text-3xl p-1.5 bg-black/20 rounded-xl border border-white/10">
              {ach.icon}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-white/90">{ach.title}</p>
              <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{ach.desc}</p>
            </div>
            {ach.unlocked && (
              <span className="text-[10px] bg-green-400/20 text-green-300 border border-green-400/30 px-2.5 py-1 rounded-full font-bold">
                Unlocked
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
