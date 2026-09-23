'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Sprout, 
  Scale, 
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Building2,
  Sparkles,
  BellRing,
  Radio,
  X,
  LayoutGrid,
  ListFilter,
  TrendingUp,
  Navigation,
  Award,
  Search,
  Check
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedUIString } from '@/lib/i18n'
import { Farmer, ProcurementCentre } from '@/types/database'
import { bookSlot, broadcastEmptySlotNotification } from '@/lib/actions'
import { getCropDailyRate, getNearbyMandiComparisons, NearbyMandiRate } from '@/lib/mandiRatesService'
import { getCustomDistributedSlots } from '@/lib/slotDistributionService'

interface BookScreenProps {
  farmer: Farmer | null
  centres: ProcurementCentre[]
  currentLang: Language
  preselectedCrop?: string
  onBookingSuccess: () => void
}

// 1. Comprehensive Crop Catalog for Maharashtra & India
const CROP_OPTIONS = [
  { id: 'Soybean', nameEn: 'Soybean', nameMr: 'सोयाबीन', icon: '🌱', popular: true },
  { id: 'Cotton', nameEn: 'Cotton', nameMr: 'कापूस', icon: '⚪', popular: true },
  { id: 'Onion', nameEn: 'Onion', nameMr: 'कांदा', icon: '🧅', popular: true },
  { id: 'Wheat', nameEn: 'Wheat', nameMr: 'गहू', icon: '🌾', popular: true },
  { id: 'Sugarcane', nameEn: 'Sugarcane', nameMr: 'ऊस', icon: '🎋', popular: true },
  { id: 'Tomato', nameEn: 'Tomato', nameMr: 'टोमॅटो', icon: '🍅', popular: true },
  { id: 'Grapes', nameEn: 'Grapes', nameMr: 'द्राक्षे', icon: '🍇', popular: true },
  { id: 'Maize', nameEn: 'Maize / Corn', nameMr: 'मका', icon: '🌽' },
  { id: 'Gram', nameEn: 'Gram / Chana', nameMr: 'हरभरा / चना', icon: '🧆' },
  { id: 'Tur', nameEn: 'Tur / Pigeon Pea', nameMr: 'तूर डाळ', icon: '🥣' },
  { id: 'Moong', nameEn: 'Moong Dal', nameMr: 'मूग', icon: '🫘' },
  { id: 'Urad', nameEn: 'Urad Dal', nameMr: 'उडीद', icon: '⚫' },
  { id: 'Bajra', nameEn: 'Bajra / Pearl Millet', nameMr: 'बाजरी', icon: '🌾' },
  { id: 'Jowar', nameEn: 'Jowar / Sorghum', nameMr: 'ज्वारी', icon: '🌾' },
  { id: 'Groundnut', nameEn: 'Groundnut / Peanut', nameMr: 'भुईमूग', icon: '🥜' },
  { id: 'Rice', nameEn: 'Paddy / Rice', nameMr: 'भात / तांदूळ', icon: '🍚' },
  { id: 'Potato', nameEn: 'Potato', nameMr: 'बटाटा', icon: '🥔' },
  { id: 'Garlic', nameEn: 'Garlic', nameMr: 'लसूण', icon: '🧄' },
  { id: 'Ginger', nameEn: 'Ginger', nameMr: 'आले', icon: '🫚' },
  { id: 'Pomegranate', nameEn: 'Pomegranate', nameMr: 'डाळिंब', icon: '🍎' },
  { id: 'Banana', nameEn: 'Banana', nameMr: 'केळी', icon: '🍌' },
  { id: 'Orange', nameEn: 'Orange / Mosambi', nameMr: 'मोसंबी / संत्रा', icon: '🍊' },
  { id: 'Mango', nameEn: 'Mango', nameMr: 'आंबा', icon: '🥭' },
  { id: 'Chili', nameEn: 'Chili (Green/Red)', nameMr: 'मिरची', icon: '🌶️' },
]

// 2. Exact Procurement Centers as Requested by User
export const APMC_CENTRES_LIST: { id: string; name: string; region: string }[] = [
  { id: 'apmc_manmad_nashik', name: 'APMC-manmad-NASHIK', region: 'Nashik District' },
  { id: 'apmc_ghoti_nashik', name: 'APMC-Ghoti-NASHIK', region: 'Nashik District' },
  { id: 'apmc_pimpalgaon_baswant_nashik', name: 'APMC-pimpalgaon-baswant-NASHIK', region: 'Nashik District' },
  { id: 'apmc_malegaon', name: 'APMC-malegaon', region: 'Nashik District' },
  { id: 'apmc_chandwad', name: 'APMC-chandwad', region: 'Nashik District' },
  { id: 'perfect_krishi_nashik', name: 'Perfect Krishi Market Yard Pvt Ltd, Dist Nashik', region: 'Nashik District' },
  { id: 'apmc_nandgaon', name: 'APMC-nandgaon', region: 'Nashik District' },
  { id: 'apmc_nampur', name: 'APMC-nampur', region: 'Nashik District' },
  { id: 'apmc_satana', name: 'APMC-satana', region: 'Nashik District' },
  { id: 'apmc_devala', name: 'APMC-devala', region: 'Nashik District' },
  { id: 'apmc_sinnar', name: 'APMC-sinnar', region: 'Nashik District' },
  { id: 'apmc_pune', name: 'APMC-Pune', region: 'Pune District' },
  { id: 'apmc_khed', name: 'APMC-khed', region: 'Pune District' },
  { id: 'apmc_shirur', name: 'APMC-shirur', region: 'Pune District' },
  { id: 'apmc_baramati', name: 'APMC-baramati', region: 'Pune District' },
  { id: 'apmc_mumbai', name: 'APMC-Mumbai', region: 'Mumbai APMC' },
  { id: 'mumbai_onion_potato', name: 'Mumabi onion and potato market-Mumbai', region: 'Mumbai APMC' },
  { id: 'mumbai_fruit', name: 'MUMBAI fruit market-Mumbai', region: 'Mumbai APMC' },
]

