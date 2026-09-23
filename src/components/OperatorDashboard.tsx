'use client'

import { useState, useEffect } from 'react'
import { Booking, BookingStatus } from '@/types/database'
import { updateBookingStatusByOperator, checkInFarmer } from '@/lib/actions'
import { 
  Users, 
  ArrowRight, 
  Scale, 
  Banknote, 
  RefreshCw,
  Clock,
  Phone,
  Building2,
  Filter,
  Calendar,
  Globe,
  Wallet,
  CheckCircle2,
  Navigation
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedUIString } from '@/lib/i18n'
import { getBookingTransitSummary, getStoredUserCoordinates } from '@/lib/locationService'

interface OperatorDashboardProps {
  queueBookings: Booking[]
  onRefresh: () => void
  currentLang?: Language
}

export function OperatorDashboard({ 
  queueBookings, 
  onRefresh, 
  currentLang = 'en' 
}: OperatorDashboardProps) {
  const t = translations[currentLang]
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedBookingForWeighing, setSelectedBookingForWeighing] = useState<Booking | null>(null)
  const [weight, setWeight] = useState<number>(20)
  const [grade, setGrade] = useState<string>('Grade A - Premium')
  const [rate, setRate] = useState<number>(4892)
  const [selectedFilterCentre, setSelectedFilterCentre] = useState<string>('all')

  // Payment Settlement State
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null)
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE')
  const [paymentRef, setPaymentRef] = useState<string>('')
  const [paymentNotes, setPaymentNotes] = useState<string>('')

  // Auto-refresh when opening Operator Console
  useEffect(() => {
    onRefresh()
  }, [])

  const filteredBookings = selectedFilterCentre === 'all'
    ? queueBookings
    : queueBookings.filter(
        (b) =>
          b.centre_id === selectedFilterCentre ||
          b.procurement_centre?.id === selectedFilterCentre
      )

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setLoadingId(bookingId)
    try {
      await updateBookingStatusByOperator(bookingId, newStatus)
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleCheckIn = async (bookingId: string) => {
    setLoadingId(bookingId)
    try {
      await checkInFarmer(bookingId)
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  const handleCompleteWeighing = async () => {
    if (!selectedBookingForWeighing) return
    setLoadingId(selectedBookingForWeighing.id)
    try {
      await updateBookingStatusByOperator(selectedBookingForWeighing.id, 'PROCURED', {
        actualWeight: Number(weight),
        grade,
        ratePerQuintal: Number(rate),
      })
      setSelectedBookingForWeighing(null)
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  const openPaymentModal = (booking: Booking, defaultMode: 'ONLINE' | 'OFFLINE' = 'ONLINE') => {
    setSelectedBookingForPayment(booking)
    setPaymentMode(defaultMode)
    setPaymentRef(
      defaultMode === 'ONLINE'
        ? `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`
        : `CASH-APMC-${Math.floor(100000 + Math.random() * 900000)}`
    )
    setPaymentNotes('')
  }

  const handlePaymentModeSelect = (mode: 'ONLINE' | 'OFFLINE') => {
    setPaymentMode(mode)
    setPaymentRef(
      mode === 'ONLINE'
        ? `DBT-PFMS-${Math.floor(10000000 + Math.random() * 90000000)}`
        : `CASH-APMC-${Math.floor(100000 + Math.random() * 900000)}`
    )
  }

  const handleCompletePayment = async () => {
    if (!selectedBookingForPayment) return
    setLoadingId(selectedBookingForPayment.id)
    try {
      await updateBookingStatusByOperator(
        selectedBookingForPayment.id,
        'COMPLETED',
        undefined,
        {
          paymentMode,
          referenceNo: paymentRef,
          notes: paymentNotes
        }
      )
      setSelectedBookingForPayment(null)
      onRefresh()
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Operator Header Card */}
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                {t.operatorConsole}
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {getLocalizedUIString('apmcQueueManagement', currentLang)}
              </h2>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
            title="Refresh Live Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Centre Filter Dropdown */}
        <div className="flex items-center gap-2 pt-1">
          <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="text-xs font-bold text-slate-700 shrink-0">{t.filterByCentre}:</span>
          <select
            value={selectedFilterCentre}
            onChange={(e) => setSelectedFilterCentre(e.target.value)}
            className="w-full text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
          >
            <option value="all">🌐 {t.allCentres} ({queueBookings.length})</option>
            <option value="apmc_manmad_nashik">APMC-manmad-NASHIK</option>
            <option value="apmc_ghoti_nashik">APMC-Ghoti-NASHIK</option>
            <option value="apmc_pimpalgaon_baswant_nashik">APMC-pimpalgaon-baswant-NASHIK</option>
            <option value="apmc_malegaon">APMC-malegaon</option>
            <option value="apmc_chandwad">APMC-chandwad</option>
            <option value="perfect_krishi_nashik">Perfect Krishi Market Yard Pvt Ltd</option>
            <option value="apmc_nandgaon">APMC-nandgaon</option>
            <option value="apmc_nampur">APMC-nampur</option>
            <option value="apmc_satana">APMC-satana</option>
            <option value="apmc_devala">APMC-devala</option>
            <option value="apmc_sinnar">APMC-sinnar</option>
            <option value="apmc_pune">APMC-Pune</option>
            <option value="apmc_khed">APMC-khed</option>
            <option value="apmc_shirur">APMC-shirur</option>
            <option value="apmc_baramati">APMC-baramati</option>
            <option value="apmc_mumbai">APMC-Mumbai</option>
            <option value="mumbai_onion_potato">Mumabi onion and potato market</option>
            <option value="mumbai_fruit">MUMBAI fruit market</option>
          </select>
        </div>

        <p className="text-xs text-amber-900 font-medium">
          {getLocalizedUIString('operatorDashboardDesc', currentLang)}
        </p>
      </div>

      {/* Queue Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>{t.liveQueueTokens}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              {filteredBookings.length}
            </span>
          </h3>
          <span className="text-[11px] text-emerald-700 font-bold">
            {getLocalizedUIString('livePostgrestSync', currentLang)}
          </span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-sm shadow-xs space-y-1">
            <p className="font-semibold text-slate-700">{getLocalizedUIString('noQueueItems', currentLang)}</p>
            <p className="text-xs text-slate-400">{getLocalizedUIString('noQueueItemsDesc', currentLang)}</p>
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const isTargetLoading = loadingId === booking.id
            const farmerName = booking.farmer?.name || 'Farmer'
            const farmerIdCode = booking.farmer?.farmer_id_code || 'KS-MH-XXXX'
            const userCoords = typeof window !== 'undefined' ? getStoredUserCoordinates() : null
            const transit = getBookingTransitSummary(booking, userCoords)

            return (
              <div
                key={booking.id}
                className={`p-4 rounded-3xl border transition-all ${
                  booking.status === 'AT_COUNTER'
                    ? 'bg-amber-50/70 border-amber-400 shadow-md shadow-amber-900/5'
                    : booking.status === 'IN_QUEUE'
                    ? 'bg-white border-emerald-300 shadow-sm'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-black text-sm text-emerald-800">
                      {booking.queue_number ? `#${booking.queue_number}` : '--'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{farmerName}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                          {farmerIdCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>{getLocalizedCropName(booking.crop, currentLang)} &bull; {booking.approx_quantity_quintals} {t.quintals}</span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Calendar className="w-3 h-3 text-amber-700" /> {booking.slot_date}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <Clock className="w-3 h-3 text-emerald-600" /> {booking.slot_time}
                        </span>
                        {booking.procurement_centre?.name && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {booking.procurement_centre.name.replace('Krishi Mandi Centre - ', '')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      booking.status === 'AT_COUNTER'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                        : booking.status === 'IN_QUEUE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : booking.status === 'PROCURED'
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {booking.status === 'BOOKED'
                      ? t.confirmed
                      : booking.status === 'IN_QUEUE'
                      ? t.stepWaiting
                      : booking.status === 'AT_COUNTER'
                      ? t.stepAtCounter
                      : booking.status === 'PROCURED' || booking.status === 'COMPLETED'
                      ? t.stepCompleted
                      : booking.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Operator Actions for this farmer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="space-y-1">
                    {/* Time and Distance of that user (Above mobile number) */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 w-fit shadow-2xs">
                      <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="font-mono">{transit.distanceKm} km</span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="font-mono">~{transit.travelTimeMins} {getLocalizedUIString('mins', currentLang)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{booking.farmer?.phone || getLocalizedUIString('mobileNotProvided', currentLang)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {booking.status === 'BOOKED' && (
                      <button
                        disabled={isTargetLoading}
                        onClick={() => handleCheckIn(booking.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-xs"
                      >
                        {getLocalizedUIString('checkInIssueToken', currentLang)}
                      </button>
                    )}

                    {booking.status === 'IN_QUEUE' && (
                      <button
                        disabled={isTargetLoading}
                        onClick={() => handleStatusChange(booking.id, 'AT_COUNTER')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 shadow-sm shadow-amber-500/20"
                      >
                        <span>{getLocalizedUIString('callToCounter', currentLang)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {booking.status === 'AT_COUNTER' && (
                      <button
                        disabled={isTargetLoading}
                        onClick={() => {
                          setSelectedBookingForWeighing(booking)
                          setWeight(booking.approx_quantity_quintals || 20)
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{getLocalizedUIString('weighAndGrade', currentLang)}</span>
                      </button>
                    )}

                    {booking.status === 'PROCURED' && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center rounded-xl bg-teal-50 border border-teal-200 p-0.5 shadow-2xs">
                          <button
                            disabled={isTargetLoading}
                            onClick={() => openPaymentModal(booking, 'ONLINE')}
                            className="px-2.5 py-1.5 text-[11px] font-bold text-teal-900 hover:text-teal-950 flex items-center gap-1 transition-colors cursor-pointer"
                            title="Settle Payment"
                          >
                            <Banknote className="w-3.5 h-3.5 text-teal-600" />
                            <span>{getLocalizedUIString('settlePayment', currentLang)}:</span>
                          </button>
                          <button
                            disabled={isTargetLoading}
                            onClick={() => openPaymentModal(booking, 'ONLINE')}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                            title="Settle Online (DBT/Bank/UPI)"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{getLocalizedUIString('paymentOnline', currentLang)}</span>
                          </button>
                          <button
                            disabled={isTargetLoading}
                            onClick={() => openPaymentModal(booking, 'OFFLINE')}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-teal-300 text-xs font-bold flex items-center gap-1 transition-all ml-1 shadow-xs"
                            title="Settle Offline (Cash/Cheque)"
                          >
                            <Wallet className="w-3 h-3 text-emerald-700" />
                            <span>{getLocalizedUIString('paymentOffline', currentLang)}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Weigh & Grade Modal */}
      {selectedBookingForWeighing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">{t.weighGrading}</h3>
              </div>
              <button
                onClick={() => setSelectedBookingForWeighing(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{t.farmerName}:</span>
                <span className="font-bold text-slate-900">{selectedBookingForWeighing.farmer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t.cropCategory}:</span>
                <span className="font-bold text-emerald-700">{getLocalizedCropName(selectedBookingForWeighing.crop, currentLang)}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.actualWeight} ({t.quintals})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.assignedGrade}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                >
                  <option value="Grade A - Premium">{getLocalizedUIString('gradeAPremium', currentLang)}</option>
                  <option value="Grade B - Standard">{getLocalizedUIString('gradeBStandard', currentLang)}</option>
                  <option value="Grade C - Fair">{getLocalizedUIString('gradeCFair', currentLang)}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t.mspRate} (₹ / {t.quintals})
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">{getLocalizedUIString('totalCalculatedPayout', currentLang)}:</span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  ₹{(weight * rate).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedBookingForWeighing(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                disabled={loadingId !== null}
                onClick={handleCompleteWeighing}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:opacity-95"
              >
                {getLocalizedUIString('completeAndIssueReceipt', currentLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Payment Modal (Online / Offline) */}
      {selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {getLocalizedUIString('settlePayment', currentLang)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {getLocalizedUIString('paymentMode', currentLang)} &bull; {selectedBookingForPayment.farmer?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Farmer & Procurement Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t.farmerName}:</span>
                <span className="font-bold text-slate-900">{selectedBookingForPayment.farmer?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t.cropCategory}:</span>
                <span className="font-bold text-emerald-700">
                  {getLocalizedCropName(selectedBookingForPayment.crop, currentLang)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">{t.actualWeight}:</span>
                <span className="font-semibold text-slate-800">
                  {selectedBookingForPayment.procurements?.[0]?.actual_weight_quintals || selectedBookingForPayment.approx_quantity_quintals || 20} {t.quintals}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-bold">{t.totalAmount}:</span>
                <span className="font-black text-emerald-700 text-lg">
                  ₹{(() => {
                    const proc = selectedBookingForPayment.procurements?.[0]
                    const amt = proc?.total_amount || (selectedBookingForPayment.approx_quantity_quintals || 20) * 4892
                    return Number(amt).toLocaleString('en-IN')
                  })()}
                </span>
              </div>
            </div>

            {/* 2 Payment Mode Options: Online vs Offline */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                {getLocalizedUIString('paymentMode', currentLang)}:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Online Option */}
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect('ONLINE')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    paymentMode === 'ONLINE'
                      ? 'border-teal-600 bg-teal-50/80 text-teal-950 shadow-sm ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-2 rounded-xl ${paymentMode === 'ONLINE' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    {paymentMode === 'ONLINE' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-[9px] font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs block text-slate-900">
                    {getLocalizedUIString('paymentOnline', currentLang)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {currentLang === 'mr' ? 'थेट बँक खाते (DBT/UPI)' : currentLang === 'hi' ? 'सीधे बैंक खाता (DBT/UPI)' : 'Direct Bank / DBT Transfer'}
                  </p>
                </button>

                {/* Offline Option */}
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect('OFFLINE')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                    paymentMode === 'OFFLINE'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-2 ring-emerald-600/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-2 rounded-xl ${paymentMode === 'OFFLINE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Wallet className="w-4 h-4" />
                    </div>
                    {paymentMode === 'OFFLINE' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-xs block text-slate-900">
                    {getLocalizedUIString('paymentOffline', currentLang)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {currentLang === 'mr' ? 'रोख / बाजार समिती चेक' : currentLang === 'hi' ? 'नकद / मंडी चेक वाउचर' : 'Mandi Cash / Cheque Voucher'}
                  </p>
                </button>
              </div>
            </div>

            {/* Reference Number Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {paymentMode === 'ONLINE' ? 'DBT / Transaction Reference ID' : 'Mandi Cash Voucher / Cheque Ref ID'}:
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                {currentLang === 'mr' ? 'नोंद (ऐच्छिक)' : currentLang === 'hi' ? 'टिप्पणी (वैकल्पिक)' : 'Notes (Optional)'}:
              </label>
              <input
                type="text"
                placeholder={paymentMode === 'ONLINE' ? 'e.g. Cleared via PFMS Aadhaar bridge' : 'e.g. Cash disbursed at Counter 1'}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>

            {/* SMS Notification Info */}
            <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 text-[11px] text-teal-900 flex items-center gap-2">
              <span className="text-base">📱</span>
              <span>
                {paymentMode === 'ONLINE' 
                  ? 'Farmer will receive SMS notification confirming online DBT settlement to bank account.'
                  : 'Farmer will receive SMS notification confirming cash/cheque voucher disbursement at counter.'}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBookingForPayment(null)}
                className="w-1/3 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={loadingId === selectedBookingForPayment.id}
                onClick={handleCompletePayment}
                className="w-2/3 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {getLocalizedUIString('confirmPaymentSettlement', currentLang)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
