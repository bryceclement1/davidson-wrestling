import type { AppUser, UserRole } from "@/types/user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const defaultUser: AppUser = {
  id: "mock-user",
  email: "manager@davidson.edu",
  name: "Match Logger",
  role: "admin",
};

export async function getAuthenticatedUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return defaultUser;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, wrestler_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    name:
      profile?.name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      "Davidson Wrestler",
    role: (profile?.role ?? user.user_metadata?.role ?? "standard") as UserRole,
    wrestlerId: profile?.wrestler_id ?? user.user_metadata?.wrestler_id ?? null,
  };
}

export function assertRole(user: AppUser | null, role: UserRole) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.role === role;
}
