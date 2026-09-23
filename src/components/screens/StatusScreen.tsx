'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  Receipt
} from 'lucide-react'
import { Language, translations, getLocalizedCropName, getLocalizedBookingStatus } from '@/lib/i18n'
import { Booking, Procurement } from '@/types/database'
import { ReceiptModal } from '@/components/ReceiptModal'

interface StatusScreenProps {
  bookings: Booking[]
  currentLang: Language
}

export function StatusScreen({ bookings, currentLang }: StatusScreenProps) {
  const t = translations[currentLang]

  const [selectedReceipt, setSelectedReceipt] = useState<{
    booking: Booking
    procurement: Procurement
  } | null>(null)

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.statusReceipts}</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t.dbtStatusDesc}
        </p>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-white border border-slate-200 text-slate-500 text-sm shadow-xs">
            {t.noTransactions}
          </div>
        ) : (
          bookings.map((booking) => {
            const procurement = booking.procurements && booking.procurements[0]
            const isCompleted = booking.status === 'COMPLETED'
            const isProcured = booking.status === 'PROCURED' || isCompleted

            return (
              <div
                key={booking.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-md shadow-slate-100 space-y-4 relative overflow-hidden"
              >
                {/* Header line */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-base">
                        {getLocalizedCropName(booking.crop, currentLang)}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                        {booking.booking_code}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      {booking.procurement_centre?.name || 'Krishi Mandi Centre - Shirur'}
                    </span>
                  </div>

                  {/* Payment / Stage badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : isProcured
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t.dbtSettled}</span>
                      </>
                    ) : isProcured ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-teal-700" />
                        <span>{t.paymentProcessing}</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>{booking.status === 'BOOKED' ? t.confirmed : booking.status === 'IN_QUEUE' ? t.stepWaiting : getLocalizedBookingStatus(booking.status, currentLang)}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Stage Progression Steps Bar */}
                <div className="py-2.5 px-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span className="text-emerald-700">1. {t.navBook}</span>
                    <span>&rarr;</span>
                    <span className={booking.status !== 'BOOKED' ? 'text-emerald-700' : 'text-slate-400'}>
                      2. {t.stepCheckedIn}
                    </span>
                    <span>&rarr;</span>
                    <span className={isProcured ? 'text-emerald-700' : 'text-slate-400'}>
                      3. {t.stepAtCounter}
                    </span>
                    <span>&rarr;</span>
                    <span className={isCompleted ? 'text-emerald-700' : 'text-slate-400'}>
                      4. {t.dbtSettled}
                    </span>
                  </div>
                </div>

                {/* Financial Summary & Receipt Trigger */}
                {procurement ? (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">{t.netDisbursed}</span>
                      <span className="text-lg font-black text-slate-900 font-mono">
                        ₹{Number(procurement.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {procurement.grade} &bull; {procurement.actual_weight_quintals} {t.quintals}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt({ booking, procurement })}
                      className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 hover:opacity-95 transition-opacity"
                    >
                      <Receipt className="w-3.5 h-3.5 font-bold" />
                      <span>{t.viewReceipt}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{t.estVolume}: {booking.approx_quantity_quintals} {t.quintals}</span>
                    <span className="italic text-[11px]">{t.procurementPending}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
          booking={selectedReceipt.booking}
          procurement={selectedReceipt.procurement}
          currentLang={currentLang}
        />
      )}
    </div>
  )
}
