import React from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Trophy, Medal, Crown, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function LeaderboardScreen() {
  const { leaderboardUsers, resetToMenu, currentUser } = useGame();

  // Mock static leaders in case Firestore lacks data initially (cold starts)
  const fallbackLeaders = [
    { name: 'SakiL Khan', wins: 245, avatar: '👑', ranking: 1540 },
    { name: 'Antigravity', wins: 182, avatar: '🦊', ranking: 1390 },
    { name: 'DeepMind', wins: 154, avatar: '🦁', ranking: 1250 },
    { name: 'LudoMaster99', wins: 98, avatar: '🐯', ranking: 1180 },
    { name: 'AlphaLudo', wins: 87, avatar: '🐼', ranking: 1110 },
  ];

  const displayedLeaders = leaderboardUsers.length > 0 
    ? leaderboardUsers.map(u => ({ name: u.name, wins: u.wins, avatar: u.avatar, ranking: u.ranking, userId: u.userId }))
    : fallbackLeaders.map((u, idx) => ({ ...u, userId: `fallback_${idx}` }));

  return (
    <div id="leaderboard-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          id="back-from-leaderboard-btn"
          onClick={resetToMenu}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-sans tracking-wide">Global Leaderboard</h1>
      </div>

      {/* Top 3 Podium Cards */}
      {displayedLeaders.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-8 items-end">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 text-center flex flex-col items-center justify-center h-36 relative"
          >
            <div className="absolute -top-3 p-1.5 bg-white/10 border border-white/20 rounded-full text-slate-300">
              <Medal className="w-4 h-4 text-slate-300" />
            </div>
            <span className="text-2xl mt-1">{displayedLeaders[1].avatar}</span>
            <p className="font-bold text-xs truncate w-full mt-2 text-white/90">{displayedLeaders[1].name}</p>
            <p className="text-blue-400 font-mono text-[10px] mt-0.5">{displayedLeaders[1].ranking} pts</p>
            <p className="text-white/50 font-semibold text-[10px] mt-1.5">{displayedLeaders[1].wins} Wins</p>
          </motion.div>

          {/* 1st Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="backdrop-blur-xl bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-3 text-center flex flex-col items-center justify-center h-44 relative shadow-xl shadow-amber-500/10"
          >
            <div className="absolute -top-5 p-2 bg-amber-500 rounded-full text-slate-950 shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 fill-slate-950" />
            </div>
            <span className="text-3xl mt-1">{displayedLeaders[0].avatar}</span>
            <p className="font-extrabold text-sm truncate w-full mt-2 text-amber-400">{displayedLeaders[0].name}</p>
            <p className="text-amber-500 font-mono text-xs font-semibold mt-0.5">{displayedLeaders[0].ranking} pts</p>
            <p className="text-white font-bold text-xs mt-2">{displayedLeaders[0].wins} Wins</p>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 text-center flex flex-col items-center justify-center h-32 relative"
          >
            <div className="absolute -top-3 p-1.5 bg-white/10 border border-white/20 rounded-full text-slate-300">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <span className="text-2xl mt-1">{displayedLeaders[2].avatar}</span>
            <p className="font-bold text-xs truncate w-full mt-2 text-white/90">{displayedLeaders[2].name}</p>
            <p className="text-blue-400 font-mono text-[10px] mt-0.5">{displayedLeaders[2].ranking} pts</p>
            <p className="text-white/50 font-semibold text-[10px] mt-1.5">{displayedLeaders[2].wins} Wins</p>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Rankings List */}
      <div className="flex-1 space-y-2 mb-4">
        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3 px-1">Top Contenders</h3>
        
        {displayedLeaders.slice(3).map((player, idx) => {
          const rank = idx + 4;
          const isCurrentUser = currentUser && player.userId === currentUser.uid;

          return (
            <motion.div
              key={player.userId || idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                isCurrentUser 
                  ? 'backdrop-blur-md bg-blue-500/10 border-blue-400/40 shadow-lg shadow-blue-500/5' 
                  : 'backdrop-blur-md bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-mono text-xs font-bold text-white/40">
                  #{rank}
                </span>
                <span className="text-xl">{player.avatar}</span>
                <div>
                  <p className={`font-semibold text-sm ${isCurrentUser ? 'text-blue-400' : 'text-slate-200'}`}>
                    {player.name}
                  </p>
                  <p className="text-white/40 text-[10px] font-mono">{player.ranking} Ranking pts</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-sm text-white/90">{player.wins} Wins</p>
                <p className="text-white/40 text-[9px]">Total Played</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
