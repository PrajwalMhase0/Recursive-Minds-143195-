'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Mic, Volume2, Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Language, LANGUAGES_LIST, translations, getLocalizedUIString, getLocalizedCropName } from '@/lib/i18n'
import { speakText, stopSpeaking } from '@/lib/speech'
import { Booking } from '@/types/database'

interface VoiceAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  currentLang: Language
  activeBooking?: Booking | null
  onNavigateTab: (tab: 'home' | 'book' | 'queue' | 'status') => void
  onPreselectCrop?: (crop: string) => void
}

// Multilingual keywords for voice intent recognition across all 16 Indian languages
const QUEUE_KEYWORDS = [
  'रांग', 'कतार', 'टोकन', 'नंबर', 'क्रमांक', 'लाइन', 'प्रतीक्षा',
  'queue', 'token', 'status', 'waiting', 'position', 'turn',
  'કતાર', 'ટોકન', 'સ્થિતિ',
  'ਕਤਾਰ', 'ਟੋਕਨ', 'ਨੰਬਰ',
  'কিউ', 'লাইন', 'টোকেন',
  'క్యూ', 'లైన్', 'టోకెన్',
  'வரிசை', 'டோக்கன்', 'எண்',
  'ಕ್ಯೂ', 'ಸರದಿ', 'ಟೋಕನ್',
  'ക്യൂ', 'വരി', 'ടോക്കൺ',
  'ଧାଡ଼ି', 'ଟୋକନ୍',
  'শাৰী', 'টোকেন',
  'قطار', 'ٹوکن'
]

const BOOK_KEYWORDS = [
  'बुक करा', 'स्लॉट बुक', 'बुकिंग करा', 'नोंदणी करा', 'स्लॉट नोंदणी',
  'book slot', 'reserve slot', 'booking', 'schedule slot',
  'બુક કરો', 'સ્લોટ બુકિંગ',
  'ਸਲਾਟ ਬੁੱਕ',
  'বুক করুন', 'স্লট বুকিং',
  'స్లాట్ బుక్', 'బుకింగ్ చేయండి',
  'முன்பதிவு செய்ய', 'ஸ்லாட் புக்',
  'ಸ್ಲಾಟ್ ಬುಕ್ ಮಾಡಿ',
  'സ്ലോട്ട് ബുക്ക് ചെയ്യുക',
  'ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ',
  'স্লট বুক কৰক',
  'سلاٹ بک کریں'
]

const PAYMENT_KEYWORDS = [
  'पेमेंट', 'पावती', 'पैसे', 'खात्यात', 'रक्कम', 'हमीभाव', 'रुपये', 'भुगतान', 'रसीद',
  'payment', 'receipt', 'dbt', 'money', 'amount', 'disbursed',
  'ચુકવણી', 'રસીદ', 'પૈસા',
  'ਭੁਗਤਾਨ', 'ਰਸੀਦ', 'ਪੈਸੇ',
  'পেমেন্ট', 'রসিদ', 'টাকা',
  'చెల్లింపు', 'రసీదు', 'డబ్బు',
  'பணம்', 'ரசீது', 'பண வரவு',
  'ಪಾವತಿ', 'ರಶೀದಿ', 'ಹಣ',
  'പണം', 'രസീത്',
  'ପେମେଣ୍ଟ', 'ରସିଦ୍',
  'পেমেন্ট', 'ৰচিদ',
  'ادائیگی', 'رسید'
]

function detectExplicitNavigationIntent(spoken: string): 'queue' | 'book' | 'payment' | 'chat' {
  const lower = spoken.toLowerCase()

  // Only trigger direct screen navigation if explicitly requested
  const wantsQueueNav = QUEUE_KEYWORDS.some((kw) => lower.includes(kw)) && 
    (lower.includes('दाखवा') || lower.includes('दिखाओ') || lower.includes('show') || lower.includes('open') || lower.includes('जा') || lower.includes('पहा'))
  
  const wantsBookNav = BOOK_KEYWORDS.some((kw) => lower.includes(kw))
  
  const wantsPaymentNav = PAYMENT_KEYWORDS.some((kw) => lower.includes(kw)) && 
    (lower.includes('दाखवा') || lower.includes('दिखाओ') || lower.includes('पावती') || lower.includes('रसीद') || lower.includes('receipt') || lower.includes('status'))

  if (wantsBookNav) return 'book'
  if (wantsQueueNav) return 'queue'
  if (wantsPaymentNav) return 'payment'

  // Otherwise, treat as natural language question for AI answering
  return 'chat'
}

