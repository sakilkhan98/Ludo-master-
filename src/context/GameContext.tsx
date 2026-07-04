import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  RoomState, 
  PlayerState, 
  PlayerColor, 
  ChatMessage, 
  GameSettings, 
  UserStats, 
  MatchRecord, 
  Achievement 
} from '../types';
import { 
  COLOR_INDEX_MAP, 
  COLOR_START_CELL, 
  isSafeCell, 
  getTokenGridPosition 
} from '../utils/ludoBoard';
import { 
  playDiceRollSound, 
  playMoveSound, 
  playCutSound, 
  playHomeSound, 
  playVictorySound, 
  triggerVibration, 
  updateAudioSettings 
} from '../lib/audio';

interface GameContextProps {
  currentUser: FirebaseUser | null;
  guestUser: { uid: string; name: string; avatar: string } | null;
  userStats: UserStats | null;
  settings: GameSettings;
  activeRoom: RoomState | null;
  activeMode: 'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'settings' | 'about';
  gameMode: 'offline2' | 'offline4' | 'online' | 'practice' | null;
  isLoading: boolean;
  isRolling: boolean;
  validMoves: number[]; // Indices of tokens (0-3) that can move
  isMovingToken: boolean;
  leaderboardUsers: UserStats[];
  matchHistory: MatchRecord[];
  
  // Auth Actions
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name: string, avatar: string) => void | Promise<void>;
  logout: () => Promise<void>;
  
  // Settings Actions
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  
  // Room Actions
  createOnlineRoom: (maxPlayers?: number) => Promise<string>;
  joinOnlineRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  toggleReady: () => Promise<void>;
  startOnlineGame: () => Promise<void>;
  sendChatMessage: (text: string) => Promise<void>;
  
  // Offline Setup Actions
  setupOfflineGame: (mode: 'offline2' | 'offline4' | 'practice', customNames?: string[]) => void;
  
  // Game Actions
  rollDice: () => Promise<void>;
  moveToken: (tokenIdx: number) => Promise<void>;
  resetToMenu: () => void;
  
  // UI Helpers
  setActiveMode: (mode: 'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'settings' | 'about') => void;
  setActiveRoom: (val: RoomState | null | ((prev: RoomState | null) => RoomState | null)) => void;
  setGameMode: (val: 'offline2' | 'offline4' | 'online' | 'practice' | null) => void;
  claimDailyReward: () => Promise<void>;
  
  // SakiL Beats Background Music Actions
  currentSong: { id: string; title: string; artist: string; url: string; playing: boolean } | null;
  playSong: (song: { id: string; title: string; artist: string; url: string }) => Promise<void>;
  pauseSong: () => Promise<void>;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  language: 'en',
  theme: 'dark'
};

const AVATARS = ['👑', '🦊', '🦁', '🐼', '🐨', '🐯', '🦄', '🐉'];

