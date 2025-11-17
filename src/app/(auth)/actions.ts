"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignUpState =
  | { status: "idle"; message?: string; email?: string }
  | { status: "error"; message: string; email?: string }
  | { status: "verify"; message?: string; email: string };

export type VerifyState =
  | { status: "idle"; message?: string }
  | { status: "error"; message: string }
  | { status: "success"; message?: string };

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: "standard" },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return {
    status: "verify",
    email,
    message: "We sent a verification code to your email.",
  };
}

export async function verifyEmailAction(
  _prevState: VerifyState | undefined,
  formData: FormData,
): Promise<VerifyState> {
  const supabase = await createSupabaseServerClient();
  const email = (formData.get("email") as string)?.trim();
  const token = (formData.get("token") as string)?.trim();

  if (!email || !token) {
    return { status: "error", message: "Email and code are required" };
  }

  if (!supabase) {
    return { status: "success", message: "Verified (mock mode)" };
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Email verified. Please sign in." };
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/admin");
  redirect("/login");
}