export function VoiceAssistantModal({
  isOpen,
  onClose,
  currentLang,
  activeBooking,
  onNavigateTab,
  onPreselectCrop,
}: VoiceAssistantModalProps) {
  const t = translations[currentLang]
  const langInfo = useMemo(() => LANGUAGES_LIST.find((l) => l.id === currentLang), [currentLang])
  const [isListening, setIsListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [assistantReply, setAssistantReply] = useState('')
  const [suggestedAction, setSuggestedAction] = useState<{ label: string; tab: 'home' | 'book' | 'queue' | 'status' } | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen) {
      setTranscript('')
      setSuggestedAction(null)
      const greeting = getLocalizedUIString('voiceGreeting', currentLang)
      setAssistantReply(greeting)

      // Greet user in their selected language
      try {
        speakText(greeting, currentLang)
      } catch {}
    } else {
      stopSpeaking()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }

    return () => {
      stopSpeaking()
    }
  }, [isOpen, currentLang])

  if (!isOpen) return null

  const handleClose = () => {
    stopSpeaking()
    onClose()
  }

  // Answer user query in their selected language
  const handleProcessQuery = async (queryText: string) => {
    const text = queryText.trim()
    if (!text) return

    setTranscript(text)
    setIsThinking(true)
    setSuggestedAction(null)

    // Check if it's a direct navigation request
    const explicitIntent = detectExplicitNavigationIntent(text)

    if (explicitIntent === 'book') {
      const reply = `${t.selectCrop}: ${getLocalizedCropName('Soybean', currentLang)}. ${t.preferredCentre}: APMC Shirur.`
      setAssistantReply(reply)
      setIsThinking(false)
      speakText(reply, currentLang)
      if (onPreselectCrop) onPreselectCrop('Soybean')
      setSuggestedAction({
        label: `${getLocalizedUIString('bookSlot', currentLang)} →`,
        tab: 'book'
      })
      return
    }

    if (explicitIntent === 'queue') {
      let reply = ''
      if (activeBooking && activeBooking.queue_number) {
        reply = `${t.namaste}! ${t.currentPosition}: #${activeBooking.queue_number}. ${t.farmersAhead}: 12. ${t.estWaitTime}: 45 ${getLocalizedUIString('mins', currentLang)}.`
      } else {
        reply = getLocalizedUIString('emptyQueueDesc', currentLang)
      }
      setAssistantReply(reply)
      setIsThinking(false)
      speakText(reply, currentLang)
      setSuggestedAction({
        label: `${getLocalizedUIString('trackQueue', currentLang)} →`,
        tab: 'queue'
      })
      return
    }

    if (explicitIntent === 'payment') {
      const reply = `${t.dbtSettled}: ₹1,21,321 (${t.receiptNo}: REC-2026-8492).`
      setAssistantReply(reply)
      setIsThinking(false)
      speakText(reply, currentLang)
      setSuggestedAction({
        label: `${getLocalizedUIString('statusReceipts', currentLang)} →`,
        tab: 'status'
      })
      return
    }

    // Call Gemini AI chat API in the user's selected language
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: currentLang,
          isResearchMode: false,
          history: [
            {
              role: 'model',
              text: `You are KrishiSetu Voice Assistant. Answer concisely in 1-3 simple sentences in the farmer's selected language (${currentLang}). Give actionable guidance for MSP, crop diseases, mandi queue, or slot booking.`
            }
          ]
        })
      })

      if (!res.ok) throw new Error('Chat API error')
      const data = await res.json()
      const reply = data.reply || getLocalizedUIString('networkRetryMsg', currentLang)

      setAssistantReply(reply)
      // Speak the answer aloud in the selected language
      speakText(reply, currentLang)

      // Provide contextual button if relevant
      const lowerReply = reply.toLowerCase()
      if (lowerReply.includes('बुक') || lowerReply.includes('स्लॉट') || lowerReply.includes('book') || lowerReply.includes('नोंदणी')) {
        setSuggestedAction({ label: `${getLocalizedUIString('bookSlot', currentLang)} →`, tab: 'book' })
      } else if (lowerReply.includes('रांग') || lowerReply.includes('कतार') || lowerReply.includes('queue') || lowerReply.includes('टोकन')) {
        setSuggestedAction({ label: `${getLocalizedUIString('trackQueue', currentLang)} →`, tab: 'queue' })
      }
    } catch (err) {
      console.error('Voice assistant AI error:', err)
      const fallback = getLocalizedUIString('networkRetryMsg', currentLang)
      setAssistantReply(fallback)
      speakText(fallback, currentLang)
    } finally {
      setIsThinking(false)
    }
  }

  const startMicListening = () => {
    stopSpeaking()

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition

    if (!SpeechRecognition) {
      handleProcessQuery(getLocalizedUIString('cmdQueue', currentLang))
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = langInfo?.speechLang || 'hi-IN'
      recognition.continuous = false
      recognition.interimResults = false

      setIsListening(true)
      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript
        setIsListening(false)
        handleProcessQuery(spoken)
      }

      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 flex flex-col shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {t.voiceAssistant}
              </h3>
              <p className="text-xs text-emerald-700 font-semibold">
                {langInfo?.nativeName} ({langInfo?.name}) &bull; {getLocalizedUIString('sixteenLanguagesNotice', currentLang)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central Audio / Mic Pulsing Icon */}
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
          <button
            onClick={startMicListening}
            disabled={isThinking}
            title={isListening ? getLocalizedUIString('listeningPrompt', currentLang) : getLocalizedUIString('speakQuestion', currentLang)}
            className={`relative p-6 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 scale-110 animate-pulse'
                : isThinking
                ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/30'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-600/30 hover:scale-105 active:scale-95'
            }`}
          >
            {isThinking ? (
              <Loader2 className="w-8 h-8 font-bold animate-spin" />
            ) : (
              <Mic className="w-8 h-8 font-bold" />
            )}
            {isListening && (
              <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping opacity-75" />
            )}
          </button>

          <div>
            <p className="text-sm font-bold text-slate-800">
              {isListening
                ? getLocalizedUIString('listeningPrompt', currentLang)
                : isThinking
                ? getLocalizedUIString('thinkingStatus', currentLang)
                : getLocalizedUIString('tapMicPrompt', currentLang)}
            </p>
            {transcript && (
              <p className="mt-1.5 text-xs text-emerald-800 italic bg-emerald-50 py-1 px-3 rounded-full inline-block border border-emerald-200 font-medium max-w-full truncate">
                "{transcript}"
              </p>
            )}
          </div>
        </div>

        {/* Assistant Response Box */}
        {assistantReply && (
          <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <Volume2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {assistantReply}
                </p>
              </div>
              <button
                onClick={() => speakText(assistantReply, currentLang)}
                title={getLocalizedUIString('audioButtonLabel', currentLang)}
                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors shrink-0"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Suggested Action Button */}
            {suggestedAction && (
              <div className="pt-1.5 border-t border-slate-200/60 flex justify-end">
                <button
                  onClick={() => {
                    handleClose()
                    onNavigateTab(suggestedAction.tab)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>{suggestedAction.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Low-Literacy 1-Click Voice Command Chips in Selected Language */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {getLocalizedUIString('quickVoiceCommands', currentLang)}
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => handleProcessQuery(getLocalizedUIString('cmdQueue', currentLang))}
              disabled={isThinking || isListening}
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-800 flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <span className="font-semibold">
                {getLocalizedUIString('cmdQueue', currentLang)}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={() => handleProcessQuery(getLocalizedUIString('cmdBook', currentLang))}
              disabled={isThinking || isListening}
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-800 flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <span className="font-semibold">
                {getLocalizedUIString('cmdBook', currentLang)}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </button>

            <button
              onClick={() => handleProcessQuery(getLocalizedUIString('cmdPayment', currentLang))}
              disabled={isThinking || isListening}
              className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs text-slate-800 flex items-center justify-between transition-all active:scale-[0.99]"
            >
              <span className="font-semibold">
                {getLocalizedUIString('cmdPayment', currentLang)}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
