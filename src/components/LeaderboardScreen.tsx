import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Music, Activity, Play, Square, Sliders, Zap, Volume2, Search, Pause, Disc } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  playDJKick, 
  playDJSweep, 
  playDJLaser, 
  playDJBassDrop, 
  playDJSynthArp, 
  playDJSnareClap,
  triggerVibration
} from '../lib/audio';

interface OnlineSong {
  id: string;
  title: string;
  artist: string;
  category: 'trending' | 'hindi' | 'bengali_punjabi' | 'international';
  url: string;
  duration: string;
}

const ONLINE_SONGS: OnlineSong[] = [
  // Trending Songs
  { id: 'trend1', title: 'Calm Down (Remix)', artist: 'Rema ft. Selena Gomez', category: 'trending', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: '3:59' },
  { id: 'trend2', title: 'Shape of You (Lofi)', artist: 'Ed Sheeran Lofi', category: 'trending', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '3:53' },
  { id: 'trend3', title: 'Starboy (Synthwave)', artist: 'The Weeknd Remix', category: 'trending', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '3:45' },
  { id: 'trend4', title: 'Blinding Lights (8-Bit)', artist: 'The Weeknd Retro', category: 'trending', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '3:20' },
  
  // Hindi Hits
  { id: 'hindi1', title: 'Apna Bana Le (Lofi)', artist: 'Arijit Singh Lofi', category: 'hindi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '4:10' },
  { id: 'hindi2', title: 'Kesariya (Instrumental)', artist: 'Pritam Cover', category: 'hindi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '4:25' },
  { id: 'hindi3', title: 'Tum Hi Ho (Chillout)', artist: 'Arijit Lofi Mix', category: 'hindi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', duration: '3:35' },
  { id: 'hindi4', title: 'Raataan Lambiyan', artist: 'Tanishk Bagchi Cover', category: 'hindi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', duration: '3:50' },
  { id: 'hindi5', title: 'Pasoori (Lofi Chill)', artist: 'Ali Sethi Remix', category: 'hindi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', duration: '3:44' },

  // Bengali & Punjabi
  { id: 'bp1', title: 'Bhalobasha Tarpor (Bengali)', artist: 'Guitar Instrumental', category: 'bengali_punjabi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', duration: '3:15' },
  { id: 'bp2', title: 'Suna Gaan (Bengali Lofi)', artist: 'Classic Lofi', category: 'bengali_punjabi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', duration: '4:02' },
  { id: 'bp3', title: 'Brown Munde (Chill Beat)', artist: 'AP Dhillon Instrumental', category: 'bengali_punjabi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', duration: '3:28' },
  { id: 'bp4', title: 'Elevated (Beat)', artist: 'Shubh Synth', category: 'bengali_punjabi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', duration: '3:05' },
  { id: 'bp5', title: 'No Love (Instrumental)', artist: 'Shubh Ambient', category: 'bengali_punjabi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', duration: '2:50' }
];

const VISUALIZER_THEMES = {
  cyber: {
    name: 'Cyber Red',
    bg: 'from-rose-950/40 via-slate-900 to-black',
    glow: 'shadow-rose-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    accent: 'bg-rose-500',
    barColor: 'bg-gradient-to-t from-red-600 via-rose-500 to-amber-400',
    recordGrad: 'from-rose-600 via-red-950 to-rose-900'
  },
  neon: {
    name: 'Neon Green',
    bg: 'from-emerald-950/40 via-slate-900 to-black',
    glow: 'shadow-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    accent: 'bg-emerald-500',
    barColor: 'bg-gradient-to-t from-emerald-600 via-green-400 to-teal-300',
    recordGrad: 'from-emerald-600 via-green-950 to-emerald-900'
  },
  acid: {
    name: 'Acid Yellow',
    bg: 'from-amber-950/30 via-slate-900 to-black',
    glow: 'shadow-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    accent: 'bg-amber-500',
    barColor: 'bg-gradient-to-t from-amber-600 via-yellow-400 to-lime-300',
    recordGrad: 'from-amber-500 via-yellow-950 to-amber-800'
  },
  electric: {
    name: 'Electric Blue',
    bg: 'from-blue-950/40 via-slate-900 to-black',
    glow: 'shadow-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    accent: 'bg-blue-500',
    barColor: 'bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-300',
    recordGrad: 'from-blue-600 via-indigo-950 to-blue-900'
  }
};

type ThemeKey = keyof typeof VISUALIZER_THEMES;

export default function LeaderboardScreen() {
  const { resetToMenu, currentSong, playSong, pauseSong } = useGame();
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('electric');
  const [activeLoop, setActiveLoop] = useState<'none' | 'techno' | 'trance' | 'chill'>('none');
  const [bpm, setBpm] = useState<number>(130);
  const [bassBoost, setBassBoost] = useState<boolean>(true);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(new Array(12).fill(15));
  
  // SakiL Beats Jukebox states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'trending' | 'hindi' | 'bengali_punjabi'>('all');

  const filteredSongs = ONLINE_SONGS.filter(song => {
    const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory;
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const theme = VISUALIZER_THEMES[activeTheme];

  // Dynamic visualizer mock frequency bars
  useEffect(() => {
    const isPlaying = activeLoop !== 'none';
    const intervalTime = isPlaying ? 90 : 250;
    
    const timer = setInterval(() => {
      setVisualizerHeights(prev => 
        prev.map(() => {
          if (isPlaying) {
            return Math.floor(Math.random() * 85) + 15; // Active heights
          }
          return Math.floor(Math.random() * 10) + 8; // Idle tiny heights
        })
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeLoop]);

  // Audio synthesis loop manager
  useEffect(() => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }

    if (activeLoop === 'none') return;

    // Calculate step duration in milliseconds based on BPM
    const beatDuration = (60 / bpm) * 1000;
    const stepDuration = beatDuration / 4; // 16th notes
    let step = 0;

    const playLoopStep = () => {
      if (activeLoop === 'techno') {
        const beatInBar = step % 8;
        // Kick on 1 and 5
        if (beatInBar === 0 || beatInBar === 4) {
          playDJKick();
        }
        // Snare/clap on 3 and 7
        if (beatInBar === 2 || beatInBar === 6) {
          playDJSnareClap();
        }
        // Offbeat laser triggers
        if (beatInBar === 1 || beatInBar === 5) {
          if (Math.random() > 0.6) playDJLaser();
        }
      } 
      else if (activeLoop === 'trance') {
        const beatInBar = step % 16;
        // Fast kick pattern
        if (beatInBar % 4 === 0) {
          playDJKick();
        }
        // Fast arpeggiator trigger on 1 and 9
        if (beatInBar === 0 || beatInBar === 8) {
          playDJSynthArp();
        }
        if (beatInBar === 4 || beatInBar === 12) {
          playDJSnareClap();
        }
      } 
      else if (activeLoop === 'chill') {
        const beatInBar = step % 8;
        // Slow kick
        if (beatInBar === 0) {
          playDJKick();
        }
        if (beatInBar === 4) {
          playDJSnareClap();
        }
        if (beatInBar === 6 && Math.random() > 0.5) {
          playDJSweep();
        }
      }

      step++;
    };

    // Run first step instantly
    playLoopStep();

    // Set recurring intervals
    loopIntervalRef.current = setInterval(playLoopStep, stepDuration);

    return () => {
      if (loopIntervalRef.current) {
        clearInterval(loopIntervalRef.current);
      }
    };
  }, [activeLoop, bpm]);

  const handleSoundPad = (soundFn: () => void) => {
    soundFn();
    // Add heavy kick visualizer flash
    setVisualizerHeights(prev => prev.map(h => Math.min(100, h + 30)));
    if (bassBoost) {
      triggerVibration([30, 20, 30]);
    }
  };

  const handleLoopToggle = (loopType: typeof activeLoop) => {
    if (activeLoop === loopType) {
      setActiveLoop('none');
      triggerVibration(100);
    } else {
      setActiveLoop(loopType);
      triggerVibration([50, 50]);
    }
  };

  return (
    <div id="dj-console-screen" className={`flex flex-col h-full bg-gradient-to-b ${theme.bg} text-white p-5 select-none overflow-y-auto relative z-10 transition-all duration-700`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button 
            id="back-from-dj-btn"
            onClick={() => {
              setActiveLoop('none');
              resetToMenu();
            }}
            className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-extrabold font-sans tracking-tight flex items-center gap-2">
            <Music className={`w-4 h-4 ${theme.text} animate-bounce`} /> SakiL DJ Console
          </h1>
        </div>

        {/* Theme Selectors */}
        <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          {(Object.keys(VISUALIZER_THEMES) as ThemeKey[]).map(tKey => (
            <button
              id={`theme-btn-${tKey}`}
              key={tKey}
              onClick={() => setActiveTheme(tKey)}
              className={`w-5 h-5 rounded-full border transition active:scale-95 ${
                activeTheme === tKey 
                  ? 'border-white scale-110 shadow-lg' 
                  : 'border-transparent opacity-65'
              }`}
              style={{
                backgroundColor: 
                  tKey === 'cyber' ? '#f43f5e' : 
                  tKey === 'neon' ? '#10b981' : 
                  tKey === 'acid' ? '#eab308' : '#3b82f6'
              }}
              title={VISUALIZER_THEMES[tKey].name}
            />
          ))}
        </div>
      </div>

      {/* Main Console Center */}
      <div className="flex-1 flex flex-col justify-between space-y-5">
        
        {/* Dynamic Frequency Visualizer EQ Display */}
        <div className={`w-full backdrop-blur-xl bg-black/55 rounded-3xl p-4 border ${theme.border} shadow-xl ${theme.glow} flex flex-col justify-between h-28 relative overflow-hidden transition-all duration-500`}>
          <div className="flex justify-between items-center z-10 relative">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
              <Activity className={`w-3.5 h-3.5 ${theme.text}`} /> Live Beat EQ Engine
            </span>
            <span className="text-[10px] font-mono font-black text-white/80 uppercase">
              {activeLoop === 'none' ? 'STANDBY' : `${activeLoop} loop active`}
            </span>
          </div>

          {/* EQ Bars */}
          <div className="flex items-end justify-between h-14 w-full gap-1 pt-2 z-10 relative">
            {visualizerHeights.map((h, idx) => (
              <div key={idx} className="flex-1 bg-white/5 h-full rounded-full overflow-hidden flex items-end">
                <motion.div 
                  animate={{ height: `${h}%` }}
                  transition={{ type: 'tween', duration: 0.1 }}
                  className={`w-full rounded-full ${theme.barColor}`} 
                />
              </div>
            ))}
          </div>

          {/* Background scanlines decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-40" />
        </div>

        {/* Dual Spinners Decks Area (Vinyl Simulation) */}
        <div className="grid grid-cols-2 gap-4 my-1">
          {/* Deck A */}
          <div className="flex flex-col items-center p-3 rounded-2xl bg-black/30 border border-white/5 relative overflow-hidden">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">DECK L_01</span>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <motion.div
                animate={{ rotate: activeLoop !== 'none' ? 360 : 0 }}
                transition={{
                  repeat: Infinity,
                  duration: activeLoop === 'trance' ? 2 : activeLoop === 'chill' ? 5 : 3.5,
                  ease: 'linear'
                }}
                className={`w-full h-full rounded-full bg-gradient-to-br ${theme.recordGrad} shadow-2xl relative flex items-center justify-center border-4 border-slate-900`}
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-3 rounded-full border border-white/5" />
                <div className="absolute inset-6 rounded-full border border-white/5" />
                <div className="absolute inset-9 rounded-full border border-white/5" />
                {/* Center Label */}
                <div className={`w-8 h-8 rounded-full ${theme.accent} border-2 border-slate-950 flex items-center justify-center text-[10px] shadow-lg`}>
                  💿
                </div>
              </motion.div>
              {/* Arm needle */}
              <div className="absolute top-0 right-0 w-8 h-10 border-t-2 border-r-2 border-white/20 rounded-tr-lg transform origin-top-right rotate-12" />
            </div>
          </div>

          {/* Deck B */}
          <div className="flex flex-col items-center p-3 rounded-2xl bg-black/30 border border-white/5 relative overflow-hidden">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2">DECK R_02</span>
            
            <div className="relative w-28 h-28 flex items-center justify-center">
              <motion.div
                animate={{ rotate: activeLoop !== 'none' ? -360 : 0 }}
                transition={{
                  repeat: Infinity,
                  duration: activeLoop === 'trance' ? 2 : activeLoop === 'chill' ? 5 : 3.5,
                  ease: 'linear'
                }}
                className={`w-full h-full rounded-full bg-gradient-to-br ${theme.recordGrad} shadow-2xl relative flex items-center justify-center border-4 border-slate-900`}
              >
                {/* Vinyl Grooves */}
                <div className="absolute inset-3 rounded-full border border-white/5" />
                <div className="absolute inset-6 rounded-full border border-white/5" />
                <div className="absolute inset-9 rounded-full border border-white/5" />
                {/* Center Label */}
                <div className={`w-8 h-8 rounded-full ${theme.accent} border-2 border-slate-950 flex items-center justify-center text-[10px] shadow-lg`}>
                  🎧
                </div>
              </motion.div>
              {/* Arm needle */}
              <div className="absolute top-0 right-0 w-8 h-10 border-t-2 border-r-2 border-white/20 rounded-tr-lg transform origin-top-right rotate-12" />
            </div>
          </div>
        </div>

        {/* SakiL Beats Online Jukebox Section */}
        <div className="backdrop-blur-xl bg-black/60 border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-teal-400 animate-pulse" /> SakiL Beats Online Jukebox
            </h3>
            {currentSong && currentSong.playing && (
              <span className="text-[10px] bg-teal-500/15 border border-teal-500/30 text-teal-400 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                Live Sync Active
              </span>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
            <input
              id="jukebox-search-input"
              type="text"
              placeholder="Search trending songs, Hindi lofi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 rounded-xl text-xs font-semibold placeholder-white/30 text-white outline-none transition duration-300"
            />
          </div>

          {/* Categories Tab Selector */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
            {[
              { id: 'all', label: 'All Beats' },
              { id: 'trending', label: '🔥 Trending' },
              { id: 'hindi', label: '🎵 Hindi Hits' },
              { id: 'bengali_punjabi', label: '🍁 Bangla/Punjabi' }
            ].map(cat => (
              <button
                id={`cat-tab-${cat.id}`}
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition shrink-0 whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-bold'
                    : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Song rows scroll container */}
          <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredSongs.length > 0 ? (
              filteredSongs.map(song => {
                const isCurrent = currentSong && currentSong.id === song.id;
                const isPlaying = isCurrent && currentSong.playing;

                return (
                  <div 
                    key={song.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-500/5' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* CD Icon or Equalizer graphic */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-inner shrink-0 ${
                        isCurrent 
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                          : 'bg-slate-900 border border-white/5 text-white/30'
                      }`}>
                        {isPlaying ? (
                          <div className="flex items-end gap-[2px] h-3">
                            <span className="w-[3px] bg-teal-400 animate-[bounce_1s_infinite_100ms] rounded-full" style={{ height: '80%' }} />
                            <span className="w-[3px] bg-teal-300 animate-[bounce_1s_infinite_300ms] rounded-full" style={{ height: '40%' }} />
                            <span className="w-[3px] bg-teal-400 animate-[bounce_1s_infinite_500ms] rounded-full" style={{ height: '100%' }} />
                          </div>
                        ) : (
                          <Disc className={`w-4 h-4 ${isCurrent ? 'animate-spin-slow text-teal-300' : 'text-white/40'}`} />
                        )}
                      </div>

                      {/* Song details */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-black truncate leading-snug ${isCurrent ? 'text-teal-300' : 'text-white/95'}`}>
                          {song.title}
                        </p>
                        <p className="text-[10px] text-white/40 font-semibold truncate mt-0.5">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Actions and category badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-bold text-white/30 pr-1">{song.duration}</span>
                      
                      <button
                        id={`play-btn-${song.id}`}
                        onClick={async () => {
                          if (isCurrent && isPlaying) {
                            await pauseSong();
                          } else {
                            await playSong(song);
                          }
                          triggerVibration(40);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                          isPlaying 
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30' 
                            : 'bg-teal-500 border-teal-400 text-slate-950 hover:scale-105 shadow-md shadow-teal-500/10'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-rose-300" /> : <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-white/35 text-xs font-medium">
                No songs match "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Beat Pad Grid (6 Tactile Glowing Pads for Sound FX) */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block text-center">
            🔥 NS SakiL DJ Launchpad (Tap to Drop) 🔥
          </span>
          <div className="grid grid-cols-3 gap-3">
            <button
              id="pad-kick-btn"
              onClick={() => handleSoundPad(playDJKick)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-rose-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg group-active:animate-ping">🥁</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-rose-300">BASS KICK</span>
            </button>

            <button
              id="pad-snare-btn"
              onClick={() => handleSoundPad(playDJSnareClap)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-emerald-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">👏</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-emerald-300">SNARE CLAP</span>
            </button>

            <button
              id="pad-laser-btn"
              onClick={() => handleSoundPad(playDJLaser)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-amber-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">⚡</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-amber-300">LASER GUN</span>
            </button>

            <button
              id="pad-sweep-btn"
              onClick={() => handleSoundPad(playDJSweep)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-blue-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">🌌</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-blue-300">EQ SWEEP</span>
            </button>

            <button
              id="pad-arp-btn"
              onClick={() => handleSoundPad(playDJSynthArp)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-purple-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">🎹</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-purple-300">SYNTH ARP</span>
            </button>

            <button
              id="pad-drop-btn"
              onClick={() => handleSoundPad(playDJBassDrop)}
              className="py-4 rounded-2xl border border-white/10 bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95 active:bg-cyan-600 transition shadow-lg text-center flex flex-col items-center justify-center gap-1 group"
            >
              <span className="text-lg">🌋</span>
              <span className="text-[10px] font-black tracking-tight uppercase text-cyan-300">BASS DROP</span>
            </button>
          </div>
        </div>

        {/* Automatic Electronic Beats Loops Controls */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-white/40 block">
            🎧 Select Live Auto-Beats Loops
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              id="loop-techno-btn"
              onClick={() => handleLoopToggle('techno')}
              className={`py-3.5 px-2 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 active:scale-95 ${
                activeLoop === 'techno'
                  ? `${theme.accent} border-white text-slate-950 font-black shadow-lg`
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {activeLoop === 'techno' ? <Square className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              TECHNO
            </button>

            <button
              id="loop-trance-btn"
              onClick={() => handleLoopToggle('trance')}
              className={`py-3.5 px-2 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 active:scale-95 ${
                activeLoop === 'trance'
                  ? `${theme.accent} border-white text-slate-950 font-black shadow-lg`
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {activeLoop === 'trance' ? <Square className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              TRANCE
            </button>

            <button
              id="loop-chill-btn"
              onClick={() => handleLoopToggle('chill')}
              className={`py-3.5 px-2 rounded-xl border text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 active:scale-95 ${
                activeLoop === 'chill'
                  ? `${theme.accent} border-white text-slate-950 font-black shadow-lg`
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {activeLoop === 'chill' ? <Square className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              LO-FI
            </button>
          </div>
        </div>

        {/* Dynamic Sliders and Toggles (Bass & Tempo) */}
        <div className="grid grid-cols-2 gap-4">
          {/* BPM Tempo Speed */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1 mb-1">
              <Sliders className="w-3.5 h-3.5" /> Speed: {bpm} BPM
            </span>
            <input
              id="bpm-slider"
              type="range"
              min={100}
              max={170}
              step={5}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Haptic Bass Boost */}
          <button
            id="bass-boost-toggle"
            onClick={() => {
              setBassBoost(!bassBoost);
              triggerVibration(bassBoost ? 150 : [80, 80]);
            }}
            className={`backdrop-blur-md rounded-2xl p-3 border text-left flex items-center justify-between transition active:scale-95 ${
              bassBoost
                ? `${theme.border} bg-white/10 text-white font-extrabold`
                : 'border-white/5 bg-white/5 text-white/50'
            }`}
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Vibe Feedback</span>
              <span className="text-xs font-extrabold">Haptic Bass</span>
            </div>
            <Zap className={`w-4 h-4 ${bassBoost ? `${theme.text} animate-pulse` : 'text-white/30'}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
