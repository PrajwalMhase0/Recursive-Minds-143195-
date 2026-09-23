'use client'

import { X, CheckCircle2, Download, Printer, ShieldCheck, QrCode } from 'lucide-react'
import { Booking, Procurement } from '@/types/database'
import { Language, translations, getLocalizedCropName, getLocalizedUIString } from '@/lib/i18n'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking | null
  procurement: Procurement | null
  currentLang?: Language
}

export function ReceiptModal({ isOpen, onClose, booking, procurement, currentLang = 'en' }: ReceiptModalProps) {
  const t = translations[currentLang]

  if (!isOpen || !procurement || !booking) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">{t.officialReceipt}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-100/70 text-slate-900">
          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-md border border-slate-200 space-y-4">
            {/* Gov / Mandi Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 block">
                {getLocalizedUIString('govtApmcPortal', currentLang)}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">{t.appName.toUpperCase()}</h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {booking.procurement_centre?.name || 'Krishi Mandi Centre - Shirur'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.dbtSettled}</span>
              </div>
            </div>

            {/* Receipt & Farmer Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs border-b border-dashed border-slate-300 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.receiptNo}</span>
                <span className="font-mono font-bold text-slate-900">{procurement.receipt_no}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.dateTime}</span>
                <span className="font-medium text-slate-800">
                  {new Date(procurement.created_at || Date.now()).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="mt-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.farmerName}</span>
                <span className="font-bold text-slate-900">{booking.farmer?.name || t.verifiedFarmer}</span>
              </div>
              <div className="mt-1 text-right">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">{t.farmerId}</span>
                <span className="font-mono font-bold text-slate-800">
                  {booking.farmer?.farmer_id_code || 'KS-MH-8492'}
                </span>
              </div>
            </div>

            {/* Produce & Valuation Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">{t.cropCategory}</span>
                <span className="font-bold text-slate-900">{getLocalizedCropName(booking.crop, currentLang)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">{t.assignedGrade}</span>
                <span className="font-bold text-emerald-700">{procurement.grade}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">{t.netWeight}</span>
                <span className="font-black text-slate-900 font-mono">
                  {Number(procurement.actual_weight_quintals).toFixed(2)} {t.quintals}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 font-medium">{t.mspRate}</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(procurement.rate_per_quintal).toLocaleString('en-IN')} / {t.quintals}
                </span>
              </div>
              <div className="flex justify-between py-2 pt-3 bg-emerald-50 px-3 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-950 text-sm">{t.totalAmount}</span>
                <span className="font-black text-emerald-900 text-base font-mono">
                  ₹{Number(procurement.total_amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* DBT Bank Reference & QR */}
            <div className="pt-2 flex items-center justify-between border-t border-dashed border-slate-300">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">{getLocalizedUIString('dbtRefId', currentLang)}</span>
                <code className="text-[11px] font-mono font-black text-slate-900 block">
                  {procurement.payment_reference || 'DBT-PFMS-9823104921'}
                </code>
                <span className="text-[10px] text-slate-500 block">{getLocalizedUIString('aadhaarLinkedAccount', currentLang)}</span>
              </div>
              <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center">
                <QrCode className="w-10 h-10 text-slate-900" />
                <span className="text-[8px] text-slate-600 mt-0.5 font-mono font-bold">{getLocalizedUIString('verifiedBadge', currentLang)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-300 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printReceipt}</span>
          </button>
          <button
            onClick={() => alert(getLocalizedUIString('pdfDownloadedAlert', currentLang))}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 hover:opacity-95 transition-opacity"
          >
            <Download className="w-4 h-4 font-bold" />
            <span>{t.downloadPdf}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
