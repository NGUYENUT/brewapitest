import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BrewApiError } from '@brew.new/sdk'
import { brew } from '@/lib/brew'

const SignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export async function POST(request: Request) {
  const apiKey = process.env.BREW_API_KEY
  const emailId = process.env.BREW_WELCOME_EMAIL_ID
  const domainId = process.env.BREW_DOMAIN_ID

  if (!apiKey || !emailId || !domainId) {
    return NextResponse.json(
      { error: `Missing env vars: ${!apiKey ? 'BREW_API_KEY ' : ''}${!emailId ? 'BREW_WELCOME_EMAIL_ID ' : ''}${!domainId ? 'BREW_DOMAIN_ID' : ''}`.trim() },
      { status: 500 }
    )
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
    await brew.contacts.upsert({
      email,
      firstName,
      lastName,
      subscribed: true,
      customFields: { signedUpAt: new Date().toISOString() },
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

  try {
    const { runId } = await brew.sends.create({
      emailId: process.env.BREW_WELCOME_EMAIL_ID!,
      domainId: process.env.BREW_DOMAIN_ID!,
      subject: "Welcome — you're in!",
      emails: [email],
    })
    return NextResponse.json({ success: true, runId })
  } catch (error) {
    if (error instanceof BrewApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code, param: error.param },
        { status: error.status },
      )
    }
    throw error
  }
}
