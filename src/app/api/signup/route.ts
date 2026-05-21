import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BrewApiError } from '@brew.new/sdk'
import { brew } from '@/lib/brew'

const SignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

const BREW_EVENTS_URL = 'https://brew.new/api/v1/events'
const TRIGGER_EVENT_ID = 'yrHRVj4AzzsezOaG2stYo'

export async function POST(request: Request) {
  const apiKey = process.env.BREW_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing env var: BREW_API_KEY' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = SignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { email, firstName, lastName } = parsed.data
  console.log('signup body:', { email, firstName, lastName })

  try {
    await brew.fields.create({
      fieldName: 'source',
      fieldType: 'string',
    })
    await brew.contacts.upsert({
      email,
      firstName,
      lastName,
      subscribed: true,
      customFields: {
        signedUpAt: new Date().toISOString(),
        source: 'signup',
      },
    })
  } catch (error) {
    if (error instanceof BrewApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code, param: error.param },
        { status: error.status },
      )
    }
    throw error
  }

  const eventRes = await fetch(BREW_EVENTS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      triggerEventId: TRIGGER_EVENT_ID,
      payload: { email, firstName, lastName },
    }),
  })

  if (!eventRes.ok) {
    const errorBody = await eventRes.text()
    console.error('event trigger failed:', eventRes.status, errorBody)
    return NextResponse.json(
      { error: 'Failed to trigger automation', detail: errorBody },
      { status: eventRes.status },
    )
  }

  const eventData = await eventRes.json().catch(() => ({}))
  return NextResponse.json({ success: true, event: eventData })
}
