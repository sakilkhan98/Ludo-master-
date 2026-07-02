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
import { Star, Shield, HelpCircle, Trophy, Volume2, VolumeX, PhoneOff, ArrowRight, MessageCircle } from 'lucide-react';

const DICE_CORNER_CLASSES: Record<PlayerColor, string> = {
  red: 'top-1 left-1 md:top-2 md:left-2',
  green: 'top-1 right-1 md:top-2 md:right-2',
  yellow: 'bottom-1 right-1 md:bottom-2 md:right-2',
  blue: 'bottom-1 left-1 md:bottom-2 md:left-2'
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
    settings
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

      // Clear reaction bubble after 4 seconds
      const timer = setTimeout(() => {
        setActiveReactions(prev => {
          if (prev[color]?.id === latestMsg.id) {
            return { ...prev, [color]: null };
          }
          return prev;
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [activeRoom?.chat]);

  const profile = currentUser ? { uid: currentUser.uid, name: currentUser.displayName || 'Player' } : guestUser;
  const turnPlayer = activeRoom.players[activeRoom.turnPlayerId || ''];
  const isMyTurn = 
    gameMode === 'online' 
      ? activeRoom.turnPlayerId === profile?.uid
      : gameMode === 'practice'
        ? (activeRoom.players[activeRoom.turnPlayerId || '']?.uid === profile?.uid)
        : true; // In offline2 and offline4, anyone's turn is playable on this device

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
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/10 sticky top-0 z-40 backdrop-blur-md">
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

        {/* Turn Timer visual progress */}
        {activeRoom.status === 'playing' && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full py-1.5 px-3.5 shadow-lg">
            <span className={`w-2.5 h-2.5 rounded-full ${timeLeft <= 7 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
            <span className="text-xs font-bold font-mono text-white/70">Turn Timer: {timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Main Game Screen Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 relative">
        
        {/* Dynamic status banner */}
        <div className="w-full max-w-md text-center py-2 px-4 mb-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-lg shadow-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <div className={`w-3.5 h-3.5 rounded-full ${COLOR_CLASSES[turnPlayer?.color || 'red'].bg} animate-pulse`} />
            <div>
              <p className="text-xs font-bold text-white/90">{turnPlayer?.name || 'Player'}'s Turn</p>
              <p className="text-[10px] text-white/40 font-medium">Color: {COLOR_NAMES[turnPlayer?.color || 'red']}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wide">Status:</span>
            <span className="text-xs font-extrabold text-blue-400 capitalize">{activeRoom.status}</span>
          </div>
        </div>

        {/* Board and Dice Wrapper with custom padding to hold outer dice and chat bubbles */}
        <div className="relative p-10 md:p-12 w-full max-w-[440px] flex items-center justify-center">

          {/* Floating Reaction Chat Bubbles at 4 corners OUTSIDE the board */}
          <AnimatePresence>
            {activeReactions.red && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute top-[35px] left-[15px] z-50 pointer-events-none"
              >
                <div className="backdrop-blur-xl bg-slate-950/90 border-2 border-red-500 rounded-2xl rounded-tl-none p-2 shadow-2xl max-w-[150px] relative">
                  <div className="absolute -top-1.5 left-2 w-3 h-3 bg-red-500 rotate-45" />
                  <p className="text-[10px] font-black text-white leading-tight break-words">{activeReactions.red.text}</p>
                </div>
              </motion.div>
            )}

            {activeReactions.green && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute top-[35px] right-[15px] z-50 pointer-events-none"
              >
                <div className="backdrop-blur-xl bg-slate-950/90 border-2 border-green-500 rounded-2xl rounded-tr-none p-2 shadow-2xl max-w-[150px] relative">
                  <div className="absolute -top-1.5 right-2 w-3 h-3 bg-green-500 rotate-45" />
                  <p className="text-[10px] font-black text-white leading-tight break-words">{activeReactions.green.text}</p>
                </div>
              </motion.div>
            )}

            {activeReactions.yellow && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: -15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute bottom-[35px] right-[15px] z-50 pointer-events-none"
              >
                <div className="backdrop-blur-xl bg-slate-950/90 border-2 border-yellow-400 rounded-2xl rounded-br-none p-2 shadow-2xl max-w-[150px] relative">
                  <div className="absolute -bottom-1.5 right-2 w-3 h-3 bg-yellow-400 rotate-45" />
                  <p className="text-[10px] font-black text-white leading-tight break-words">{activeReactions.yellow.text}</p>
                </div>
              </motion.div>
            )}

            {activeReactions.blue && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: -15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute bottom-[35px] left-[15px] z-50 pointer-events-none"
              >
                <div className="backdrop-blur-xl bg-slate-950/90 border-2 border-blue-500 rounded-2xl rounded-bl-none p-2 shadow-2xl max-w-[150px] relative">
                  <div className="absolute -bottom-1.5 left-2 w-3 h-3 bg-blue-500 rotate-45" />
                  <p className="text-[10px] font-black text-white leading-tight break-words">{activeReactions.blue.text}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Active Corner Dice outside board corners */}
          {turnPlayer && (
            <div className={`absolute ${DICE_CORNER_CLASSES[turnPlayer.color]} z-40 pointer-events-auto transition-all duration-500 ease-out`}>
              <button
                id={`roll-dice-floating-${turnPlayer.color}`}
                onClick={() => {
                  if (isMyTurn && !activeRoom.dice.rolled && !isRolling) {
                    rollDice();
                  }
                }}
                disabled={!isMyTurn || activeRoom.dice.rolled || isRolling}
                className={`transition-all duration-300 relative flex flex-col items-center justify-center p-2 rounded-2xl border backdrop-blur-md shadow-2xl ${
                  isMyTurn && !activeRoom.dice.rolled && !isRolling
                    ? `scale-110 cursor-pointer hover:scale-115 active:scale-95 ring-4 animate-pulse ${DICE_RING_CLASSES[turnPlayer.color]}`
                    : `scale-90 opacity-95 ${DICE_RING_CLASSES[turnPlayer.color]}`
                }`}
              >
                {/* Visual label above dice */}
                <span className="px-2 py-0.5 mb-1.5 rounded-full bg-slate-950/80 text-[8px] font-black uppercase tracking-wider text-white">
                  {turnPlayer.name.split(' ')[0]}
                </span>

                <div className={`dice-scene glow-${turnPlayer.color}`}>
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
            </div>
          )}

          {/* Outer square container to lock aspect ratio of the board */}
          <div className="w-full aspect-square bg-black/40 border-4 border-white/10 rounded-3xl p-1 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            
            {/* LUDO BOARD RENDERING USING ABSOLUTE SEGMENTS */}
            <div className="w-full h-full relative bg-slate-950 rounded-2xl overflow-hidden">
            
            {/* 1. Red Yard (Top Left) */}
            <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-red-600 p-2 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/85 rounded-xl border-2 border-red-500 flex flex-wrap p-2.5 items-center justify-center gap-2.5 relative">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-[10px] text-red-400">
                    🎯
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Green Yard (Top Right) */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-green-600 p-2 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/85 rounded-xl border-2 border-green-500 flex flex-wrap p-2.5 items-center justify-center gap-2.5 relative">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-green-600/20 border border-green-500 flex items-center justify-center text-[10px] text-green-400">
                    🎯
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Yellow Yard (Bottom Right) */}
            <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-yellow-500 p-2 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/85 rounded-xl border-2 border-yellow-400 flex flex-wrap p-2.5 items-center justify-center gap-2.5 relative">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-400 flex items-center justify-center text-[10px] text-yellow-500">
                    🎯
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Bottom Left Yard (Blue) */}
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-600 p-2 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950/85 rounded-xl border-2 border-blue-500 flex flex-wrap p-2.5 items-center justify-center gap-2.5 relative">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500 flex items-center justify-center text-[10px] text-blue-400">
                    🎯
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Center Finish (3x3 grid) */}
            <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-slate-950 flex items-center justify-center border border-slate-800 shadow-md">
              <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                <div className="bg-red-600 flex items-center justify-center text-xs text-white">🏠</div>
                <div className="bg-green-600 flex items-center justify-center text-xs text-white">🏠</div>
                <div className="bg-blue-600 flex items-center justify-center text-xs text-white">🏠</div>
                <div className="bg-yellow-500 flex items-center justify-center text-xs text-white">🏠</div>
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

                // Find color mapping
                let cellBg = 'bg-slate-950 border border-slate-900';
                
                // Color Home Paths
                if (r === 7 && c >= 1 && c <= 5) cellBg = 'bg-red-600 border border-red-500';
                if (c === 7 && r >= 1 && r <= 5) cellBg = 'bg-green-600 border border-green-500';
                if (r === 7 && c >= 9 && c <= 13) cellBg = 'bg-yellow-500 border border-yellow-400';
                if (c === 7 && r >= 9 && r <= 13) cellBg = 'bg-blue-600 border border-blue-500';

                // Color Start Cells
                if (r === 6 && c === 1) cellBg = 'bg-red-600 border-2 border-red-400';
                if (r === 1 && c === 8) cellBg = 'bg-green-600 border-2 border-green-400';
                if (r === 8 && c === 13) cellBg = 'bg-yellow-500 border-2 border-yellow-400';
                if (r === 13 && c === 6) cellBg = 'bg-blue-600 border-2 border-blue-400';

                return (
                  <div 
                    key={idx} 
                    className={`${cellBg} w-full h-full flex items-center justify-center text-[8px]`}
                  >
                    {/* Render safe star icon */}
                    {safeStars.some(s => s.row === r && s.col === c) && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 7. Active Tokens Layer */}
            {(Object.entries(activeRoom.boardState) as [PlayerColor, number[]][]).map(([color, tokens]) => {
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
                    style={style}
                    className={`absolute rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-300 ${
                      colorMeta.bg
                    } ${colorMeta.border} ${
                      isHighlight 
                        ? 'ring-4 ring-white animate-bounce shadow-yellow-400 z-30 cursor-pointer scale-110' 
                        : 'z-10'
                    }`}
                  >
                    {/* Inner graphic representing active token detail */}
                    <div className="w-2/3 h-2/3 rounded-full bg-white/30 border border-white/60 flex items-center justify-center shadow-inner text-[9px] font-bold text-slate-900">
                      {stepCount === 57 ? '👑' : tokenIdx + 1}
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
        <div className="w-full max-w-sm mt-2 grid grid-cols-2 gap-4">
          
          {/* Active Player Card with status */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-lg text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2">Dice Status</span>
            
            <div className={`text-lg font-black tracking-tight ${COLOR_CLASSES[turnPlayer?.color || 'red'].text}`}>
              {activeRoom.dice.rolled ? `Rolled a ${activeRoom.dice.value}!` : isRolling ? 'Rolling...' : 'Needs to Roll'}
            </div>

            {isMyTurn && !activeRoom.dice.rolled && !isRolling && (
              <span className="text-[10px] text-blue-400 font-extrabold mt-1.5 animate-bounce">
                Tap Corner Dice!
              </span>
            )}
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

        {/* Quick Chat FAB and Popover Selector */}
        <div className="mt-4 flex flex-col items-center justify-center">
          <button
            id="quick-chat-toggle-btn"
            onClick={() => setShowQuickChat(!showQuickChat)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 border border-slate-700/60 text-slate-200 font-bold text-xs shadow-xl hover:bg-slate-850 hover:border-slate-600 hover:scale-105 active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>কুইক চ্যাট / Reactions</span>
          </button>
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
                    Quick Bengali Phrases
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
                    { text: "জলদি চাল দিন! 🕒", label: "Quick Play" },
                    { text: "আজ আমিই জিতবো! 😎", label: "Confidence" },
                    { text: "ওরে বাবারে! 😮", label: "Surprise" },
                    { text: "হা হা কেটে দিলাম! 😈", label: "Taunt" },
                    { text: "ভাল খেলেছেন! 👏", label: "Respect" },
                    { text: "ভাগ্যের খেলা ভাই! 🎲", label: "Luck" },
                    { text: "একটু দাঁড়ান... 🤔", label: "Wait" },
                    { text: "ধুর ছাই! 🤦‍♂️", label: "Oops" },
                    { text: "৬ চাই ভাই! 🎲", label: "Need 6" },
                    { text: "দারুণ চাল! 🔥", label: "Fire" }
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
        {activeRoom.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 max-w-sm text-center relative overflow-hidden shadow-2xl shadow-amber-500/10"
            >
              {/* Confetti vectors or stars */}
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-amber-400 tracking-tight">VICTORY!</h2>
              <p className="text-white font-extrabold text-lg mt-2">{activeRoom.winnerName}</p>
              <p className="text-white/50 text-xs mt-1">Has claimed the ultimate title of Ludo Master!</p>

              <div className="mt-8 space-y-3">
                <button
                  id="victory-main-menu-btn"
                  onClick={leaveRoom}
                  className="w-full py-3 px-6 bg-gradient-to-r from-amber-500/80 to-yellow-600/80 border border-white/10 text-white font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/10"
                >
                  Return to Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
