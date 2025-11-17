import { AuthPanel } from "@/components/auth/AuthPanel";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--brand-navy)]/5 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--neutral-gray)]">
          WrestleMetrics
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
          Sign in to continue
        </h1>
        <p className="text-sm text-[var(--neutral-gray)]">
          Davidson Wrestling staff and wrestlers only.
        </p>
        <AuthPanel />
      </div>
    </div>
  );
}
