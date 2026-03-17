import { createError } from 'h3'

interface GrokChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function parseXaiError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string }
    return parsed.error || parsed.message || null
  } catch {
    return null
  }
}

export async function grokChat(
  apiKey: string,
  messages: GrokChatMessage[],
  model: string,
) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      store: false,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw createError({
      statusCode: response.status,
      message: parseXaiError(body) || 'Failed to reach xAI.',
    })
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return payload.choices?.[0]?.message?.content?.trim() || ''
}
