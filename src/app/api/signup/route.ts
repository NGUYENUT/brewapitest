import { NextResponse } from 'next/server'
import { z } from 'zod'
import { BrewApiError } from '@brew.new/sdk'
import { brew } from '@/lib/brew'
import { supabaseAdmin } from '@/lib/supabase'

const SignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

export async function POST(request: Request) {
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

  // Create user in Supabase — the auth.users trigger fires the Brew webhook,
  // which creates the contact and starts the automation.
  // email_confirm: true marks them as confirmed on creation so the automation fires immediately.
  const { error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
    email,
    user_metadata: { first_name: firstName, last_name: lastName },
    email_confirm: true,
  })

  // "already been registered" means they signed up before — safe to continue.
  if (supabaseError && !supabaseError.message.toLowerCase().includes('already been registered')) {
    return NextResponse.json({ error: supabaseError.message }, { status: 400 })
  }

  // Enrich the Brew contact with first/last name — the Supabase webhook only maps email.
  try {
    await brew.fields.create({ fieldName: 'source', fieldType: 'string' })
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

  return NextResponse.json({ success: true })
}
