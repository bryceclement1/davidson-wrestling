"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SignUpState =
  | { status: "idle"; message?: string; email?: string }
  | { status: "error"; message: string; email?: string }
  | { status: "verify"; message?: string; email: string };

export async function loginAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string) ?? "";

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (!supabase) {
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

export async function signUpAction(
  _prevState: SignUpState | undefined,
  formData: FormData,
): Promise<SignUpState> {
  const supabase = await createSupabaseServerClient();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { status: "error", message: "Email and password required" };
  }

  if (!supabase) {
    return {
      status: "verify",
      email,
      message: "Supabase not configured. Skipping verification in preview mode.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "standard" },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  const authUser = data.user;
  if (authUser) {
    const payload: Database["public"]["Tables"]["users"]["Insert"] = {
      id: authUser.id,
      email: authUser.email ?? email,
      name:
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name ??
        null,
      role: "standard",
      wrestler_id: null,
    };

    await supabase
      .from("users")
      .upsert(payload, { onConflict: "id" });
  }

  return {
    status: "verify",
    email,
    message: "We sent a verification link to your email.",
  };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/admin");
  redirect("/login");
}
