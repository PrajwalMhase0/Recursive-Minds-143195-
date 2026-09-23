'use client'

import { Sprout, Bell, Mic, Users, User, Languages } from 'lucide-react'
import { Language, LANGUAGES_LIST, translations } from '@/lib/i18n'

interface HeaderProps {
  currentLang: Language
  onLanguageChange: (lang: Language) => void
  currentMode: 'farmer' | 'operator'
  onModeChange: (mode: 'farmer' | 'operator') => void
  unreadSmsCount: number
  onOpenSms: () => void
  onOpenVoice: () => void
}

export function Header({
  currentLang,
  onLanguageChange,
  currentMode,
  onModeChange,
  unreadSmsCount,
  onOpenSms,
  onOpenVoice,
}: HeaderProps) {
  const t = translations[currentLang]

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-2.5 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-base tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
              {t.appName}
            </span>
            <span className="block text-[10px] text-emerald-700 font-semibold -mt-0.5">
              {currentMode === 'farmer' ? t.farmerMode : t.operatorMode}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode Switcher Pill */}
          <button
            onClick={() => onModeChange(currentMode === 'farmer' ? 'operator' : 'farmer')}
            title={currentMode === 'farmer' ? 'Switch to Mandi Operator View' : 'Switch to Farmer View'}
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold transition-all shadow-xs ${
              currentMode === 'operator'
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {currentMode === 'operator' ? (
              <>
                <Users className="w-3 h-3" />
                <span>{t.operatorMode}</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-emerald-600" />
                <span>{t.farmerMode}</span>
              </>
            )}
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-0.5 max-w-[95px] sm:max-w-[120px]">
            <Languages className="w-3 h-3 text-slate-500 mr-1 shrink-0" />
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer truncate w-full"
              title="Select Language"
            >
              {LANGUAGES_LIST.map((lang) => (
                <option key={lang.id} value={lang.id} className="text-slate-800 bg-white">
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            title={t.voiceAssistant}
            className="p-1.5 rounded-lg bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-700 border border-emerald-300/60 transition-all hover:scale-105"
          >
            <Mic className="w-4 h-4 font-bold" />
          </button>

          {/* SMS Notification Bell */}
          <button
            onClick={onOpenSms}
            title="Simulated SMS Alerts"
            className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadSmsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                {unreadSmsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
