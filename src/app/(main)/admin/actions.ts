"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertRole, getAuthenticatedUser } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MatchResult } from "@/types/match";

export async function updateMatchAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Invalid match id");
  }

  const opponentName = String(formData.get("opponentName") ?? "").trim();
  const ourScore = Number(formData.get("ourScore"));
  const opponentScore = Number(formData.get("opponentScore"));
  const result = (formData.get("result") ?? "W") as MatchResult;

  const { error } = await (supabase as any)
    .from("matches")
    .update({
      opponent_name: opponentName || null,
      our_score: Number.isNaN(ourScore) ? 0 : ourScore,
      opponent_score: Number.isNaN(opponentScore) ? 0 : opponentScore,
      result,
    })
    .eq("id", id);

  if (error) {
    console.error("Failed to update match", error);
    throw new Error("Unable to update match");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/matches/${id}`);
  redirect("/admin");
}

export async function promoteUserToAdminAction(formData: FormData) {
  const currentUser = await getAuthenticatedUser();
  if (!assertRole(currentUser, "admin")) {
    throw new Error("Unauthorized");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    throw new Error("Invalid user id");
  }

  const { error } = await supabase
    .from("users")
    .update({ role: "admin" } as Database["public"]["Tables"]["users"]["Update"])
    .eq("id", id);

  if (error) {
    console.error("Failed to promote user", error);
    throw new Error("Unable to promote user");
  }

  revalidatePath("/admin");
}

export async function deleteMatchAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Invalid match id");
  }

  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete match", error);
    throw new Error("Unable to delete match");
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/matches/${id}`);
  redirect("/admin");
}
