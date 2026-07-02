import React from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Volume2, VolumeX, Smartphone, Globe, Sun, Moon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsScreen() {
  const { settings, updateSettings, resetToMenu } = useGame();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ language: e.target.value as any });
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'es', name: 'Español (Spanish)' }
  ];

  return (
    <div id="settings-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          id="back-from-settings-btn"
          onClick={resetToMenu}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-sans tracking-wide">Settings</h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Sound Toggle */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.soundEnabled ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-sm">Game Sounds</p>
              <p className="text-white/50 text-xs">Play rolling and move sound effects</p>
            </div>
          </div>
          <button
            id="toggle-sounds-btn"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-12 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
              settings.soundEnabled ? 'bg-green-500/80 border border-green-400/40' : 'bg-white/10 border border-white/5'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Music Toggle */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.musicEnabled ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Background Music</p>
              <p className="text-white/50 text-xs">Mellow lobby or active game melodies</p>
            </div>
          </div>
          <button
            id="toggle-music-btn"
            onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
            className={`w-12 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
              settings.musicEnabled ? 'bg-purple-500/80 border border-purple-400/40' : 'bg-white/10 border border-white/5'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Vibration Toggle */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.vibrationEnabled ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-white/40 border border-white/5'}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Haptic Feedback</p>
              <p className="text-white/50 text-xs">Vibrate on rolling, cutting or wins</p>
            </div>
          </div>
          <button
            id="toggle-vibrate-btn"
            onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
            className={`w-12 h-6 rounded-full p-1 transition duration-200 focus:outline-none ${
              settings.vibrationEnabled ? 'bg-amber-500/80 border border-amber-400/40' : 'bg-white/10 border border-white/5'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Language Selection */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 shadow-xl shadow-black/10">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Language</p>
                <p className="text-white/50 text-xs">Select preferred in-game language</p>
              </div>
            </div>
            <select
              id="language-select"
              value={settings.language}
              onChange={handleLanguageChange}
              className="bg-[#1b1b3a] text-white py-1.5 px-3 rounded-lg border border-white/15 text-xs font-medium focus:outline-none focus:border-blue-400"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-[#1b1b3a]">
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Theme Toggling */}
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between shadow-xl shadow-black/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded-xl">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-semibold text-sm">Theme Selection</p>
              <p className="text-white/50 text-xs">Toggle dark theme dashboard overlays</p>
            </div>
          </div>
          <button
            id="toggle-theme-btn"
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="px-3 py-1.5 backdrop-blur-md bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 rounded-lg transition"
          >
            {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
