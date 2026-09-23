'use client'

import { X, MessageSquare, CheckCheck, Clock } from 'lucide-react'
import { NotificationLog } from '@/types/database'
import { Language, translations, getLocalizedUIString } from '@/lib/i18n'

interface SmsModalProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationLog[]
  farmerPhone?: string
  currentLang?: Language
}

export function SmsModal({ 
  isOpen, 
  onClose, 
  notifications, 
  farmerPhone = '+91 98231 45892',
  currentLang = 'en'
}: SmsModalProps) {
  if (!isOpen) return null

  const t = translations[currentLang]

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t.smsInbox}</h3>
              <p className="text-xs text-slate-500">{getLocalizedUIString('liveSms', currentLang)} &bull; {farmerPhone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SMS List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              {t.noSms}
            </div>
          ) : (
            notifications.map((sms) => (
              <div
                key={sms.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs relative space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-bold text-emerald-700">VK-KRSHSTU</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {new Date(sms.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {sms.message}
                </p>
                <div className="flex justify-end pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                    <CheckCheck className="w-3 h-3 text-emerald-600" />
                    {getLocalizedUIString('deliveredViaSms', currentLang)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            {getLocalizedUIString('smsFallbackNotice', currentLang)}
          </p>
        </div>
      </div>
    </div>
  )
}
