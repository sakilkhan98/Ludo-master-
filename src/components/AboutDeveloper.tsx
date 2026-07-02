import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ChevronLeft, Send, Check, Copy, Heart, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function AboutDeveloper() {
  const { resetToMenu } = useGame();
  const [copied, setCopied] = useState(false);

  const telegramLink = 'https://t.me/Sharechat_ns_098';

  const copyLink = () => {
    navigator.clipboard.writeText(telegramLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLink = () => {
    window.open(telegramLink, '_blank', 'noreferrer');
  };

  return (
    <div id="about-developer-screen" className="flex flex-col h-full bg-transparent text-white p-5 select-none overflow-y-auto relative z-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          id="back-from-about-btn"
          onClick={resetToMenu}
          className="p-2 backdrop-blur-md bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold font-sans tracking-wide">About Developer</h1>
      </div>

      {/* Developer Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 text-center mb-6 shadow-2xl"
      >
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-4xl shadow-lg border border-blue-400">
          👑
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">SakiL Khan</h2>
        <p className="text-blue-400 text-sm font-medium mt-1">Lead Architect & Developer</p>
        <p className="text-white/50 text-xs mt-3 leading-relaxed">
          Crafting premium, lightweight, real-time gaming apps with clean modular architecture and seamless user experience.
        </p>
      </motion.div>

      {/* Community Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 shadow-xl shadow-black/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Community Support</h3>
        </div>
        <p className="text-white/70 text-sm leading-relaxed mb-5">
          Join our Telegram community for official support, future feature releases, custom match room coordination, and clean APK builds.
        </p>

        {/* Telegram Address Display */}
        <div className="bg-black/30 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono text-white/50 mb-6">
          <span className="truncate">t.me/Sharechat_ns_098</span>
          <button 
            id="copy-telegram-link-btn"
            onClick={copyLink} 
            className="p-1.5 hover:bg-white/10 rounded transition text-blue-400"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="join-telegram-btn"
            onClick={openLink}
            className="py-3 px-4 bg-blue-500/80 hover:bg-blue-400 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/10 border border-white/10"
          >
            <Send className="w-4 h-4" />
            Join Telegram
          </button>
          
          <button
            id="open-telegram-btn"
            onClick={openLink}
            className="py-3 px-4 backdrop-blur-md bg-white/5 hover:bg-white/10 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 active:scale-95 border border-white/10"
          >
            <MessageSquare className="w-4 h-4" />
            Open Telegram
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto text-center flex flex-col items-center gap-2 text-white/30 text-xs py-4">
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
          <span>by SakiL Khan</span>
        </div>
        <p>© 2026 Ludo Master Online. All rights reserved.</p>
      </div>
    </div>
  );
}
