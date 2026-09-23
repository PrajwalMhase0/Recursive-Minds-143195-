'use client'

import { useState } from 'react'
import { 
  CalendarPlus, 
  User, 
  Phone, 
  Sprout, 
  Scale, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Printer,
  ChevronDown
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedUIString } from '@/lib/i18n'
import { ProcurementCentre } from '@/types/database'
import { bookSlot, checkInFarmer } from '@/lib/actions'
import { getCropDailyRate } from '@/lib/mandiRatesService'

interface OperatorWalkInBookingProps {
  centres: ProcurementCentre[]
  currentLang: Language
  onBookingSuccess: () => void
}

const CROP_OPTIONS = [
  { id: 'Soybean', nameEn: 'Soybean', nameMr: 'सोयाबीन', icon: '🌱' },
  { id: 'Cotton', nameEn: 'Cotton', nameMr: 'कापूस', icon: '⚪' },
  { id: 'Onion', nameEn: 'Onion', nameMr: 'कांदा', icon: '🧅' },
  { id: 'Wheat', nameEn: 'Wheat', nameMr: 'गहू', icon: '🌾' },
  { id: 'Gram', nameEn: 'Gram / Chana', nameMr: 'हरभरा / चना', icon: '🧆' },
  { id: 'Tur', nameEn: 'Tur Dal', nameMr: 'तूर डाळ', icon: '🥣' },
  { id: 'Tomato', nameEn: 'Tomato', nameMr: 'टोमॅटो', icon: '🍅' },
  { id: 'Maize', nameEn: 'Maize / Corn', nameMr: 'मका', icon: '🌽' },
  { id: 'Potato', nameEn: 'Potato', nameMr: 'बटाटा', icon: '🥔' },
  { id: 'Paddy', nameEn: 'Paddy / Rice', nameMr: 'भात / तांदूळ', icon: '🍚' },
]

