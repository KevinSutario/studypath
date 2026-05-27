// lib/anthropic.ts
// Singleton Anthropic SDK client.
// Import `anthropic` wherever you need to call Claude.

import Anthropic from '@anthropic-ai/sdk';

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic: Anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic;
}

// ─── Model constant ───────────────────────────────────────────────────────────

/** The Claude model used throughout the app. */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514' as const;
