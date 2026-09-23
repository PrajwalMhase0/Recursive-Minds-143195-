'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  X, 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldCheck, 
  Bot, 
  Search,
  BookOpen,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { Language, translations, LANGUAGES_LIST, getLocalizedUIString } from '@/lib/i18n'
import { speakText } from '@/lib/speech'

interface Message {
  id: string
  role: 'user' | 'model'
  text: string
  timestamp: string
  source?: 'google_gemini' | 'govt_agmarknet' | 'zero_key_ai' | 'krishi_engine'
  model?: string
  isResearch?: boolean
  verifiedGovtData?: boolean
}

interface KrishiChatbotModalProps {
  isOpen: boolean
  onClose: () => void
  currentLang: Language
}

const QUICK_PROMPTS = [
  { 
    labelMr: '🔬 सोयाबीन खोडकीड संशोधन', 
    labelHi: '🔬 सोयाबीन तना कीट शोध', 
    labelEn: '🔬 Soybean Stem Borer Research', 
    query: 'सोयाबीन वरील खोडकिडीवर सखोल संशोधन, जैविक नियंत्रण व उपाय काय आहेत?',
    isResearch: true 
  },
  { 
    labelMr: '🧅 कांदा आजचा बाजारभाव', 
    labelHi: '🧅 प्याज आज का भाव', 
    labelEn: '🧅 Onion Today Rate', 
    query: 'नाशिक व लासलगाव बाजार समितीमधील आजचा कांदा बाजारभाव काय आहे?',
    isResearch: false 
  },
  { 
    labelMr: '🔬 डाळिंब तेल्या रोग संशोधन', 
    labelHi: '🔬 अनार जीवाणु झुलसा शोध', 
    labelEn: '🔬 Pomegranate Blight Research', 
    query: 'Research causes, preventive schedule, and biological management of bacterial blight (teliya) in pomegranate',
    isResearch: true 
  },
  { 
    labelMr: '🌱 सोयाबीन हमीभाव (MSP)', 
    labelHi: '🌱 सोयाबीन न्यूनतम समर्थन मूल्य', 
    labelEn: '🌱 Soybean Govt MSP', 
    query: 'What is the official Government MSP for Soybean this season?',
    isResearch: false 
  },
  { 
    labelMr: '🌾 गहू सरकारी दर व बाजारभाव', 
    labelHi: '🌾 गेहूं सरकारी रेट व मंडी भाव', 
    labelEn: '🌾 Wheat Govt Rate', 
    query: 'What is wheat government MSP and APMC rate today?',
    isResearch: false 
  },
  { 
    labelMr: '🏛️ PM-KISAN योजना माहिती', 
    labelHi: '🏛️ पीएम-किसान योजना गाइड', 
    labelEn: '🏛️ PM-KISAN Benefits', 
    query: 'PM-KISAN योजनेचे निकष, हप्ते आणि e-KYC बद्दल सविस्तर माहिती सांगा',
    isResearch: true 
  },
]

