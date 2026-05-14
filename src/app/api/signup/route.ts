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
  const domainId = process.env.BREW_DOMAIN_ID

  if (!apiKey || !domainId) {
    return NextResponse.json(
      { error: `Missing env vars: ${!apiKey ? 'BREW_API_KEY ' : ''}${!domainId ? 'BREW_DOMAIN_ID' : ''}`.trim() },
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

  let generated
  try {
    generated = await brew.emails.generate({
      prompt: `Create a warm, friendly welcome email for ${firstName} ${lastName} who just signed up. Use the brand's existing design, colors, and tone. Include a short welcome message and a get started CTA.`,
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

  if (!('emailId' in generated)) {
    return NextResponse.json(
      { error: 'Email generation failed', detail: generated.response },
      { status: 500 }
    )
  }

  try {
    const sendResult = await brew.sends.create({
      emailId: generated.emailId,
      domainId,
      subject: `Welcome, ${firstName}!`,
      emails: [email],
    })
    return NextResponse.json({
      success: true,
      runId: sendResult.runId,
      status: sendResult.status,
      emailId: generated.emailId,
      note: 'Email generation may take 5-10 seconds; reflect this in the loading state.',
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
}
