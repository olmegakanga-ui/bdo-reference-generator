"use server";

import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["admin", "user"] as const;

function redirectWithError(message: string): never {
  redirect(`/admin/users?error=${encodeURIComponent(message)}`);
}

export async function createUser(formData: FormData) {
  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser || appUser?.role !== "admin") {
    redirectWithError("Accès administrateur requis.");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");

  if (!fullName || !email || !password) {
    redirectWithError("Tous les champs sont obligatoires.");
  }

  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    redirectWithError("Le rôle sélectionné est invalide.");
  }

  if (password.length < 8) {
    redirectWithError("Le mot de passe doit contenir au moins 8 caractères.");
  }

  let adminClient;

  try {
    adminClient = createAdminClient();
  } catch (error) {
    redirectWithError(
      error instanceof Error ? error.message : "Configuration Supabase invalide."
    );
  }

  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError || !authData.user) {
    redirectWithError(
      authError?.message ?? "Impossible de créer le compte de connexion."
    );
  }

  const { error: profileError } = await adminClient.from("users").insert({
    email,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id);
    redirectWithError(
      `Le profil utilisateur n'a pas été créé : ${profileError.message}`
    );
  }

  redirect("/admin/users?success=1");
}
