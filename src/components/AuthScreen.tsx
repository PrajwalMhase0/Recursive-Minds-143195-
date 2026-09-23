'use client'

import { useState } from 'react'
import { Sprout, Phone, ShieldCheck, ArrowRight, User, Users, CheckCircle2, Sparkles, Building2, Languages, MapPin, Search } from 'lucide-react'
import { Language, LANGUAGES_LIST, translations, getLocalizedUIString } from '@/lib/i18n'
import { APMC_CENTRES_LIST } from '@/components/screens/BookScreen'

export interface LoginPayload {
  role: 'farmer' | 'operator'
  name: string
  phone: string
  address?: string
  procurementCentre?: string
  centreId?: string
}

interface AuthScreenProps {
  currentLang: Language
  onLanguageChange: (lang: Language) => void
  onLogin: (payload: LoginPayload) => void
  initialName?: string
  initialPhone?: string
  initialAddress?: string
  initialOperatorName?: string
  initialOperatorPhone?: string
  initialProcurementCentre?: string
}

export function AuthScreen({ 
  currentLang, 
  onLanguageChange, 
  onLogin,
  initialName = '',
  initialPhone = '',
  initialAddress = '',
  initialOperatorName = 'Suresh Deshmukh',
  initialOperatorPhone = '9822011928',
  initialProcurementCentre = 'APMC-shirur'
}: AuthScreenProps) {
  const t = translations[currentLang]
  const [role, setRole] = useState<'farmer' | 'operator'>('farmer')
  
  // Farmer fields
  const [farmerName, setFarmerName] = useState(initialName)
  const [farmerPhone, setFarmerPhone] = useState(initialPhone)
  const [farmerAddress, setFarmerAddress] = useState(initialAddress || 'Shirur, Pune Dist.')

  // Operator fields
  const [operatorName, setOperatorName] = useState(initialOperatorName)
  const [operatorPhone, setOperatorPhone] = useState(initialOperatorPhone)
  const [selectedCentreId, setSelectedCentreId] = useState(() => {
    const found = APMC_CENTRES_LIST.find((c) => c.name === initialProcurementCentre || c.id === initialProcurementCentre)
    return found ? found.id : APMC_CENTRES_LIST[13]?.id || 'apmc_shirur'
  })

  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'farmer') {
      if (!farmerName.trim()) {
        setErrorMsg(t.enterFarmerName)
        return
      }
      const cleanPhone = farmerPhone.trim().replace(/\D/g, '')
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg(t.enterMobileNumber)
        return
      }
      if (!farmerAddress.trim()) {
        setErrorMsg(getLocalizedUIString('enterValidAddress', currentLang))
        return
      }
      setErrorMsg('')
      onLogin({
        role: 'farmer',
        name: farmerName.trim(),
        phone: cleanPhone,
        address: farmerAddress.trim()
      })
    } else {
      if (!operatorName.trim()) {
        setErrorMsg(getLocalizedUIString('enterValidOperatorName', currentLang))
        return
      }
      const cleanPhone = operatorPhone.trim().replace(/\D/g, '')
      if (!cleanPhone || cleanPhone.length < 10) {
        setErrorMsg(t.enterMobileNumber)
        return
      }
      const centreObj = APMC_CENTRES_LIST.find((c) => c.id === selectedCentreId) || APMC_CENTRES_LIST[0]
      if (!centreObj) {
        setErrorMsg(getLocalizedUIString('enterValidCentre', currentLang))
        return
      }
      setErrorMsg('')
      onLogin({
        role: 'operator',
        name: operatorName.trim(),
        phone: cleanPhone,
        procurementCentre: centreObj.name,
        centreId: centreObj.id
      })
    }
  }

  const handleQuickLoginFarmer = (name: string, phoneNumber: string, address: string) => {
    setRole('farmer')
    setFarmerName(name)
    setFarmerPhone(phoneNumber)
    setFarmerAddress(address)
    setErrorMsg('')
    onLogin({
      role: 'farmer',
      name,
      phone: phoneNumber,
      address
    })
  }

  const handleQuickLoginOperator = (name: string, phoneNumber: string, centreId: string) => {
    setRole('operator')
    setOperatorName(name)
    setOperatorPhone(phoneNumber)
    setSelectedCentreId(centreId)
    setErrorMsg('')
    const centreObj = APMC_CENTRES_LIST.find((c) => c.id === centreId) || APMC_CENTRES_LIST[0]
    onLogin({
      role: 'operator',
      name,
      phone: phoneNumber,
      procurementCentre: centreObj.name,
      centreId: centreObj.id
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-emerald-50/30 flex flex-col justify-between p-4 sm:p-6 text-slate-900">
      {/* Top Bar with Language Selector */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-bold">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
            {t.appName}
          </span>
        </div>

        {/* 16 Languages selector */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-xs rounded-xl px-2.5 py-1">
          <Languages className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[120px] truncate"
            title="Choose Language"
          >
            {LANGUAGES_LIST.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5">
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{getLocalizedUIString('apmcPmkisanVerified', currentLang)}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {getLocalizedUIString('welcomeToKrishiSetu', currentLang)}
            </h1>
            <p className="text-xs text-slate-500">
              {getLocalizedUIString('directLoginSubtitle', currentLang)}
            </p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('farmer')
                setErrorMsg('')
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'farmer'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {getLocalizedUIString('farmerRoleLabel', currentLang)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('operator')
                setErrorMsg('')
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'operator'
                  ? 'bg-white text-amber-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {getLocalizedUIString('operatorRoleLabel', currentLang)}
              </span>
            </button>
          </div>

          {/* Error Message if any */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'farmer' ? (
              <div className="space-y-3.5">
                {/* 1. Name of Farmer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">1</span>
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {t.enterFarmerName}
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                      {getLocalizedUIString('required', currentLang)}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      placeholder={getLocalizedUIString('farmerNamePlaceholder', currentLang)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number (no OTP required) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">2</span>
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {t.mobilePhone}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>
                        {getLocalizedUIString('noOtpRequired', currentLang)}
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={farmerPhone}
                      onChange={(e) => setFarmerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9823145892"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>
                      {getLocalizedUIString('enter10DigitMobile', currentLang)}
                    </span>
                    <span className="text-emerald-700 font-semibold font-mono">
                      {farmerPhone.length}/10
                    </span>
                  </p>
                </div>

                {/* 3. Address of Farmer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold">3</span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {getLocalizedUIString('enterFarmerAddress', currentLang)}
                      </span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                      {getLocalizedUIString('required', currentLang)}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={farmerAddress}
                      onChange={(e) => setFarmerAddress(e.target.value)}
                      placeholder={getLocalizedUIString('farmerAddressPlaceholder', currentLang)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* 1. Name of Operator */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-amber-600 text-white text-[10px] font-bold">1</span>
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {getLocalizedUIString('enterOperatorName', currentLang)}
                      </span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold lowercase">
                      {getLocalizedUIString('required', currentLang)}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      placeholder={getLocalizedUIString('operatorNamePlaceholder', currentLang)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-amber-600 text-white text-[10px] font-bold">2</span>
                      <Phone className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {t.mobilePhone}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <CheckCircle2 className="w-3 h-3 text-amber-600" />
                      <span>
                        {getLocalizedUIString('noOtpRequired', currentLang)}
                      </span>
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={operatorPhone}
                      onChange={(e) => setOperatorPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9822011928"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span>
                      {getLocalizedUIString('enter10DigitMobile', currentLang)}
                    </span>
                    <span className="text-amber-700 font-semibold font-mono">
                      {operatorPhone.length}/10
                    </span>
                  </p>
                </div>

                {/* 3. Procurement Center */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-amber-600 text-white text-[10px] font-bold">3</span>
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {getLocalizedUIString('selectProcurementCentre', currentLang)}
                      </span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold lowercase">
                      {getLocalizedUIString('required', currentLang)}
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCentreId}
                      onChange={(e) => setSelectedCentreId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all cursor-pointer"
                    >
                      {APMC_CENTRES_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.region})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Quick centre chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { id: 'apmc_shirur', label: 'APMC Shirur' },
                      { id: 'apmc_manmad_nashik', label: 'APMC Manmad' },
                      { id: 'apmc_pune', label: 'APMC Pune' },
                      { id: 'apmc_mumbai', label: 'APMC Mumbai' },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setSelectedCentreId(chip.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                          selectedCentreId === chip.id
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Direct Login Button */}
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-95 active:scale-[0.99] ${
                role === 'farmer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-600/20'
              }`}
            >
              <span>
                {role === 'farmer'
                  ? getLocalizedUIString('enterAppDirectly', currentLang)
                  : t.loginAsOperator}
              </span>
              <ArrowRight className="w-4 h-4 font-bold" />
            </button>
          </form>

          {/* Quick Demo Login Helpers */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              {getLocalizedUIString('quickDemoProfiles', currentLang)}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLoginFarmer('Prajwal Mhase', '8010594568', 'Shirur, Pune Dist.')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-bold text-center transition-colors flex flex-col items-center justify-center"
              >
                <span>🌾 Prajwal Mhase</span>
                <span className="text-[9px] text-emerald-700 font-normal">Shirur, Pune</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginFarmer('Ramesh Rao', '9823145892', 'Khed, Pune Dist.')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-[11px] font-semibold text-center transition-colors flex flex-col items-center justify-center"
              >
                <span>🌾 Ramesh Rao</span>
                <span className="text-[9px] text-emerald-700 font-normal">Khed, Pune</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginFarmer('Vedang Rayate', '9975683508', 'Manmad, Nashik Dist.')}
                className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-teal-800 text-[11px] font-semibold text-center transition-colors flex flex-col items-center justify-center"
              >
                <span>🌾 Vedang Rayate</span>
                <span className="text-[9px] text-teal-700 font-normal">Manmad, Nashik</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoginOperator('Suresh Deshmukh', '9822011928', 'apmc_shirur')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 text-[11px] font-semibold text-center transition-colors flex flex-col items-center justify-center"
              >
                <span>🏢 Suresh Deshmukh</span>
                <span className="text-[9px] text-amber-700 font-normal">APMC Shirur</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-slate-500 pb-2">
        <p>{getLocalizedUIString('govtMaharashtra', currentLang)} &bull; APMC Smart Queue System</p>
      </div>
    </div>
  )
}

