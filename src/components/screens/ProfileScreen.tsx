'use client'

import { useState } from 'react'
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  Sprout, 
  Phone, 
  CreditCard, 
  FileCheck2, 
  Languages, 
  Users, 
  Settings,
  Bell,
  Volume2,
  Lock,
  LogOut,
  ChevronRight,
  Check,
  Download,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Language, LANGUAGES_LIST, translations, getLocalizedCropName, getLocalizedUIString, getLocalizedBookingStatus } from '@/lib/i18n'
import { Farmer, Booking } from '@/types/database'

interface ProfileScreenProps {
  farmer: Farmer | null
  activeBooking?: Booking | null
  currentLang: Language
  onLanguageChange: (lang: Language) => void
  onToggleOperatorMode?: () => void
  onLogout: () => void
}

export function ProfileScreen({
  farmer,
  activeBooking,
  currentLang,
  onLanguageChange,
  onToggleOperatorMode,
  onLogout,
}: ProfileScreenProps) {
  const t = translations[currentLang]

  const farmerName = farmer?.name || 'Farmer'
  const farmerIdCode = farmer?.farmer_id_code || 'KS-MH-XXXX'
  const village = farmer?.village || 'Shirur'
  const district = farmer?.district || 'Pune Dist.'
  const crops = farmer?.registered_crops || ['Soybean', 'Cotton', 'Onion']

  // Settings State
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [voiceAutoReadout, setVoiceAutoReadout] = useState(true)
  const [highContrast, setHighContrast] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Profile Header Card - Matches PRD Image 3 Reference */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-lg shadow-slate-100 relative overflow-hidden text-center space-y-4">
        {/* Avatar */}
        <div className="relative mx-auto h-20 w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 p-1 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <div className="h-full w-full rounded-full bg-emerald-50 flex items-center justify-center">
            <User className="w-10 h-10 text-emerald-700" />
          </div>
          <span className="absolute bottom-0 right-0 p-1 bg-emerald-600 rounded-full text-white border-2 border-white shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 font-bold" />
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">{farmerName}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="font-mono text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              {farmerIdCode}
            </span>
            <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {village}, {district}
            </span>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>{t.verifiedFarmer}</span>
          </div>
          <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center gap-1.5 text-teal-800 font-bold">
            <FileCheck2 className="w-4 h-4 text-teal-700" />
            <span>{getLocalizedUIString('pmKisanActive', currentLang)}</span>
          </div>
        </div>
      </div>

      {/* ACTIVE SLOT DETAILS CARD (Updated via Missed-Slot Recovery) */}
      {activeBooking && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-300 shadow-md shadow-emerald-900/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  {t.activeSlotDetails}
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {getLocalizedCropName(activeBooking.crop, currentLang)} &bull; {activeBooking.approx_quantity_quintals} {t.quintals}
                </h3>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {getLocalizedBookingStatus(activeBooking.status, currentLang)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-2xl bg-white border border-emerald-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.dateLabel}
              </span>
              <span className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {activeBooking.slot_date}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white border border-emerald-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.timeSlotLabel}
              </span>
              <span className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                {activeBooking.slot_time}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/80 border border-emerald-200 text-xs flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate font-semibold">
              {activeBooking.procurement_centre?.name || 'APMC Procurement Centre'}
            </span>
          </div>
        </div>
      )}

      {/* Registered Crops List */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.registeredProduce}</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {crops.map((crop) => (
            <span
              key={crop}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold"
            >
              🌾 {getLocalizedCropName(crop, currentLang)}
            </span>
          ))}
        </div>
      </div>

      {/* Identification & Mandi Details */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3.5 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
          {t.identityDetails}
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.mobilePhone}</span>
            </span>
            <span className="text-slate-900 font-mono font-bold">
              +91 {farmer?.phone ? farmer.phone.replace(/(\d{5})(\d{5})/, '$1 $2') : '98231 45892'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.aadhaarLink}</span>
            </span>
            <span className="text-slate-900 font-mono font-bold">XXXX XXXX 8492</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.preferredCentre}</span>
            </span>
            <span className="text-slate-900 font-bold">Krishi Mandi - Shirur</span>
          </div>
        </div>
      </div>

      {/* NEW: Settings Menu Section (Requirement 3) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {t.appSettings}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Setting 1: SMS Notifications */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-800 block">
                  {t.smsAlerts}
                </span>
                <span className="text-[11px] text-slate-500">{t.receiveSmsDesc}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSmsAlerts(!smsAlerts)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                smsAlerts ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Setting 2: Voice Audio Feedback */}
          <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-teal-600" />
              <div>
                <span className="font-bold text-slate-800 block">
                  {t.voiceAudioHelp}
                </span>
                <span className="text-[11px] text-slate-500">{t.voiceAudioDesc}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVoiceAutoReadout(!voiceAutoReadout)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                voiceAutoReadout ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Setting 3: Language Preference */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <span className="text-slate-700 font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-emerald-600" />
                <span>{t.changeLanguage}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {LANGUAGES_LIST.length} {getLocalizedUIString('languagesAvailable', currentLang)}
              </span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {LANGUAGES_LIST.map((lang) => {
                const isSelected = currentLang === lang.id
                return (
                  <button
                    key={lang.id}
                    onClick={() => onLanguageChange(lang.id)}
                    className={`py-2 px-2.5 rounded-xl text-left border transition-all flex flex-col justify-center ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {lang.nativeName}
                    </span>
                    <span className={`text-[10px] leading-tight ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {lang.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Download Android APK Card */}
      <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Android APK ({getLocalizedUIString('mobileApp', currentLang)})
              </h3>
              <p className="text-[11px] text-emerald-800 font-medium">
                {getLocalizedUIString('installOnPhone', currentLang)} &bull; 11.9 MB
              </p>
            </div>
          </div>
          <a
            href="/KrishiSetu.apk"
            download="KrishiSetu.apk"
            className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            {getLocalizedUIString('download', currentLang)}
          </a>
        </div>
      </div>

      {/* Sign Out / Switch Account Action */}
      <div className="pt-1">
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>
            {t.switchAccount}
          </span>
        </button>
      </div>
    </div>
  )
}
