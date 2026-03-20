import { createClient } from "@/lib/supabase/server";

export type AppUser = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "user";
  is_active: boolean;
};

export async function getCurrentAppUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return {
      authUser: null,
      appUser: null,
    };
  }

  const normalizedEmail = user.email.trim().toLowerCase();

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_active")
    .ilike("email", normalizedEmail)
    .eq("is_active", true)
    .maybeSingle<AppUser>();

  if (appUserError || !appUser) {
    return {
      authUser: user,
      appUser: null,
    };
  }

  return {
    authUser: user,
    appUser,
  };
}

export async function isCurrentUserAdmin() {
  const { appUser } = await getCurrentAppUser();
  return appUser?.role === "admin";
}