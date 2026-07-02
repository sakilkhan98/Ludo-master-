/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import HomeScreen from './components/HomeScreen';
import GameBoard from './components/GameBoard';
import Lobby from './components/Lobby';
import LeaderboardScreen from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import ProfileScreen from './components/ProfileScreen';
import AboutDeveloper from './components/AboutDeveloper';
import WelcomePopup from './components/WelcomePopup';
import VersionUpdateModal from './components/VersionUpdateModal';

function MainAppContent() {
  const { activeMode, isLoading } = useGame();

  if (isLoading) {
    return (
      <div id="loading-fallback" className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white select-none">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-slate-900 rounded-full animate-spin shadow-lg" />
        <p className="text-sm font-semibold tracking-wide text-slate-400 mt-6 animate-pulse uppercase">
          Ludo Master Online
        </p>
      </div>
    );
  }

  // Route/render correct screen based on central state
  switch (activeMode) {
    case 'menu':
      return <HomeScreen />;
    case 'lobby':
      return <Lobby />;
    case 'game':
      return <GameBoard />;
    case 'leaderboard':
      return <LeaderboardScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'about':
      return <AboutDeveloper />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <div className="w-full max-w-xl md:max-w-2xl mx-auto h-screen bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col font-sans">
        <MainAppContent />
        <WelcomePopup />
        <VersionUpdateModal />
      </div>
    </GameProvider>
  );
}
