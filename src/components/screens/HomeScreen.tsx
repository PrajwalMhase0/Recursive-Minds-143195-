'use client'

import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowUpRight, 
  ShieldCheck, 
  Sprout, 
  CalendarPlus, 
  CreditCard, 
  Mic, 
  CheckCircle2,
  Navigation as NavIcon
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedUIString } from '@/lib/i18n'
import { Booking, Farmer } from '@/types/database'
import { TabType } from '@/components/Navigation'

interface HomeScreenProps {
  farmer: Farmer | null
  activeBooking: Booking | null
  currentLang: Language
  onNavigateTab: (tab: TabType) => void
  onOpenVoice: () => void
  onCheckIn: (bookingId: string) => void
}

export function HomeScreen({
  farmer,
  activeBooking,
  currentLang,
  onNavigateTab,
  onOpenVoice,
  onCheckIn,
}: HomeScreenProps) {
  const t = translations[currentLang]

  const farmerName = farmer?.name || t.verifiedFarmer
  const farmerIdCode = farmer?.farmer_id_code || 'KS-MH-XXXX'
  const village = farmer?.village || 'Shirur'
  const district = farmer?.district || 'Pune Dist.'

  // Direction coordinates for Krishi Mandi Shirur
  const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=18.8267,74.3789'

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-300">
      {/* Greeting & Farmer Profile Snapshot */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
            <Sprout className="w-3.5 h-3.5" />
            <span>{t.namaste},</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{farmerName}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-bold">
              {farmerIdCode}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {village}, {district}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.verifiedFarmer}</span>
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-medium">{getLocalizedUIString('pmKisanActive', currentLang)}</span>
        </div>
      </div>

      {/* Card 1: Upcoming Slot Card (Confirmed) */}
      {activeBooking ? (
        <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-lg shadow-emerald-900/5 relative overflow-hidden">
          {/* Header pill */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.upcomingSlot}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {activeBooking.booking_code}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.confirmed}</span>
            </span>
          </div>

          {/* Slot Details */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {getLocalizedCropName(activeBooking.crop, currentLang)} &bull; {activeBooking.approx_quantity_quintals} {t.quintals}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{activeBooking.procurement_centre?.name || 'Krishi Mandi Centre - Shirur'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">{t.dateLabel}</span>
                  <span className="font-bold text-slate-800">
                    {new Date(activeBooking.slot_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">{t.timeSlotLabel}</span>
                  <span className="font-bold text-slate-800">{activeBooking.slot_time}</span>
                </div>
              </div>
            </div>

            {/* Actions: Get Directions & Check-In */}
            <div className="pt-2 flex items-center gap-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 transition-all shadow-xs"
              >
                <NavIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.getDirections}</span>
              </a>

              {activeBooking.status === 'BOOKED' ? (
                <button
                  onClick={() => onCheckIn(activeBooking.id)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 hover:opacity-95 transition-opacity"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.checkInNow}</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigateTab('queue')}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-all"
                >
                  <span>{t.trackQueue}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-md shadow-slate-100">
          <CalendarPlus className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-slate-900 text-sm">{t.noActiveBooking}</h3>
          <p className="text-xs text-slate-500">
            {t.noActiveBookingDesc}
          </p>
          <button
            onClick={() => onNavigateTab('book')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
          >
            {t.bookSlot}
          </button>
        </div>
      )}

      {/* Card 2: Live Queue Snapshot Widget */}
      {activeBooking && activeBooking.queue_number && (
        <div
          onClick={() => onNavigateTab('queue')}
          className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-md shadow-slate-200/40 cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {t.liveQueueSnapshot}
            </span>
            <span className="text-xs text-slate-500 group-hover:text-emerald-700 flex items-center gap-0.5 font-semibold">
              <span>{t.viewFullQueue}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">{t.currentPosition}</span>
              <span className="text-xl font-black text-emerald-700 font-mono">
                #{activeBooking.queue_number}
              </span>
            </div>
            <div className="border-x border-slate-200">
              <span className="text-[10px] text-slate-500 font-medium block">{t.farmersAhead}</span>
              <span className="text-xl font-black text-slate-800 font-mono">12</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">{t.estWaitTime}</span>
              <span className="text-xl font-black text-teal-700 font-mono">~45 {getLocalizedUIString('mins', currentLang)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Tiles */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {t.quickActions}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Book Slot */}
          <button
            onClick={() => onNavigateTab('book')}
            className="p-4 rounded-2xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-left transition-all group flex flex-col justify-between shadow-xs"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-5 h-5 font-bold" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                {t.bookSlot}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.reserveTimeDesc}</p>
            </div>
          </button>

          {/* Action 2: Live Queue */}
          <button
            onClick={() => onNavigateTab('queue')}
            className="p-4 rounded-2xl bg-white hover:bg-teal-50/50 border border-slate-200 hover:border-teal-300 text-left transition-all group flex flex-col justify-between shadow-xs"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center border border-teal-200 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 font-bold" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                {t.trackQueue}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.liveTrackerDesc}</p>
            </div>
          </button>

          {/* Action 3: Payment & Receipts */}
          <button
            onClick={() => onNavigateTab('status')}
            className="p-4 rounded-2xl bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-left transition-all group flex flex-col justify-between shadow-xs"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 font-bold" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                {t.statusReceipts}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.dbtStatusDesc}</p>
            </div>
          </button>

          {/* Action 4: Voice Assistant */}
          <button
            onClick={onOpenVoice}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-left transition-all group flex flex-col justify-between shadow-xs"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-emerald-950 text-sm group-hover:text-emerald-700 transition-colors">
                {t.voiceAssistant}
              </h4>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">{t.voiceCmdDesc}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
