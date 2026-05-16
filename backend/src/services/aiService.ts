/**
 * Multi-AI Provider Service
 * Primary: Google Gemini (free tier)
 * Fallback: Groq (free tier - llama/mixtral)
 * Strategy: Try Gemini → fallback to Groq on failure
 */

interface AiSummaryResult {
  summary: string
  actionItems: string[]
  suggestedTitle: string
  keyTopics: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  provider: string
  modelUsed: string
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────

async function callGemini(content: string, title: string): Promise<AiSummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const model = 'gemini-1.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const prompt = buildPrompt(content, title)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  return { ...parseAiResponse(text), provider: 'gemini', modelUsed: model }
}

// ─── Groq Provider ────────────────────────────────────────────────────────────

async function callGroq(content: string, title: string): Promise<AiSummaryResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')
  const model = 'llama-3.3-70b-versatile'
  const url = 'https://api.groq.com/openai/v1/chat/completions'

  const prompt = buildPrompt(content, title)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a smart note-taking assistant. Always respond with valid JSON only, no markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''

  return { ...parseAiResponse(text), provider: 'groq', modelUsed: model }
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(content: string, title: string): string {
  return `Analyze the following note and respond ONLY with a JSON object (no markdown, no code blocks):

Note Title: "${title}"
Note Content:
"""
${content.slice(0, 3000)}
"""

Respond with this exact JSON structure:
{
  "summary": "2-3 sentence summary of the note",
  "actionItems": ["action 1", "action 2", "action 3"],
  "suggestedTitle": "A better title if applicable, else keep original",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "sentiment": "positive" | "neutral" | "negative"
}

Rules:
- summary: concise, 2-3 sentences max
- actionItems: extract real tasks/todos, max 5 items, empty array if none
- suggestedTitle: short, descriptive, max 8 words
- keyTopics: 3-5 main themes or keywords
- sentiment: overall tone of the note`
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseAiResponse(text: string): Omit<AiSummaryResult, 'provider' | 'modelUsed'> {
  try {
    // Strip markdown code blocks if any
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      summary: parsed.summary || 'No summary available.',
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      suggestedTitle: parsed.suggestedTitle || 'Untitled Note',
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
      sentiment: parsed.sentiment || 'neutral',
    }
  } catch {
    // Fallback parsing: extract what we can
    return {
      summary: text.slice(0, 200) || 'Could not parse summary.',
      actionItems: [],
      suggestedTitle: 'Untitled Note',
      keyTopics: [],
      sentiment: 'neutral',
    }
  }
}

// ─── Main Export: Multi-Provider with Fallback ───────────────────────────────

export async function generateAiSummary(
  content: string,
  title: string
): Promise<AiSummaryResult> {
  // Validate content
  if (!content || content.trim().length < 10) {
    throw new Error('Note content is too short to summarize (minimum 10 characters)')
  }

  const providers = [
    { name: 'gemini', fn: () => callGemini(content, title) },
    { name: 'groq', fn: () => callGroq(content, title) },
  ]

  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      console.log(`[AI] Trying provider: ${provider.name}`)
      const result = await provider.fn()
      console.log(`[AI] Success with provider: ${provider.name}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`[AI] Provider ${provider.name} failed:`, lastError.message)
      // Continue to next provider
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`)
}

export type { AiSummaryResult }
