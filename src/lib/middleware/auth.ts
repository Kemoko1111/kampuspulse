import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors/app-error";

export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await requireAuth();

  const { data: rawProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const profile = rawProfile as { id: string; role: string; user_id: string } | null;
  if (error || !profile) {
    throw new AppError("Profile not found", 404, "PROFILE_NOT_FOUND");
  }

  return { supabase, user, profile };
}

export async function requireRole(roles: string[]) {
  const { supabase, user, profile } = await requireProfile();

  if (!roles.includes(profile.role)) {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  return { supabase, user, profile };
}
