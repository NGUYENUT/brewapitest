import Link from 'next/link'
import { brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const { contacts, pagination } = await brew.contacts.list({ limit: 50 })

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Contacts
          </h1>
          <Link
            href="/admin"
            className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            ← Back to admin
          </Link>
        </header>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing {contacts.length} of up to {pagination.limit}
          {pagination.hasMore ? ' (more available)' : ''}.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {contacts.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
              No contacts yet. Submit the signup form on the home page to create one.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <Th>Email</Th>
                  <Th>First name</Th>
                  <Th>Last name</Th>
                  <Th>Subscribed</Th>
                  <Th>Verification</Th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.email} className="border-t border-zinc-200 dark:border-zinc-800">
                    <Td>{c.email}</Td>
                    <Td>{c.firstName ?? '—'}</Td>
                    <Td>{c.lastName ?? '—'}</Td>
                    <Td>
                      <Badge tone={c.subscribed ? 'green' : 'zinc'}>
                        {c.subscribed ? 'subscribed' : 'unsubscribed'}
                      </Badge>
                    </Td>
                    <Td>
                      {c.verificationStatus ? (
                        <Badge tone={verificationTone(c.verificationStatus)}>
                          {c.verificationStatus}
                        </Badge>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}

type Tone = 'green' | 'zinc' | 'amber' | 'red'

function verificationTone(status: 'valid' | 'risky' | 'invalid'): Tone {
  if (status === 'valid') return 'green'
  if (status === 'risky') return 'amber'
  return 'red'
}

function Badge({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  const styles: Record<Tone, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[tone]}`}>
      {children}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">{children}</td>
}
