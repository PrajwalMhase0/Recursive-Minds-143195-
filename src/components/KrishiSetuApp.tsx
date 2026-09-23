'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { Farmer, ProcurementCentre, Booking, NotificationLog } from '@/types/database'
import { Header } from '@/components/Header'
import { Navigation, TabType } from '@/components/Navigation'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { BookScreen } from '@/components/screens/BookScreen'
import { QueueScreen } from '@/components/screens/QueueScreen'
import { StatusScreen } from '@/components/screens/StatusScreen'
import { ProfileScreen } from '@/components/screens/ProfileScreen'
import { OperatorDashboard } from '@/components/OperatorDashboard'
import { OperatorWalkInBooking } from '@/components/screens/OperatorWalkInBooking'
import { OperatorSlotDistribution } from '@/components/screens/OperatorSlotDistribution'
import { OperatorProfileScreen } from '@/components/screens/OperatorProfileScreen'
import { OperatorNavigation, OperatorTabType } from '@/components/OperatorNavigation'
import { SmsModal } from '@/components/SmsModal'
import { VoiceAssistantModal } from '@/components/VoiceAssistantModal'
import { KrishiChatbotModal } from '@/components/KrishiChatbotModal'
import { AuthScreen, LoginPayload } from '@/components/AuthScreen'
import { Language, getLocalizedUIString } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { checkInFarmer, getFarmerBookings, getCentreQueue, getNotifications, getOrCreateFarmer } from '@/lib/actions'
import { Smartphone, Monitor, Download, Bot, Sparkles, BellRing, X } from 'lucide-react'

interface KrishiSetuAppProps {
  initialFarmer: Farmer | null
  initialCentres: ProcurementCentre[]
  initialBookings: Booking[]
  initialCentreQueue: Booking[]
  initialNotifications: NotificationLog[]
}