export function KrishiChatbotModal({ isOpen, onClose, currentLang }: KrishiChatbotModalProps) {
  const t = translations[currentLang]
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isResearchMode, setIsResearchMode] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize greeting
  useEffect(() => {
    const initialGreeting =
      currentLang === 'mr'
        ? `नमस्कार शेतकरी बंधू! मी **कृषीसेतू AI (Google Gemini कृषी संशोधक)** आहे. 🌾
मी पिकांचे रोग संशोधन, खत व्यवस्थापन, कीड नियंत्रण, शासकीय हमीभाव (MSP), Agmarknet बाजारभाव आणि इतर सर्व प्रश्नांवर सखोल माहिती देतो.

तुम्ही खालीलपैकी कोणतीही माहिती किंवा संशोधन विचारू शकता:`
        : currentLang === 'hi'
        ? `नमस्ते किसान साथी! मैं **कृषिसेतु AI (Google Gemini कृषि शोध सहायक)** हूँ। 🌾
मैं फसल सुरक्षा, खाद प्रबंधन, कीट नियंत्रण, सरकारी समर्थन मूल्य (MSP), Agmarknet मंडी भाव और अन्य सभी कृषि प्रश्नों पर गहन अनुसंधान सहायता प्रदान करता हूँ।

आप नीचे दिए विकल्पों में से कोई भी सवाल या शोध पूछ सकते हैं:`
        : `Hello! I am **KrishiSetu AI (Google Gemini Agronomy & Research Assistant)**. 🌾
I deliver deep scientific crop disease research, IPM solutions, real-time Agmarknet mandi rates, Govt MSP schedules, and general intelligence.

Ask any agricultural research question or market query below:`

    setMessages([
      {
        id: '1',
        role: 'model',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'google_gemini',
        model: 'gemini-3.6-flash',
        isResearch: true,
        verifiedGovtData: true,
      },
    ])
  }, [currentLang, isOpen])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Voice speech recognition
  const handleVoiceInput = () => {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or type your message.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      const langInfo = LANGUAGES_LIST.find((l) => l.id === currentLang)
      recognition.lang = langInfo?.speechLang || 'hi-IN'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (err) {
      console.error('Speech recognition error:', err)
      setIsListening(false)
    }
  }

  const handleSendMessage = async (textToSend?: string, forceResearch?: boolean) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history,
          language: currentLang,
          isResearchMode: forceResearch !== undefined ? forceResearch : isResearchMode,
        }),
      })

      if (!res.ok) {
        throw new Error(`Chat API error: ${res.statusText}`)
      }

      const data = await res.json()

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply || 'No response received from AI engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        model: data.model,
        isResearch: data.isResearch,
        verifiedGovtData: data.verifiedGovtData,
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: getLocalizedUIString('networkRetryMsg', currentLang),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'krishi_engine',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to format inline bold, markdown and line breaks
  const formatMarkdown = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, idx) => {
      // Heading level 3 or 4
      if (line.startsWith('### ') || line.startsWith('#### ')) {
        const text = line.replace(/^#{3,4}\s*/, '')
        return (
          <h4 key={idx} className="font-extrabold text-sm text-emerald-900 mt-2.5 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            {renderInlineStyles(text)}
          </h4>
        )
      }
      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        return <hr key={idx} className="my-2 border-slate-200" />
      }
      // Bullet list item
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const text = line.trim().replace(/^[*•-]\s*/, '')
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-emerald-600 font-bold text-xs mt-0.5">•</span>
            <div className="flex-1 text-xs leading-relaxed text-slate-800">
              {renderInlineStyles(text)}
            </div>
          </div>
        )
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />
      }
      // Regular paragraph
      return (
        <p key={idx} className="text-xs sm:text-[13px] leading-relaxed text-slate-800 my-0.5">
          {renderInlineStyles(line)}
        </p>
      )
    })
  }

  // Render bold **text** within line
  const renderInlineStyles = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900 bg-emerald-50/50 px-0.5 rounded">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg h-[92vh] sm:h-[86vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs relative">
              <Bot className="w-5 h-5 text-emerald-200" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-900 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-sm tracking-tight text-white">KrishiSetu AI</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                  Google Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/90 font-medium">
                {getLocalizedUIString('researchSubtitle', currentLang)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Research Mode Toggle */}
            <button
              onClick={() => setIsResearchMode(!isResearchMode)}
              title={isResearchMode ? `${getLocalizedUIString('researchMode', currentLang)}: ON` : `${getLocalizedUIString('researchMode', currentLang)}: OFF`}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all border ${
                isResearchMode
                  ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50 shadow-xs'
                  : 'bg-white/10 text-white/70 border-white/20 hover:text-white'
              }`}
            >
              <Search className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">{getLocalizedUIString('researchMode', currentLang)}:</span>
              <span>{isResearchMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {QUICK_PROMPTS.map((chip, idx) => {
            const label =
              currentLang === 'mr' ? chip.labelMr : currentLang === 'hi' ? chip.labelHi : chip.labelEn
            return (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(chip.query, chip.isResearch)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 shadow-2xs active:scale-95 disabled:opacity-50 flex items-center gap-1 ${
                  chip.isResearch
                    ? 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-slate-50/60 text-slate-900">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none shadow-sm'
                }`}
              >
                {/* Source / Model Badge */}
                {msg.role === 'model' && (
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      {msg.source === 'google_gemini' ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                          <span>Google Gemini 3.6 Flash</span>
                          {msg.isResearch && (
                            <span className="text-[9px] text-teal-700 font-extrabold">&bull; {getLocalizedUIString('aiResearchBadge', currentLang)}</span>
                          )}
                        </span>
                      ) : msg.verifiedGovtData ? (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{getLocalizedUIString('govtVerifiedBadge', currentLang)}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Bot className="w-3 h-3" />
                          <span>Krishi Mitra AI</span>
                        </span>
                      )}
                    </span>

                    <button
                      onClick={() => speakText(msg.text, currentLang)}
                      title={getLocalizedUIString('audioButtonLabel', currentLang)}
                      className="text-slate-400 hover:text-emerald-700 flex items-center gap-1 hover:bg-slate-50 px-1.5 py-0.5 rounded transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{getLocalizedUIString('audioButtonLabel', currentLang)}</span>
                    </button>
                  </div>
                )}

                {/* Formatted Markdown Content */}
                <div className="space-y-1">
                  {formatMarkdown(msg.text)}
                </div>

                <div
                  className={`text-[9px] mt-1.5 text-right font-medium ${
                    msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-white text-slate-800 border border-emerald-200 rounded-2xl rounded-bl-none p-3 shadow-md flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="absolute -inset-1 rounded-full bg-emerald-400/20 animate-ping" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Google Gemini 3.6</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {isResearchMode ? getLocalizedUIString('researchingStatus', currentLang) : getLocalizedUIString('thinkingStatus', currentLang)}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {isResearchMode ? getLocalizedUIString('researchingStatus', currentLang) : getLocalizedUIString('thinkingStatus', currentLang)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            {/* Mic button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              title={isListening ? getLocalizedUIString('listeningPrompt', currentLang) : getLocalizedUIString('speakQuestion', currentLang)}
              className={`p-2.5 rounded-2xl transition-all shadow-xs shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isResearchMode
                  ? getLocalizedUIString('chatbotPlaceholderResearch', currentLang)
                  : getLocalizedUIString('chatbotPlaceholderGeneral', currentLang)
              }
              className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white font-bold shadow-md shadow-emerald-700/20 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
