import Link from "next/link";
import { redirect } from "next/navigation";
import { createUser } from "@/app/admin/users/actions";
import { getCurrentAppUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  searchParams: Promise<{
    success?: string | string[];
    error?: string | string[];
  }>;
};

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser) {
    redirect("/login?next=/admin/users");
  }

  if (!appUser || appUser.role !== "admin") {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-red-700">
            Accès refusé
          </h1>
          <p className="app-subtitle mb-8">
            Seuls les administrateurs peuvent gérer les utilisateurs.
          </p>
          <Link href="/" className="app-btn app-btn-outline px-8 py-4">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const success = getSingleValue(params.success);
  const errorMessage = getSingleValue(params.error);
  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, is_active")
    .order("full_name");

  if (error) {
    throw new Error("Impossible de charger les utilisateurs.");
  }

  return (
    <main className="app-page p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <section className="app-card p-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Administration
          </p>
          <h1 className="app-title mt-2">Ajouter un utilisateur</h1>
          <p className="app-subtitle">
            Créez son accès au portail et attribuez-lui son rôle.
          </p>

          {success === "1" && (
            <div className="app-success mt-6">Utilisateur créé avec succès.</div>
          )}

          {errorMessage && (
            <div className="app-error mt-6">{errorMessage}</div>
          )}

          <form action={createUser} className="mt-8 space-y-5">
            <div>
              <label className="app-label" htmlFor="fullName">
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                className="app-input"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="app-label" htmlFor="email">
                Email professionnel
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="app-input"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="app-label" htmlFor="password">
                Mot de passe temporaire
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                className="app-input"
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="app-label" htmlFor="role">
                Rôle
              </label>
              <select id="role" name="role" className="app-select" required>
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <button type="submit" className="app-btn app-btn-blue w-full py-4">
              Créer l’utilisateur
            </button>
          </form>

          <Link href="/engagement/admin" className="app-btn app-btn-outline mt-4 w-full">
            Retour à l’administration
          </Link>
        </section>

        <section className="app-card p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Utilisateurs existants
              </h2>
              <p className="app-subtitle">{users?.length ?? 0} utilisateur(s)</p>
            </div>
          </div>

          <div className="space-y-3">
            {users?.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-slate-900">{user.full_name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
