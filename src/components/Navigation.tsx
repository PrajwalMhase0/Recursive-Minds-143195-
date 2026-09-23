'use client'

import { Home, CalendarPlus, Clock, FileText, User } from 'lucide-react'
import { Language, translations } from '@/lib/i18n'

export type TabType = 'home' | 'book' | 'queue' | 'status' | 'profile'

interface NavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  currentLang: Language
  queueCount?: number
}

export function Navigation({ activeTab, onTabChange, currentLang, queueCount }: NavigationProps) {
  const t = translations[currentLang]

  const navItems: { id: TabType; label: string; icon: typeof Home; badge?: number }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'book', label: t.navBook, icon: CalendarPlus },
    { id: 'queue', label: t.navQueue, icon: Clock, badge: queueCount },
    { id: 'status', label: t.navStatus, icon: FileText },
    { id: 'profile', label: t.navProfile, icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 h-3.5 min-w-[14px] px-1 bg-emerald-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight truncate max-w-full ${isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