// Helper to generate dynamic time slots based on the selected date
export function getSlotsForDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dayOfWeek = d.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const dayOfMonth = d.getDate()

  let baseSlots: { time: string; booked: number; max: number; distributedByOperator?: boolean }[] = []

  if (dayOfWeek === 0) {
    // Sunday schedule (Special Weekend Windows)
    baseSlots = [
      { time: '08:00 AM - 10:00 AM', booked: dayOfMonth % 3, max: 5 },
      { time: '10:00 AM - 12:00 PM', booked: 5, max: 5 }, // Full to show dynamic congestion
      { time: '01:30 PM - 03:30 PM', booked: 1, max: 5 },
      { time: '03:30 PM - 05:30 PM', booked: 0, max: 5 },
    ]
  } else if (dayOfWeek % 2 === 1) {
    // Mon / Wed / Fri schedule
    baseSlots = [
      { time: '08:30 AM - 10:00 AM', booked: ((dayOfMonth * 2) % 4) + 1, max: 5 },
      { time: '10:00 AM - 11:30 AM', booked: 5, max: 5 }, // Full
      { time: '12:30 PM - 02:00 PM', booked: (dayOfMonth % 3), max: 5 },
      { time: '02:00 PM - 03:30 PM', booked: 2, max: 5 },
      { time: '03:30 PM - 05:00 PM', booked: (dayOfMonth % 2), max: 5 },
    ]
  } else {
    // Tue / Thu / Sat schedule
    baseSlots = [
      { time: '09:00 AM - 10:30 AM', booked: 4, max: 5 },
      { time: '10:30 AM - 12:00 PM', booked: 5, max: 5 },
      { time: '01:00 PM - 02:30 PM', booked: 1, max: 5 },
      { time: '02:30 PM - 04:00 PM', booked: ((dayOfMonth + 1) % 4), max: 5 },
      { time: '04:00 PM - 05:30 PM', booked: 0, max: 5 },
    ]
  }

  // Merge any custom slots distributed by Mandi Operator for this particular date
  try {
    const customDistributed = getCustomDistributedSlots(dateStr)
    if (customDistributed && customDistributed.length > 0) {
      customDistributed.forEach((custom) => {
        const idx = baseSlots.findIndex(
          (b) => b.time.trim().toLowerCase() === custom.time.trim().toLowerCase()
        )
        if (idx >= 0) {
          baseSlots[idx] = {
            ...baseSlots[idx],
            max: custom.max,
            distributedByOperator: true,
          }
        } else {
          baseSlots.push({
            time: custom.time,
            booked: custom.booked || 0,
            max: custom.max,
            distributedByOperator: true,
          })
        }
      })
    }
  } catch {}

  return baseSlots
}

