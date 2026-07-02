import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Copy, Check, Users, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { COLOR_CLASSES, COLOR_NAMES } from '../utils/ludoBoard';
import { PlayerColor, PlayerState, RoomState } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Lobby() {
  const { 
    activeRoom, 
    setActiveRoom, 
    leaveRoom, 
    toggleReady, 
    startOnlineGame, 
    currentUser, 
    guestUser, 
    setActiveMode, 
    setGameMode 
  } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeRoom?.roomId) return;

    const docRef = doc(db, 'rooms', activeRoom.roomId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        setActiveRoom(null);
        setGameMode(null);
        setActiveMode('menu');
        return;
      }

      const roomData = docSnap.data() as RoomState;
      setActiveRoom(roomData);

      // Transition screen mode if status changed to playing
      if (roomData.status === 'playing') {
        setActiveMode('game');
      }
    }, (error) => {
      console.error("Lobby room snapshot error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [activeRoom?.roomId, setActiveRoom, setActiveMode, setGameMode]);

  if (!activeRoom) return null;

  const playersList = Object.values(activeRoom.players) as PlayerState[];
  const slots: { color: PlayerColor; index: number }[] = [
    { color: 'red', index: 0 },
    { color: 'green', index: 1 },
    { color: 'yellow', index: 2 },
    { color: 'blue', index: 3 }
  ];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profile = currentUser ? { uid: currentUser.uid, name: currentUser.displayName || 'Player' } : guestUser;
  const isHost = activeRoom.hostId === profile?.uid;
  const maxPlayers = activeRoom.maxPlayers || 4;
  const everyoneReady = playersList.every((p) => p.isHost || p.isReady);
  const canStart = playersList.length >= 2 && everyoneReady;

  const filteredSlots = slots.filter((slot) => {
    if (maxPlayers === 2) {
      return slot.color === 'red' || slot.color === 'yellow';
    }
    return true;
  });

  return (
    <div id="lobby-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          id="leave-lobby-btn"
          onClick={leaveRoom}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-sans tracking-wide">Multiplayer Lobby</h1>
      </div>

      {/* Room Code Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 text-center mb-6 shadow-xl shadow-black/10"
      >
        <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-1">Room Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl font-black font-mono tracking-widest text-blue-400">
            {activeRoom.roomId}
          </span>
          <button
            id="copy-room-code-btn"
            onClick={handleCopyCode}
            className="p-2 bg-black/30 border border-white/10 rounded-xl hover:bg-white/10 transition text-white"
          >
            {copied ? <Check className="w-4.5 h-4.5 text-green-400" /> : <Copy className="w-4.5 h-4.5" />}
          </button>
        </div>
        <p className="text-white/50 text-[10px] mt-2 leading-relaxed">
          Share this 6-digit room code with your friends so they can join.
        </p>
      </motion.div>

      {/* Slots Section */}
      <div className="flex-1 space-y-3.5 mb-6">
        <div className="flex items-center gap-2 px-1 mb-2">
          <Users className="w-4.5 h-4.5 text-white/40" />
          <h2 className="text-sm font-semibold text-white/40">Player Lineup ({playersList.length}/{maxPlayers})</h2>
        </div>

        {filteredSlots.map((slot) => {
          // Find player assigned to this color
          const player = playersList.find((p) => p.color === slot.color);
          const colorMeta = COLOR_CLASSES[slot.color];

          return (
            <motion.div
              key={slot.color}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: slot.index * 0.05 }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                player 
                  ? 'backdrop-blur-md bg-white/5 border-white/10 shadow-md' 
                  : 'bg-white/[0.01] border-white/5 border-dashed opacity-40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {/* Color Block Indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colorMeta.bg} text-slate-950 shadow-md ${colorMeta.glow}`}>
                  {player ? player.avatar : '?'}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`font-bold text-sm ${player ? 'text-white/90' : 'text-white/30 font-normal'}`}>
                      {player ? player.name : `Waiting for Player...`}
                    </p>
                    {player?.isHost && (
                      <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">
                        Host
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                    Slot {slot.index + 1}: {COLOR_NAMES[slot.color]}
                  </p>
                </div>
              </div>

              {/* Ready / Status Indicators */}
              {player && (
                <div>
                  {player.isHost ? (
                    <span className="text-xs text-blue-400 font-bold flex items-center gap-1">
                      👑 Ready
                    </span>
                  ) : player.isReady ? (
                    <span className="text-xs text-green-400 font-bold flex items-center gap-1 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                      <CheckCircle className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="text-xs text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Unready
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="mt-auto space-y-3">
        {/* If Host: Start button, otherwise: Ready button */}
        {isHost ? (
          <div>
            {!canStart && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs mb-3">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <p>Needs at least 2 players, and all players must toggle Ready.</p>
              </div>
            )}
            <button
              id="start-online-game-btn"
              onClick={startOnlineGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition shadow-lg active:scale-95 ${
                canStart 
                  ? 'bg-gradient-to-r from-green-500/80 to-emerald-600/80 hover:from-green-400 hover:to-emerald-500 text-white border border-white/10 shadow-lg shadow-green-500/10' 
                  : 'backdrop-blur-md bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              Start Game
            </button>
          </div>
        ) : (
          <button
            id="toggle-ready-lobby-btn"
            onClick={toggleReady}
            className="w-full py-4 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-sm tracking-wide rounded-2xl transition border border-white/10 shadow-lg active:scale-95 shadow-blue-500/10"
          >
            {activeRoom.players[profile?.uid || '']?.isReady ? 'Cancel Ready' : 'I am Ready!'}
          </button>
        )}
      </div>
    </div>
  );
}
