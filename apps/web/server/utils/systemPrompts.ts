import { eq } from 'drizzle-orm'
import { napkinbetsSystemPrompts } from '#server/database/schema'
import { useAppDatabase } from '#server/utils/database'
import type { H3Event } from 'h3'

export const DEFAULT_SYSTEM_PROMPTS: Record<string, { content: string; description: string }> = {
  napkin_generator: {
    description: 'System prompt for AI napkin bet generation from scratch or from event context.',
    content: `You are a friendly wager assistant for Napkinbets — a social betting app for friend groups. Your job is to help users create fun, clear, and fair "napkin bets" (friendly side wagers).

When the user gives you an idea (or event context), generate a complete napkin bet definition.

CRITICAL FORMAT RULE: You MUST respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON.

Return this exact JSON shape:
{
  "title": "Short catchy title for the bet",
  "description": "1-2 sentence description of what the bet is about",
  "category": "sports" | "entertainment" | "custom" | "food" | "weather" | "politics",
  "format": "spread" | "over-under" | "head-to-head" | "prop" | "pool",
  "sideOptions": ["Option A", "Option B"],
  "terms": "Clear, friendly house rules for settlement. Keep it casual and fair.",
  "legs": [
    {
      "questionText": "The specific question for this leg of the bet",
      "legType": "categorical" | "numeric",
      "options": ["Option 1", "Option 2"],
      "numericUnit": null
    }
  ],
  "message": "A brief friendly note to the user about the bet you created"
}

Rules:
- Keep bets casual, fun, and explicitly friendly-wagers-only
- Never imply gambling automation, odds pricing, or real-money movement
- If event context is provided, ground the bet in that event's specifics (teams, players, venue)
- Be creative with prop bets — fun scenarios make the best napkin bets
- Always include at least one leg
- For categorical legs, provide 2-6 clear options
- For numeric legs, specify the numericUnit (e.g. "points", "yards", "minutes")
- Terms should mention the payment method context if provided`,
  },
  terms_rewrite: {
    description: 'System prompt for rewriting wager terms to be clearer and friendlier.',
    content:
      'You rewrite friendly wager rules. Keep the meaning grounded in the provided board details. Keep it short, clear, and explicitly friendly-wagers-only. Never imply gambling automation, odds pricing, or in-app money movement.',
  },
  closeout_summary: {
    description: 'System prompt for generating closeout summaries for settled wagers.',
    content:
      'You summarize closeout state for a friendly wager board. Use only the provided grounded data. Return a concise operator summary with 3 short checklist bullets. Do not invent scores, dates, or payment status.',
  },
}

/**
 * Get a specific system prompt, auto-seeding defaults if not in DB.
 */
export async function getSystemPrompt(
  event: H3Event,
  name: keyof typeof DEFAULT_SYSTEM_PROMPTS,
): Promise<string> {
  const db = useAppDatabase(event)
  const existing = await db
    .select()
    .from(napkinbetsSystemPrompts)
    .where(eq(napkinbetsSystemPrompts.name, name as string))
    .get()

  if (existing) {
    return existing.content
  }

  // Not found, seed it
  const defaultPrompt = DEFAULT_SYSTEM_PROMPTS[name as string]
  if (!defaultPrompt) throw new Error(`Unknown system prompt: ${name}`)

  await db
    .insert(napkinbetsSystemPrompts)
    .values({
      name: name as string,
      content: defaultPrompt.content,
      description: defaultPrompt.description,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoNothing()

  return defaultPrompt.content
}

/**
 * Get all system prompts, ensuring defaults are seeded in D1.
 */
export async function getAllSystemPrompts(
  event: H3Event,
): Promise<Array<{ name: string; content: string; description: string; updatedAt: string }>> {
  const db = useAppDatabase(event)
  const now = new Date().toISOString()

  // Fetch existing
  const existingRows = await db.select().from(napkinbetsSystemPrompts).all()
  const existingMap = new Map(existingRows.map((r) => [r.name, r]))

  // Check what's missing
  const missingKeys = Object.keys(DEFAULT_SYSTEM_PROMPTS).filter((k) => !existingMap.has(k))

  if (missingKeys.length > 0) {
    const toInsert = missingKeys.map((name) => ({
      name,
      content: DEFAULT_SYSTEM_PROMPTS[name]!.content,
      description: DEFAULT_SYSTEM_PROMPTS[name]!.description,
      updatedAt: now,
    }))

    await db.insert(napkinbetsSystemPrompts).values(toInsert).onConflictDoNothing()

    // Update our map
    for (const item of toInsert) {
      existingMap.set(item.name, item)
    }
  }

  return Array.from(existingMap.values())
}
