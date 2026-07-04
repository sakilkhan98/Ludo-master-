import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { 
  getTokenGridPosition, 
  isSafeCell, 
  COLOR_CLASSES, 
  COLOR_NAMES 
} from '../utils/ludoBoard';
import { PlayerColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Shield, HelpCircle, Trophy, Volume2, VolumeX, PhoneOff, ArrowRight, MessageCircle, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

const DICE_CORNER_CLASSES: Record<PlayerColor, string> = {
  red: 'top-[8%] left-[8%]',
  green: 'top-[8%] right-[8%]',
  yellow: 'bottom-[8%] right-[8%]',
  blue: 'bottom-[8%] left-[8%]'
};

const DICE_RING_CLASSES: Record<PlayerColor, string> = {
  red: 'ring-red-500/50 border-red-500/60 hover:border-red-400 bg-red-950/90',
  green: 'ring-green-500/50 border-green-500/60 hover:border-green-400 bg-green-950/90',
  yellow: 'ring-yellow-500/50 border-yellow-400/60 hover:border-yellow-300 bg-yellow-950/90',
  blue: 'ring-blue-500/50 border-blue-500/60 hover:border-blue-400 bg-blue-950/90'
};

export default function GameBoard() {
  const { 
    activeRoom, 
    currentUser, 
    guestUser, 
    gameMode,
    validMoves, 
    isRolling, 
    isMovingToken,
    rollDice, 
    moveToken,
    leaveRoom,
    sendChatMessage,
    settings,
    updateSettings
  } = useGame();

  const [timeLeft, setTimeLeft] = useState<number>(30);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  if (!activeRoom) return null;

  const [activeReactions, setActiveReactions] = useState<Record<PlayerColor, { text: string; id: string } | null>>({
    red: null,
    green: null,
    yellow: null,
    blue: null
  });

  const [showQuickChat, setShowQuickChat] = useState(false);

  // Trigger high-impact celebration when a player successfully moves all pieces to home base (wins the Ludo game)
  useEffect(() => {
    if (activeRoom.status === 'finished') {
      // 1. Initial big burst from the center of the screen
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#ffffff']
      });

      // 2. Continuous fireworks and confetti shower on the sides for a high-impact duration
      const duration = 6 * 1000; // 6 seconds of intense celebration
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 75, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 45 * (timeLeft / duration);

        // Burst on the left side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#ef4444']
        });
        // Burst on the right side
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
          colors: ['#60a5fa', '#3b82f6', '#2563eb', '#10b981']
        });
        // Scattered bursts in the middle
        if (Math.random() > 0.4) {
          confetti({
            ...defaults,
            particleCount: 25,
            origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.1 },
            colors: ['#a7f3d0', '#fb7185', '#c084fc', '#fde047']
          });
        }
      }, 300);

      return () => clearInterval(interval);
    }
  }, [activeRoom.status]);

  // Local bubble pop sound synthesizer
  const playPopSound = () => {
    if (settings && !settings.soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Pop sound error:', e);
    }
  };

  // Sync real-time chat bubbles
  useEffect(() => {
    if (!activeRoom || !activeRoom.chat || activeRoom.chat.length === 0) return;
    const latestMsg = activeRoom.chat[activeRoom.chat.length - 1];
    
    // Ignore system logs
    if (latestMsg.senderId === 'system') return;

    const color = latestMsg.senderColor;
    if (color) {
      setActiveReactions(prev => ({
        ...prev,
        [color]: { text: latestMsg.text, id: latestMsg.id }
      }));

      playPopSound();

      // Clear reaction bubble after 3 seconds
      const timer = setTimeout(() => {
        setActiveReactions(prev => {
          if (prev[color]?.id === latestMsg.id) {
            return { ...prev, [color]: null };
          }
          return prev;
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [activeRoom?.chat]);

  const profile = currentUser ? { uid: currentUser.uid, name: currentUser.displayName || 'Player' } : guestUser;
  const turnPlayer = activeRoom.players[activeRoom.turnPlayerId || ''];
  const isMyTurn = 
    gameMode === 'online' 
      ? activeRoom.turnPlayerId === profile?.uid
      : gameMode === 'practice'
        ? activeRoom.turnPlayerId === 'p_red'
        : true; // In offline2 and offline4, anyone's turn is playable on this device

  // Determine local player's color for perspective rotation
  const getRotationAngle = (color: PlayerColor): number => {
    switch (color) {
      case 'red': return 180;
      case 'green': return 90;
      case 'yellow': return 0;
      case 'blue': return 270;
      default: return 0;
    }
  };

  const localPlayer = (gameMode === 'online' && profile?.uid) ? activeRoom.players[profile.uid] : null;
  const localColor: PlayerColor = localPlayer ? localPlayer.color : 'yellow'; // default yellow in offline so Red is top-left, Yellow is bottom-right (original view)
  const boardRotation = getRotationAngle(localColor);

  // Turn Timer Countdown (30 seconds)
  useEffect(() => {
    if (activeRoom.status !== 'playing') return;

    // Reset timer on turn change or roll change
    setTimeLeft(30);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          // If it is my turn and we haven't rolled, or we rolled and didn't move, auto skip or trigger random move
          if (isMyTurn) {
            triggerAutoAction();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeRoom.turnPlayerId, activeRoom.dice.rolled, isMyTurn]);

  // Handle auto roll / auto move on timeout
  const triggerAutoAction = () => {
    if (!activeRoom.dice.rolled) {
      rollDice();
    } else if (validMoves.length > 0) {
      // Pick random valid move
      const randomTokenIdx = validMoves[Math.floor(Math.random() * validMoves.length)];
      moveToken(randomTokenIdx);
    }
  };

  // Group tokens by grid position to handle clustering / overlapping
  const getClusters = () => {
    const clusters: Record<string, { color: PlayerColor; tokenIdx: number }[]> = {};

    (Object.entries(activeRoom.boardState) as [PlayerColor, number[]][]).forEach(([color, tokens]) => {
      tokens.forEach((stepCount, tokenIdx) => {
        // Find position
        const pos = getTokenGridPosition(color as PlayerColor, tokenIdx, stepCount);
        const key = `${pos.row}_${pos.col}`;
        
        if (!clusters[key]) {
          clusters[key] = [];
        }
        clusters[key].push({ color: color as PlayerColor, tokenIdx });
      });
    });

    return clusters;
  };

  const clusters = getClusters();

  // Get offset and scale for a token inside a cluster
  const getTokenStyle = (color: PlayerColor, tokenIdx: number, stepCount: number) => {
    const pos = getTokenGridPosition(color, tokenIdx, stepCount);
    const key = `${pos.row}_${pos.col}`;
    const tokenCluster = clusters[key] || [];
    const count = tokenCluster.length;

    // Default: centered in the cell (each cell is 1/15th of board width)
    const cellSize = 100 / 15; // 6.6667%
    let left = pos.col * cellSize;
    let top = pos.row * cellSize;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    // Cluster arrangement
    if (count > 1) {
      const idx = tokenCluster.findIndex((t) => t.color === color && t.tokenIdx === tokenIdx);
      scale = count === 2 ? 0.75 : count === 3 ? 0.65 : 0.55;

      // Small offsets within the cell
      const offsetAmt = cellSize * 0.22;
      if (count === 2) {
        offsetX = idx === 0 ? -offsetAmt : offsetAmt;
        offsetY = idx === 0 ? -offsetAmt : offsetAmt;
      } else if (count === 3) {
        if (idx === 0) {
          offsetX = 0;
          offsetY = -offsetAmt;
        } else if (idx === 1) {
          offsetX = -offsetAmt;
          offsetY = offsetAmt;
        } else {
          offsetX = offsetAmt;
          offsetY = offsetAmt;
        }
      } else {
        // 4 or more tokens
        if (idx === 0) { offsetX = -offsetAmt; offsetY = -offsetAmt; }
        else if (idx === 1) { offsetX = offsetAmt; offsetY = -offsetAmt; }
        else if (idx === 2) { offsetX = -offsetAmt; offsetY = offsetAmt; }
        else { offsetX = offsetAmt; offsetY = offsetAmt; }
      }
    }

    return {
      left: `calc(${left}% + ${offsetX}px)`,
      top: `calc(${top}% + ${offsetY}px)`,
      width: `${cellSize * scale}%`,
      height: `${cellSize * scale}%`
    };
  };

  // Safe check for visual indicator
  const safeStars = [
    { row: 2, col: 6 },
    { row: 6, col: 12 },
    { row: 12, col: 8 },
    { row: 8, col: 2 }
  ];

  return (
    <div id="game-board-container" className="flex flex-col h-full bg-transparent text-white select-none relative overflow-y-auto z-10">
      
      {/* Header Overlay */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button 
            id="leave-game-btn"
            onClick={leaveRoom} 
            className="text-xs backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 py-1.5 px-3 rounded-lg font-bold transition"
          >
            Leave
          </button>
          <span className="text-xs text-white/40 font-mono">Room: {activeRoom.roomId}</span>
        </div>

        {/* Turn Timer visual progress, Chat, and Sound Toggle */}
        <div className="flex items-center gap-2">
          {activeRoom.status === 'playing' && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full py-1 px-2 shadow-lg">
              <span className={`w-2 h-2 rounded-full ${timeLeft <= 7 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
              <span className="text-[10px] font-bold font-mono text-white/70">{timeLeft}s</span>
            </div>
          )}

          {/* Integrated Chat Button */}
          <button
            id="header-chat-btn"
            onClick={() => setShowQuickChat(!showQuickChat)}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/75 transition"
            title="Chat Reactions"
          >
            <MessageCircle className="w-4 h-4 text-blue-400" />
          </button>

          <button
            id="board-sound-toggle-btn"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-1.5 rounded-lg border transition-all duration-300 ${
              settings.soundEnabled 
                ? 'bg-indigo-600/25 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40 hover:scale-105' 
                : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
            }`}
            title={settings.soundEnabled ? "Mute Sound" : "Unmute Sound"}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Game Screen Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative">
        
        {/* Board and Dice Wrapper with custom minimal padding to maximize screen usage */}
        <div 
          className="relative p-2 w-full max-w-[480px] xs:max-w-[520px] sm:max-w-[560px] md:max-w-[600px] flex items-center justify-center transition-transform duration-1000 ease-out-back"
          style={{ transform: `rotate(${boardRotation}deg)` }}
        >

          {/* Outer square container representing high-contrast modern frame */}
          <div className="w-full aspect-square bg-[#0c082b] border-[10px] border-[#1e1757] rounded-[28px] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.7),inset_0_2px_8px_rgba(255,255,255,0.15)] relative overflow-hidden">
            
            {/* LUDO BOARD PLAYING FIELD WITH PURE WHITE HIGH-CONTRAST BACKGROUND */}
            <div className="w-full h-full relative bg-white rounded-[16px] overflow-hidden border-2 border-slate-950">
            
            {/* 1. Red Yard (Top Left) */}
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-[#E13A23] p-2.5 flex items-center justify-center border-r-[2.5px] border-b-[2.5px] border-slate-950">
              <div className="w-[86%] h-[86%] bg-white rounded-xl border-2 border-slate-950 shadow-inner relative flex items-center justify-center overflow-hidden">
                {/* 6x6 grid mapping to perfectly match 15x15 layout */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-2">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const r = Math.floor(idx / 6);
                    const c = idx % 6;
                    const isSocket = (r === 2 || r === 3) && (c === 2 || c === 3);
                    if (isSocket) {
                      return (
                        <div key={idx} className="flex items-center justify-center p-0.5">
                          <div className="w-full h-full rounded-full bg-[#E13A23] border-2 border-slate-950 shadow-sm" />
                        </div>
                      );
                    }
                    return <div key={idx} />;
                  })}
                </div>

                {/* Overlapping Yard Reaction Overlay */}
                <AnimatePresence>
                  {activeReactions.red && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/95 rounded-full flex flex-col items-center justify-center p-2.5 z-20 border-2 border-red-500 shadow-2xl"
                      style={{ transform: `rotate(${-boardRotation}deg)` }}
                    >
                      <span className="text-[14px] leading-none mb-1">💬</span>
                      <p className="text-[10px] font-extrabold text-red-400 text-center leading-tight break-words w-[85%]">
                        {activeReactions.red.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 2. Green Yard (Top Right) */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[#0BB24E] p-2.5 flex items-center justify-center border-l-[2.5px] border-b-[2.5px] border-slate-950">
              <div className="w-[86%] h-[86%] bg-white rounded-xl border-2 border-slate-950 shadow-inner relative flex items-center justify-center overflow-hidden">
                {/* 6x6 grid mapping to perfectly match 15x15 layout */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-2">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const r = Math.floor(idx / 6);
                    const c = idx % 6;
                    const isSocket = (r === 2 || r === 3) && (c === 2 || c === 3);
                    if (isSocket) {
                      return (
                        <div key={idx} className="flex items-center justify-center p-0.5">
                          <div className="w-full h-full rounded-full bg-[#0BB24E] border-2 border-slate-950 shadow-sm" />
                        </div>
                      );
                    }
                    return <div key={idx} />;
                  })}
                </div>

                {/* Overlapping Yard Reaction Overlay */}
                <AnimatePresence>
                  {activeReactions.green && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/95 rounded-full flex flex-col items-center justify-center p-2.5 z-20 border-2 border-green-500 shadow-2xl"
                      style={{ transform: `rotate(${-boardRotation}deg)` }}
                    >
                      <span className="text-[14px] leading-none mb-1">💬</span>
                      <p className="text-[10px] font-extrabold text-green-400 text-center leading-tight break-words w-[85%]">
                        {activeReactions.green.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 3. Yellow Yard (Bottom Right) */}
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-[#F9C013] p-2.5 flex items-center justify-center border-l-[2.5px] border-t-[2.5px] border-slate-950">
              <div className="w-[86%] h-[86%] bg-white rounded-xl border-2 border-slate-950 shadow-inner relative flex items-center justify-center overflow-hidden">
                {/* 6x6 grid mapping to perfectly match 15x15 layout */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-2">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const r = Math.floor(idx / 6);
                    const c = idx % 6;
                    const isSocket = (r === 2 || r === 3) && (c === 2 || c === 3);
                    if (isSocket) {
                      return (
                        <div key={idx} className="flex items-center justify-center p-0.5">
                          <div className="w-full h-full rounded-full bg-[#F9C013] border-2 border-slate-950 shadow-sm" />
                        </div>
                      );
                    }
                    return <div key={idx} />;
                  })}
                </div>

                {/* Overlapping Yard Reaction Overlay */}
                <AnimatePresence>
                  {activeReactions.yellow && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/95 rounded-full flex flex-col items-center justify-center p-2.5 z-20 border-2 border-yellow-400 shadow-2xl"
                      style={{ transform: `rotate(${-boardRotation}deg)` }}
                    >
                      <span className="text-[14px] leading-none mb-1">💬</span>
                      <p className="text-[10px] font-extrabold text-yellow-400 text-center leading-tight break-words w-[85%]">
                        {activeReactions.yellow.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Bottom Left Yard (Blue) */}
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#028BF8] p-2.5 flex items-center justify-center border-r-[2.5px] border-t-[2.5px] border-slate-950">
              <div className="w-[86%] h-[86%] bg-white rounded-xl border-2 border-slate-950 shadow-inner relative flex items-center justify-center overflow-hidden">
                {/* 6x6 grid mapping to perfectly match 15x15 layout */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 p-2">
                  {Array.from({ length: 36 }).map((_, idx) => {
                    const r = Math.floor(idx / 6);
                    const c = idx % 6;
                    const isSocket = (r === 2 || r === 3) && (c === 2 || c === 3);
                    if (isSocket) {
                      return (
                        <div key={idx} className="flex items-center justify-center p-0.5">
                          <div className="w-full h-full rounded-full bg-[#028BF8] border-2 border-slate-950 shadow-sm" />
                        </div>
                      );
                    }
                    return <div key={idx} />;
                  })}
                </div>

                {/* Overlapping Yard Reaction Overlay */}
                <AnimatePresence>
                  {activeReactions.blue && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-0 bg-slate-950/95 rounded-full flex flex-col items-center justify-center p-2.5 z-20 border-2 border-blue-500 shadow-2xl"
                      style={{ transform: `rotate(${-boardRotation}deg)` }}
                    >
                      <span className="text-[14px] leading-none mb-1">💬</span>
                      <p className="text-[10px] font-extrabold text-blue-400 text-center leading-tight break-words w-[85%]">
                        {activeReactions.blue.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 5. Center Finish Area (Classic Triangles Layout) */}
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-[#E5A65D] flex items-center justify-center border-[2.5px] border-slate-950 overflow-hidden">
              <div className="w-full h-full relative">
                {/* Left Triangle (Red) */}
                <div className="absolute inset-0 bg-[#E13A23] border border-slate-950/20" style={{ clipPath: 'polygon(0% 0%, 50% 50%, 0% 100%)' }} />
                {/* Top Triangle (Green) */}
                <div className="absolute inset-0 bg-[#0BB24E] border border-slate-950/20" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)' }} />
                {/* Right Triangle (Yellow) */}
                <div className="absolute inset-0 bg-[#F9C013] border border-slate-950/20" style={{ clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)' }} />
                {/* Bottom Triangle (Blue) */}
                <div className="absolute inset-0 bg-[#028BF8] border border-slate-950/20" style={{ clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)' }} />
              </div>
            </div>

            {/* 6. Columns & Track Grid Layer (to overlay individual cell boundaries nicely) */}
            <div className="w-full h-full grid grid-cols-15 grid-rows-15 absolute top-0 left-0 pointer-events-none">
              {Array.from({ length: 15 * 15 }).map((_, idx) => {
                const r = Math.floor(idx / 15);
                const c = idx % 15;

                // Only render cell border outlines for actual tracks/paths
                const isYard = (r < 6 && c < 6) || (r < 6 && c >= 9) || (r >= 9 && c < 6) || (r >= 9 && c >= 9);
                const isCenter = r >= 6 && r < 9 && c >= 6 && c < 9;

                if (isYard || isCenter) return <div key={idx} />;

                // Solid high-contrast white cell background with thick black borders
                let cellBg = 'bg-[#FFFFFF] border-[1.5px] border-slate-950';
                let cellContent: React.ReactNode = null;
                
                // Color Home Paths
                if (r === 7 && c >= 1 && c <= 5) cellBg = 'bg-[#E13A23] border-[1.5px] border-slate-950 shadow-inner';
                if (c === 7 && r >= 1 && r <= 5) cellBg = 'bg-[#0BB24E] border-[1.5px] border-slate-950 shadow-inner';
                if (r === 7 && c >= 9 && c <= 13) cellBg = 'bg-[#F9C013] border-[1.5px] border-slate-950 shadow-inner';
                if (c === 7 && r >= 9 && r <= 13) cellBg = 'bg-[#028BF8] border-[1.5px] border-slate-950 shadow-inner';

                // Color Start Cells
                if (r === 6 && c === 1) {
                  cellBg = 'bg-[#E13A23] border-[1.5px] border-slate-950 shadow-inner';
                }
                if (r === 1 && c === 8) {
                  cellBg = 'bg-[#0BB24E] border-[1.5px] border-slate-950 shadow-inner';
                }
                if (r === 8 && c === 13) {
                  cellBg = 'bg-[#F9C013] border-[1.5px] border-slate-950 shadow-inner';
                }
                if (r === 13 && c === 6) {
                  cellBg = 'bg-[#028BF8] border-[1.5px] border-slate-950 shadow-inner';
                }

                // Render Star cells with a bold black Star icon
                const isStar = safeStars.some(s => s.row === r && s.col === c);
                if (isStar) {
                  cellBg = 'bg-[#FFFFFF] border-[1.5px] border-slate-950 flex items-center justify-center';
                  cellContent = <Star className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />;
                }

                // Specific detail (e.g. circles inside home path elements matching standard style)
                if (r === 2 && c === 7) {
                  cellContent = <div className="w-3 h-3 rounded-full border-2 border-slate-950/40 bg-transparent" />;
                }

                return (
                  <div 
                    key={idx} 
                    className={`${cellBg} w-full h-full flex items-center justify-center text-[8px]`}
                  >
                    {cellContent}
                  </div>
                );
              })}
            </div>

            {/* 7. Active Tokens Layer (Redesigned as Premium 3D Glossy Pawns matching second photo) */}
            {(Object.entries(activeRoom.boardState) as [PlayerColor, number[]][]).flatMap(([color, tokens]) => {
              const colorMeta = COLOR_CLASSES[color as PlayerColor];
              const isPlayerColor = color === turnPlayer?.color;

              return tokens.map((stepCount, tokenIdx) => {
                const style = getTokenStyle(color as PlayerColor, tokenIdx, stepCount);
                const isHighlight = isPlayerColor && isMyTurn && validMoves.includes(tokenIdx) && !isMovingToken;

                return (
                  <motion.div
                    id={`token-${color}-${tokenIdx}`}
                    key={`${color}_${tokenIdx}`}
                    onClick={() => {
                      if (isHighlight) {
                        moveToken(tokenIdx);
                      }
                    }}
                    style={{ ...style, transform: `rotate(${-boardRotation}deg)` }}
                    className={`absolute flex items-center justify-center transition-all duration-300 ${
                      isHighlight 
                        ? 'z-30 cursor-pointer scale-115 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.85)]' 
                        : 'z-10'
                    }`}
                  >
                    {/* Exquisite 3D Pawn Layout (Head on top, Collar in middle, Skirt base at bottom) */}
                    <div className={`relative w-full h-[155%] -top-[55%] flex flex-col items-center justify-end select-none ${isHighlight ? 'animate-bounce' : ''}`}>
                      
                      {/* Smooth Pawn shadow on cell */}
                      <div className="absolute bottom-0 w-[84%] h-[15%] bg-black/55 rounded-full blur-[1px] z-0" />
                      
                      {/* 1. Glossy Spherical Head (on top) */}
                      <div className={`w-[68%] aspect-square rounded-full border border-black/15 z-20 shadow-md relative overflow-hidden ${
                        color === 'red' ? 'bg-[radial-gradient(circle_at_35%_35%,#ffa5a5_0%,#e11d48_45%,#881337_100%)]' :
                        color === 'green' ? 'bg-[radial-gradient(circle_at_35%_35%,#a7f3d0_0%,#10b981_45%,#064e3b_100%)]' :
                        color === 'yellow' ? 'bg-[radial-gradient(circle_at_35%_35%,#fffbeb_0%,#eab308_45%,#713f12_100%)]' :
                        'bg-[radial-gradient(circle_at_35%_35%,#dbeafe_0%,#3b82f6_45%,#1e3a8a_100%)]'
                      }`}>
                        {/* Specular spot */}
                        <div className="absolute top-1 left-1.5 w-2 h-2 bg-white/85 rounded-full blur-[0.4px]" />
                      </div>

                      {/* 2. Middle neck collar separator ring */}
                      <div className={`w-[48%] h-[10%] -mt-1 z-10 rounded-full border border-black/15 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.5)] ${
                        color === 'red' ? 'bg-[#ff6b6b]' :
                        color === 'green' ? 'bg-[#51cf66]' :
                        color === 'yellow' ? 'bg-[#ffd43b]' :
                        'bg-[#339af0]'
                      }`} />

                      {/* 3. Pawn Skirt Base (Styled as real 3D Conical shape matching the photo, at the bottom) */}
                      <div 
                        className={`w-[85%] h-[58%] -mt-1 border border-black/15 rounded-b-[4px] relative overflow-hidden shadow-inner z-0 ${
                          color === 'red' ? 'bg-[linear-gradient(135deg,#ff3b30_0%,#d11a0f_50%,#800500_100%)]' :
                          color === 'green' ? 'bg-[linear-gradient(135deg,#34c759_0%,#198d36_50%,#095019_100%)]' :
                          color === 'yellow' ? 'bg-[linear-gradient(135deg,#ffcc00_0%,#dca400_50%,#885f00_100%)]' :
                          'bg-[linear-gradient(135deg,#007aff_0%,#0055c5_50%,#002b7a_100%)]'
                        }`}
                        style={{ clipPath: 'polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)' }}
                      >
                        {/* Real shiny specular gloss vertical highlight */}
                        <div className="absolute top-0 left-[22%] w-[18%] h-full bg-gradient-to-r from-white/40 to-transparent transform -skew-x-12" />
                      </div>

                    </div>
                  </motion.div>
                );
              });
            })}

          </div>
        </div>

        {/* Closing the relative Board and Dice Wrapper with custom padding */}
        </div>

        {/* Active Roll Panel / User Profile Controls */}
        <div className="w-full max-w-sm mt-2 hidden grid-cols-2 gap-4">
          
          {/* Active Player Card with status */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden shadow-lg text-center min-h-[140px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5">Dice Status</span>
            
            {/* Interactive 3D Dice Cube inside the card */}
            {turnPlayer && (
              <button
                id={`roll-dice-console-${turnPlayer.color}`}
                onClick={() => {
                  if (isMyTurn && !activeRoom.dice.rolled && !isRolling) {
                    rollDice();
                  }
                }}
                disabled={!isMyTurn || activeRoom.dice.rolled || isRolling}
                className={`transition-all duration-300 relative flex items-center justify-center p-2 rounded-xl border ${
                  isMyTurn && !activeRoom.dice.rolled && !isRolling
                    ? `scale-105 cursor-pointer hover:scale-110 active:scale-95 ring-2 animate-pulse ${DICE_RING_CLASSES[turnPlayer.color]}`
                    : `scale-95 opacity-90 ${DICE_RING_CLASSES[turnPlayer.color]}`
                }`}
              >
                <div className={`dice-scene glow-${turnPlayer.color} scale-[0.75] my-0.5`}>
                  <div className={`dice-cube ${isRolling ? 'is-rolling' : `show-${activeRoom.dice.value}`}`}>
                    <div className="dice-face face-1"><div className="dice-dot"></div></div>
                    <div className="dice-face face-2"><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-3"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-4"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-5"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-6"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                  </div>
                </div>
              </button>
            )}

            <div className={`text-[11px] font-black tracking-tight mt-2 ${COLOR_CLASSES[turnPlayer?.color || 'red'].text}`}>
              {activeRoom.dice.rolled ? `Rolled a ${activeRoom.dice.value}!` : isRolling ? 'Rolling...' : isMyTurn ? 'Tap Dice to Roll' : 'Waiting...'}
            </div>
          </div>

          {/* Opponent Info card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/40 uppercase">Match Player</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl">{turnPlayer?.avatar || '🦁'}</span>
                <div>
                  <p className="text-xs font-bold truncate max-w-[100px] text-white/90">{turnPlayer?.name || 'Loading...'}</p>
                  <p className="text-[9px] text-white/40 font-mono font-bold capitalize">{turnPlayer?.color || 'red'}</p>
                </div>
              </div>
            </div>

            {/* Indicator of highlights */}
            {isMyTurn && activeRoom.dice.rolled && validMoves.length > 0 && (
              <div className="bg-blue-400/20 text-blue-300 text-[10px] border border-blue-400/30 py-1.5 px-2 rounded-lg text-center font-bold">
                Tap Glowing Token!
              </div>
            )}
          </div>

        </div>

        {/* Ultra-sleek, Compact Action & Dice Bar */}
        <div className="w-full max-w-[440px] xs:max-w-[480px] mt-1 backdrop-blur-xl bg-black/45 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between shadow-xl">
          {/* Turn Indicator */}
          <div className="flex items-center gap-2 max-w-[45%]">
            <span className="text-lg bg-white/5 p-1 rounded-xl">{turnPlayer?.avatar || '🦁'}</span>
            <div className="text-left min-w-0">
              <p className="text-[11px] font-black text-white/95 leading-none truncate">{turnPlayer?.name || 'Player'}</p>
              <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 leading-none ${COLOR_CLASSES[turnPlayer?.color || 'red'].text}`}>
                {COLOR_NAMES[turnPlayer?.color || 'red']}
              </p>
            </div>
          </div>

          {/* Centered state instruction */}
          <div className="text-center px-2 flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-white/40 leading-none">Status</p>
            <p className={`text-[11px] font-black uppercase tracking-tight truncate mt-1 ${COLOR_CLASSES[turnPlayer?.color || 'red'].text}`}>
              {activeRoom.dice.rolled ? `Rolled a ${activeRoom.dice.value}!` : isRolling ? 'Rolling...' : isMyTurn ? 'Tap to Roll' : 'Waiting...'}
            </p>
          </div>

          {/* Dice Button */}
          <div className="relative shrink-0 flex items-center justify-center">
            {turnPlayer && (
              <button
                id={`roll-dice-console-${turnPlayer.color}`}
                onClick={() => {
                  if (isMyTurn && !activeRoom.dice.rolled && !isRolling) {
                    rollDice();
                  }
                }}
                disabled={!isMyTurn || activeRoom.dice.rolled || isRolling}
                className={`transition-all duration-300 relative flex items-center justify-center p-1 rounded-xl border ${
                  isMyTurn && !activeRoom.dice.rolled && !isRolling
                    ? `scale-105 cursor-pointer hover:scale-110 active:scale-95 ring-2 animate-pulse ${DICE_RING_CLASSES[turnPlayer.color]}`
                    : `scale-95 opacity-90 ${DICE_RING_CLASSES[turnPlayer.color]}`
                }`}
              >
                <div className={`dice-scene glow-${turnPlayer.color} scale-[0.55] my-0.5`}>
                  <div className={`dice-cube ${isRolling ? 'is-rolling' : `show-${activeRoom.dice.value}`}`}>
                    <div className="dice-face face-1"><div className="dice-dot"></div></div>
                    <div className="dice-face face-2"><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-3"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-4"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-5"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                    <div className="dice-face face-6"><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div><div className="dice-dot"></div></div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Floating Indicator of highlights */}
        {isMyTurn && activeRoom.dice.rolled && validMoves.length > 0 && (
          <div className="mt-2 bg-blue-400/20 text-blue-300 text-[10px] border border-blue-400/30 py-1.5 px-3 rounded-xl text-center font-bold animate-pulse">
            👉 Tap glowing token to move!
          </div>
        )}

        {/* Styled signature at the bottom with a subtle animation */}
        <div className="mt-6 pb-2 flex justify-center">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4], scale: [0.97, 1, 0.97] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-[9px] font-black uppercase tracking-widest text-white/35 font-mono select-none"
          >
            Make by the <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-400 to-indigo-400">Ns team</span>
          </motion.div>
        </div>

        {/* Compact Reactions Selection Grid Overlay */}
        <AnimatePresence>
          {showQuickChat && (
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowQuickChat(false)}>
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-slate-950/95 border border-slate-800/80 p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    Quick Game Reactions
                  </h3>
                  <button
                    onClick={() => setShowQuickChat(false)}
                    className="text-xs font-black text-white/40 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {[
                    { text: "Play fast please! 🕒", label: "Hurry Up" },
                    { text: "I will win this! 😎", label: "Confidence" },
                    { text: "Wow, lucky roll! 😲", label: "Surprise" },
                    { text: "Haha, captured you! 😈", label: "Taunt" },
                    { text: "Well played! 👏", label: "Respect" },
                    { text: "It's all about luck! 🎲", label: "Luck" },
                    { text: "Wait, thinking... 🤔", label: "Strategy" },
                    { text: "Oh no, bad luck! 🤦‍♂️", label: "Oops" },
                    { text: "I need a 6! 🎲", label: "Need 6" },
                    { text: "Excellent move! 🔥", label: "Awesome" }
                  ].map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sendChatMessage(phrase.text);
                        setShowQuickChat(false);
                      }}
                      className="py-3 px-2 bg-slate-900 hover:bg-slate-850 active:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-xl transition text-left group"
                    >
                      <p className="text-[10px] font-black text-blue-400 group-hover:text-blue-300 uppercase tracking-wider mb-0.5">{phrase.label}</p>
                      <p className="text-xs font-bold text-white/95 leading-snug">{phrase.text}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

      {/* Victory Congratulation Dialog overlay */}
      <AnimatePresence>
        {activeRoom.status === 'finished' && (() => {
          const winnerPlayer = activeRoom.winnerId ? activeRoom.players[activeRoom.winnerId] : null;
          const winnerColor = winnerPlayer ? winnerPlayer.color : 'yellow';
          const winnerColorGlow = 
            winnerColor === 'red' ? 'shadow-red-500/20 border-red-500/30' :
            winnerColor === 'green' ? 'shadow-green-500/20 border-green-500/30' :
            winnerColor === 'yellow' ? 'shadow-yellow-500/20 border-yellow-500/30' :
            'shadow-blue-500/20 border-blue-500/30';
          
          const winnerColorText = 
            winnerColor === 'red' ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
            winnerColor === 'green' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
            winnerColor === 'yellow' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' :
            'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]';

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
                className={`backdrop-blur-2xl bg-slate-900/80 border ${winnerColorGlow} rounded-3xl p-8 w-full max-w-sm text-center relative overflow-hidden shadow-2xl`}
              >
                {/* Rotating golden radiant light behind trophy */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl -z-10"
                />

                {/* Sparkling Floating Stars */}
                <div className="absolute top-6 left-6 animate-pulse text-amber-400 opacity-60 text-lg">✦</div>
                <div className="absolute top-12 right-8 animate-bounce text-amber-300 opacity-70 text-sm">✦</div>
                <div className="absolute bottom-16 left-8 animate-bounce text-yellow-400 opacity-50 text-xs">✦</div>
                <div className="absolute bottom-12 right-12 animate-pulse text-amber-500 opacity-60 text-sm">✦</div>

                {/* High-impact trophy with bounce */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-7xl mb-4 drop-shadow-[0_10px_20px_rgba(245,158,11,0.5)] flex justify-center"
                >
                  🏆
                </motion.div>

                {/* Title */}
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 tracking-tight uppercase">
                  Victory!
                </h2>

                {/* Winner Avatar Circle */}
                <div className="relative inline-block mt-4 mb-3">
                  <div className="absolute inset-0 bg-amber-500/25 rounded-full blur-lg animate-pulse" />
                  <div className="relative w-20 h-20 bg-slate-950 border-2 border-amber-400/80 rounded-full flex items-center justify-center text-4xl shadow-2xl">
                    {winnerPlayer?.avatar || '👑'}
                    {/* Tiny pawn badge at the corner of avatar */}
                    <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow-md">
                      🥇
                    </span>
                  </div>
                </div>

                {/* Winner details */}
                <p className={`font-black text-xl tracking-tight ${winnerColorText}`}>
                  {activeRoom.winnerName}
                </p>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mt-1">
                  Ludo Master Champion
                </p>
                <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl inline-block">
                  <span className="text-[10px] text-white/40 uppercase font-bold mr-1">Status:</span>
                  <span className="text-[11px] font-black text-amber-400 uppercase">Unbeaten</span>
                </div>

                <div className="mt-8">
                  <button
                    id="victory-main-menu-btn"
                    onClick={leaveRoom}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider border border-amber-400/20"
                  >
                    Return to Main Menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
