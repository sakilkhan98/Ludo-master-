import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Music, Activity, Play, Search, Pause, Disc, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerVibration } from '../lib/audio';

interface OnlineSong {
  id: string;
  title: string;
  artist: string;
  category: 'trending' | 'hindi' | 'bengali_punjabi' | 'search';
  url: string;
  image: string;
  duration: string;
}

export default function LeaderboardScreen() {
  const { 
    resetToMenu, 
    currentSong, 
    playSong, 
    pauseSong, 
    settings, 
    updateSettings,
    songsPlaylist,
    setSongsPlaylist
  } = useGame();
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'trending' | 'hindi' | 'bengali_punjabi'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(new Array(16).fill(10));

  // Dynamic visualizer mock EQ waves when music is playing
  useEffect(() => {
    const isPlaying = currentSong && currentSong.playing;
    const intervalTime = isPlaying ? 80 : 250;
    
    const timer = setInterval(() => {
      setVisualizerHeights(prev => 
        prev.map(() => {
          if (isPlaying) {
            return Math.floor(Math.random() * 85) + 15; // Active bouncing heights
          }
          return Math.floor(Math.random() * 8) + 6; // Idle tiny heights
        })
      );
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentSong?.playing]);

  // Fetch JioSaavn songs from api.airbeats.xyz with multiple public fallbacks
  const fetchSongsFromAPI = async (query: string, category: 'trending' | 'hindi' | 'bengali_punjabi' | 'search') => {
    try {
      // Multiple active JioSaavn wrapper hosts for absolute maximum reliability
      const hosts = [
        'https://api.airbeats.xyz',
        'https://saavn.dev',
        'https://jiosaavn-api-private.vercel.app',
        'https://saavn.me'
      ];

      for (const host of hosts) {
        // Try both paths with/without /api suffix depending on wrapper config
        const paths = [
          `${host}/api/search/songs?query=${encodeURIComponent(query)}`,
          `${host}/search/songs?query=${encodeURIComponent(query)}`
        ];

        for (const url of paths) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const resData = await res.json();
              const results = resData?.data?.results || resData?.data || [];
              if (Array.isArray(results) && results.length > 0) {
                return results.slice(0, 12).map((s: any, idx: number) => {
                  // Extract highest available quality direct MP3 URL
                  const downloadUrlObj = 
                    s.downloadUrl?.find((d: any) => d.quality === '320kbps') || 
                    s.downloadUrl?.find((d: any) => d.quality === '160kbps') ||
                    s.downloadUrl?.find((d: any) => d.quality === '96kbps') ||
                    s.downloadUrl?.[s.downloadUrl.length - 1];

                  // Extract medium quality album image
                  const imageObj = 
                    s.image?.find((i: any) => i.quality === '150x150') || 
                    s.image?.[s.image.length - 1];

                  return {
                    id: `${category}-${s.id || idx}-${Math.random().toString(36).substr(2, 4)}`,
                    title: s.name || s.title || 'Unknown Song',
                    artist: s.primaryArtists || s.artists?.primary?.[0]?.name || s.artist || 'Unknown Artist',
                    category,
                    url: downloadUrlObj?.url || s.downloadUrl?.[0]?.url || '',
                    image: imageObj?.url || s.image?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
                    duration: s.duration ? `${Math.floor(s.duration / 60)}:${String(s.duration % 60).padStart(2, '0')}` : '3:15'
                  };
                }).filter((s: any) => s.url);
              }
            }
          } catch (e) {
            console.warn(`Host ${host} path fail:`, e);
          }
        }
      }
    } catch (err) {
      console.error("All hosts failed for query:", query, err);
    }
    return [];
  };

  // Load amazing initial Hindi, Bengali, and Trending hit tracks on mount if empty
  useEffect(() => {
    if (songsPlaylist.length > 0) return;

    const loadInitialSongs = async () => {
      setIsLoading(true);
      
      // Dynamic parallel search queries to populate initial tracks
      const [trending, hindi, bengali] = await Promise.all([
        fetchSongsFromAPI('lofi hit', 'trending'),
        fetchSongsFromAPI('Arijit Singh lofi', 'hindi'),
        fetchSongsFromAPI('Bengali lofi chill', 'bengali_punjabi')
      ]);

      // Static fallback list with CORS-compliant public domain MP3 links in case internet / APIs fail completely
      const staticFallback: OnlineSong[] = [
        { 
          id: 'bp-f1', 
          title: 'Calm Down (Remix)', 
          artist: 'Rema ft. Selena Gomez', 
          category: 'trending', 
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 
          duration: '3:59', 
          image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150' 
        },
        { 
          id: 'bp-f2', 
          title: 'Shape of You (Lofi)', 
          artist: 'Ed Sheeran Lofi', 
          category: 'trending', 
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 
          duration: '3:53', 
          image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150' 
        },
        { 
          id: 'bp-f3', 
          title: 'Brown Munde (Chill Beat)', 
          artist: 'AP Dhillon Instrumental', 
          category: 'bengali_punjabi', 
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', 
          duration: '3:28', 
          image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150' 
        }
      ];

      const combined = [...trending, ...hindi, ...bengali];
      if (combined.length === 0) {
        setSongsPlaylist(staticFallback);
      } else {
        // Guarantee unique songs by direct MP3 URL
        const unique = combined.filter((song, index, self) =>
          self.findIndex(t => t.url === song.url) === index
        );
        setSongsPlaylist(unique);
      }
      
      setIsLoading(false);
    };

    loadInitialSongs();
  }, [songsPlaylist.length, setSongsPlaylist]);

  // Perform a fresh search when typing / clicking search
  const handleSearchTrigger = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    triggerVibration(40);
    
    const results = await fetchSongsFromAPI(searchQuery, 'search');
    if (results.length > 0) {
      // Prepend new search results to the front, and filter duplicate links
      const merged = [...results, ...songsPlaylist];
      const unique = merged.filter((song, idx, self) =>
        self.findIndex(t => t.url === song.url) === idx
      );
      setSongsPlaylist(unique);
    }
    setIsLoading(false);
  };

  // Filter songs based on category tab selection
  const filteredSongs = songsPlaylist.filter(song => {
    if (selectedCategory === 'all') return true;
    return song.category === selectedCategory;
  });

  return (
    <div id="ns-beats-jukebox-screen" className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-4 select-none overflow-y-auto relative z-10">
      
      {/* Top Menu Option (Extremely Small, Elegant, Translucent Bar) */}
      <div className="flex items-center justify-between mb-4 bg-white/[0.03] border border-white/5 py-2 px-3 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button 
            id="back-from-jukebox-btn"
            onClick={resetToMenu}
            className="p-2 bg-white/5 hover:bg-white/10 hover:text-teal-300 border border-white/15 rounded-xl transition active:scale-95 flex items-center gap-1 text-xs font-black uppercase tracking-wider text-white/90"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>

        <h1 className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-500 flex items-center gap-1.5 font-sans">
          <Music className="w-4 h-4 text-teal-400 animate-pulse" /> NS Beats Jukebox
        </h1>

        {/* Small Sound Toggle option inside the header menu */}
        <button
          id="jukebox-sound-toggle-btn"
          onClick={() => {
            updateSettings({ soundEnabled: !settings.soundEnabled });
            triggerVibration(45);
          }}
          className={`p-2 rounded-xl border transition active:scale-95 flex items-center justify-center ${
            settings.soundEnabled
              ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25'
              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
          }`}
          title={settings.soundEnabled ? "Mute Game Sound" : "Unmute Game Sound"}
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Jukebox Screen Layout */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Active Song Billboard Panel (Equalizer + CD Vinyl Cover) */}
        <div className="w-full bg-black/50 rounded-3xl p-4 border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between h-40">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-teal-400/80 flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3 animate-pulse text-teal-400" /> Live playback active
              </span>
              <p className="text-sm font-black text-white truncate max-w-[200px] mt-1 leading-tight">
                {currentSong ? currentSong.title : 'No active song'}
              </p>
              <p className="text-[11px] text-white/55 font-bold truncate max-w-[180px] mt-0.5">
                {currentSong ? currentSong.artist : 'Select a track below'}
              </p>
            </div>

            {/* Rotating CD Vinyl Sleeve Illustration */}
            <div className="relative w-16 h-16 shrink-0 shadow-lg">
              <motion.div
                animate={{ rotate: currentSong?.playing ? 360 : 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 4.5,
                  ease: 'linear'
                }}
                className="w-full h-full rounded-full bg-slate-900 border-[3px] border-slate-950 flex items-center justify-center relative overflow-hidden"
              >
                {currentSong ? (
                  <img 
                    src={(currentSong as any).image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150'} 
                    alt="Album Cover" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full opacity-80"
                  />
                ) : (
                  <Disc className="w-6 h-6 text-white/20" />
                )}
                {/* Center hole of record */}
                <div className="absolute w-3.5 h-3.5 bg-slate-950 rounded-full border border-white/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                </div>
              </motion.div>
              {/* Outer light sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Clean High-Contrast EQ Waves */}
          <div className="flex items-end justify-between h-14 w-full gap-[3px] pt-1 z-10 relative border-t border-white/5">
            {visualizerHeights.map((h, idx) => (
              <div key={idx} className="flex-1 bg-white/[0.02] h-full rounded-full overflow-hidden flex items-end">
                <motion.div 
                  animate={{ height: `${h}%` }}
                  transition={{ type: 'tween', duration: 0.12 }}
                  className="w-full rounded-full bg-gradient-to-t from-teal-500 via-emerald-400 to-indigo-500" 
                />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/15 via-transparent to-slate-950/40 pointer-events-none" />
        </div>

        {/* Dynamic Search Box */}
        <div className="relative">
          <input
            id="jukebox-search-input"
            type="text"
            placeholder="Search Hindi, Bengali, Punjabi hit songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchTrigger();
            }}
            className="w-full pl-4 pr-12 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 rounded-2xl text-xs font-semibold placeholder-white/30 text-white outline-none transition duration-300"
          />
          <button
            id="jukebox-search-submit-btn"
            onClick={handleSearchTrigger}
            className="absolute right-2.5 top-2 py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition duration-300 flex items-center justify-center active:scale-95"
          >
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          {[
            { id: 'all', label: 'All Beats' },
            { id: 'trending', label: '🔥 Trending' },
            { id: 'hindi', label: '🎵 Hindi Hits' },
            { id: 'bengali_punjabi', label: '🍁 Bangla/Punjabi' }
          ].map(cat => (
            <button
              id={`cat-tab-${cat.id}`}
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as any);
                triggerVibration(30);
              }}
              className={`py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition shrink-0 whitespace-nowrap active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'bg-white/5 border border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Songs Rows Scrolling Jukebox List */}
        <div className="flex-1 min-h-[180px] max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-teal-400/80 animate-pulse font-mono uppercase tracking-widest">
                Searching api.airbeats.xyz...
              </p>
            </div>
          ) : filteredSongs.length > 0 ? (
            filteredSongs.map(song => {
              const isCurrent = currentSong && currentSong.id === song.id;
              const isPlaying = isCurrent && currentSong.playing;

              return (
                <div 
                  key={song.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 ${
                    isCurrent 
                      ? 'bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-500/5' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Song thumbnail art with CD spinning animation */}
                    <div className="relative w-10 h-10 shrink-0 shadow-md rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                      <img 
                        src={song.image} 
                        alt="Thumbnail" 
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'animate-spin-slow' : ''}`}
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <div className="flex items-end gap-[2px] h-3">
                            <span className="w-[2.5px] bg-teal-400 animate-[bounce_1s_infinite_100ms] rounded-full" style={{ height: '70%' }} />
                            <span className="w-[2.5px] bg-teal-300 animate-[bounce_1s_infinite_300ms] rounded-full" style={{ height: '35%' }} />
                            <span className="w-[2.5px] bg-teal-400 animate-[bounce_1s_infinite_500ms] rounded-full" style={{ height: '90%' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Song details */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black truncate leading-snug ${isCurrent ? 'text-teal-300' : 'text-white/95'}`}>
                        {song.title}
                      </p>
                      <p className="text-[10px] text-white/40 font-semibold truncate mt-0.5 leading-none">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Playback controller */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[9px] font-black text-white/30 font-mono pr-1">{song.duration}</span>
                    
                    <button
                      id={`play-btn-${song.id}`}
                      onClick={async () => {
                        if (isCurrent && isPlaying) {
                          await pauseSong();
                        } else {
                          await playSong(song);
                        }
                        triggerVibration(45);
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                        isPlaying 
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30' 
                          : 'bg-teal-500 border-teal-400 text-slate-950 hover:scale-105 shadow-md shadow-teal-500/10'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-rose-300" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-white/35 text-xs font-semibold">
              No songs found. Try searching for a different track!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
