'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle2, 
  Volume2, 
  AlertTriangle, 
  RefreshCw,
  CalendarPlus,
  Navigation,
  Compass,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedUIString, getLocalizedQueueStepDesc } from '@/lib/i18n'
import { Booking, ProcurementCentre } from '@/types/database'
import { speakText } from '@/lib/speech'
import { TabType } from '@/components/Navigation'
import { 
  calculateTransitEstimate, 
  getStoredUserCoordinates, 
  requestBrowserCoordinates, 
  UserCoordinates, 
  TransitEstimate 
} from '@/lib/locationService'

interface QueueScreenProps {
  activeBooking: Booking | null
  currentLang: Language
  onRefresh: () => void
  centres?: ProcurementCentre[]
  onNavigateTab?: (tab: TabType) => void
  onCheckIn?: (bookingId: string) => void
}

export function QueueScreen({ 
  activeBooking, 
  currentLang, 
  onRefresh, 
  centres = [],
  onNavigateTab,
  onCheckIn 
}: QueueScreenProps) {
  const t = translations[currentLang]

  // Location & Transit state
  const [userCoords, setUserCoords] = useState<UserCoordinates | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Initialize cached location or check permissions
  useEffect(() => {
    const cached = getStoredUserCoordinates()
    if (cached) {
      setUserCoords(cached)
    } else if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        ?.query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            requestBrowserCoordinates()
              .then(setUserCoords)
              .catch(() => {})
          }
        })
        .catch(() => {})
    }
  }, [])

  // Identify destination procurement centre
  const targetCentre = useMemo(() => {
    if (activeBooking?.procurement_centre) return activeBooking.procurement_centre
    if (activeBooking?.centre_id && centres.length > 0) {
      const found = centres.find((c) => c.id === activeBooking.centre_id)
      if (found) return found
    }
    if (centres.length > 0) return centres[0]
    return null
  }, [activeBooking, centres])

  // Request browser location
  const handleEnableLocation = useCallback(async () => {
    setIsLocating(true)
    setLocationError(null)
    try {
      const coords = await requestBrowserCoordinates()
      setUserCoords(coords)
    } catch (err: unknown) {
      console.error('Location detection failed:', err)
      setLocationError(getLocalizedUIString('locationPermissionDenied', currentLang))
    } finally {
      setIsLocating(false)
    }
  }, [currentLang])

  // Calculate live road distance & travel times
  const transitEstimate: TransitEstimate | null = useMemo(() => {
    if (!userCoords || !targetCentre || !targetCentre.latitude || !targetCentre.longitude) {
      return null
    }
    return calculateTransitEstimate(
      userCoords.latitude,
      userCoords.longitude,
      targetCentre.latitude,
      targetCentre.longitude,
      activeBooking?.slot_time
    )
  }, [userCoords, targetCentre, activeBooking?.slot_time])

  const queueNumber = activeBooking?.queue_number
  const isBookedOnly = activeBooking?.status === 'BOOKED'
  const isCheckedInOrMore = Boolean(
    activeBooking &&
    ['IN_QUEUE', 'AT_COUNTER', 'GRADED', 'PROCURED', 'COMPLETED'].includes(activeBooking.status)
  )
  const isAtCounterOrMore = Boolean(
    activeBooking &&
    ['AT_COUNTER', 'GRADED', 'PROCURED', 'COMPLETED'].includes(activeBooking.status)
  )
  const isProcuredOrMore = Boolean(
    activeBooking &&
    ['PROCURED', 'COMPLETED'].includes(activeBooking.status)
  )
  const isCompleted = activeBooking?.status === 'COMPLETED'

  const farmersAhead = activeBooking?.status === 'AT_COUNTER' ? 0 : isCheckedInOrMore ? 12 : 0
  const estWaitMins = activeBooking?.status === 'AT_COUNTER' ? 5 : isCheckedInOrMore ? 45 : 0
  const isApproaching = Boolean(
    activeBooking &&
    !isBookedOnly &&
    (farmersAhead <= 3 || activeBooking.status === 'AT_COUNTER')
  )

  const handleSpeakStatus = () => {
    let textToSpeak = ''

    if (!activeBooking) {
      textToSpeak = getLocalizedUIString('noSlotBookedLifecycleExplanation', currentLang)
    } else if (isBookedOnly) {
      const cropName = getLocalizedCropName(activeBooking.crop, currentLang)
      textToSpeak = `${cropName}: ${getLocalizedUIString('gateCheckinPrompt', currentLang)} (${activeBooking.slot_time}).`
    } else {
      textToSpeak = `${t.appName}: ${t.currentPosition} #${queueNumber || '--'}. ${t.farmersAhead}: ${farmersAhead}. ${t.estWaitTime}: ${estWaitMins} ${getLocalizedUIString('mins', currentLang)}.`
    }

    // Voice announcement with distance and travel time
    if (transitEstimate) {
      if (currentLang === 'mr') {
        textToSpeak += ` खरेदी केंद्राचे अंतर ${transitEstimate.roadDistanceKm} किलोमीटर आहे, ट्रॅक्टर प्रवासाचा वेळ अंदाजे ${transitEstimate.tractorMinutes} मिनिटे आहे.`
      } else if (currentLang === 'hi') {
        textToSpeak += ` खरीद केंद्र की दूरी ${transitEstimate.roadDistanceKm} किलोमीटर है, ट्रैक्टर यात्रा का समय लगभग ${transitEstimate.tractorMinutes} मिनट है.`
      } else {
        textToSpeak += ` Distance to centre is ${transitEstimate.roadDistanceKm} kilometers, estimated transit time is ${transitEstimate.tractorMinutes} minutes.`
      }

      if (transitEstimate.recommendedDepartureTime) {
        if (currentLang === 'mr') {
          textToSpeak += ` वेळेत पोहोचण्यासाठी अंदाजे ${transitEstimate.recommendedDepartureTime} वाजता घरून निघा.`
        } else if (currentLang === 'hi') {
          textToSpeak += ` समय पर पहुंचने के लिए लगभग ${transitEstimate.recommendedDepartureTime} बजे घर से निकलें.`
        } else {
          textToSpeak += ` Recommended departure time is ${transitEstimate.recommendedDepartureTime}.`
        }
      }
    }

    speakText(textToSpeak, currentLang)
  }

  // Stepper state - purely reactive to actual status
  const steps = [
    {
      id: 'checked_in' as const,
      title: t.stepCheckedIn,
      desc: getLocalizedQueueStepDesc('checked_in', currentLang),
      isDone: isCheckedInOrMore,
      isActive: false,
    },
    {
      id: 'in_queue' as const,
      title: t.stepWaiting,
      desc: getLocalizedQueueStepDesc('in_queue', currentLang),
      isDone: isAtCounterOrMore,
      isActive: activeBooking?.status === 'IN_QUEUE',
    },
    {
      id: 'at_counter' as const,
      title: t.stepAtCounter,
      desc: getLocalizedQueueStepDesc('at_counter', currentLang),
      isDone: isProcuredOrMore,
      isActive: activeBooking?.status === 'AT_COUNTER' || activeBooking?.status === 'GRADED',
    },
    {
      id: 'procured' as const,
      title: t.stepCompleted,
      desc: getLocalizedQueueStepDesc('procured', currentLang),
      isDone: isCompleted,
      isActive: activeBooking?.status === 'PROCURED' || activeBooking?.status === 'PAYMENT_INITIATED',
    },
  ]

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Screen Title & Live Sync Badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.trackQueue}</h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {getLocalizedUIString('realtimeSync', currentLang)} &bull; {targetCentre?.name || 'APMC Procurement Centre'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSpeakStatus}
            className="p-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-all flex items-center gap-1 text-xs font-bold shadow-xs"
            title="Listen in regional audio"
          >
            <Volume2 className="w-4 h-4 text-emerald-700" />
            <span className="text-[11px]">{getLocalizedUIString('listenAudio', currentLang)}</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Proximity Alert Banner (if approaching turn) */}
      {isApproaching && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-md shadow-amber-900/5 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-amber-900">{t.proximityAlert}</h4>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {t.proximityAlertDesc}
            </p>
          </div>
        </div>
      )}

      {/* Main Queue Position / Token Card */}
      {activeBooking ? (
        isBookedOnly ? (
          /* Booked but not checked in yet */
          <div className="p-6 rounded-3xl bg-white border border-blue-200 shadow-xl shadow-blue-900/5 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-700 block">
                {t.upcomingSlot}
              </span>
              <div className="text-4xl font-black tracking-tight text-slate-900 font-mono flex items-center justify-center gap-1">
                <span className="text-blue-600">{activeBooking.booking_code}</span>
              </div>
              <span className="text-xs text-slate-600 font-medium block">
                {getLocalizedCropName(activeBooking.crop, currentLang)} &bull; {activeBooking.approx_quantity_quintals} {t.quintals}
              </span>
              <span className="text-[11px] text-slate-500 font-mono block">
                {activeBooking.slot_date} &bull; {activeBooking.slot_time}
              </span>
            </div>

            <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{getLocalizedUIString('assignedCentre', currentLang)}: {targetCentre?.name || 'APMC Procurement Centre'}</span>
            </div>
          </div>
        ) : (
          /* Checked in and in active queue */
          <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-xl shadow-emerald-900/5 text-center space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 block">
                {t.currentPosition}
              </span>
              <div className="text-6xl font-black tracking-tight text-slate-900 font-mono flex items-center justify-center gap-1">
                <span className="text-emerald-600 text-4xl font-bold">#</span>
                <span>{activeBooking.queue_number || '--'}</span>
              </div>
              <span className="text-xs text-slate-500 font-mono font-medium block">
                Token: {activeBooking.booking_code} &bull; {getLocalizedCropName(activeBooking.crop, currentLang)} ({activeBooking.approx_quantity_quintals} {t.quintals})
              </span>
            </div>

            {/* Counter stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mb-1 font-semibold">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.farmersAhead}</span>
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono">{farmersAhead}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 text-xs mb-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t.estWaitTime}</span>
                </div>
                <span className="text-2xl font-black text-teal-700 font-mono">
                  ~{estWaitMins} <span className="text-xs font-normal text-slate-500">{getLocalizedUIString('mins', currentLang)}</span>
                </span>
              </div>
            </div>

            <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{getLocalizedUIString('assignedCentre', currentLang)}: {targetCentre?.name || 'APMC Procurement Centre'}</span>
            </div>
          </div>
        )
      ) : (
        /* No active slot booked */
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            {t.noActiveToken}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {getLocalizedUIString('emptyQueueDesc', currentLang)}
          </p>
          {onNavigateTab && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateTab('book')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{t.bookSlot} &rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Distance, Travel Time & Route Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-lg shadow-slate-200/40 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-900">
                  {getLocalizedUIString('gpsLocationLive', currentLang)}
                </h4>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[210px] block">
                {targetCentre?.name || 'Mandi Centre'}
              </span>
            </div>
          </div>

          {userCoords ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{getLocalizedUIString('gpsActive', currentLang)}</span>
            </span>
          ) : (
            <button
              onClick={handleEnableLocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{getLocalizedUIString('detectingLocation', currentLang)}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{getLocalizedUIString('enableGps', currentLang)}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Coords Active State: Display Distance & Transit Durations */}
        {transitEstimate ? (
          <div className="space-y-3.5">
            {/* 2 Main Metric Highlights: Distance & Travel Time */}
            <div className="grid grid-cols-2 gap-3">
              {/* Road Distance */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-100 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                  {getLocalizedUIString('distanceToCentre', currentLang)}
                </span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                    {transitEstimate.roadDistanceKm}
                  </span>
                  <span className="text-xs font-bold text-slate-500">km</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">
                  ({transitEstimate.directDistanceKm} km aerial)
                </span>
              </div>

              {/* Travel Time */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 border border-teal-100 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-0.5">
                  {getLocalizedUIString('travelTimeEst', currentLang)}
                </span>
                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="text-3xl font-black text-teal-700 font-mono tracking-tight">
                    ~{transitEstimate.tractorMinutes}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{getLocalizedUIString('mins', currentLang)}</span>
                </div>
              </div>
            </div>

            {/* Recommended Departure */}
            {transitEstimate.recommendedDepartureTime && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs shadow-2xs">
                <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{getLocalizedUIString('leaveBy', currentLang)}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black font-mono text-xs shadow-2xs">
                  {transitEstimate.recommendedDepartureTime}
                </span>
              </div>
            )}

            {/* Action Bar: Google Maps Navigation Link & Recalculate */}
            <div className="flex items-center gap-2 pt-0.5">
              <a
                href={transitEstimate.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>{getLocalizedUIString('openInMaps', currentLang)}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </a>

              <button
                type="button"
                onClick={handleEnableLocation}
                disabled={isLocating}
                title={getLocalizedUIString('recalculateDistance', currentLang)}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ) : (
          /* Location Prompt Card */
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-center space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-slate-900 text-xs">
                {getLocalizedUIString('distanceToCentre', currentLang)}
              </h5>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto font-medium">
                {locationError ? (
                  <span className="text-rose-600 font-medium block">{locationError}</span>
                ) : (
                  'Enable GPS to predict real-time road distance, transit duration (Tractor / Tempo), and departure countdown to your Mandi.'
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleEnableLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{getLocalizedUIString('detectingLocation', currentLang)}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{getLocalizedUIString('enableGps', currentLang)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Process Timeline Stepper */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {getLocalizedUIString('procurementLifecycle', currentLang)}
          </h3>
          {!activeBooking ? (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              {getLocalizedUIString('noSlotBookedBadge', currentLang)}
            </span>
          ) : isBookedOnly ? (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {getLocalizedUIString('awaitingCheckinBadge', currentLang)}
            </span>
          ) : isCompleted ? (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {getLocalizedUIString('completedBadge', currentLang)}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              {getLocalizedUIString('inProgressBadge', currentLang)}
            </span>
          )}
        </div>

        {!activeBooking && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {getLocalizedUIString('noSlotBookedLifecycleExplanation', currentLang)}
            </p>
          </div>
        )}

        <div className="space-y-4 relative pl-2">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1

            return (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Vertical line connecting steps */}
                {!isLast && (
                  <div
                    className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 ${
                      step.isDone ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center z-10 shrink-0 transition-all ${
                    step.isDone
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : step.isActive
                      ? 'bg-amber-500 text-white font-bold animate-pulse shadow-md shadow-amber-500/30 ring-4 ring-amber-100'
                      : 'bg-slate-100 border border-slate-200 text-slate-400 font-bold'
                  }`}
                >
                  {step.isDone ? (
                    <CheckCircle2 className="w-4 h-4 font-bold" />
                  ) : (
                    <span className="text-xs font-mono font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-bold ${
                        step.isActive
                          ? 'text-amber-800'
                          : step.isDone
                          ? 'text-slate-900'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    {step.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        {getLocalizedUIString('activeNow', currentLang)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
