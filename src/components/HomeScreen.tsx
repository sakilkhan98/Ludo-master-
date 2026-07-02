import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Play, 
  Users, 
  Settings, 
  Award, 
  HelpCircle, 
  User, 
  LogOut, 
  Compass, 
  Plus, 
  ChevronRight, 
  Sparkles, 
  Send,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LuckyChestPopup from './LuckyChestPopup';
import { useEffect } from 'react';

const AVATARS = ['👑', '🦊', '🦁', '🐼', '🐨', '🐯', '🦄', '🐉'];

export default function HomeScreen() {
  const { 
    currentUser, 
    guestUser, 
    userStats, 
    loginWithGoogle, 
    loginAsGuest, 
    logout, 
    createOnlineRoom, 
    joinOnlineRoom, 
    setupOfflineGame,
    setActiveMode 
  } = useGame();

  // Authentication inputs
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('👑');

  // Modal states
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showLuckyChest, setShowLuckyChest] = useState(false);

  // Load local guest ranking if guest
  const [guestCoins, setGuestCoins] = useState(1000);

  useEffect(() => {
    if (guestUser) {
      const guestKey = `ludo_guest_ranking_${guestUser.uid}`;
      const savedCoins = localStorage.getItem(guestKey);
      if (savedCoins) {
        setGuestCoins(parseInt(savedCoins, 10));
      } else {
        localStorage.setItem(guestKey, '1000');
        setGuestCoins(1000);
      }
    }
  }, [guestUser]);

  // Listen to local storage changes to keep it updated when spinning/claiming
  useEffect(() => {
    const handleStorageChange = () => {
      if (guestUser) {
        const savedCoins = localStorage.getItem(`ludo_guest_ranking_${guestUser.uid}`);
        if (savedCoins) {
          setGuestCoins(parseInt(savedCoins, 10));
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [guestUser]);

  const isLoggedIn = currentUser || guestUser;

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsGuest(guestName, guestAvatar);
  };

  const handleCreateRoom = async (maxPlayers: number) => {
    try {
      await createOnlineRoom(maxPlayers);
      setShowOnlineModal(false);
    } catch (e: any) {
      alert(e.message || 'Failed to create room.');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.length !== 6) {
      setErrorMsg('Code must be exactly 6 digits.');
      return;
    }
    setErrorMsg('');
    setIsJoining(true);
    try {
      await joinOnlineRoom(roomCodeInput);
      setShowJoinModal(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to join room.');
    } finally {
      setIsJoining(false);
    }
  };

  // Auth Card Renderer
  if (!isLoggedIn) {
    return (
      <div id="auth-screen" className="flex flex-col h-full bg-transparent text-white p-6 justify-center select-none overflow-y-auto relative z-10">
        <div className="text-center mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
            className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-red-500 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-lg shadow-amber-500/10 mb-4"
          >
            🎲
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-red-500 to-indigo-500 bg-clip-text text-transparent">
            LUDO MASTER
          </h1>
          <p className="text-white/40 text-xs mt-1.5 font-medium uppercase tracking-widest">Online Championship</p>
        </div>

        {/* Guest form */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" /> Choose Guest Identity
          </h2>
          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Nickname</label>
              <input
                id="guest-name-input"
                type="text"
                required
                maxLength={12}
                placeholder="Enter nickname..."
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none mt-1 text-white placeholder-white/30"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Select Avatar</label>
              <div className="flex justify-between gap-2 mt-1.5 flex-wrap">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setGuestAvatar(av)}
                    className={`text-2xl p-2 rounded-xl transition active:scale-90 ${
                      guestAvatar === av ? 'bg-blue-500/20 border border-blue-400/80 scale-110 shadow-lg shadow-blue-500/10' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="guest-play-btn"
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500/80 to-indigo-600/80 hover:from-blue-400 hover:to-indigo-500 text-white border border-white/10 font-bold text-sm rounded-xl transition shadow-lg active:scale-95 shadow-blue-500/10"
            >
              Play as Guest
            </button>
          </form>

          {/* Separator divider */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10" />
            <span className="relative bg-[#151235] px-3 text-[10px] text-white/40 font-bold uppercase tracking-wider">or Connect</span>
          </div>

          {/* Google Login button */}
          <button
            id="google-login-btn"
            onClick={loginWithGoogle}
            className="w-full py-3.5 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 active:scale-95 text-white/90"
          >
            <Sparkles className="w-4.5 h-4.5 text-amber-400" />
            Sign In with Google
          </button>
        </motion.div>
      </div>
    );
  }

  // Dashboard Renderer
  const userDisplayName = currentUser?.displayName || guestUser?.name || 'Ludo Master';
  const userDisplayAvatar = userStats?.avatar || guestUser?.avatar || '👑';

  return (
    <div id="home-dashboard" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Top Profile Strip */}
      <div className="flex items-center justify-between mb-8">
        <div 
          id="profile-trigger-div"
          onClick={() => setActiveMode('profile')}
          className="flex items-center gap-3 backdrop-blur-xl bg-white/5 border border-white/10 p-2.5 rounded-2xl cursor-pointer hover:bg-white/10 transition"
        >
          <span className="text-3xl bg-black/40 w-11 h-11 rounded-xl flex items-center justify-center border border-white/10">
            {userDisplayAvatar}
          </span>
          <div>
            <p className="font-extrabold text-sm tracking-tight text-white">{userDisplayName}</p>
            <p className="text-yellow-400 text-[10px] font-bold mt-0.5 font-mono flex items-center gap-1">
              🪙 {currentUser ? (userStats?.ranking || 1000) : guestCoins} Gold
            </p>
          </div>
        </div>

        <button 
          id="settings-nav-btn"
          onClick={() => setActiveMode('settings')}
          className="p-3 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95 text-white/60 hover:text-blue-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hero logo banner */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-red-500 to-indigo-500 bg-clip-text text-transparent">
          LUDO MASTER
        </h1>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">Online Arena</p>
      </div>

      {/* Lucky Daily Chest Portal */}
      <div className="flex justify-center mb-6">
        <button
          id="trigger-lucky-chest-btn"
          onClick={() => setShowLuckyChest(true)}
          className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#501311] via-[#100e2e] to-[#090724] border border-amber-400/60 hover:border-amber-400 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider shadow-lg shadow-black/50 hover:scale-105 active:scale-95 transition-all animate-pulse"
        >
          <span className="text-base">🎁</span>
          <span>Lucky Daily Chest</span>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping shrink-0" />
        </button>
      </div>

      {/* Main Mode Options */}
      <div className="space-y-4 flex-1">
        
        {/* Play Online Match creator (Green Bento Card style) */}
        <button
          id="quick-online-match-btn"
          onClick={() => setShowOnlineModal(true)}
          className="w-full p-5 bg-gradient-to-br from-green-500/80 to-emerald-700/80 rounded-3xl flex items-center justify-between border border-white/20 shadow-2xl transition duration-200 active:scale-98 text-left"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="p-2.5 bg-white/20 rounded-xl text-white">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">Play Online</h3>
              <p className="text-white/70 text-[10px] font-medium mt-0.5">Instant match room creator</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </button>

        {/* Private Room Joining option (Blue Bento Card style) */}
        <button
          id="join-private-room-btn"
          onClick={() => setShowJoinModal(true)}
          className="w-full p-5 bg-gradient-to-br from-blue-500/80 to-indigo-700/80 rounded-3xl flex items-center justify-between border border-white/20 shadow-2xl transition duration-200 active:scale-98 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 text-white rounded-xl">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">Private Room</h3>
              <p className="text-white/70 text-[10px] font-medium mt-0.5">Enter 6-digit room code</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </button>

        {/* Play Offline Option (Yellow Bento Card style) */}
        <button
          id="play-offline-btn"
          onClick={() => setShowOfflineModal(true)}
          className="w-full p-5 bg-gradient-to-br from-yellow-500/80 to-orange-700/80 rounded-3xl flex items-center justify-between border border-white/20 shadow-2xl transition duration-200 active:scale-98 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 text-white rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">Play Offline Local</h3>
              <p className="text-white/70 text-[10px] font-medium mt-0.5">Pass & play with local friends</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </button>

        {/* Practice Mode against smart AI (Red Bento Card style) */}
        <button
          id="practice-vs-ai-btn"
          onClick={() => setupOfflineGame('practice')}
          className="w-full p-5 bg-gradient-to-br from-red-500/80 to-rose-700/80 rounded-3xl flex items-center justify-between border border-white/20 shadow-2xl transition duration-200 active:scale-98 text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 text-white rounded-xl">
              <Play className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide text-white">Practice Mode</h3>
              <p className="text-white/70 text-[10px] font-medium mt-0.5">Vs smart computer AI bots</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* Grid of utility sub screens */}
      <div className="grid grid-cols-4 gap-2.5 mt-8 backdrop-blur-xl bg-white/5 border border-white/10 p-2.5 rounded-3xl">
        <button
          id="leaderboard-nav-btn"
          onClick={() => setActiveMode('leaderboard')}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white/5 transition text-white/60 hover:text-amber-400"
        >
          <Gift className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase font-sans">Lucky Spin</span>
        </button>

        <button
          id="settings-nav-btn"
          onClick={() => setActiveMode('settings')}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white/5 transition text-white/60 hover:text-blue-400"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Settings</span>
        </button>

        <button
          id="about-nav-btn"
          onClick={() => setActiveMode('about')}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white/5 transition text-white/60 hover:text-indigo-400"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Developer</span>
        </button>

        <button
          id="profile-nav-btn"
          onClick={() => setActiveMode('profile')}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl hover:bg-white/5 transition text-white/60 hover:text-green-400"
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Profile</span>
        </button>
      </div>

      {/* 1. JOIN ROOM CODE MODAL DIALOG */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="backdrop-blur-xl bg-slate-950/85 border border-white/15 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl"
            >
              <h3 className="text-lg font-black text-white">Join Room</h3>
              <p className="text-white/50 text-xs mt-1">Enter the 6-digit room code to join your friends</p>
              
              <form onSubmit={handleJoinRoom} className="mt-6 space-y-4">
                <input
                  id="room-code-input"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  required
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 rounded-2xl px-4 py-4 text-2xl font-bold font-mono tracking-[0.4em] text-center focus:outline-none text-white placeholder-white/20"
                />

                {errorMsg && (
                  <p className="text-xs font-semibold text-red-400">{errorMsg}</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    id="cancel-join-room-btn"
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setRoomCodeInput('');
                      setErrorMsg('');
                    }}
                    className="py-3 px-4 backdrop-blur-md bg-white/5 border border-white/10 text-white/80 font-bold text-xs rounded-xl hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-join-room-btn"
                    type="submit"
                    disabled={isJoining}
                    className="py-3 px-4 bg-blue-500/80 text-white font-bold text-xs rounded-xl hover:bg-blue-400 border border-white/10 transition disabled:opacity-50 shadow-lg shadow-blue-500/10"
                  >
                    {isJoining ? 'Joining...' : 'Join Room'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. OFFLINE MODE SELECTOR MODAL DIALOG */}
      <AnimatePresence>
        {showOfflineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="backdrop-blur-xl bg-slate-950/85 border border-white/15 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl"
            >
              <h3 className="text-lg font-black text-white">Local Offline Setup</h3>
              <p className="text-white/50 text-xs mt-1">Select the player configuration for your local game</p>
              
              <div className="mt-6 space-y-3.5">
                <button
                  id="offline-2p-btn"
                  onClick={() => {
                    setupOfflineGame('offline2');
                    setShowOfflineModal(false);
                  }}
                  className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition flex items-center justify-center gap-3 active:scale-95 text-white font-bold"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm">2 Players Match</span>
                </button>

                <button
                  id="offline-4p-btn"
                  onClick={() => {
                    setupOfflineGame('offline4');
                    setShowOfflineModal(false);
                  }}
                  className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition flex items-center justify-center gap-3 active:scale-95 text-white font-bold"
                >
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-sm">4 Players Match</span>
                </button>

                <button
                  id="cancel-offline-modal-btn"
                  onClick={() => setShowOfflineModal(false)}
                  className="w-full py-3 text-white/40 font-bold text-xs hover:text-white/70 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. ONLINE MODE SELECTOR MODAL DIALOG */}
      <AnimatePresence>
        {showOnlineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="backdrop-blur-xl bg-slate-950/85 border border-white/15 rounded-3xl p-6 w-full max-w-sm text-center relative shadow-2xl"
            >
              <h3 className="text-lg font-black text-white">Online Room Setup</h3>
              <p className="text-white/50 text-xs mt-1">Choose game capacity for your online room</p>
              
              <div className="mt-6 space-y-3.5">
                <button
                  id="online-2p-btn"
                  onClick={() => handleCreateRoom(2)}
                  className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/15 border border-white/10 hover:border-blue-500/40 rounded-2xl transition flex items-center justify-center gap-3 active:scale-95 text-white font-bold"
                >
                  <Users className="w-5 h-5 text-blue-400" />
                  <span className="font-bold text-sm">2 Players (Red vs Yellow)</span>
                </button>

                <button
                  id="online-4p-btn"
                  onClick={() => handleCreateRoom(4)}
                  className="w-full py-4 backdrop-blur-md bg-white/5 hover:bg-white/15 border border-white/10 hover:border-green-500/40 rounded-2xl transition flex items-center justify-center gap-3 active:scale-95 text-white font-bold"
                >
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="font-bold text-sm">4 Players (All Colors)</span>
                </button>

                <button
                  id="cancel-online-modal-btn"
                  onClick={() => setShowOnlineModal(false)}
                  className="w-full py-3 text-white/40 font-bold text-xs hover:text-white/70 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exquisite 3D Lucky Daily Chest pop-up page */}
      <LuckyChestPopup isOpen={showLuckyChest} onClose={() => setShowLuckyChest(false)} />

    </div>
  );
}