// Global Room Audio Singleton for background song syncing and persistent playback
const globalRoomAudio = new Audio();
globalRoomAudio.preload = 'auto';
globalRoomAudio.loop = true;

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSongState] = useState<{ id: string; title: string; artist: string; url: string; playing: boolean } | null>(null);
  const currentSongRef = useRef<{ id: string; title: string; artist: string; url: string; playing: boolean } | null>(null);
  const setCurrentSong = (val: { id: string; title: string; artist: string; url: string; playing: boolean } | null) => {
    currentSongRef.current = val;
    setCurrentSongState(val);
  };

  const [currentUser, setCurrentUserState] = useState<FirebaseUser | null>(null);
  const currentUserRef = useRef<FirebaseUser | null>(null);
  const setCurrentUser = (val: FirebaseUser | null) => {
    currentUserRef.current = val;
    setCurrentUserState(val);
  };

  const [guestUser, setGuestUserState] = useState<{ uid: string; name: string; avatar: string } | null>(null);
  const guestUserRef = useRef<{ uid: string; name: string; avatar: string } | null>(null);
  const setGuestUser = (val: { uid: string; name: string; avatar: string } | null) => {
    guestUserRef.current = val;
    setGuestUserState(val);
  };

  const [userStats, setUserStatsState] = useState<UserStats | null>(null);
  const userStatsRef = useRef<UserStats | null>(null);
  const setUserStats = (val: UserStats | null) => {
    userStatsRef.current = val;
    setUserStatsState(val);
  };

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const [activeRoom, setActiveRoomState] = useState<RoomState | null>(null);
  const activeRoomRef = useRef<RoomState | null>(null);
  const setActiveRoom = (val: RoomState | null | ((prev: RoomState | null) => RoomState | null)) => {
    if (typeof val === 'function') {
      setActiveRoomState((prev) => {
        const next = val(prev);
        activeRoomRef.current = next;
        return next;
      });
    } else {
      activeRoomRef.current = val;
      setActiveRoomState(val);
    }
  };

  const [activeMode, setActiveModeState] = useState<'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'settings' | 'about'>('menu');
  const activeModeRef = useRef<'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'settings' | 'about'>('menu');
  const setActiveMode = (val: 'menu' | 'lobby' | 'game' | 'leaderboard' | 'profile' | 'settings' | 'about') => {
    activeModeRef.current = val;
    setActiveModeState(val);
  };
  const [gameMode, setGameMode] = useState<'offline2' | 'offline4' | 'online' | 'practice' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRolling, setIsRollingState] = useState<boolean>(false);
  const isRollingRef = useRef<boolean>(false);
  const setIsRolling = (val: boolean) => {
    isRollingRef.current = val;
    setIsRollingState(val);
  };

  const [validMoves, setValidMoves] = useState<number[]>([]);

  const [isMovingToken, setIsMovingTokenState] = useState<boolean>(false);
  const isMovingTokenRef = useRef<boolean>(false);
  const setIsMovingToken = (val: boolean) => {
    isMovingTokenRef.current = val;
    setIsMovingTokenState(val);
  };
  const [leaderboardUsers, setLeaderboardUsers] = useState<UserStats[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);

  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Sync Settings & Auth
  useEffect(() => {
    // Load local settings
    const saved = localStorage.getItem('ludo_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        updateAudioSettings(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    // Load guest user
    const savedGuest = localStorage.getItem('ludo_guest');
    if (savedGuest) {
      try {
        setGuestUser(JSON.parse(savedGuest));
      } catch (e) {
        console.error(e);
      }
    } else {
      const defaultGuest = {
        uid: `guest_${Math.floor(Math.random() * 1000000)}`,
        name: `Guest #${Math.floor(Math.random() * 900 + 100)}`,
        avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
      };
      setGuestUser(defaultGuest);
      localStorage.setItem('ludo_guest', JSON.stringify(defaultGuest));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          if (user.isAnonymous) {
            const savedGuest = localStorage.getItem('ludo_guest');
            if (savedGuest) {
              try {
                setGuestUser(JSON.parse(savedGuest));
              } catch (e) {
                console.error(e);
              }
            } else {
              const defaultGuest = {
                uid: user.uid,
                name: `Guest #${Math.floor(Math.random() * 900 + 100)}`,
                avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
              };
              setGuestUser(defaultGuest);
              localStorage.setItem('ludo_guest', JSON.stringify(defaultGuest));
            }
            setUserStats(null);
          } else {
            setGuestUser(null);
            try {
              await syncUserProfile(user);
            } catch (profileError) {
              console.error("Failed to sync user profile, falling back to cached profile state:", profileError);
              const cachedStats = localStorage.getItem(`ludo_stats_${user.uid}`);
              if (cachedStats) {
                try {
                  setUserStats(JSON.parse(cachedStats));
                } catch (e) {
                  console.error(e);
                }
              } else {
                setUserStats({
                  userId: user.uid,
                  name: user.displayName || `Ludo Player #${Math.floor(Math.random() * 9000 + 1000)}`,
                  avatar: AVATARS[0],
                  wins: 0,
                  losses: 0,
                  ranking: 1000,
                  totalGames: 0,
                  createdAt: Date.now()
                });
              }
            }
          }
        } else {
          setGuestUser(null);
          // Keep the local guest user if loaded, or generate one if missing
          const savedGuest = localStorage.getItem('ludo_guest');
          if (savedGuest) {
            try {
              setGuestUser(JSON.parse(savedGuest));
            } catch (e) {
              console.error(e);
            }
          } else {
            const defaultGuest = {
              uid: `guest_${Math.floor(Math.random() * 1000000)}`,
              name: `Guest #${Math.floor(Math.random() * 900 + 100)}`,
              avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
            };
            setGuestUser(defaultGuest);
            localStorage.setItem('ludo_guest', JSON.stringify(defaultGuest));
          }
        }
      } catch (authError) {
        console.error("Auth state observer error:", authError);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      if (lastHeartbeatRef.current) clearInterval(lastHeartbeatRef.current);
    };
  }, []);

  // Sync profile data with Firestore
  const syncUserProfile = async (user: FirebaseUser) => {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const stats = snap.data() as UserStats;
        setUserStats(stats);
        localStorage.setItem(`ludo_stats_${user.uid}`, JSON.stringify(stats));
      } else {
        const initialStats: UserStats = {
          userId: user.uid,
          name: user.displayName || `Ludo Player #${Math.floor(Math.random() * 9000 + 1000)}`,
          avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          wins: 0,
          losses: 0,
          ranking: 1000,
          totalGames: 0,
          createdAt: Date.now()
        };
        await setDoc(userRef, initialStats);
        setUserStats(initialStats);
        localStorage.setItem(`ludo_stats_${user.uid}`, JSON.stringify(initialStats));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
      // Fallback to cached stats so that the user state is populated when offline
      const cachedStats = localStorage.getItem(`ludo_stats_${user.uid}`);
      if (cachedStats) {
        try {
          setUserStats(JSON.parse(cachedStats));
        } catch (jsonErr) {
          console.error(jsonErr);
        }
      } else {
        // Fallback to temporary initial stats
        setUserStats({
          userId: user.uid,
          name: user.displayName || `Ludo Player #${Math.floor(Math.random() * 9000 + 1000)}`,
          avatar: AVATARS[0],
          wins: 0,
          losses: 0,
          ranking: 1000,
          totalGames: 0,
          createdAt: Date.now()
        });
      }
    }
  };

  // Auth Operations
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google login error', e);
    }
  };

  const loginAsGuest = async (name: string, avatar: string) => {
    try {
      setIsLoading(true);
      let guestUid = `guest_${Math.floor(Math.random() * 1000000)}`;
      try {
        const userCredential = await signInAnonymously(auth);
        guestUid = userCredential.user.uid;
      } catch (authErr) {
        console.warn('Firebase Anonymous Auth not enabled or failed, falling back to local guest UID:', authErr);
      }
      const guest = {
        uid: guestUid,
        name: name || `Guest #${Math.floor(Math.random() * 900 + 100)}`,
        avatar: avatar || AVATARS[0]
      };
      setGuestUser(guest);
      localStorage.setItem('ludo_guest', JSON.stringify(guest));
    } catch (e) {
      console.error('Guest login error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setGuestUser(null);
      localStorage.removeItem('ludo_guest');
    } catch (e) {
      console.error(e);
    }
  };

  // Settings Operation
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('ludo_settings', JSON.stringify(updated));
      updateAudioSettings(updated);
      return updated;
    });
  };

  // Helper to fetch current profile
  const getActiveProfile = () => {
    if (currentUserRef.current) {
      return {
        uid: currentUserRef.current.uid,
        name: userStatsRef.current?.name || currentUserRef.current.displayName || 'Player',
        avatar: userStatsRef.current?.avatar || '👑'
      };
    } else if (guestUserRef.current) {
      return guestUserRef.current;
    }
    return {
      uid: 'offline_1',
      name: 'Player 1',
      avatar: '👑'
    };
  };

  // ----------------- OFFLINE SETUP ACTIONS -----------------
  const setupOfflineGame = (mode: 'offline2' | 'offline4' | 'practice', customNames?: string[]) => {
    setGameMode(mode);
    const profile = getActiveProfile();

    let players: Record<string, PlayerState> = {};
    const defaultBoardState: Record<PlayerColor, number[]> = {
      red: [0, 0, 0, 0],
      green: [0, 0, 0, 0],
      yellow: [0, 0, 0, 0],
      blue: [0, 0, 0, 0]
    };

    if (mode === 'offline2') {
      // Opposite sides: Red (Player) and Yellow (Opponent)
      players['p_red'] = {
        uid: 'p_red',
        name: profile.name,
        avatar: profile.avatar,
        color: 'red',
        colorIndex: 0,
        isReady: true,
        isHost: true,
        isOnline: true,
        lastActive: Date.now()
      };
      players['p_yellow'] = {
        uid: 'p_yellow',
        name: customNames?.[1] || 'Player 2',
        avatar: '🦁',
        color: 'yellow',
        colorIndex: 2,
        isReady: true,
        isHost: false,
        isOnline: true,
        lastActive: Date.now()
      };
    } else if (mode === 'offline4') {
      const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
      colors.forEach((color, idx) => {
        const uid = `p_${color}`;
        players[uid] = {
          uid,
          name: idx === 0 ? profile.name : customNames?.[idx] || `Player ${idx + 1}`,
          avatar: idx === 0 ? profile.avatar : AVATARS[idx % AVATARS.length],
          color,
          colorIndex: idx,
          isReady: true,
          isHost: idx === 0,
          isOnline: true,
          lastActive: Date.now()
        };
      });
    } else if (mode === 'practice') {
      // Practice mode: You against 3 smart AI bots!
      players['p_red'] = {
        uid: 'p_red',
        name: profile.name,
        avatar: profile.avatar,
        color: 'red',
        colorIndex: 0,
        isReady: true,
        isHost: true,
        isOnline: true,
        lastActive: Date.now()
      };

      const bots: { color: PlayerColor; index: number; name: string; avatar: string }[] = [
        { color: 'green', index: 1, name: 'Bot Green', avatar: '🐼' },
        { color: 'yellow', index: 2, name: 'Bot Yellow', avatar: '🦁' },
        { color: 'blue', index: 3, name: 'Bot Blue', avatar: '🦊' }
      ];

      bots.forEach((bot) => {
        const uid = `bot_${bot.color}`;
        players[uid] = {
          uid,
          name: bot.name,
          avatar: bot.avatar,
          color: bot.color,
          colorIndex: bot.index,
          isReady: true,
          isHost: false,
          isOnline: true,
          lastActive: Date.now()
        };
      });
    }

    const initialRoom: RoomState = {
      roomId: 'OFFLINE',
      hostId: profile.uid,
      players,
      status: 'playing',
      turnPlayerId: 'p_red', // Red always starts
      dice: {
        value: 1,
        rolled: false,
        rolledBy: null,
        canRoll: true
      },
      boardState: defaultBoardState,
      chat: [],
      winnerId: null,
      winnerName: null,
      winHistory: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      hasRollExtraTurn: false
    };

    setActiveRoom(initialRoom);
    setValidMoves([]);
    setActiveMode('game');
  };

  // ----------------- ONLINE ROOM ACTIONS -----------------
  const createOnlineRoom = async (maxPlayers: number = 4): Promise<string> => {
    setIsLoading(true);
    const profile = getActiveProfile();
    const code = Math.floor(Math.random() * 900000 + 100000).toString(); // 6 digit code
    
    const initialPlayers: Record<string, PlayerState> = {
      [profile.uid]: {
        uid: profile.uid,
        name: profile.name,
        avatar: profile.avatar,
        color: 'red', // Host is Red
        colorIndex: 0,
        isReady: true,
        isHost: true,
        isOnline: true,
        lastActive: Date.now()
      }
    };

    const initialRoom: RoomState = {
      roomId: code,
      hostId: profile.uid,
      players: initialPlayers,
      status: 'waiting',
      maxPlayers,
      turnPlayerId: null,
      dice: {
        value: 1,
        rolled: false,
        rolledBy: null,
        canRoll: false
      },
      boardState: {
        red: [0, 0, 0, 0],
        green: [0, 0, 0, 0],
        yellow: [0, 0, 0, 0],
        blue: [0, 0, 0, 0]
      },
      chat: [],
      winnerId: null,
      winnerName: null,
      winHistory: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      hasRollExtraTurn: false
    };

    try {
      await setDoc(doc(db, 'rooms', code), initialRoom);
      setActiveRoom(initialRoom);
      setGameMode('online');
      setActiveMode('lobby');
      subscribeToRoom(code);
      return code;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `rooms/${code}`);
    } finally {
      setIsLoading(false);
    }
  };

  const joinOnlineRoom = async (code: string) => {
    setIsLoading(true);
    const profile = getActiveProfile();
    const roomRef = doc(db, 'rooms', code);

    try {
      const snap = await getDoc(roomRef);
      if (!snap.exists()) {
        throw new Error('Room not found! Double check the 6-digit code.');
      }

      const room = snap.data() as RoomState;
      if (!room) {
        throw new Error('Room details are corrupted or empty.');
      }

      if (!room.players) {
        room.players = {};
      }
      if (!room.chat) {
        room.chat = [];
      }

      const isAlreadyInRoom = !!room.players[profile.uid];

      // Allow players already in the room to rejoin even if game started/finished
      if (room.status !== 'waiting' && !isAlreadyInRoom) {
        throw new Error('Game already started or finished in this room.');
      }

      const currentPlayers = Object.values(room.players);
      const maxPlayers = room.maxPlayers || 4;
      if (currentPlayers.length >= maxPlayers && !isAlreadyInRoom) {
        throw new Error(`Room is already full! Max ${maxPlayers} players allowed.`);
      }

      // Check if already in players
      if (!isAlreadyInRoom) {
        // Assign a color based on slot availability
        let freeColor: PlayerColor = 'green';
        let freeIdx = 1;

        if (maxPlayers === 2) {
          // Opposite sides are Red (Host) and Yellow (Opponent)
          freeColor = 'yellow';
          freeIdx = 2;
        } else {
          const assignedColors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
          const occupiedColors = currentPlayers.map(p => p.color);
          freeColor = assignedColors.find(c => !occupiedColors.includes(c)) || 'green';
          freeIdx = COLOR_INDEX_MAP.indexOf(freeColor);
        }

        room.players[profile.uid] = {
          uid: profile.uid,
          name: profile.name,
          avatar: profile.avatar,
          color: freeColor,
          colorIndex: freeIdx,
          isReady: false,
          isHost: false,
          isOnline: true,
          lastActive: Date.now()
        };

        // Add joined system message
        const systemMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          senderId: 'system',
          senderName: 'System',
          senderColor: freeColor,
          text: `${profile.name} joined the room!`,
          timestamp: Date.now()
        };
        room.chat.push(systemMsg);

        await updateDoc(roomRef, {
          players: room.players,
          chat: room.chat,
          lastActivity: Date.now()
        });
      } else {
        // Mark player as back online
        const updatedPlayers = { ...room.players };
        updatedPlayers[profile.uid].isOnline = true;
        updatedPlayers[profile.uid].lastActive = Date.now();

        await updateDoc(roomRef, {
          players: updatedPlayers,
          lastActivity: Date.now()
        });
      }

      setActiveRoom(room);
      setGameMode('online');
      setActiveMode(room.status === 'playing' ? 'game' : 'lobby');
      subscribeToRoom(code);
    } catch (e: any) {
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReady = async () => {
    if (!activeRoom || gameMode !== 'online') return;
    const profile = getActiveProfile();
    const roomRef = doc(db, 'rooms', activeRoom.roomId);

    try {
      const player = activeRoom.players[profile.uid];
      if (!player) return;

      const updatedPlayers = { ...activeRoom.players };
      updatedPlayers[profile.uid].isReady = !player.isReady;

      await updateDoc(roomRef, {
        players: updatedPlayers,
        lastActivity: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoom.roomId}`);
    }
  };

  const startOnlineGame = async () => {
    if (!activeRoom || gameMode !== 'online') return;
    const roomRef = doc(db, 'rooms', activeRoom.roomId);

    const playersList = Object.values(activeRoom.players) as PlayerState[];
    const unready = playersList.filter(p => !p.isReady && !p.isHost);
    if (unready.length > 0) {
      throw new Error('All players must be ready before starting.');
    }

    // Sort players by colorIndex to find who should go first
    const sortedPlayers = [...playersList].sort((a, b) => (a.colorIndex ?? 0) - (b.colorIndex ?? 0));
    const firstPlayer = sortedPlayers[0];

    try {
      await updateDoc(roomRef, {
        status: 'playing',
        turnPlayerId: firstPlayer.uid,
        'dice.canRoll': true,
        lastActivity: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoom.roomId}`);
    }
  };

  const sendChatMessage = async (text: string) => {
    if (!activeRoom) return;
    const profile = getActiveProfile();

    const playerColor = activeRoom.players[profile.uid]?.color || 'red';

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: profile.uid,
      senderName: profile.name,
      senderColor: playerColor,
      text: text.slice(0, 100), // Enforce 100 char limit
      timestamp: Date.now()
    };

    if (gameMode === 'online') {
      const roomRef = doc(db, 'rooms', activeRoom.roomId);
      try {
        const currentChat = [...activeRoom.chat, newMsg];
        // Limit chat log to last 50 messages
        if (currentChat.length > 50) currentChat.shift();
        
        await updateDoc(roomRef, {
          chat: currentChat,
          lastActivity: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoom.roomId}`);
      }
    } else {
      setActiveRoom((prev) => {
        if (!prev) return null;
        const currentChat = [...prev.chat, newMsg];
        if (currentChat.length > 50) currentChat.shift();
        return {
          ...prev,
          chat: currentChat
        };
      });
    }
  };

  // Subscribe to realtime room updates
  const roomUnsubscribeRef = useRef<(() => void) | null>(null);

  const subscribeToRoom = (code: string) => {
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
    }

    const docRef = doc(db, 'rooms', code);
    roomUnsubscribeRef.current = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        setActiveRoom(null);
        setGameMode(null);
        setActiveMode('menu');
        return;
      }

      const room = docSnap.data() as RoomState;
      const profile = getActiveProfile();

      // Live background song sync across the online room
      if (room.activeSong) {
        const rSong = room.activeSong;
        const currentLocal = currentSongRef.current;
        
        // Sync if local song doesn't exist, has different id, or has different play/pause state
        if (!currentLocal || currentLocal.id !== rSong.id || currentLocal.playing !== rSong.playing) {
          if (globalRoomAudio.src !== rSong.url) {
            globalRoomAudio.src = rSong.url;
          }
          
          if (rSong.playing) {
            // Seek to match active playtime (approximate with latency)
            const latency = (Date.now() - rSong.timestamp) / 1000;
            const targetTime = rSong.progress + (latency > 0 && latency < 15 ? latency : 0);
            globalRoomAudio.currentTime = targetTime;
            globalRoomAudio.play().catch(e => console.warn("Background audio sync failed:", e));
            setCurrentSong({ id: rSong.id, title: rSong.title, artist: rSong.artist, url: rSong.url, playing: true });
          } else {
            globalRoomAudio.pause();
            setCurrentSong({ id: rSong.id, title: rSong.title, artist: rSong.artist, url: rSong.url, playing: false });
          }
        }
      }

      // If we are currently moving a token, preserve our local animated boardState 
      // so the sequential transition does not jump or flicker.
      if (isMovingTokenRef.current) {
        setActiveRoom((prev) => {
          if (!prev) return room;
          return {
            ...room,
            boardState: prev.boardState // Keep the animating board state
          };
        });
        return;
      }

      // If someone else rolled the dice, play the rolling animation locally for 600ms
      const oldRoom = activeRoomRef.current;
      const someoneElseRolled = oldRoom && 
        !oldRoom.dice.rolled && 
        room.dice.rolled && 
        room.dice.rolledBy !== profile.uid;

      if (someoneElseRolled) {
        setIsRolling(true);
        playDiceRollSound();
        triggerVibration(40);
        setTimeout(() => {
          setIsRolling(false);
          setActiveRoom(room);
        }, 600);
      } else {
        setActiveRoom(room);
      }

      // Transition screen mode if status changed to playing
      if (room.status === 'playing' && activeModeRef.current === 'lobby') {
        setActiveMode('game');
      }

      // Check if we became active player to calculate valid moves
      if (room.status === 'playing' && room.turnPlayerId === profile.uid) {
        if (room.dice.rolled && !isMovingTokenRef.current) {
          const valid = getValidMovesForPlayer(room, profile.uid);
          setValidMoves(valid);

          // Auto skip turn if no valid moves exist
          if (valid.length === 0) {
            setTimeout(() => {
              passTurn(room);
            }, 1500);
          }
        } else {
          setValidMoves([]);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `rooms/${code}`);
    });

    // Start online heartbeat/disconnect detection
    startHeartbeat(code);
  };

  const startHeartbeat = (code: string) => {
    if (lastHeartbeatRef.current) clearInterval(lastHeartbeatRef.current);
    
    lastHeartbeatRef.current = setInterval(async () => {
      const profile = getActiveProfile();
      const roomRef = doc(db, 'rooms', code);
      
      try {
        const snap = await getDoc(roomRef);
        if (!snap.exists()) return;
        
        const room = snap.data() as RoomState;
        if (room.players[profile.uid]) {
          const updatedPlayers = { ...room.players };
          updatedPlayers[profile.uid].lastActive = Date.now();
          updatedPlayers[profile.uid].isOnline = true;
          
          // Check for other disconnected players (silent for > 15 seconds)
          let changed = false;
          Object.values(updatedPlayers).forEach((p) => {
            if (p.uid !== profile.uid && p.isOnline && Date.now() - p.lastActive > 15000) {
              p.isOnline = false;
              changed = true;
            }
          });

          // Handle Host transfer if host disconnected or left
          let updatedHostId = room.hostId;
          const hostPlayer = updatedPlayers[room.hostId];
          if (!hostPlayer || !hostPlayer.isOnline) {
            const activeOnlinePlayers = Object.values(updatedPlayers).filter(p => p.isOnline);
            if (activeOnlinePlayers.length > 0) {
              updatedHostId = activeOnlinePlayers[0].uid;
              updatedPlayers[updatedHostId].isHost = true;
              changed = true;
            }
          }

          if (changed || Date.now() % 3 === 0) { // update periodically
            await updateDoc(roomRef, {
              players: updatedPlayers,
              hostId: updatedHostId,
              lastActivity: Date.now()
            });
          }
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `rooms/${code}`);
      }
    }, 5000);
  };

  const leaveRoom = async () => {
    if (lastHeartbeatRef.current) clearInterval(lastHeartbeatRef.current);
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
      roomUnsubscribeRef.current = null;
    }

    if (activeRoom && gameMode === 'online') {
      const profile = getActiveProfile();
      const roomRef = doc(db, 'rooms', activeRoom.roomId);

      try {
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
          const room = snap.data() as RoomState;
          const players = { ...room.players };
          delete players[profile.uid];

          const remainingPlayers = Object.values(players);
          if (remainingPlayers.length === 0) {
            // Delete room if empty
            await setDoc(roomRef, { ...room, status: 'finished' });
          } else {
            // Host transfer
            let newHostId = room.hostId;
            if (room.hostId === profile.uid) {
              const onlinePlayers = remainingPlayers.filter(p => p.isOnline);
              if (onlinePlayers.length > 0) {
                newHostId = onlinePlayers[0].uid;
                players[newHostId].isHost = true;
              } else {
                newHostId = remainingPlayers[0].uid;
                players[newHostId].isHost = true;
              }
            }

            // System chat
            const sysMsg: ChatMessage = {
              id: `sys_${Date.now()}`,
              senderId: 'system',
              senderName: 'System',
              senderColor: 'red',
              text: `${profile.name} left the room.`,
              timestamp: Date.now()
            };

            await updateDoc(roomRef, {
              players,
              hostId: newHostId,
              chat: [...room.chat, sysMsg],
              lastActivity: Date.now()
            });
          }
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `rooms/${activeRoom.roomId}`);
      }
    }

    setActiveRoom(null);
    setGameMode(null);
    setActiveMode('menu');
  };

  // ----------------- CORE LUDO GAME LOGIC -----------------
  
  // Calculate which tokens can move for a given room state and player UID
  const getValidMovesForPlayer = (room: RoomState, uid: string): number[] => {
    const player = room.players[uid];
    if (!player) return [];

    const diceValue = room.dice.value;
    const tokens = room.boardState[player.color];
    const valid: number[] = [];

    tokens.forEach((stepCount, idx) => {
      // 1. Locked in yard: needs exactly a 6 to unlock
      if (stepCount === 0) {
        if (diceValue === 6) {
          valid.push(idx);
        }
      } 
      // 2. On board: cannot exceed home cell (stepCount 57)
      else if (stepCount > 0 && stepCount < 57) {
        if (stepCount + diceValue <= 57) {
          valid.push(idx);
        }
      }
    });

    return valid;
  };

  // Pass Turn to next active player
  const passTurn = async (room: RoomState) => {
    const playersList = Object.values(room.players);
    // Sort players by colorIndex
    const sortedPlayers = [...playersList].sort((a, b) => a.colorIndex - b.colorIndex);
    const currentIdx = sortedPlayers.findIndex(p => p.uid === room.turnPlayerId);
    
    // Find next player who is online / in game
    let nextIdx = (currentIdx + 1) % sortedPlayers.length;
    let nextPlayer = sortedPlayers[nextIdx];

    // Check if extra turn was granted (rolling 6 or cutting)
    let nextPlayerId = room.turnPlayerId;
    if (!room.hasRollExtraTurn) {
      nextPlayerId = nextPlayer.uid;
    }

    const updatedRoom: RoomState = {
      ...room,
      turnPlayerId: nextPlayerId,
      hasRollExtraTurn: false,
      dice: {
        value: room.dice.value,
        rolled: false,
        rolledBy: null,
        canRoll: true
      },
      lastActivity: Date.now()
    };

    if (gameMode === 'online') {
      const roomRef = doc(db, 'rooms', room.roomId);
      try {
        await updateDoc(roomRef, {
          turnPlayerId: nextPlayerId,
          hasRollExtraTurn: false,
          'dice.rolled': false,
          'dice.canRoll': true,
          lastActivity: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/${room.roomId}`);
      }
    } else {
      setActiveRoom(updatedRoom);
      
      // AI handling if practice mode and next player is Bot
      if (gameMode === 'practice' && nextPlayerId?.startsWith('bot_')) {
        setTimeout(() => {
          handleBotTurn(updatedRoom, nextPlayerId!);
        }, 1200);
      }
    }
  };

  // Roll Dice Action
  const rollDice = async () => {
    if (!activeRoom || isRolling) return;
    const profile = getActiveProfile();

    // Check if it's actually their turn to play on this device
    const isPlayerTurnOnDevice = 
      gameMode === 'online'
        ? activeRoom.turnPlayerId === profile.uid
        : gameMode === 'practice'
          ? activeRoom.turnPlayerId === 'p_red'
          : true; // In offline local pass-and-play, any player turn is playable on this device

    if (!isPlayerTurnOnDevice) return;
    if (activeRoom.dice.rolled) return;

    setIsRolling(true);
    playDiceRollSound();
    triggerVibration(40);

    // Roll animation delay (600ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const rolledValue = Math.floor(Math.random() * 6) + 1;
    const isSix = rolledValue === 6;

    const updatedRoom: RoomState = {
      ...activeRoom,
      dice: {
        value: rolledValue,
        rolled: true,
        rolledBy: profile.uid,
        canRoll: false
      },
      hasRollExtraTurn: isSix || activeRoom.hasRollExtraTurn,
      lastActivity: Date.now()
    };

    setIsRolling(false);

    if (gameMode === 'online') {
      setActiveRoom(updatedRoom);
      
      // Calculate valid moves immediately for the local user so they can act instantly
      const valid = getValidMovesForPlayer(updatedRoom, updatedRoom.turnPlayerId || '');
      setValidMoves(valid);

      if (valid.length === 0) {
        // Automatically pass turn if no move possible
        setTimeout(() => {
          passTurn(updatedRoom);
        }, 1500);
      }

      const roomRef = doc(db, 'rooms', activeRoom.roomId);
      try {
        await updateDoc(roomRef, {
          'dice.value': rolledValue,
          'dice.rolled': true,
          'dice.rolledBy': profile.uid,
          'dice.canRoll': false,
          hasRollExtraTurn: isSix || activeRoom.hasRollExtraTurn,
          lastActivity: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoom.roomId}`);
      }
    } else {
      setActiveRoom(updatedRoom);
      
      // Calculate valid moves
      const valid = getValidMovesForPlayer(updatedRoom, updatedRoom.turnPlayerId || '');
      setValidMoves(valid);

      if (valid.length === 0) {
        // Automatically pass turn if no move possible
        setTimeout(() => {
          passTurn(updatedRoom);
        }, 1500);
      }
    }
  };

  // Move Token Action (with sequential movement animation!)
  const moveToken = async (tokenIdx: number) => {
    if (!activeRoom || isMovingToken) return;
    const profile = getActiveProfile();

    // Check if it's actually their turn to play on this device
    const isPlayerTurnOnDevice = 
      gameMode === 'online'
        ? activeRoom.turnPlayerId === profile.uid
        : gameMode === 'practice'
          ? activeRoom.turnPlayerId === 'p_red'
          : true; // In offline local pass-and-play, any player turn is playable on this device

    if (!isPlayerTurnOnDevice) return;
    if (!activeRoom.dice.rolled) return;

    const player = activeRoom.players[activeRoom.turnPlayerId || ''];
    if (!player) return;

    const diceValue = activeRoom.dice.value;
    const currentStep = activeRoom.boardState[player.color][tokenIdx];

    // Validate if selected token can move
    const valid = getValidMovesForPlayer(activeRoom, activeRoom.turnPlayerId || '');
    if (!valid.includes(tokenIdx)) return;

    setIsMovingToken(true);
    setValidMoves([]); // Clear highlights immediately

    let currentTempStep = currentStep;
    const targetStep = currentStep === 0 ? 1 : currentStep + diceValue;

    // Sequential movement animation loop
    if (currentStep === 0) {
      // Unlocking 6 - instant jump to start
      currentTempStep = 1;
      playMoveSound();
      triggerVibration(30);
      await animateStepUpdate(player.color, tokenIdx, currentTempStep);
    } else {
      // Step by step visual movement
      for (let s = currentStep + 1; s <= targetStep; s++) {
        currentTempStep = s;
        playMoveSound();
        triggerVibration(25);
        await animateStepUpdate(player.color, tokenIdx, currentTempStep);
        await new Promise((resolve) => setTimeout(resolve, 180)); // step speed
      }
    }

    // Now, handle landing check (cutting or landing safely)
    const finalStep = targetStep;
    let gotExtraTurn = activeRoom.hasRollExtraTurn;

    // Did token reach finish (57)?
    if (finalStep === 57) {
      playHomeSound();
      gotExtraTurn = true; // Reaching home gives extra turn
    }

    // Capture / Cutting mechanics
    const finalGridPos = getTokenGridPosition(player.color, tokenIdx, finalStep);
    const isSafe = isSafeCell(finalStep, player.color);
    
    let cutOccurred = false;
    const newBoardState: Record<PlayerColor, number[]> = {
      red: [...activeRoom.boardState.red],
      green: [...activeRoom.boardState.green],
      yellow: [...activeRoom.boardState.yellow],
      blue: [...activeRoom.boardState.blue]
    };
    newBoardState[player.color][tokenIdx] = finalStep;

    if (!isSafe) {
      // Check for cuts on outer track
      (Object.entries(newBoardState) as [PlayerColor, number[]][]).forEach(([color, tokens]) => {
        if (color === player.color) return; // Can't cut own tokens

        tokens.forEach((stepCount, oIdx) => {
          if (stepCount > 0 && stepCount < 57) {
            const oppPos = getTokenGridPosition(color as PlayerColor, oIdx, stepCount);
            if (oppPos.row === finalGridPos.row && oppPos.col === finalGridPos.col) {
              // Capture opponent! Reset to yard
              newBoardState[color as PlayerColor] = [...newBoardState[color as PlayerColor]];
              newBoardState[color as PlayerColor][oIdx] = 0;
              cutOccurred = true;
            }
          }
        });
      });
    }

    if (cutOccurred) {
      playCutSound();
      gotExtraTurn = true; // Capture gives extra turn
    }

    // Check if current player completed all tokens (won!)
    const allFinished = newBoardState[player.color].every(s => s === 57);
    let updatedStatus = activeRoom.status;
    let updatedWinnerId = activeRoom.winnerId;
    let updatedWinnerName = activeRoom.winnerName;

    if (allFinished && !activeRoom.winnerId) {
      updatedStatus = 'finished';
      updatedWinnerId = player.uid;
      updatedWinnerName = player.name;
      playVictorySound();
      
      // Update match record / stats if authenticated
      if (gameMode === 'online') {
        await saveMatchResult(player.uid, player.name);
      }
    }

    const updatedRoom: RoomState = {
      ...activeRoom,
      status: updatedStatus,
      winnerId: updatedWinnerId,
      winnerName: updatedWinnerName,
      boardState: newBoardState,
      hasRollExtraTurn: gotExtraTurn,
      lastActivity: Date.now()
    };

    setIsMovingToken(false);

    if (gameMode === 'online') {
      const roomRef = doc(db, 'rooms', activeRoom.roomId);
      try {
        if (updatedStatus === 'finished') {
          setActiveRoom(updatedRoom);
          await updateDoc(roomRef, {
            boardState: newBoardState,
            hasRollExtraTurn: gotExtraTurn,
            status: updatedStatus,
            winnerId: updatedWinnerId,
            winnerName: updatedWinnerName,
            lastActivity: Date.now()
          });
        } else {
          // Calculate the next player atomically to write all state changes in one Firestore operation.
          // This prevents intermediate updates from triggering inconsistent snapshots on other clients.
          const playersList = Object.values(activeRoom.players) as PlayerState[];
          const sortedPlayers = [...playersList].sort((a, b) => a.colorIndex - b.colorIndex);
          const currentIdx = sortedPlayers.findIndex(p => p.uid === activeRoom.turnPlayerId);
          
          let nextIdx = (currentIdx + 1) % sortedPlayers.length;
          let nextPlayer = sortedPlayers[nextIdx];

          let nextPlayerId = activeRoom.turnPlayerId;
          if (!gotExtraTurn) {
            nextPlayerId = nextPlayer.uid;
          }

          // Build and apply the optimistic local room state so the active turn shifts instantly
          const finalLocalRoom: RoomState = {
            ...updatedRoom,
            turnPlayerId: nextPlayerId,
            hasRollExtraTurn: false,
            dice: {
              value: activeRoom.dice.value,
              rolled: false,
              rolledBy: null,
              canRoll: true
            }
          };
          setActiveRoom(finalLocalRoom);

          await updateDoc(roomRef, {
            boardState: newBoardState,
            hasRollExtraTurn: false,
            status: updatedStatus,
            winnerId: updatedWinnerId,
            winnerName: updatedWinnerName,
            turnPlayerId: nextPlayerId,
            'dice.rolled': false,
            'dice.rolledBy': null,
            'dice.canRoll': true,
            lastActivity: Date.now()
          });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `rooms/${activeRoom.roomId}`);
      }
    } else {
      setActiveRoom(updatedRoom);

      if (updatedStatus !== 'finished') {
        passTurn(updatedRoom);
      }
    }
  };

  const animateStepUpdate = async (color: PlayerColor, tokenIdx: number, step: number) => {
    setActiveRoom((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        boardState: {
          ...prev.boardState,
          [color]: prev.boardState[color].map((s, idx) => idx === tokenIdx ? step : s)
        }
      };
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
  };

  // ----------------- ROBOT / AI HANDLING -----------------
  const handleBotTurn = async (room: RoomState, botUid: string) => {
    const botPlayer = room.players[botUid];
    if (!botPlayer) return;

    const sendBotMessage = (text: string) => {
      const botMsg: ChatMessage = {
        id: `bot_msg_${Date.now()}_${Math.random()}`,
        senderId: botUid,
        senderName: botPlayer.name,
        senderColor: botPlayer.color,
        text,
        timestamp: Date.now()
      };
      setActiveRoom((prev) => {
        if (!prev) return null;
        const chat = [...prev.chat, botMsg];
        if (chat.length > 50) chat.shift();
        return { ...prev, chat };
      });
    };

    // 1. Roll Dice Simulation
    await new Promise((resolve) => setTimeout(resolve, 800));
    playDiceRollSound();
    const botDiceValue = Math.floor(Math.random() * 6) + 1;
    const isSix = botDiceValue === 6;

    if (isSix && Math.random() < 0.45) {
      const sixPhrases = [
        "অবশেষে একটা ৬! 🎲",
        "৬ পেয়ে গেলাম! আবার চাল আমার 😎",
        "ভাগ্যের ছক্কা! ⚡",
        "আজ আমার দিন! 💥"
      ];
      setTimeout(() => {
        sendBotMessage(sixPhrases[Math.floor(Math.random() * sixPhrases.length)]);
      }, 400);
    }

    let tempRoom: RoomState = {
      ...room,
      dice: {
        value: botDiceValue,
        rolled: true,
        rolledBy: botUid,
        canRoll: false
      },
      hasRollExtraTurn: isSix || room.hasRollExtraTurn,
      lastActivity: Date.now()
    };
    setActiveRoom(tempRoom);

    // 2. Decide move
    const valid = getValidMovesForPlayer(tempRoom, botUid);
    if (valid.length === 0) {
      setTimeout(() => {
        passTurn(tempRoom);
      }, 1000);
      return;
    }

    // AI Decision: Prefer cutting opponents, otherwise prefer moving tokens closest to Home, otherwise random
    let bestTokenIdx = valid[0];
    let maxHeuristic = -1;

    valid.forEach((tIdx) => {
      const step = tempRoom.boardState[botPlayer.color][tIdx];
      const nextStep = step === 0 ? 1 : step + botDiceValue;
      let heuristic = 0;

      // Unlocking 6 is high priority
      if (step === 0) heuristic += 100;
      
      // Moving close to home is high priority
      heuristic += nextStep;

      // Reaching home is top priority
      if (nextStep === 57) heuristic += 1000;

      // Landing on opponents is extremely high priority!
      const nextPos = getTokenGridPosition(botPlayer.color, tIdx, nextStep);
      const isSafe = isSafeCell(nextStep, botPlayer.color);
      if (!isSafe) {
        Object.entries(tempRoom.boardState).forEach(([color, tokens]) => {
          if (color === botPlayer.color) return;
          tokens.forEach((st, oIdx) => {
            if (st > 0 && st < 57) {
              const oppPos = getTokenGridPosition(color as PlayerColor, oIdx, st);
              if (oppPos.row === nextPos.row && oppPos.col === nextPos.col) {
                heuristic += 500; // Attack heuristic!
              }
            }
          });
        });
      }

      if (heuristic > maxHeuristic) {
        maxHeuristic = heuristic;
        bestTokenIdx = tIdx;
      }
    });

    // 3. Move Animation Simulation
    await new Promise((resolve) => setTimeout(resolve, 800));
    const finalStep = tempRoom.boardState[botPlayer.color][bestTokenIdx] === 0 ? 1 : tempRoom.boardState[botPlayer.color][bestTokenIdx] + botDiceValue;

    // Simulate stepping loop for Bot too
    for (let s = tempRoom.boardState[botPlayer.color][bestTokenIdx] + 1; s <= finalStep; s++) {
      playMoveSound();
      setActiveRoom((prev) => {
        if (!prev) return null;
        const b = { ...prev.boardState };
        b[botPlayer.color][bestTokenIdx] = s;
        return { ...prev, boardState: b };
      });
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Landing updates
    let gotExtraTurn = tempRoom.hasRollExtraTurn;
    if (finalStep === 57) {
      playHomeSound();
      gotExtraTurn = true;
    }

    const finalGridPos = getTokenGridPosition(botPlayer.color, bestTokenIdx, finalStep);
    const isSafe = isSafeCell(finalStep, botPlayer.color);
    let cutOccurred = false;
    const newBoard: Record<PlayerColor, number[]> = {
      red: [...tempRoom.boardState.red],
      green: [...tempRoom.boardState.green],
      yellow: [...tempRoom.boardState.yellow],
      blue: [...tempRoom.boardState.blue]
    };
    newBoard[botPlayer.color][bestTokenIdx] = finalStep;

    if (!isSafe) {
      Object.entries(newBoard).forEach(([color, tokens]) => {
        if (color === botPlayer.color) return;
        tokens.forEach((st, idx) => {
          if (st > 0 && st < 57) {
            const oppPos = getTokenGridPosition(color as PlayerColor, idx, st);
            if (oppPos.row === finalGridPos.row && oppPos.col === finalGridPos.col) {
              newBoard[color as PlayerColor] = [...newBoard[color as PlayerColor]];
              newBoard[color as PlayerColor][idx] = 0;
              cutOccurred = true;
            }
          }
        });
      });
    }

    if (cutOccurred) {
      playCutSound();
      gotExtraTurn = true;
      if (Math.random() < 0.7) {
        const cutPhrases = [
          "হা হা কেটে দিলাম! 😈",
          "দুঃখিত বন্ধু, খেলতে হলে শিখতে হবে! 😜",
          "সোজা ঘরে পাঠিয়ে দিলাম! 🚀",
          "আহারে কেটে গেল! 🤭"
        ];
        setTimeout(() => {
          sendBotMessage(cutPhrases[Math.floor(Math.random() * cutPhrases.length)]);
        }, 600);
      }
    } else if (finalStep === 57 && Math.random() < 0.6) {
      const homePhrases = [
        "পাকা গুটি ঘরে চলে গেল! 👑",
        "একদম নিরাপদে ঘরে! 🌟",
        "হা হা লাল বাতি জ্বলল! 🎉"
      ];
      setTimeout(() => {
        sendBotMessage(homePhrases[Math.floor(Math.random() * homePhrases.length)]);
      }, 600);
    }

    const allFinished = newBoard[botPlayer.color].every(s => s === 57);
    let status = tempRoom.status;
    let winnerId = tempRoom.winnerId;
    let winnerName = tempRoom.winnerName;

    if (allFinished) {
      status = 'finished';
      winnerId = botPlayer.uid;
      winnerName = botPlayer.name;
      playVictorySound();
      const winPhrases = [
        "আমিই লুডো কিং! চ্যাম্পিয়ন 🏆",
        "ভাল খেলেছ সবাই, কিন্তু জয়ী তো একজনই! 😎",
        "দারুণ ম্যাচ ছিল! 🎉"
      ];
      setTimeout(() => {
        sendBotMessage(winPhrases[Math.floor(Math.random() * winPhrases.length)]);
      }, 1000);
    }

    const endRoom: RoomState = {
      ...tempRoom,
      status,
      winnerId,
      winnerName,
      boardState: newBoard,
      hasRollExtraTurn: gotExtraTurn,
      lastActivity: Date.now()
    };

    setActiveRoom(endRoom);

    if (status !== 'finished') {
      passTurn(endRoom);
    }
  };

  // ----------------- SAVE MATCH RECORDS & UPDATE STATS -----------------
  const saveMatchResult = async (winnerUid: string, winnerName: string) => {
    const activeUid = currentUser?.uid || guestUser?.uid;
    if (!activeUid || !userStats) return;

    const isMatchWinner = winnerUid === activeUid;
    const eloDelta = isMatchWinner ? 25 : -15;

    const userRef = doc(db, 'users', activeUid);
    const updatedStats: UserStats = {
      ...userStats,
      wins: userStats.wins + (isMatchWinner ? 1 : 0),
      losses: userStats.losses + (isMatchWinner ? 0 : 1),
      ranking: Math.max(100, userStats.ranking + eloDelta),
      totalGames: userStats.totalGames + 1
    };

    try {
      // Save user stats
      await setDoc(userRef, updatedStats);
      setUserStats(updatedStats);

      // Save match history record
      const matchId = `match_${Date.now()}`;
      const playersList = activeRoom ? (Object.values(activeRoom.players) as PlayerState[]).map(p => ({
        uid: p.uid,
        name: p.name,
        avatar: p.avatar,
        color: p.color
      })) : [];

      const record: MatchRecord = {
        matchId,
        players: playersList,
        winnerId: winnerUid,
        winnerName,
        date: Date.now(),
        mode: 'online'
      };

      await setDoc(doc(db, 'matches', matchId), record);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${activeUid}`);
    }
  };

  // Reset/Return to Main Menu
  const resetToMenu = () => {
    if (lastHeartbeatRef.current) clearInterval(lastHeartbeatRef.current);
    if (roomUnsubscribeRef.current) {
      roomUnsubscribeRef.current();
      roomUnsubscribeRef.current = null;
    }
    setActiveRoom(null);
    setGameMode(null);
    setActiveMode('menu');
    setValidMoves([]);
  };

  // Fetch Leaderboard
  useEffect(() => {
    const activeUid = currentUser?.uid || guestUser?.uid;
    if (activeMode === 'leaderboard' && activeUid) {
      const fetchLeaderboard = async () => {
        try {
          const q = query(
            collection(db, 'users'),
            orderBy('wins', 'desc'),
            limit(20)
          );
          const snap = await getDocs(q);
          const users: UserStats[] = [];
          snap.forEach((docSnap) => {
            users.push(docSnap.data() as UserStats);
          });
          setLeaderboardUsers(users);
        } catch (e) {
          handleFirestoreError(e, OperationType.LIST, 'users');
        }
      };
      fetchLeaderboard();
    }
  }, [activeMode, currentUser, guestUser]);

  // ----------------- BACKGROUND MUSIC PLAYER ACTIONS -----------------
  const playSong = async (song: { id: string; title: string; artist: string; url: string }) => {
    const activeUid = currentUserRef.current?.uid || guestUserRef.current?.uid || 'guest';
    const newSongState = { ...song, playing: true };
    setCurrentSong(newSongState);

    try {
      if (globalRoomAudio.src !== song.url) {
        globalRoomAudio.src = song.url;
      }
      // If we are syncing or playing, ensure audio triggers
      await globalRoomAudio.play();
    } catch (e) {
      console.warn("Local play failed, browser might require user interaction first:", e);
    }

    // Sync to Firestore if in an online room
    const currentRoom = activeRoomRef.current;
    if (currentRoom && gameMode === 'online') {
      const roomRef = doc(db, 'rooms', currentRoom.roomId);
      try {
        await updateDoc(roomRef, {
          activeSong: {
            id: song.id,
            title: song.title,
            artist: song.artist,
            url: song.url,
            playing: true,
            timestamp: Date.now(),
            progress: globalRoomAudio.currentTime || 0,
            senderId: activeUid
          },
          lastActivity: Date.now()
        });
      } catch (err) {
        console.error("Failed to sync playSong state to Firestore:", err);
      }
    }
  };

  const pauseSong = async () => {
    const activeUid = currentUserRef.current?.uid || guestUserRef.current?.uid || 'guest';
    const current = currentSongRef.current;
    if (current) {
      setCurrentSong({ ...current, playing: false });
    }
    
    globalRoomAudio.pause();

    // Sync to Firestore if in an online room
    const currentRoom = activeRoomRef.current;
    if (currentRoom && gameMode === 'online') {
      const roomRef = doc(db, 'rooms', currentRoom.roomId);
      try {
        await updateDoc(roomRef, {
          activeSong: current ? {
            id: current.id,
            title: current.title,
            artist: current.artist,
            url: current.url,
            playing: false,
            timestamp: Date.now(),
            progress: globalRoomAudio.currentTime || 0,
            senderId: activeUid
          } : null,
          lastActivity: Date.now()
        });
      } catch (err) {
        console.error("Failed to sync pauseSong state to Firestore:", err);
      }
    }
  };

  // Daily Reward claimer
  const claimDailyReward = async () => {
    const activeUid = currentUser?.uid || guestUser?.uid;
    if (!activeUid || !userStats) return;
    const userRef = doc(db, 'users', activeUid);
    try {
      const updated = {
        ...userStats,
        ranking: userStats.ranking + 50 // reward ranking points
      };
      await setDoc(userRef, updated);
      setUserStats(updated);
      triggerVibration([50, 100]);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${activeUid}`);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentUser,
        guestUser,
        userStats,
        settings,
        activeRoom,
        activeMode,
        gameMode,
        isLoading,
        isRolling,
        validMoves,
        isMovingToken,
        leaderboardUsers,
        matchHistory,
        loginWithGoogle,
        loginAsGuest,
        logout,
        updateSettings,
        createOnlineRoom,
        joinOnlineRoom,
        leaveRoom,
        toggleReady,
        startOnlineGame,
        sendChatMessage,
        setupOfflineGame,
        rollDice,
        moveToken,
        resetToMenu,
        setActiveMode,
        setActiveRoom,
        setGameMode,
        claimDailyReward,
        currentSong,
        playSong,
        pauseSong
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
