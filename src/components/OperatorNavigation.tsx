'use client'

import { Users, CalendarPlus, User, Sliders } from 'lucide-react'
import { Language, translations, getLocalizedUIString } from '@/lib/i18n'

export type OperatorTabType = 'queue' | 'book' | 'distribute' | 'profile'

interface OperatorNavigationProps {
  activeTab: OperatorTabType
  onTabChange: (tab: OperatorTabType) => void
  currentLang: Language
  queueCount?: number
}

export function OperatorNavigation({
  activeTab,
  onTabChange,
  currentLang,
  queueCount,
}: OperatorNavigationProps) {
  const t = translations[currentLang]

  const navItems: { id: OperatorTabType; label: string; icon: typeof Users; badge?: number }[] = [
    {
      id: 'queue',
      label: getLocalizedUIString('opNavQueue', currentLang),
      icon: Users,
      badge: queueCount,
    },
    {
      id: 'book',
      label: getLocalizedUIString('opNavWalkIn', currentLang),
      icon: CalendarPlus,
    },
    {
      id: 'distribute',
      label: getLocalizedUIString('opNavDistribute', currentLang),
      icon: Sliders,
    },
    {
      id: 'profile',
      label: getLocalizedUIString('opNavProfile', currentLang),
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
                isActive
                  ? 'text-amber-800 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5] text-amber-600' : 'stroke-2'
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 h-3.5 min-w-[14px] px-1 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight truncate max-w-full ${
                  isActive ? 'text-amber-900 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