export function OperatorWalkInBooking({ centres, currentLang, onBookingSuccess }: OperatorWalkInBookingProps) {
  const t = translations[currentLang]

  const [farmerName, setFarmerName] = useState('')
  const [farmerPhone, setFarmerPhone] = useState('')
  const [selectedCrop, setSelectedCrop] = useState('Soybean')
  const [quantity, setQuantity] = useState(25)
  const [selectedCentreId, setSelectedCentreId] = useState(centres[0]?.id || 'apmc_shirur')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedData, setConfirmedData] = useState<{
    bookingCode: string
    tokenNumber?: number
    farmerName: string
    crop: string
    quantity: number
  } | null>(null)

  const handleWalkInBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!farmerName.trim()) {
      alert(currentLang === 'mr' ? 'कृपया शेतकऱ्याचे नाव टाका.' : 'Please enter farmer name.')
      return
    }

    setIsSubmitting(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      const hours = now.getHours()
      const timeStr = `${hours % 12 || 12}:00 ${hours >= 12 ? 'PM' : 'AM'} - ${(hours + 1) % 12 || 12}:00 ${hours + 1 >= 12 ? 'PM' : 'AM'}`

      // 1. Create walk-in booking
      const res = await bookSlot({
        farmerId: `farmer_walkin_${Date.now()}`,
        farmerName: farmerName.trim(),
        farmerPhone: farmerPhone.trim() || '9823145892',
        centreId: selectedCentreId,
        crop: selectedCrop,
        quantity,
        slotDate: today,
        slotTime: timeStr,
      })

      if (res.success && res.booking) {
        // 2. Automatically check in the farmer so they get a token instantly!
        try {
          await checkInFarmer(res.booking.id)
        } catch (checkInErr) {
          console.error('Error in auto check-in:', checkInErr)
        }

        setConfirmedData({
          bookingCode: res.booking.booking_code,
          tokenNumber: res.booking.queue_number || 19,
          farmerName: farmerName.trim(),
          crop: selectedCrop,
          quantity,
        })
      } else {
        alert(res.error || 'Booking failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Walk-in booking error:', err)
      alert(err.message || 'Error creating walk-in booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setConfirmedData(null)
    setFarmerName('')
    setFarmerPhone('')
    setQuantity(25)
  }

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>
            {currentLang === 'mr' ? 'थेट हजेरी नोंदणी कक्ष (Walk-in Desk)' : currentLang === 'hi' ? 'सीधे किसान आगमन डेस्क' : 'On-Site Walk-In Desk'}
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {currentLang === 'mr' ? 'शेतकरी स्पॉट स्लॉट बुकिंग' : currentLang === 'hi' ? 'किसान स्पॉट स्लॉट बुकिंग' : 'Spot Slot Booking for Farmers'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {currentLang === 'mr'
            ? 'नोंदणी नसलेल्या शेतकऱ्यांना थेट केंद्रावर त्वरित स्लॉट आणि टोकन क्रमांक जारी करा.'
            : currentLang === 'hi'
            ? 'बिना पूर्व बुकिंग वाले किसानों को तुरंत स्लॉट और टोकन जारी करें।'
            : 'Issue instant slots and queue tokens for farmers arriving directly at the APMC yard without prior booking.'}
        </p>
      </div>

      {confirmedData ? (
        /* Confirmed Token Slip Card */
        <div className="p-6 rounded-3xl bg-white border-2 border-emerald-400 text-center space-y-4 shadow-xl shadow-emerald-900/5 animate-in zoom-in-95 duration-200">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
              {currentLang === 'mr' ? 'थेट स्लॉट व टोकन निश्चित!' : currentLang === 'hi' ? 'स्पॉट स्लॉट और टोकन जारी!' : 'Walk-in Token Issued!'}
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {confirmedData.farmerName}
            </h3>
            <p className="text-xs text-slate-500">
              {getLocalizedCropName(confirmedData.crop, currentLang)} &bull; {confirmedData.quantity} {t.quintals}
            </p>
          </div>

          {/* Big Token Number Display */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 inline-block w-full max-w-xs">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              {currentLang === 'mr' ? 'रांगेतील टोकन क्रमांक' : currentLang === 'hi' ? 'कतार टोकन नंबर' : 'Active Queue Token'}
            </span>
            <div className="text-4xl font-black font-mono text-emerald-950 mt-1">
              #{confirmedData.tokenNumber}
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-600 block mt-1">
              Ref: {confirmedData.bookingCode}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => window.print()}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printReceipt}</span>
            </button>
            <button
              onClick={handleReset}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
            >
              {currentLang === 'mr' ? '+ दुसऱ्या शेतकऱ्याची नोंद करा' : currentLang === 'hi' ? '+ दूसरे किसान को जोड़ें' : '+ Book Another Farmer'}
            </button>
            <button
              onClick={onBookingSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
            >
              <span>{currentLang === 'mr' ? 'रांगेत पहा' : currentLang === 'hi' ? 'कतार में देखें' : 'View in Queue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Walk-in Booking Form */
        <form onSubmit={handleWalkInBooking} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-100 space-y-4">
          {/* Farmer Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'mr' ? 'शेतकऱ्याचे संपूर्ण नाव' : currentLang === 'hi' ? 'किसान का पूरा नाम' : 'Farmer Full Name'}</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={currentLang === 'mr' ? 'उदा. ज्ञानेश्वर पाटील' : currentLang === 'hi' ? 'उदा. ज्ञानेश्वर पाटिल' : 'e.g. Ramesh Patil'}
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Farmer Mobile Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'mr' ? 'मोबाईल नंबर' : currentLang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Phone Number'}</span>
            </label>
            <input
              type="tel"
              placeholder="98XXXXXXXX"
              maxLength={10}
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Crop Selection with Daily Rates beside each crop */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.selectCrop}</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                ₹{getCropDailyRate(selectedCrop).modalPrice.toLocaleString('en-IN')}/Qtl (Today)
              </span>
            </div>

            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:border-emerald-600 focus:bg-white focus:outline-none appearance-none cursor-pointer pr-10"
              >
                {CROP_OPTIONS.map((c) => {
                  const cRate = getCropDailyRate(c.id)
                  return (
                    <option key={c.id} value={c.id}>
                      {c.icon} {getLocalizedCropName(c.id, currentLang)} — ₹{cRate.modalPrice.toLocaleString('en-IN')}/Qtl {cRate.govtMsp > 0 ? `(MSP: ₹${cRate.govtMsp.toLocaleString('en-IN')})` : ''}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Chips with Rate beside crop */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {CROP_OPTIONS.slice(0, 5).map((c) => {
                const cRate = getCropDailyRate(c.id)
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedCrop(c.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition-all border flex items-center gap-1 ${
                      selectedCrop === c.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
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

          {/* Quantity in Quintals */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>{t.quantityQuintals}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="500"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                {t.quintals} (~{quantity * 100} kg)
              </span>
            </div>
          </div>

          {/* Mandi Centre */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.preferredCentre}</span>
            </label>
            <div className="relative">
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs focus:border-emerald-600 focus:bg-white focus:outline-none appearance-none cursor-pointer pr-10"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 pt-3"
          >
            {isSubmitting ? (
              <span>{t.confirmingBooking}</span>
            ) : (
              <>
                <CalendarPlus className="w-4 h-4 font-bold" />
                <span>
                  {currentLang === 'mr' ? 'थेट हजेरी टोकन द्या व रांगेत जोडा' : currentLang === 'hi' ? 'स्पॉट टोकन जारी करें और कतार में जोड़ें' : 'Issue Walk-In Token & Add to Queue'}
                </span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
