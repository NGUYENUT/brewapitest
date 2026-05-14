import Link from 'next/link'
import { brew } from '@/lib/brew'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [domains, emails, count, audiences] = await Promise.all([
    brew.domains.list(),
    brew.emails.list(),
    brew.contacts.count(),
    brew.audiences.list(),
  ])

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Brew admin
          </h1>
          <Link
            href="/admin/contacts"
            className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            View contacts →
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total contacts" value={count.toLocaleString()} />
          <StatCard label="Domains" value={domains.domains.length.toString()} />
          <StatCard label="Emails" value={emails.emails.length.toString()} />
        </section>

        <Section title="Domains" hint="Copy a domainId into BREW_DOMAIN_ID in .env.local">
          {domains.domains.length === 0 ? (
            <Empty>No verified domains yet.</Empty>
          ) : (
            <Table headers={['Domain', 'domainId']}>
              {domains.domains.map((d) => (
                <tr key={d.domainId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <Td>{d.domainUrl}</Td>
                  <Td><Code>{d.domainId}</Code></Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Emails" hint="Welcome emails are generated per signup; saved emails are listed here for reference.">
          {emails.emails.length === 0 ? (
            <Empty>No emails yet — create one in the Brew dashboard.</Empty>
          ) : (
            <Table headers={['Title', 'emailId']}>
              {emails.emails.map((e) => (
                <tr key={e.emailId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <Td>{e.emailTitle}</Td>
                  <Td><Code>{e.emailId}</Code></Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>

        <Section title="Audiences">
          {audiences.audiences.length === 0 ? (
            <Empty>No saved audiences.</Empty>
          ) : (
            <Table headers={['Name', 'audienceId']}>
              {audiences.audiences.map((a) => (
                <tr key={a.audienceId} className="border-t border-zinc-200 dark:border-zinc-800">
                  <Td>{a.audienceName}</Td>
                  <Td><Code>{a.audienceId}</Code></Td>
                </tr>
              ))}
            </Table>
          )}
        </Section>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-sm text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {hint && <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {headers.map((h) => (
              <th key={h} className="pb-2 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="py-3 pr-4 text-zinc-800 dark:text-zinc-200">{children}</td>
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
      {children}
    </code>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
}
