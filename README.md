# Brew Welcome Email Platform

A Next.js app that sends a transactional welcome email via the Brew SDK every time a user signs up.

## How It Works

1. User fills out the signup form (email, first name, last name)
2. Their contact is upserted into Brew with `source: "signup"`
3. A pre-made welcome email is sent to their inbox instantly via Brew

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get your Brew credentials

- **API key:** Go to [brew.new/settings/api](https://brew.new/settings/api) and create an API key.
- **Welcome email:** Go to [brew.new](https://brew.new) and create a welcome email. Once it exists, click into that specific email template — the URL will look like `https://brew.new/emails/<emailId>`. Copy the `<emailId>` segment from the URL; that is the value you'll use for `BREW_WELCOME_EMAIL_ID`. If you ever swap the welcome email for a different template, repeat this step and update the value in **both** `.env.local` and Vercel → Settings → Environment Variables, then redeploy.
- **Sending domain:** Go to brew.new settings and verify a sending domain — copy its `domainId`.

### 3. Create `.env.local` in the project root

```
BREW_API_KEY=brew_your_key_here
BREW_WELCOME_EMAIL_ID=your_email_id_here
BREW_DOMAIN_ID=your_domain_id_here
```

### 4. Set up the Signups audience in Brew

- Go to brew.new → Audience → New Audience
- Set filter: `source` equals `signup`
- Save as "Signups"
- All signup form submissions will appear here automatically

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Vercel

- Push to GitHub and import in Vercel
- Add the three env vars in **Vercel → Settings → Environment Variables** (the same values from `.env.local`, including the `BREW_WELCOME_EMAIL_ID` you copied from the email template URL)
- Redeploy so the new env vars are picked up (env var changes do not apply to existing deployments)
- If you later change the welcome email template, update `BREW_WELCOME_EMAIL_ID` in **both** `.env.local` and the Vercel dashboard, then redeploy

## Pages

- `/` — Signup form
- `/admin` — Shows your domains, emails, contact count, and audiences
- `/admin/contacts` — Full contact list with verification status

## Optional: Generate a unique email per signup instead of a static one

If you want Brew to AI-generate a fresh welcome email for every signup instead of using a pre-made one, replace the sends flow in `src/app/api/signup/route.ts` with:

```ts
const generated = await brew.emails.generate({
  prompt: `Create a warm friendly welcome email for ${firstName} ${lastName} who just signed up. Use the brand's design and tone. Include a welcome message and a get started CTA.`,
})

if (!('emailId' in generated)) {
  return NextResponse.json(
    { error: 'Email generation failed' },
    { status: 500 }
  )
}

await brew.sends.create({
  emailId: generated.emailId,
  domainId: process.env.BREW_DOMAIN_ID!,
  subject: `Welcome, ${firstName}!`,
  emails: [email],
})
```

Note: This approach costs Brew credits per signup and adds **30–90 seconds** to the signup response (per the SDK's documented agent runtime). Recommended for low-volume or personalized flows only. Remove `BREW_WELCOME_EMAIL_ID` from your env vars if using this approach, and set `export const maxDuration = 300` in the route so Vercel's serverless timeout doesn't kill the request mid-generation.
