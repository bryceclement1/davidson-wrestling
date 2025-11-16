import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { getRecentMatches } from "@/lib/db/matches";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

const mockUsers = [
  { id: "user-101", name: "New Wrestler", email: "rookie@davidson.edu" },
  { id: "user-102", name: "Analytics GA", email: "ga@davidson.edu" },
];

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const matches = await getRecentMatches(5);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          Admin Tools
        </p>
        <h2 className="text-3xl font-semibold text-[var(--brand-navy)]">
          Data correction & role management
        </h2>
      </header>
      <section className="card-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              Match Edit Queue
            </p>
            <p className="text-sm text-[var(--neutral-gray)]">
              Pull a match to correct scores or events.
            </p>
          </div>
          <Button variant="secondary">Open SQL Editor</Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="min-w-full divide-y divide-[var(--border)] text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                  Date
                </th>
                <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                  Wrestler
                </th>
                <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                  Opponent
                </th>
                <th className="px-5 py-3 text-left font-semibold text-[var(--neutral-gray)]">
                  Result
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {matches.map((match) => (
                <tr key={match.id}>
                  <td className="px-5 py-3">{formatDate(match.date)}</td>
                  <td className="px-5 py-3">
                    {match.wrestlerName ?? `ID ${match.wrestlerId}`}
                  </td>
                  <td className="px-5 py-3">{match.opponentName}</td>
                  <td className="px-5 py-3 font-semibold">
                    {match.result} {match.ourScore}-{match.opponentScore}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="outline" size="sm">
                      Edit Match
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card-surface p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
          User Management
        </p>
        <p className="text-sm text-[var(--neutral-gray)]">
          Promote new users to Admin or link them to roster entries.
        </p>
        <div className="mt-4 space-y-3">
          {mockUsers.map((pending) => (
            <div
              key={pending.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--brand-navy)]">
                  {pending.name}
                </p>
                <p className="text-xs text-[var(--neutral-gray)]">
                  {pending.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Link Wrestler
                </Button>
                <Button variant="primary" size="sm">
                  Promote to Admin
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