export function KrishiSetuApp({
  initialFarmer,
  initialCentres,
  initialBookings,
  initialCentreQueue,
  initialNotifications,
}: KrishiSetuAppProps) {
  // First-time open login option for farmer and operator using mobile number without OTP
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'farmer' | 'operator'>('farmer')
  const [operatorInfo, setOperatorInfo] = useState<{
    name: string
    phone: string
    operatorId: string
    procurementCentre: string
    centreId: string
  }>({
    name: 'Suresh Deshmukh',
    phone: '9822011928',
    operatorId: 'OP-MH-501',
    procurementCentre: 'APMC-shirur',
    centreId: 'apmc_shirur'
  })

  // Farmer state dynamically updated from login or initial props
  const [currentFarmer, setCurrentFarmer] = useState<Farmer>(() => {
    return (
      initialFarmer || {
        id: 'farmer_ramesh',
        farmer_id_code: 'KS-MH-8492',
        name: 'Ramesh Rao',
        phone: '9823145892',
        village: 'Shirur',
        district: 'Pune Dist.',
        state: 'Maharashtra',
        registered_crops: ['Soybean', 'Cotton', 'Onion', 'Wheat'],
        preferred_centre_id: 'mandi_shirur',
        verified: true,
        aadhaar_last4: '8492',
      }
    )
  })

  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [operatorTab, setOperatorTab] = useState<OperatorTabType>('queue')
  const [currentMode, setCurrentMode] = useState<'farmer' | 'operator'>('farmer')
  const [currentLang, setCurrentLang] = useState<Language>('mr')
  const [isPhoneFrame, setIsPhoneFrame] = useState(true)

  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang)
    try {
      localStorage.setItem('krishisetu_language', lang)
    } catch {}
  }

  const [bookings, setBookings] = useState<Booking[]>([])
  const [centreQueue, setCentreQueue] = useState<Booking[]>(initialCentreQueue)
  const [notifications, setNotifications] = useState<NotificationLog[]>(initialNotifications)
  const [isSmsOpen, setIsSmsOpen] = useState(false)
  const [isVoiceOpen, setIsVoiceOpen] = useState(false)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [preselectedCrop, setPreselectedCrop] = useState<string>('')
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])

  // Deduplicate empty slot notifications: Ensure only ONE alert per specific day is shown, not many
  const deduplicatedNotifications = useMemo(() => {
    const seenEmptyDates = new Set<string>()
    return notifications.filter((n) => {
      if (n.message && n.message.includes('EMPTY')) {
        const match = n.message.match(/on ([^!]+)!/)
        const dateKey = match ? match[1].trim().toLowerCase() : 'today'
        if (seenEmptyDates.has(dateKey)) {
          return false // Drop duplicate empty slot alerts for the same day
        }
        seenEmptyDates.add(dateKey)
      }
      return true
    })
  }, [notifications])

  const [isPending, startTransition] = useTransition()

  // Restore saved login, language & credentials from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('krishisetu_language') as Language | null
      if (savedLang) {
        setCurrentLang(savedLang)
      }
      const savedRole = localStorage.getItem('krishisetu_user_role') as 'farmer' | 'operator' | null
      if (savedRole) {
        setUserRole(savedRole)
        setCurrentMode(savedRole)
      }

      const savedOpName = localStorage.getItem('krishisetu_operator_name')
      const savedOpPhone = localStorage.getItem('krishisetu_operator_phone')
      const savedOpId = localStorage.getItem('krishisetu_operator_id')
      const savedOpCentre = localStorage.getItem('krishisetu_operator_centre')
      const savedOpCentreId = localStorage.getItem('krishisetu_operator_centre_id')
      if (savedOpName || savedOpPhone || savedOpCentre || savedOpId) {
        setOperatorInfo({
          name: savedOpName || 'Suresh Deshmukh',
          phone: savedOpPhone || '9822011928',
          operatorId: savedOpId || 'OP-MH-501',
          procurementCentre: savedOpCentre || 'APMC-shirur',
          centreId: savedOpCentreId || 'apmc_shirur'
        })
      }

      const savedName = localStorage.getItem('krishisetu_farmer_name')
      const savedPhone = localStorage.getItem('krishisetu_farmer_phone')
      const savedId = localStorage.getItem('krishisetu_farmer_id')
      const savedAddress = localStorage.getItem('krishisetu_farmer_address')
      const savedLoggedIn = localStorage.getItem('krishisetu_is_logged_in')

      if (savedLoggedIn === 'true' && (savedName || savedId || savedRole === 'operator')) {
        setIsLoggedIn(true)
        if (savedRole !== 'operator') {
          getOrCreateFarmer(savedName || '', savedPhone || '', savedAddress || '')
            .then(async (farmer) => {
              if (farmer) {
                setCurrentFarmer(farmer)
                const [fBookings, fNotes] = await Promise.all([
                  getFarmerBookings(farmer.id),
                  getNotifications(farmer.id),
                ])
                setBookings(fBookings)
                setNotifications(fNotes)
              }
            })
            .catch(console.error)
        }
      } else {
        setIsLoggedIn(false)
        setBookings([])
      }
    } catch {
      // LocalStorage unavailable
    }
  }, [])

  // Active booking for current farmer (strictly from current farmer's bookings)
  const activeBooking =
    bookings.find((b) => ['AT_COUNTER', 'IN_QUEUE', 'BOOKED'].includes(b.status)) ||
    bookings.find((b) => b.status === 'PROCURED') ||
    null

  const reloadData = async () => {
    if (!currentFarmer?.id) return
    startTransition(async () => {
      const [updatedBookings, updatedQueue, updatedNotes] = await Promise.all([
        getFarmerBookings(currentFarmer.id),
        getCentreQueue('all'),
        getNotifications(currentFarmer.id),
      ])
      setBookings(updatedBookings)
      setCentreQueue(updatedQueue)
      setNotifications(updatedNotes)
    })
  }

  // Subscribe to Supabase Realtime changes
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('krishisetu-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          reloadData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications_log' },
        () => {
          reloadData()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'procurements' },
        () => {
          reloadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentFarmer])

  const handleCheckIn = async (bookingId: string) => {
    await checkInFarmer(bookingId)
    await reloadData()
    setActiveTab('queue')
  }

  const handleLogin = async (payload: LoginPayload) => {
    const { role, name, phone, address, procurementCentre, centreId } = payload
    setUserRole(role)
    setCurrentMode(role)

    try {
      localStorage.setItem('krishisetu_user_role', role)
      localStorage.setItem('krishisetu_is_logged_in', 'true')
    } catch {}

    if (role === 'farmer' && name) {
      const cleanPhone = phone.replace(/\D/g, '')
      const targetName = name.trim()

      // Immediately clear prior bookings to avoid showing another user's data
      setBookings([])
      setNotifications([])

      try {
        const persisted = await getOrCreateFarmer(targetName, cleanPhone, address || '')
        if (persisted) {
          setCurrentFarmer(persisted)
          try {
            localStorage.setItem('krishisetu_farmer_id', persisted.id)
            localStorage.setItem('krishisetu_farmer_name', persisted.name)
            localStorage.setItem('krishisetu_farmer_phone', cleanPhone)
            if (address) {
              localStorage.setItem('krishisetu_farmer_address', address)
            }
          } catch {}

          const [userBookings, userNotes, qBookings] = await Promise.all([
            getFarmerBookings(persisted.id),
            getNotifications(persisted.id),
            getCentreQueue('all'),
          ])
          setBookings(userBookings)
          setNotifications(userNotes)
          setCentreQueue(qBookings)
        }
      } catch (err) {
        console.error('Error in handleLogin:', err)
      }
    } else if (role === 'operator') {
      const newOp = {
        name: name.trim() || 'Suresh Deshmukh',
        phone: phone.trim() || '9822011928',
        operatorId: payload.operatorId?.trim().toUpperCase() || 'OP-MH-501',
        procurementCentre: procurementCentre || 'APMC-shirur',
        centreId: centreId || 'apmc_shirur'
      }
      setOperatorInfo(newOp)
      try {
        localStorage.setItem('krishisetu_operator_name', newOp.name)
        localStorage.setItem('krishisetu_operator_phone', newOp.phone)
        localStorage.setItem('krishisetu_operator_id', newOp.operatorId)
        localStorage.setItem('krishisetu_operator_centre', newOp.procurementCentre)
        localStorage.setItem('krishisetu_operator_centre_id', newOp.centreId)
      } catch {}
    }
    setIsLoggedIn(true)
    setActiveTab('home')
    setOperatorTab('queue')
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('krishisetu_is_logged_in')
      localStorage.removeItem('krishisetu_user_role')
      localStorage.removeItem('krishisetu_farmer_name')
      localStorage.removeItem('krishisetu_farmer_phone')
      localStorage.removeItem('krishisetu_farmer_id')
      localStorage.removeItem('krishisetu_farmer_address')
      localStorage.removeItem('krishisetu_operator_name')
      localStorage.removeItem('krishisetu_operator_phone')
      localStorage.removeItem('krishisetu_operator_id')
      localStorage.removeItem('krishisetu_operator_centre')
      localStorage.removeItem('krishisetu_operator_centre_id')
    } catch {}
    setBookings([])
    setNotifications([])
    setIsLoggedIn(false)
    setActiveTab('home')
    setOperatorTab('queue')
  }

  // If not logged in, render the login screen
  if (!isLoggedIn) {
    return (
      <AuthScreen
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onLogin={handleLogin}
        initialName={currentFarmer.name}
        initialPhone={currentFarmer.phone}
        initialAddress={currentFarmer.village ? `${currentFarmer.village}, ${currentFarmer.district}` : 'Shirur, Pune Dist.'}
        initialOperatorName={operatorInfo.name}
        initialOperatorPhone={operatorInfo.phone}
        initialOperatorId={operatorInfo.operatorId}
        initialProcurementCentre={operatorInfo.procurementCentre}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col items-center justify-start selection:bg-emerald-500 selection:text-white">
      {/* Desktop Helper Bar */}
      <div className="hidden lg:flex w-full max-w-4xl py-2 px-6 items-center justify-between text-xs text-slate-600 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {getLocalizedUIString('supabaseCloudConnected', currentLang)}
          </span>
          <span>&bull;</span>
          <span className="font-medium">{getLocalizedUIString('krishiSetuMobile', currentLang)}</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/KrishiSetu.apk"
            download="KrishiSetu.apk"
            className="px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs mr-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{getLocalizedUIString('downloadApk', currentLang)}</span>
          </a>
          <span className="font-medium">{getLocalizedUIString('displayMode', currentLang)}:</span>
          <button
            onClick={() => setIsPhoneFrame(true)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
              isPhoneFrame
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{getLocalizedUIString('mobileRecommended', currentLang)}</span>
          </button>
          <button
            onClick={() => setIsPhoneFrame(false)}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-all ${
              !isPhoneFrame
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{getLocalizedUIString('fullWidth', currentLang)}</span>
          </button>
        </div>
      </div>

      {/* Main Container / Mobile Mockup Frame */}
      <div
        className={`w-full transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-md my-0 sm:my-6 rounded-none sm:rounded-[2.5rem] border-0 sm:border sm:border-slate-200/90 bg-white shadow-2xl shadow-slate-300/60 overflow-hidden relative min-h-screen sm:min-h-[850px]'
            : 'max-w-4xl px-4 py-4'
        }`}
      >
        {/* Top Header */}
        <Header
          currentLang={currentLang}
          onLanguageChange={handleLanguageChange}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          unreadSmsCount={deduplicatedNotifications.length}
          onOpenSms={() => setIsSmsOpen(true)}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />

        {/* Global Real-Time Empty Slot Broadcast Banner - Only ONE alert for the specific day */}
        {(() => {
          const todayFormatted = new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          }).toLowerCase()

          // Show only ONE alert for the specific day (preferring today or latest active date), not many
          const emptySlotAlert = deduplicatedNotifications.find(
            (n) => n.message && n.message.includes('EMPTY') &&
              n.message.toLowerCase().includes(todayFormatted) &&
              !dismissedNotificationIds.includes(n.id)
          ) || deduplicatedNotifications.find(
            (n) => n.message && n.message.includes('EMPTY') && !dismissedNotificationIds.includes(n.id)
          )
          if (!emptySlotAlert) return null

          return (
            <div className="px-4 pt-2.5">
              <div 
                onClick={() => {
                  setCurrentMode('farmer')
                  setActiveTab('book')
                }}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-emerald-700/15 cursor-pointer hover:brightness-105 transition-all group animate-in slide-in-from-top-2"
              >
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  <BellRing className="w-4 h-4 text-emerald-200 animate-bounce shrink-0" />
                  <span className="truncate font-medium">
                    {emptySlotAlert.message}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] bg-white text-emerald-800 px-2.5 py-1 rounded-xl font-black group-hover:scale-105 transition-transform shadow-xs">
                    {getLocalizedUIString('bookNow', currentLang)} →
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDismissedNotificationIds((prev) => [...prev, emptySlotAlert.id])
                    }}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all ml-0.5"
                    title={getLocalizedUIString('dismiss', currentLang)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Content Area */}
        <main className="px-4 pt-4 pb-20 overflow-y-auto bg-slate-50/50">
          {currentMode === 'operator' ? (
            <>
              {operatorTab === 'queue' && (
                <OperatorDashboard
                  queueBookings={centreQueue}
                  onRefresh={reloadData}
                  currentLang={currentLang}
                />
              )}

              {operatorTab === 'book' && (
                <OperatorWalkInBooking
                  centres={initialCentres}
                  currentLang={currentLang}
                  onBookingSuccess={() => {
                    reloadData()
                    setOperatorTab('queue')
                  }}
                />
              )}

              {operatorTab === 'distribute' && (
                <OperatorSlotDistribution
                  centres={initialCentres}
                  currentLang={currentLang}
                />
              )}

              {operatorTab === 'profile' && (
                <OperatorProfileScreen
                  currentLang={currentLang}
                  onLanguageChange={handleLanguageChange}
                  onLogout={handleLogout}
                  operatorInfo={operatorInfo}
                />
              )}
            </>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeScreen
                  farmer={currentFarmer}
                  activeBooking={activeBooking}
                  currentLang={currentLang}
                  onNavigateTab={setActiveTab}
                  onOpenVoice={() => setIsVoiceOpen(true)}
                  onCheckIn={handleCheckIn}
                />
              )}

              {activeTab === 'book' && (
                <BookScreen
                  farmer={currentFarmer}
                  centres={initialCentres}
                  currentLang={currentLang}
                  preselectedCrop={preselectedCrop}
                  onBookingSuccess={() => {
                    reloadData()
                    setActiveTab('queue')
                  }}
                />
              )}

              {activeTab === 'queue' && (
                <QueueScreen
                  activeBooking={activeBooking}
                  currentLang={currentLang}
                  onRefresh={reloadData}
                  centres={initialCentres}
                  onNavigateTab={setActiveTab}
                  onCheckIn={handleCheckIn}
                />
              )}

              {activeTab === 'status' && (
                <StatusScreen
                  bookings={bookings}
                  currentLang={currentLang}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileScreen
                  farmer={currentFarmer}
                  activeBooking={activeBooking}
                  currentLang={currentLang}
                  onLanguageChange={handleLanguageChange}
                  onLogout={handleLogout}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation */}
        {currentMode === 'farmer' ? (
          <Navigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentLang={currentLang}
            queueCount={activeBooking?.queue_number || undefined}
          />
        ) : (
          <OperatorNavigation
            activeTab={operatorTab}
            onTabChange={setOperatorTab}
            currentLang={currentLang}
            queueCount={centreQueue.length || undefined}
          />
        )}
      </div>

      {/* Floating 1-on-1 KrishiSetu AI Chatbot Launcher */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        title="Open KrishiSetu AI Research & Mandi Rates"
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white font-bold shadow-xl shadow-emerald-900/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/50 group animate-in fade-in"
      >
        <div className="relative flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
          <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="text-xs tracking-tight font-black flex items-center gap-1">
          <span>{getLocalizedUIString('krishiAiResearch', currentLang)}</span>
          <span className="text-[10px] text-emerald-200 hidden sm:inline">&bull; Gemini 3.6</span>
        </span>
      </button>

      {/* Modals */}
      <SmsModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        notifications={deduplicatedNotifications}
        farmerPhone={currentFarmer.phone}
        currentLang={currentLang}
      />

      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        currentLang={currentLang}
        activeBooking={activeBooking}
        onNavigateTab={(tab) => {
          setCurrentMode('farmer')
          setActiveTab(tab)
        }}
        onPreselectCrop={(crop) => {
          setPreselectedCrop(crop)
        }}
      />

      <KrishiChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        currentLang={currentLang}
      />
    </div>
  )
}