export function BookScreen({
  farmer,
  centres,
  currentLang,
  preselectedCrop,
  onBookingSuccess,
}: BookScreenProps) {
  const t = translations[currentLang]

  // Combine database centres with requested list
  const availableCentres = useMemo(() => {
    const list = [...APMC_CENTRES_LIST]
    // Ensure all centres from database prop are mapped if not present
    centres.forEach((c) => {
      if (!list.some((item) => item.id === c.id || item.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({ id: c.id, name: c.name, region: c.district || 'Maharashtra' })
      }
    })
    return list
  }, [centres])

  // Selected crop (no autofill, start empty unless preselected)
  const [selectedCrop, setSelectedCrop] = useState<string>(preselectedCrop || '')
  const [quantity, setQuantity] = useState<string>('')
  
  // Selected Procurement Centre (no autofill, start empty)
  const [selectedCentreId, setSelectedCentreId] = useState<string>('')

  // Searchable Crop Dropdown State
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false)
  const [cropSearchQuery, setCropSearchQuery] = useState('')
  const cropDropdownRef = useRef<HTMLDivElement>(null)
  const cropSearchInputRef = useRef<HTMLInputElement>(null)

  // Searchable Centre Dropdown State
  const [isCentreDropdownOpen, setIsCentreDropdownOpen] = useState(false)
  const [centreSearchQuery, setCentreSearchQuery] = useState('')
  const centreDropdownRef = useRef<HTMLDivElement>(null)
  const centreSearchInputRef = useRef<HTMLInputElement>(null)

  // Filter crops based on search query
  const filteredCrops = useMemo(() => {
    if (!cropSearchQuery.trim()) return CROP_OPTIONS
    const q = cropSearchQuery.trim().toLowerCase()
    return CROP_OPTIONS.filter((c) => {
      const localized = getLocalizedCropName(c.id, currentLang).toLowerCase()
      return (
        c.nameEn.toLowerCase().includes(q) ||
        c.nameMr.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        localized.includes(q)
      )
    })
  }, [cropSearchQuery, currentLang])

  // Filter procurement centres based on search query
  const filteredCentres = useMemo(() => {
    if (!centreSearchQuery.trim()) return availableCentres
    const q = centreSearchQuery.trim().toLowerCase()
    return availableCentres.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    })
  }, [availableCentres, centreSearchQuery])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cropDropdownRef.current && !cropDropdownRef.current.contains(e.target as Node)) {
        setIsCropDropdownOpen(false)
      }
      if (centreDropdownRef.current && !centreDropdownRef.current.contains(e.target as Node)) {
        setIsCentreDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isCropDropdownOpen) {
      setTimeout(() => cropSearchInputRef.current?.focus(), 60)
    }
  }, [isCropDropdownOpen])

  useEffect(() => {
    if (isCentreDropdownOpen) {
      setTimeout(() => centreSearchInputRef.current?.focus(), 60)
    }
  }, [isCentreDropdownOpen])

  // Dates: Today, Tomorrow, Day After
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  // 3. Date Selection via Calendar & Dynamic Slots (no autofill, start empty)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [slotOptions, setSlotOptions] = useState<{ time: string; booked: number; max: number; distributedByOperator?: boolean }[]>([])
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('')
  const [selectedSpotNumber, setSelectedSpotNumber] = useState<number | null>(null)
  const [slotViewMode, setSlotViewMode] = useState<'cards' | 'matrix'>('cards')
  const [slotChangeNotice, setSlotChangeNotice] = useState<string | null>(null)
  const [broadcastNotice, setBroadcastNotice] = useState<string | null>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [isDismissedEmptySlotsBanner, setIsDismissedEmptySlotsBanner] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null)

  // Sync if preselectedCrop prop changes from external source (like Voice Assistant)
  useEffect(() => {
    if (preselectedCrop) {
      setSelectedCrop(preselectedCrop)
    }
  }, [preselectedCrop])

  // Find empty slots (0 bookings)
  const emptySlots = useMemo(
    () => (selectedDate ? slotOptions.filter((s) => s.booked === 0) : []),
    [slotOptions, selectedDate]
  )

  const selectedCentreObj = selectedCentreId ? availableCentres.find((c) => c.id === selectedCentreId) : null
  const selectedCropObj = selectedCrop ? CROP_OPTIONS.find((c) => c.id === selectedCrop) : null
  const selectedCropRate = selectedCrop ? getCropDailyRate(selectedCrop, selectedDate || today) : null

  // 2-3 Nearby Mandi Rates Comparison for the selected crop
  const nearbyMandiComparisons = useMemo(() => {
    if (!selectedCrop) return []
    return getNearbyMandiComparisons(
      selectedCrop,
      selectedCentreId,
      selectedDate || today,
      Number(quantity) || 0
    )
  }, [selectedCrop, selectedCentreId, selectedDate, today, quantity])

  // Listen for real-time slot distribution updates from Operator
  useEffect(() => {
    if (!selectedDate) return
    const handleSlotsUpdated = () => {
      setSlotOptions(getSlotsForDate(selectedDate))
    }
    window.addEventListener('krishisetu_slots_updated', handleSlotsUpdated)
    return () => window.removeEventListener('krishisetu_slots_updated', handleSlotsUpdated)
  }, [selectedDate])

  // Ref to track dates already alerted in this session to ensure only ONE alert comes for that specific day
  const alertedSpecificDatesRef = useRef<Set<string>>(new Set())

  // Send empty slot alert ONLY for the specific day being viewed, strictly once (never all days)
  useEffect(() => {
    if (!selectedDate || !selectedCentreId || emptySlots.length === 0 || !selectedCentreObj?.name) return

    // If this specific day was already alerted, do not alert again
    if (alertedSpecificDatesRef.current.has(selectedDate)) return

    const sessionKey = `krishisetu_alerted_slot_${selectedDate}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      alertedSpecificDatesRef.current.add(selectedDate)
      return
    }

    // Only alert for the specific active date, once
    alertedSpecificDatesRef.current.add(selectedDate)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true')
    }

    const firstEmpty = emptySlots[0]
    broadcastEmptySlotNotification({
      centreName: selectedCentreObj.name,
      slotDate: selectedDate,
      slotTime: firstEmpty.time,
      availableSpots: firstEmpty.max - firstEmpty.booked,
    })
      .then((res) => {
        if (res.success && !res.alreadyBroadcast) {
          const formatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            weekday: 'short',
          })
          setBroadcastNotice(`📢 Alert sent for ${formatted}: Slot ${firstEmpty.time} is EMPTY! (Only 1 alert per day)`)
          setTimeout(() => setBroadcastNotice(null), 5000)
        }
      })
      .catch(console.error)
  }, [selectedDate, selectedCentreId, emptySlots, selectedCentreObj?.name])

  const handleManualBroadcast = async () => {
    if (emptySlots.length === 0 || !selectedCentreObj?.name || !selectedDate) return
    setIsBroadcasting(true)
    try {
      const firstEmpty = emptySlots[0]
      const formatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      })
      const res = await broadcastEmptySlotNotification({
        centreName: selectedCentreObj.name,
        slotDate: selectedDate,
        slotTime: firstEmpty.time,
        availableSpots: firstEmpty.max - firstEmpty.booked,
      })
      if (res.success && !res.alreadyBroadcast) {
        setBroadcastNotice(`📢 Single SMS alert sent for ${formatted} (${firstEmpty.time})!`)
      } else if (res.alreadyBroadcast) {
        setBroadcastNotice(`ℹ️ Alert for ${formatted} has already been sent. Only one alert per day is permitted.`)
      }
      setTimeout(() => setBroadcastNotice(null), 5000)
    } catch (err) {
      console.error('Error broadcasting empty slot:', err)
    } finally {
      setIsBroadcasting(false)
    }
  }

  // Handler for Date Change via Calendar or Shortcut buttons
  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      setSelectedDate('')
      setSlotOptions([])
      setSelectedSlotTime('')
      setSelectedSpotNumber(null)
      return
    }
    setSelectedDate(newDate)
    const newSlots = getSlotsForDate(newDate)
    setSlotOptions(newSlots)

    // Reset selected slot time and spot so farmer explicitly selects their own slot
    setSelectedSlotTime('')
    setSelectedSpotNumber(null)

    // Visual notice that time slots have changed
    const formatted = new Date(newDate + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    setSlotChangeNotice(`${getLocalizedUIString('timeSlotsUpdated', currentLang)} ${formatted}`)
    setTimeout(() => setSlotChangeNotice(null), 3000)
  }

  const handleSelectSlotSpot = (slotTime: string, spotNum: number) => {
    setSelectedSlotTime(slotTime)
    setSelectedSpotNumber(spotNum)
  }

  const handleSelectSlotCard = (slot: { time: string; booked: number; max: number }) => {
    if (slot.booked >= slot.max) return
    setSelectedSlotTime(slot.time)
    // If not already in this slot window or spot is acquired, auto-select first available empty spot
    if (selectedSlotTime !== slot.time || !selectedSpotNumber || selectedSpotNumber <= slot.booked) {
      const firstAvailable = slot.booked + 1
      if (firstAvailable <= slot.max) {
        setSelectedSpotNumber(firstAvailable)
      }
    }
  }

  const activeSlot = slotOptions.find((s) => s.time === selectedSlotTime)
  const isSelectedSlotFull = activeSlot ? activeSlot.booked >= activeSlot.max : false

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCrop) {
      setErrorMessage(getLocalizedUIString('errorSelectCrop', currentLang))
      return
    }

    const numQty = Number(quantity)
    if (!quantity || isNaN(numQty) || numQty <= 0) {
      setErrorMessage(getLocalizedUIString('errorEnterQuantity', currentLang))
      return
    }

    if (!selectedCentreId) {
      setErrorMessage(getLocalizedUIString('errorSelectCentre', currentLang))
      return
    }

    if (!selectedDate) {
      setErrorMessage(getLocalizedUIString('errorSelectDate', currentLang))
      return
    }

    if (!selectedSlotTime) {
      setErrorMessage(getLocalizedUIString('errorSelectTimeSlot', currentLang))
      return
    }

    if (isSelectedSlotFull) {
      setErrorMessage(getLocalizedUIString('errorSlotFull', currentLang))
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await bookSlot({
        farmerId: farmer?.id || '',
        farmerName: farmer?.name || '',
        farmerPhone: farmer?.phone || '',
        centreId: selectedCentreId,
        crop: selectedCrop,
        quantity: numQty,
        slotDate: selectedDate,
        slotTime: selectedSlotTime,
      })

      if (res.success && res.booking) {
        setConfirmedBookingCode(res.booking.booking_code)
        // Reset form inputs for next time
        setSelectedCrop('')
        setCropSearchQuery('')
        setIsCropDropdownOpen(false)
        setQuantity('')
        setSelectedCentreId('')
        setCentreSearchQuery('')
        setIsCentreDropdownOpen(false)
        setSelectedDate('')
        setSelectedSlotTime('')
        setSelectedSpotNumber(null)
        setTimeout(() => {
          onBookingSuccess()
        }, 2200)
      } else {
        setErrorMessage(res.error || 'Failed to confirm booking.')
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Booking error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {t.bookSlot}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.slotBookingDesc}
        </p>
      </div>

      {confirmedBookingCode ? (
        <div className="p-6 rounded-3xl bg-white border border-emerald-300 text-center space-y-4 shadow-xl shadow-emerald-900/5 animate-in zoom-in-95 duration-200">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              {t.slotBookingConfirmed}
            </h3>
            <p className="text-xs text-slate-500">
              {getLocalizedUIString('smsDispatchedNotice', currentLang)} {farmer?.phone || 'registered mobile'}.
            </p>
            <div className="py-2 px-4 rounded-xl bg-slate-50 border border-slate-200 inline-block font-mono text-emerald-700 font-black text-base mt-2">
              {confirmedBookingCode}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 animate-pulse font-medium">
            {t.trackQueue}...
          </p>
        </div>
      ) : (
        <form onSubmit={handleBooking} className="space-y-5">
          {/* Step 1: Crop Selection via Dropdown Menu */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.selectCrop}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                {CROP_OPTIONS.length} {getLocalizedUIString('cropOptionsCount', currentLang)}
              </span>
            </label>

            {/* Searchable Dropdown Trigger with Live Search Option */}
            <div className="relative" ref={cropDropdownRef}>
              <button
                type="button"
                id="crop-selection-button"
                onClick={() => {
                  setIsCropDropdownOpen((prev) => !prev)
                  setIsCentreDropdownOpen(false)
                }}
                className={`w-full px-4 py-3.5 rounded-2xl bg-white border text-left flex items-center justify-between transition-all shadow-xs ${
                  isCropDropdownOpen
                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                    : selectedCropObj
                    ? 'border-emerald-300 hover:border-emerald-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  {selectedCropObj ? (
                    <>
                      <span className="text-xl shrink-0">{selectedCropObj.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                          {getLocalizedCropName(selectedCropObj.id, currentLang)}
                        </span>
                        {selectedCropRate && (
                          <span className="text-[11px] font-mono text-emerald-700 font-bold block truncate">
                            ₹{selectedCropRate.modalPrice.toLocaleString('en-IN')}/Qtl &bull; Today's Mandi Rate
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                      <Search className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {getLocalizedUIString('selectCropOptionPlaceholder', currentLang)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedCrop && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCrop('')
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="p-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Search className="w-3 h-3 text-slate-500" />
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                        isCropDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Searchable Crop Popover Menu */}
              {isCropDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-emerald-200/90 rounded-2xl shadow-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Input Box */}
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                    <input
                      ref={cropSearchInputRef}
                      type="text"
                      value={cropSearchQuery}
                      onChange={(e) => setCropSearchQuery(e.target.value)}
                      placeholder={getLocalizedUIString('searchCrop', currentLang)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    />
                    {cropSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCropSearchQuery('')}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 absolute right-2 hover:bg-slate-200/50"
                        title={getLocalizedUIString('clearSearch', currentLang)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Status Bar */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                    <span>
                      {cropSearchQuery ? (
                        <>
                          <span className="font-bold text-emerald-800">{filteredCrops.length}</span> {getLocalizedUIString('cropOptionsCount', currentLang)}
                        </>
                      ) : (
                        <span>{CROP_OPTIONS.length} {getLocalizedUIString('cropOptionsCount', currentLang)}</span>
                      )}
                    </span>
                    {cropSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCropSearchQuery('')}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        {getLocalizedUIString('clearSearch', currentLang)}
                      </button>
                    )}
                  </div>

                  {/* Scrollable Crops List */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {filteredCrops.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                        <Sprout className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          {getLocalizedUIString('noCropsFound', currentLang)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCropSearchQuery('')}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs"
                        >
                          {getLocalizedUIString('clearSearch', currentLang)}
                        </button>
                      </div>
                    ) : (
                      filteredCrops.map((c) => {
                        const cRate = getCropDailyRate(c.id, selectedDate || today)
                        const isSelected = selectedCrop === c.id

                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setSelectedCrop(c.id)
                              setIsCropDropdownOpen(false)
                              setCropSearchQuery('')
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                : 'bg-white hover:bg-emerald-50/40 border-transparent hover:border-emerald-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl shrink-0">{c.icon}</span>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold block truncate text-slate-900">
                                  {getLocalizedCropName(c.id, currentLang)}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {c.nameEn} {c.nameMr !== c.nameEn ? `• ${c.nameMr}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-100/70 text-emerald-900 text-[11px] font-mono font-bold">
                                ₹{cRate.modalPrice.toLocaleString('en-IN')}/Qtl
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Popular Crop Chips with Rate displayed beside each crop */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">
                {getLocalizedUIString('popular', currentLang)}
              </span>
              {CROP_OPTIONS.filter((c) => c.popular).map((c) => {
                const cRate = getCropDailyRate(c.id, selectedDate || today)
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-1 ${
                      selectedCrop === c.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <span>{c.icon} {getLocalizedCropName(c.id, currentLang)}</span>
                    <span className={`text-[10px] font-mono font-bold ${selectedCrop === c.id ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      ₹{cRate.modalPrice.toLocaleString('en-IN')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Quantity in Quintals */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.quantityQuintals}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="500"
                placeholder={getLocalizedUIString('quantityPlaceholder', currentLang)}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all shadow-xs placeholder:text-slate-400 placeholder:font-sans"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                {quantity && Number(quantity) > 0 ? `${t.quintals} (~${Number(quantity) * 100} kg)` : t.quintals}
              </span>
            </div>
          </div>

          {/* Feature: Nearby Mandi Rate Comparison (compare 2-3 nearby APMC yards before committing slot) */}
          {selectedCrop && nearbyMandiComparisons.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/90 shadow-sm space-y-3.5 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                      {getLocalizedUIString('nearbyMandiTitle', currentLang)}
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 font-medium leading-tight">
                    {getLocalizedUIString('nearbyMandiSubtitle', currentLang)}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[9px] shrink-0 uppercase tracking-wider shadow-2xs">
                  Agmarknet Live
                </span>
              </div>

              {/* Comparison Cards for 2-3 Nearby APMC Yards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {nearbyMandiComparisons.map((yard) => {
                  const isSelected = selectedCentreId === yard.centreId

                  return (
                    <div
                      key={yard.centreId}
                      className={`p-3 rounded-2xl border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-white border-2 border-emerald-500 shadow-md ring-1 ring-emerald-400/40'
                          : yard.isBestRate
                          ? 'bg-white/95 border-2 border-amber-400 shadow-xs hover:border-amber-500'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                          {yard.isBestRate ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[9px] flex items-center gap-1 shadow-2xs">
                              <Award className="w-2.5 h-2.5 text-amber-700" />
                              <span>{getLocalizedUIString('bestRateBadge', currentLang)}</span>
                            </span>
                          ) : isSelected ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[9px]">
                              {getLocalizedUIString('selectedCentreBadge', currentLang)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {yard.region}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500 font-mono font-bold flex items-center gap-0.5">
                            <Navigation className="w-2.5 h-2.5 text-slate-400" />
                            <span>~{yard.distanceKm} km</span>
                          </span>
                        </div>

                        {/* APMC Yard Name */}
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {yard.centreName}
                        </h4>

                        {/* Specialty Badge if any */}
                        {yard.specialtyBadge && (
                          <span className="text-[9px] text-emerald-800 font-semibold block mt-0.5">
                            {yard.specialtyBadge}
                          </span>
                        )}

                        {/* Modal Price */}
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black font-mono text-emerald-800">
                            ₹{yard.modalPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {getLocalizedUIString('perQuintalShort', currentLang)}
                          </span>
                        </div>

                        {/* Price Range */}
                        <div className="text-[10px] text-slate-500 font-medium">
                          Range: ₹{yard.minPrice.toLocaleString('en-IN')} - ₹{yard.maxPrice.toLocaleString('en-IN')}
                        </div>

                        {/* Price Advantage over current selection */}
                        {yard.priceDiffPerQtl > 0 && !isSelected && (
                          <div className="mt-1.5 py-1 px-2 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-[10px] font-bold">
                            <span>+₹{yard.priceDiffPerQtl}/Qtl higher</span>
                            {yard.extraTotalEarnings > 0 && (
                              <span className="block text-emerald-950 font-black">
                                +₹{yard.extraTotalEarnings.toLocaleString('en-IN')} {getLocalizedUIString('extraEarning', currentLang)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Route/Select Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCentreId(yard.centreId)}
                        className={`mt-2.5 w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs cursor-default'
                            : yard.isBestRate
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs active:scale-95'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>{getLocalizedUIString('selectedCentreBadge', currentLang)}</span>
                          </>
                        ) : (
                          <>
                            <span>{getLocalizedUIString('routeToMandi', currentLang)}</span>
                            <ArrowRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Procurement Centres via Dropdown Menu */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.preferredCentre}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">
                {availableCentres.length} {getLocalizedUIString('apmcCentersCount', currentLang)}
              </span>
            </label>

            {/* Searchable Dropdown Trigger with Live Search Option for APMC Centre */}
            <div className="relative" ref={centreDropdownRef}>
              <button
                type="button"
                id="centre-selection-button"
                onClick={() => {
                  setIsCentreDropdownOpen((prev) => !prev)
                  setIsCropDropdownOpen(false)
                }}
                className={`w-full px-4 py-3.5 rounded-2xl bg-white border text-left flex items-center justify-between transition-all shadow-xs ${
                  isCentreDropdownOpen
                    ? 'border-emerald-600 ring-2 ring-emerald-100'
                    : selectedCentreObj
                    ? 'border-emerald-300 hover:border-emerald-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                  {selectedCentreObj ? (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                          {selectedCentreObj.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block truncate">
                          {selectedCentreObj.region} &bull; {getLocalizedUIString('capacityVerified', currentLang)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm">
                      <Search className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {getLocalizedUIString('selectCentreOptionPlaceholder', currentLang)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedCentreId && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCentreId('')
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="p-1 rounded-lg bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Search className="w-3 h-3 text-slate-500" />
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                        isCentreDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* Searchable Centre Popover Menu */}
              {isCentreDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white border border-emerald-200/90 rounded-2xl shadow-xl p-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Search Input Box */}
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                    <input
                      ref={centreSearchInputRef}
                      type="text"
                      value={centreSearchQuery}
                      onChange={(e) => setCentreSearchQuery(e.target.value)}
                      placeholder={getLocalizedUIString('searchCentre', currentLang)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    />
                    {centreSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCentreSearchQuery('')}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 absolute right-2 hover:bg-slate-200/50"
                        title={getLocalizedUIString('clearSearch', currentLang)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Status Bar */}
                  <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
                    <span>
                      {centreSearchQuery ? (
                        <>
                          <span className="font-bold text-emerald-800">{filteredCentres.length}</span> {getLocalizedUIString('apmcCentersCount', currentLang)}
                        </>
                      ) : (
                        <span>{availableCentres.length} {getLocalizedUIString('apmcCentersCount', currentLang)}</span>
                      )}
                    </span>
                    {centreSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCentreSearchQuery('')}
                        className="text-[10px] font-bold text-emerald-700 hover:underline"
                      >
                        {getLocalizedUIString('clearSearch', currentLang)}
                      </button>
                    )}
                  </div>

                  {/* Scrollable Centres List */}
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                    {filteredCentres.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 space-y-2">
                        <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700">
                          {getLocalizedUIString('noCentresFound', currentLang)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setCentreSearchQuery('')}
                          className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs"
                        >
                          {getLocalizedUIString('clearSearch', currentLang)}
                        </button>
                      </div>
                    ) : (
                      filteredCentres.map((centre) => {
                        const isSelected = selectedCentreId === centre.id

                        return (
                          <button
                            type="button"
                            key={centre.id}
                            onClick={() => {
                              setSelectedCentreId(centre.id)
                              setIsCentreDropdownOpen(false)
                              setCentreSearchQuery('')
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-2xs'
                                : 'bg-white hover:bg-emerald-50/40 border-transparent hover:border-emerald-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-base shrink-0">🏢</span>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold block truncate text-slate-900">
                                  {centre.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium block truncate">
                                  {centre.region} &bull; {getLocalizedUIString('capacityVerified', currentLang)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                {centre.region.replace(' District', '').replace(' APMC', '')}
                              </span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Centre Active Badge / Card */}
            {selectedCentreObj && selectedCentreId && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {selectedCentreObj.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {selectedCentreObj.region} &bull; {getLocalizedUIString('capacityVerified', currentLang)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                  {getLocalizedUIString('activeBadge', currentLang)}
                </span>
              </div>
            )}
          </div>

          {/* Step 4: Date Selection via Calendar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.selectDate}</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium font-mono">
                {selectedDate}
              </span>
            </div>

            {/* Interactive Calendar Input Picker */}
            <div className="relative">
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold font-mono text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all cursor-pointer shadow-xs"
              />
            </div>

            {/* Quick Shortcut Date Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              {[
                { label: t.todayLabel, date: today },
                { label: t.tomorrowLabel, date: tomorrow },
                { label: t.dayAfterLabel, date: dayAfter },
              ].map((d) => (
                <button
                  type="button"
                  key={d.date}
                  onClick={() => handleDateChange(d.date)}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    selectedDate === d.date
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className={`block text-[10px] font-medium ${selectedDate === d.date ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {d.label}
                  </span>
                  <span className="text-xs font-bold font-mono">
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </button>
              ))}
            </div>

            {/* Dynamic Slot Change Alert */}
            {slotChangeNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{slotChangeNotice}</span>
              </div>
            )}
          </div>

          {/* Step 5: Time Slots (Dynamically Updated When Date Changes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>{t.selectTimeSlot}</span>
              </label>
              
              {/* View Switcher: Cards vs BookMyShow Grid */}
              {selectedDate && slotOptions.length > 0 && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSlotViewMode('cards')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      slotViewMode === 'cards'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ListFilter className="w-3 h-3" />
                    <span>{getLocalizedUIString('bookMyShowCards', currentLang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotViewMode('matrix')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                      slotViewMode === 'matrix'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>{getLocalizedUIString('bookMyShowGrid', currentLang)}</span>
                  </button>
                </div>
              )}
            </div>

            {/* BookMyShow Style Status Legend matching the reference image */}
            {selectedDate && slotOptions.length > 0 && (
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1 text-xs">
                {/* Empty Slot (Green border style like image) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-md border-2 border-emerald-500 bg-white flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs">
                    1
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">
                    {getLocalizedUIString('emptySlotLegend', currentLang)}
                  </span>
                </div>

                {/* Selected Slot (Amber glowing style like row 2 box 2 in image) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-md border-2 border-amber-400 bg-amber-50 text-amber-950 flex items-center justify-center font-black text-xs shadow-[0_0_8px_rgba(245,158,11,0.5)] ring-1 ring-amber-300">
                    2
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-700">
                    {getLocalizedUIString('selectedSlotLegend', currentLang)}
                  </span>
                </div>

                {/* Acquired Slot (Solid gray box like image) */}
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-md bg-slate-200 border border-slate-300/40 flex items-center justify-center font-bold text-xs text-slate-400">
                    3
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">
                    {getLocalizedUIString('acquiredSlotLegend', currentLang)}
                  </span>
                </div>
              </div>
            )}

            {/* Broadcast Notice Banner */}
            {broadcastNotice && (
              <div className="p-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-emerald-600/20 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2 truncate">
                  <BellRing className="w-4 h-4 animate-bounce shrink-0" />
                  <span className="truncate">{broadcastNotice}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase">
                    {getLocalizedUIString('delivered', currentLang)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBroadcastNotice(null)}
                    className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-all"
                    title={getLocalizedUIString('close', currentLang)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Empty Slots Alert Banner for All Users */}
            {emptySlots.length > 0 && !isDismissedEmptySlotsBanner && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-100/90 via-teal-50 to-emerald-50 border border-emerald-300 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-emerald-950">
                        {emptySlots.length} {getLocalizedUIString('emptySlotBadge', currentLang)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold text-[9px]">
                        {getLocalizedUIString('liveBadge', currentLang)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium truncate">
                      {getLocalizedUIString('allUsersNotified', currentLang)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualBroadcast}
                    disabled={isBroadcasting}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] shrink-0 transition-all shadow-xs flex items-center gap-1 disabled:opacity-50 active:scale-95"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>{isBroadcasting ? getLocalizedUIString('sending', currentLang) : getLocalizedUIString('broadcastSmsAlert', currentLang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDismissedEmptySlotsBanner(true)}
                    className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all"
                    title={getLocalizedUIString('close', currentLang)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Time Slot Container */}
            {!selectedDate ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="font-medium">
                  {getLocalizedUIString('selectDatePrompt', currentLang)}
                </p>
              </div>
            ) : slotOptions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                <span>
                  {getLocalizedUIString('noSlotsAvailableDate', currentLang)}
                </span>
              </div>
            ) : slotViewMode === 'cards' ? (
              /* VIEW 1: Detailed Cards with BookMyShow Slot Box Rows */
              <div className="space-y-3">
                {slotOptions.map((slot) => {
                  const isSelected = selectedSlotTime === slot.time
                  const isFull = slot.booked >= slot.max
                  const isEmpty = slot.booked === 0
                  const spotsLeft = slot.max - slot.booked
                  const isDistributed = Boolean((slot as any).distributedByOperator)

                  return (
                    <div
                      key={slot.time}
                      onClick={() => handleSelectSlotCard(slot)}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isFull
                          ? 'bg-slate-100/90 border-slate-200 cursor-not-allowed opacity-75'
                          : isSelected
                          ? 'bg-emerald-50/60 border-2 border-emerald-500 shadow-sm ring-1 ring-emerald-400/40 cursor-pointer'
                          : isEmpty
                          ? 'bg-white border-2 border-emerald-500/80 shadow-2xs hover:border-emerald-600 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-emerald-300 cursor-pointer'
                      }`}
                    >
                      {/* Top Header Row of Slot Window */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-slate-900 block">
                            {slot.time}
                          </span>
                          {isDistributed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              {getLocalizedUIString('distributedBadge', currentLang)}
                            </span>
                          )}
                          {isEmpty && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-600 text-white animate-pulse">
                              {slot.max}/{slot.max} {getLocalizedUIString('emptyBadge', currentLang)}
                            </span>
                          )}
                        </div>

                        <div>
                          {isFull ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 border border-slate-300">
                              {t.slotFull}
                            </span>
                          ) : isSelected ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                              {t.slotSelected}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {spotsLeft} {t.spotsLeft}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1 font-medium">
                        {isFull
                          ? t.capacityReached
                          : isEmpty
                          ? getLocalizedUIString('emptySlotNotice', currentLang)
                          : `${spotsLeft} ${t.spotsLeft}`}
                      </div>

                      {/* Divider and BookMyShow Slot Boxes Row */}
                      <div className="border-t border-slate-100 pt-2.5 mt-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span className="uppercase tracking-wider">
                            {getLocalizedUIString('slotBayLabel', currentLang)} (1 - {slot.max})
                          </span>
                          {isSelected && selectedSpotNumber && (
                            <span className="text-amber-700 font-bold">
                              {getLocalizedUIString('slotBayLabel', currentLang)} {selectedSpotNumber} {getLocalizedUIString('selectedSlotLegend', currentLang)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {Array.from({ length: slot.max }, (_, idx) => {
                            const spotNum = idx + 1
                            const isSpotAcquired = spotNum <= slot.booked
                            const isSpotSelected = isSelected && selectedSpotNumber === spotNum

                            if (isSpotAcquired) {
                              /* Acquired Slot: Gray Box (matching reference image) */
                              return (
                                <div
                                  key={spotNum}
                                  title={`Bay #${spotNum}: Acquired / Booked`}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-200 border border-slate-300/40 flex items-center justify-center text-slate-400 font-bold text-sm cursor-not-allowed select-none shadow-2xs"
                                >
                                  {spotNum}
                                </div>
                              )
                            }

                            if (isSpotSelected) {
                              /* Selected Slot: Glowing amber border (matching row 2 box 2 in reference image) */
                              return (
                                <button
                                  type="button"
                                  key={spotNum}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSelectSlotSpot(slot.time, spotNum)
                                  }}
                                  title={`Bay #${spotNum}: Selected`}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-950 flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(245,158,11,0.55)] ring-2 ring-amber-300/60 scale-105 transition-all select-none"
                                >
                                  {spotNum}
                                </button>
                              )
                            }

                            /* Empty Slot: Green style box (matching reference image) */
                            return (
                              <button
                                type="button"
                                key={spotNum}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectSlotSpot(slot.time, spotNum)
                                }}
                                title={`Click to select Bay #${spotNum} (${slot.time})`}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 border-emerald-500 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 flex items-center justify-center font-bold text-sm shadow-2xs active:scale-95 transition-all select-none group"
                              >
                                <span className="group-hover:text-emerald-700">{spotNum}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* VIEW 2: BookMyShow Cinema Matrix Grid View (exact layout like reference image) */
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                {/* Cinema Screen Indicator (Mandi Entry Gate) */}
                <div className="space-y-1.5 pb-2">
                  <div className="h-1.5 w-4/5 mx-auto bg-gradient-to-r from-transparent via-emerald-400 to-transparent rounded-full" />
                  <p className="text-[10px] uppercase font-black text-center text-slate-400 tracking-wider">
                    {getLocalizedUIString('mandiGateScreen', currentLang)}
                  </p>
                </div>

                {/* Matrix Rows matching the reference image layout */}
                <div className="divide-y divide-slate-100">
                  {slotOptions.map((slot) => {
                    const isSelected = selectedSlotTime === slot.time
                    const isFull = slot.booked >= slot.max

                    return (
                      <div
                        key={slot.time}
                        className={`py-3.5 flex items-center justify-between gap-2 sm:gap-4 transition-all ${
                          isSelected ? 'bg-emerald-50/50 -mx-2 px-2 rounded-xl' : ''
                        }`}
                      >
                        {/* Time Window Label */}
                        <div className="min-w-[85px] sm:min-w-[120px]">
                          <span className={`text-xs font-mono font-bold block ${isFull ? 'text-slate-400' : 'text-slate-800'}`}>
                            {slot.time.split(' - ')[0]}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {isFull ? t.slotFull : `${slot.max - slot.booked} ${t.spotsLeft}`}
                          </span>
                        </div>

                        {/* Numbered Slot Boxes Row */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                          {Array.from({ length: slot.max }, (_, idx) => {
                            const spotNum = idx + 1
                            const isSpotAcquired = spotNum <= slot.booked
                            const isSpotSelected = isSelected && selectedSpotNumber === spotNum

                            if (isSpotAcquired) {
                              /* Acquired Slot: Gray Box */
                              return (
                                <div
                                  key={spotNum}
                                  title={`Bay #${spotNum} (Acquired)`}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-200 border border-slate-300/40 flex items-center justify-center text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed select-none"
                                >
                                  {spotNum}
                                </div>
                              )
                            }

                            if (isSpotSelected) {
                              /* Selected Slot: Amber glowing border (matching image) */
                              return (
                                <button
                                  type="button"
                                  key={spotNum}
                                  onClick={() => handleSelectSlotSpot(slot.time, spotNum)}
                                  title={`Bay #${spotNum} Selected`}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-amber-400 bg-amber-50 text-amber-950 flex items-center justify-center font-black text-xs sm:text-sm shadow-[0_0_12px_rgba(245,158,11,0.55)] ring-2 ring-amber-300/60 scale-105 transition-all select-none"
                                >
                                  {spotNum}
                                </button>
                              )
                            }

                            /* Empty Slot: Green style box */
                            return (
                              <button
                                type="button"
                                key={spotNum}
                                onClick={() => handleSelectSlotSpot(slot.time, spotNum)}
                                title={`Select Bay #${spotNum}`}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-emerald-500 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs active:scale-95 transition-all select-none group"
                              >
                                <span className="group-hover:text-emerald-700">{spotNum}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Active Selected Slot Confirmation Bar */}
            {selectedSlotTime && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedSpotNumber || '✓'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {selectedSlotTime} {selectedSpotNumber ? `• ${getLocalizedUIString('slotBayLabel', currentLang)} ${selectedSpotNumber}` : ''}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {getLocalizedUIString('slotSelected', currentLang)}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[10px] shadow-2xs">
                  {t.slotSelected}
                </span>
              </div>
            )}
          </div>

          {/* Congestion Mitigation Banner if Selected Slot is Full */}
          {isSelectedSlotFull && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">{t.congestionTitle}</h4>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {t.congestionDesc}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isSelectedSlotFull}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{t.confirmingBooking}</span>
              </span>
            ) : (
              <>
                <span>
                  {selectedSlotTime 
                    ? `${t.confirmBooking} (${selectedSlotTime.split(' - ')[0]}${selectedSpotNumber ? ` • Bay #${selectedSpotNumber}` : ''})`
                    : t.confirmBooking}
                </span>
                <ArrowRight className="w-4 h-4 font-bold" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
