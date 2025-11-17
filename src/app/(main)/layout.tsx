import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { UserMenu } from "@/components/layout/UserMenu";
import { getAuthenticatedUser } from "@/lib/auth/roles";

type Props = {
  children: ReactNode;
};

export default async function MainLayout({ children }: Props) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto bg-transparent px-6 pb-10 pt-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--neutral-gray)]">
              WrestleMetrics
            </p>
            <h1 className="text-2xl font-semibold text-[var(--brand-navy)]">
              Davidson Wrestling Analytics
            </h1>
          </div>
          <UserMenu user={user} />
        </div>
        {children}
      </main>
    </div>
  );
}
