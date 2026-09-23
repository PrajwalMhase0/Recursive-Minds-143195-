'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Building2, 
  Plus, 
  CheckCircle2, 
  Radio, 
  Trash2, 
  Sparkles, 
  BellRing,
  Layers,
  ArrowRight,
  Sliders,
  Users
} from 'lucide-react'
import { Language, translations } from '@/lib/i18n'
import { ProcurementCentre } from '@/types/database'
import { broadcastEmptySlotNotification } from '@/lib/actions'
import { 
  addDistributedSlot, 
  removeDistributedSlot, 
  getCustomDistributedSlots 
} from '@/lib/slotDistributionService'
import { getSlotsForDate } from '@/components/screens/BookScreen'

interface OperatorSlotDistributionProps {
  centres: ProcurementCentre[]
  currentLang: Language
}

const PRESET_WINDOWS = [
  { label: '06:00 AM - 08:00 AM', tag: 'Early Morning' },
  { label: '11:30 AM - 01:00 PM', tag: 'Midday Extra' },
  { label: '05:30 PM - 07:00 PM', tag: 'Evening Window' },
  { label: '07:00 PM - 08:30 PM', tag: 'Night Clearance' },
]

export function OperatorSlotDistribution({ centres, currentLang }: OperatorSlotDistributionProps) {
  const t = translations[currentLang]

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0]

  const [selectedDate, setSelectedDate] = useState<string>(tomorrow)
  const [selectedCentreId, setSelectedCentreId] = useState<string>(centres[0]?.id || 'apmc_manmad_nashik')
  
  // New Slot Input Form State
  const [slotTime, setSlotTime] = useState('05:30 PM - 07:00 PM')
  const [capacity, setCapacity] = useState<number>(10)
  const [notes, setNotes] = useState('')
  const [notifyFarmers, setNotifyFarmers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Current active slots for the selected date
  const [activeSlots, setActiveSlots] = useState(() => getSlotsForDate(tomorrow))

  const selectedCentreObj = centres.find((c) => c.id === selectedCentreId) || centres[0] || {
    name: 'APMC Manmad / Nashik',
  }

  const reloadSlots = () => {
    setActiveSlots(getSlotsForDate(selectedDate))
  }

  useEffect(() => {
    reloadSlots()
  }, [selectedDate])

  const handleDistributeSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotTime.trim()) return

    setIsSubmitting(true)
    try {
      // 1. Save distributed slot
      addDistributedSlot(selectedDate, {
        time: slotTime.trim(),
        max: Number(capacity),
        notes: notes.trim() || 'Operator Distributed Window',
      })

      // 2. Broadcast SMS notification to all farmers if enabled
      if (notifyFarmers) {
        try {
          await broadcastEmptySlotNotification({
            centreName: selectedCentreObj.name,
            slotDate: selectedDate,
            slotTime: slotTime.trim(),
            availableSpots: Number(capacity),
          })
        } catch (alertErr) {
          console.error('Error broadcasting new slot alert:', alertErr)
        }
      }

      reloadSlots()

      const formatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      })

      setSuccessMessage(
        currentLang === 'mr'
          ? `✅ ${formatted} साठी नवीन स्लॉट (${slotTime} - ${capacity} जागा) यशस्वीपणे वितरित करण्यात आला!`
          : currentLang === 'hi'
          ? `✅ ${formatted} के लिए नया स्लॉट (${slotTime} - ${capacity} सीटें) वितरित किया गया!`
          : `✅ Slot (${slotTime} - ${capacity} spots) successfully distributed for ${formatted}!`
      )

      setTimeout(() => setSuccessMessage(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveSlot = (timeToRemove: string) => {
    removeDistributedSlot(selectedDate, timeToRemove)
    reloadSlots()
  }

  const handleQuickAddCapacity = (targetTime: string, currentMax: number) => {
    addDistributedSlot(selectedDate, {
      time: targetTime,
      max: currentMax + 5,
      notes: 'Expanded Capacity (+5 slots)',
    })
    reloadSlots()
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
          <Sliders className="w-3.5 h-3.5 text-amber-700" />
          <span>
            {currentLang === 'mr' ? 'ऑपरेटर स्लॉट वितरण प्रणाली' : currentLang === 'hi' ? 'ऑपरेटर स्लॉट वितरण' : 'Operator Slot Distribution'}
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {currentLang === 'mr' ? 'स्लॉट वितरण करा' : currentLang === 'hi' ? 'स्लॉट वितरित करें' : 'Distribute Time Slots'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {currentLang === 'mr'
            ? 'विशिष्ट तारखेसाठी नवीन वेळ आणि स्लॉट क्षमता जोडा, जेणेकरून शेतकरी बुकिंग करू शकतील.'
            : currentLang === 'hi'
            ? 'विशिष्ट तिथि के लिए नया समय और स्लॉट क्षमता जोड़ें ताकि किसान बुकिंग कर सकें।'
            : 'Add new time windows and slot capacities for particular dates to open them for farmer bookings.'}
        </p>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-600/20 animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="space-y-4">
        {/* Card 1: Target Date & APMC Centre Selector */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentLang === 'mr' ? 'तारीख निवडा' : currentLang === 'hi' ? 'तारीख चुनें' : 'Select Target Date'}</span>
            </label>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Date Picker Input */}
          <input
            type="date"
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold font-mono text-sm focus:border-amber-600 focus:bg-white focus:outline-none transition-all cursor-pointer"
          />

          {/* Shortcut Quick Date Pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t.todayLabel, date: today },
              { label: t.tomorrowLabel, date: tomorrow },
              { label: t.dayAfterLabel, date: dayAfter },
            ].map((d) => (
              <button
                type="button"
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`py-2 px-2.5 rounded-xl text-center border transition-all ${
                  selectedDate === d.date
                    ? 'bg-amber-600 border-amber-600 text-white font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300 font-medium'
                }`}
              >
                <span className="block text-[10px] opacity-80">{d.label}</span>
                <span className="text-xs font-mono font-bold">
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </span>
              </button>
            ))}
          </div>

          {/* APMC Center Select */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.preferredCentre}</span>
            </label>
            <select
              value={selectedCentreId}
              onChange={(e) => setSelectedCentreId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:border-amber-600 focus:bg-white focus:outline-none cursor-pointer"
            >
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name} ({c.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card 2: Create & Distribute New Slot Form */}
        <form onSubmit={handleDistributeSlot} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {currentLang === 'mr' ? 'नवीन वेळ व स्लॉट जोडा' : currentLang === 'hi' ? 'नया समय व स्लॉट जोड़ें' : 'Add Time Window & Slots'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              For Farmers
            </span>
          </div>

          {/* Time Window Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{currentLang === 'mr' ? 'वेळेची खिडकी (Time Slot)' : currentLang === 'hi' ? 'समय विंडो (Time Slot)' : 'Time Slot Window'}</span>
            </label>
            <input
              type="text"
              required
              placeholder="उदा. 05:30 PM - 07:00 PM"
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:border-amber-600 focus:bg-white focus:outline-none transition-all"
            />

            {/* Quick Preset Time Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {PRESET_WINDOWS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setSlotTime(p.label)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold shrink-0 transition-all border ${
                    slotTime === p.label
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capacity (Number of slots/spots) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentLang === 'mr' ? 'स्लॉट क्षमता (जागांची संख्या)' : currentLang === 'hi' ? 'स्लॉट क्षमता (सीटों की संख्या)' : 'Slot Capacity (Spots)'}</span>
              </label>
              <span className="text-xs font-mono font-black text-amber-800">
                {capacity} {currentLang === 'mr' ? 'जागा' : 'Spots'}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={capacity}
                onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm focus:border-amber-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Quick Capacity Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {[5, 10, 15, 20].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setCapacity(num)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                    capacity === num
                      ? 'bg-amber-100 text-amber-900 border-amber-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {num} Spots
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Special Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {currentLang === 'mr' ? 'टीप / शेरा (पर्यायी)' : currentLang === 'hi' ? 'टिप्पणी (वैकल्पिक)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              placeholder={currentLang === 'mr' ? 'उदा. विशेष संध्याकाळ खिडकी' : 'e.g. Special Evening Gate Opening'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-amber-600 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Notify All Farmers via SMS Toggle */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyFarmers}
              onChange={(e) => setNotifyFarmers(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-amber-700" />
                <span>{currentLang === 'mr' ? 'सर्व शेतकऱ्यांना लगेच SMS पाठवा' : currentLang === 'hi' ? 'सभी किसानों को तुरंत SMS भेजें' : 'Broadcast SMS Alert to All Farmers'}</span>
              </span>
              <span className="text-[11px] text-amber-700 leading-tight block mt-0.5">
                {currentLang === 'mr'
                  ? 'हा नवीन मोकळा स्लॉट उपलब्ध झाल्याची त्वरित सूचना सर्व शेतकऱ्यांना जाईल.'
                  : 'Automatically alerts all registered farmers that this new open slot is available to book.'}
              </span>
            </div>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{currentLang === 'mr' ? 'वितरित करत आहे...' : 'Distributing Slot...'}</span>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>
                  {currentLang === 'mr' ? 'स्लॉट वितरित करा व शेतकरी बुकिंगसाठी उघडा' : currentLang === 'hi' ? 'स्लॉट वितरित करें व बुकिंग खोलें' : 'Distribute Slot & Open for Farmers'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Card 3: Currently Available Slots for Selected Date */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {currentLang === 'mr' ? 'या तारखेचे एकूण स्लॉट' : currentLang === 'hi' ? 'इस तिथि के कुल स्लॉट' : 'Live Slots on Selected Date'}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {activeSlots.length} Windows
            </span>
          </div>

          <div className="space-y-2">
            {activeSlots.map((slot: any) => {
              const spotsLeft = slot.max - slot.booked
              const isFull = slot.booked >= slot.max
              const isOperatorCustom = Boolean(slot.distributedByOperator)

              return (
                <div
                  key={slot.time}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isOperatorCustom
                      ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-900 block">
                        {slot.time}
                      </span>
                      {isOperatorCustom && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-600 text-white">
                          DISTRIBUTED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {isFull
                        ? 'Capacity Reached (5/5 booked)'
                        : `🟢 ${spotsLeft} spots available (${slot.booked}/${slot.max} booked)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quick Capacity Add Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickAddCapacity(slot.time, slot.max)}
                      title="Add 5 more spots"
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 text-slate-700 text-[10px] font-bold transition-all shadow-2xs"
                    >
                      +5 Spots
                    </button>

                    {/* Delete Custom Slot Button */}
                    {isOperatorCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.time)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove custom slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
