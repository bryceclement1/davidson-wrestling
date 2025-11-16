import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function LoginPage() {
  async function login(formData: FormData) {
    "use server";
    const supabase = await createSupabaseServerClient();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!supabase) {
      console.info("Supabase not configured. Skipping real login.");
      redirect("/");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect("/");
  }

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
        <div className="mt-6">
          <AuthForm action={login} />
        </div>
      </div>
    </div>
  );
}
