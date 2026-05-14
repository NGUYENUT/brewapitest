import { createBrewClient } from '@brew.new/sdk'

export const brew = createBrewClient({
  apiKey: process.env.BREW_API_KEY!,
  timeoutMs: 30_000,
  maxRetries: 2,
})
