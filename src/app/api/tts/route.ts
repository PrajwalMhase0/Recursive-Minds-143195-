import { NextRequest, NextResponse } from 'next/server'
import { Language } from '@/lib/i18n'

// Map 16 app language codes to Google TTS engine language codes
const TTS_LANG_MAP: Record<Language, string> = {
  mr: 'mr',
  hi: 'hi',
  en: 'en',
  gu: 'gu',
  pa: 'pa',
  bn: 'bn',
  te: 'te',
  ta: 'ta',
  kn: 'kn',
  ml: 'ml',
  ur: 'ur',
  bho: 'hi',
  mai: 'hi',
  kok: 'mr',
  as: 'bn',
  or: 'hi',
}

function sanitizeTextForTTS(text: string): string {
  return text
    // Remove markdown symbols
    .replace(/[*_~`#>]/g, '')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Remove excessive punctuation or urls
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rawText = searchParams.get('text') || ''
    const lang = (searchParams.get('lang') || 'mr') as Language

    const cleanText = sanitizeTextForTTS(rawText)
    if (!cleanText) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 })
    }

    const ttsLang = TTS_LANG_MAP[lang] || 'hi'

    // Google Translate TTS accepts chunks up to ~180-200 characters
    // For assistant spoken answers, take the first 1-2 key sentences (up to 200 chars)
    let textToSpeak = cleanText
    if (textToSpeak.length > 200) {
      // Find sentence boundary within first 200 chars
      const boundaryMatch = textToSpeak.slice(0, 200).match(/^([\s\S]*[.।!?\n])/)
      if (boundaryMatch && boundaryMatch[1].trim().length > 30) {
        textToSpeak = boundaryMatch[1].trim()
      } else {
        const lastSpace = textToSpeak.slice(0, 190).lastIndexOf(' ')
        textToSpeak = lastSpace > 50 ? textToSpeak.slice(0, lastSpace) : textToSpeak.slice(0, 190)
      }
    }

    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      ttsLang
    )}&q=${encodeURIComponent(textToSpeak)}`

    const upstreamRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: 'Upstream TTS service error' },
        { status: upstreamRes.status }
      )
    }

    const audioBuffer = await upstreamRes.arrayBuffer()

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err: any) {
    console.error('TTS API error:', err)
    return NextResponse.json({ error: err.message || 'TTS generation failed' }, { status: 500 })
  }
}
