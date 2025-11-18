import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/roles";
import { getRecentMatches } from "@/lib/db/matches";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { promoteUserToAdminAction } from "./actions";

export default async function AdminPage() {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  const matches = await getRecentMatches();

  const supabase = await createSupabaseServerClient();
  const { data: appUsers } =
    (supabase &&
      (await supabase
        .from("users")
        .select("id,email,name,role")
        .order("created_at", { ascending: true }))) ||
    { data: null };
  const users = appUsers ?? [];

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
                    <Link href={`/admin/matches/${match.id}`}>
                      <Button variant="outline" size="sm">
                        Edit Match
                      </Button>
                    </Link>
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
          Promote new users to Admin.
        </p>
        <div className="mt-4 space-y-3">
          {users.length ? (
            users.map((appUser) => (
              <div
                key={appUser.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">
                    {appUser.name ?? "Unnamed User"}
                    {appUser.role === "admin" ? " (Admin)" : ""}
                  </p>
                  <p className="text-xs text-[var(--neutral-gray)]">
                    {appUser.email}
                  </p>
                </div>
                {appUser.role !== "admin" && (
                  <form action={promoteUserToAdminAction}>
                    <input type="hidden" name="id" value={appUser.id} />
                    <Button variant="primary" size="sm">
                      Promote to Admin
                    </Button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--neutral-gray)]">
              No users found yet. New signups will appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
