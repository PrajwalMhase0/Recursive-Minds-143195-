'use client'

import { 
  Building2, 
  ShieldCheck, 
  Languages, 
  Download, 
  LogOut, 
  Scale, 
  Users, 
  CheckCircle2, 
  FileCheck2,
  Phone
} from 'lucide-react'
import { Language, LANGUAGES_LIST, translations, getLocalizedUIString } from '@/lib/i18n'

interface OperatorInfo {
  name: string
  phone: string
  operatorId?: string
  procurementCentre: string
  centreId?: string
}

interface OperatorProfileScreenProps {
  currentLang: Language
  onLanguageChange: (lang: Language) => void
  onLogout: () => void
  operatorInfo?: OperatorInfo
}

export function OperatorProfileScreen({
  currentLang,
  onLanguageChange,
  onLogout,
  operatorInfo = {
    name: 'Suresh Deshmukh',
    phone: '9822011928',
    operatorId: 'OP-MH-501',
    procurementCentre: 'APMC-shirur'
  }
}: OperatorProfileScreenProps) {
  const t = translations[currentLang]
  const opName = operatorInfo.name || 'Suresh Deshmukh'
  const opPhone = operatorInfo.phone ? (operatorInfo.phone.startsWith('+91') ? operatorInfo.phone : `+91 ${operatorInfo.phone}`) : '+91 98220 11928'
  const opCentre = operatorInfo.procurementCentre || 'APMC-shirur'
  const opId = operatorInfo.operatorId || 'OP-MH-501'

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Operator Identity Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl shadow-amber-900/15 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full inline-block">
              {currentLang === 'mr' ? 'शासकीय बाजार समिती ऑपरेटर' : currentLang === 'hi' ? 'शासकीय मंडी ऑपरेटर' : 'Authorized APMC Operator'}
            </span>
            <h2 className="text-xl font-black tracking-tight">
              {opName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-amber-100 font-medium">
              <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md text-[11px] tracking-wide">
                {opId}
              </span>
              <span>&bull;</span>
              <span className="truncate max-w-[200px]">{opCentre}</span>
            </div>
          </div>

          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-xs">
            <Users className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Verification Pill */}
        <div className="pt-2 border-t border-white/20 flex items-center justify-between text-xs relative z-10">
          <span className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Certified Weighbridge Officer</span>
          </span>
          <span className="text-[10px] font-medium bg-white/15 px-2 py-0.5 rounded-full">
            Govt. APMC Desk
          </span>
        </div>
      </div>

      {/* Operator Permissions & Roles Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
          <span>{currentLang === 'mr' ? 'ऑपरेटर अधिकार व जबाबदाऱ्या' : currentLang === 'hi' ? 'ऑपरेटर अधिकार एवं कार्य' : 'Operator Access & Privileges'}</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gate Check-in</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Issue spot tokens for walk-in farmers & verify registered arrivals.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Weigh & Grade</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Calibrated electronic weighbridge scale recording & Grade A/B/C assignment.
            </p>
          </div>
        </div>
      </div>

      {/* Station & Mandi Details */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
          {t.identityDetails}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Operator Verified ID:</span>
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {opId}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">APMC Centre:</span>
            <span className="font-bold text-slate-900 text-right max-w-[220px] truncate">{opCentre}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">District & State:</span>
            <span className="font-bold text-slate-900">Maharashtra APMC Desk</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Designation:</span>
            <span className="font-bold text-emerald-700">Mandi Gate & Weighbridge Incharge</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-500 font-medium">Support Contact:</span>
            <span className="font-bold text-slate-900 flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-slate-400" />
              {opPhone}
            </span>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {t.changeLanguage}
          </h3>
        </div>

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

      {/* Sign Out / Exit Console */}
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
