import { Language, LANGUAGES_LIST } from './i18n'

let activeAudio: HTMLAudioElement | null = null

export function stopSpeaking() {
  if (typeof window === 'undefined') return

  if (activeAudio) {
    try {
      activeAudio.pause()
      activeAudio.currentTime = 0
    } catch {}
    activeAudio = null
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel()
    } catch {}
  }
}

export function speakText(text: string, lang: Language = 'mr') {
  if (typeof window === 'undefined' || !text) return

  stopSpeaking()

  // Clean text from markdown or extra symbols for speech
  const cleanText = text
    .replace(/[*_~`#>]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleanText) return

  // 1. Primary: High-fidelity native speech in the selected Indian language via /api/tts
  try {
    const audioUrl = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(cleanText)}`
    const audio = new Audio(audioUrl)
    activeAudio = audio

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Audio playing natively in target language
        })
        .catch((err) => {
          console.warn('Audio TTS play prevented or failed, falling back to Web Speech API:', err)
          fallbackWebSpeech(cleanText, lang)
        })
    }
    return
  } catch (err) {
    console.warn('Native audio init failed, using Web Speech fallback:', err)
    fallbackWebSpeech(cleanText, lang)
  }
}

function fallbackWebSpeech(cleanText: string, lang: Language) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const utterance = new SpeechSynthesisUtterance(cleanText)
  const langInfo = LANGUAGES_LIST.find((l) => l.id === lang)
  const targetLangCode = langInfo?.speechLang || 'hi-IN'
  utterance.lang = targetLangCode
  utterance.rate = 0.95
  utterance.pitch = 1.0

  const voices = window.speechSynthesis.getVoices()
  if (voices && voices.length > 0) {
    // 1. Exact match with targetLangCode
    const exactVoice = voices.find(
      (v) => v.lang.toLowerCase().replace('_', '-') === targetLangCode.toLowerCase()
    )
    if (exactVoice) {
      utterance.voice = exactVoice
    } else {
      // 2. Prefix match (e.g. 'mr', 'hi', 'ta', 'te', 'bn', 'gu', 'pa')
      const langPrefix = targetLangCode.split('-')[0].toLowerCase()
      const prefixVoice = voices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
      )
      if (prefixVoice) {
        utterance.voice = prefixVoice
      } else {
        // 3. Name match with native language name or English name
        const nameVoice = voices.find(
          (v) =>
            v.name.toLowerCase().includes(langInfo?.name.toLowerCase() || '') ||
            v.name.toLowerCase().includes(langInfo?.nativeName.toLowerCase() || '')
        )
        if (nameVoice) {
          utterance.voice = nameVoice
        }
      }
    }
  }

  window.speechSynthesis.speak(utterance)
}
