import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSignatory,
  toggleSignatoryStatus,
  updateSignatoryModule,
} from "@/app/admin/signatories/actions";
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

const SUCCESS_MESSAGES: Record<string, string> = {
  created: "Signataire ajouté avec succès.",
  updated: "Affectation mise à jour avec succès.",
  disabled: "Signataire retiré des sélections actives.",
  enabled: "Signataire réactivé avec succès.",
};

export default async function AdminSignatoriesPage({ searchParams }: Props) {
  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser) {
    redirect("/login?next=/admin/signatories");
  }

  if (!appUser || appUser.role !== "admin") {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="mb-4 text-3xl font-extrabold text-red-700">
            Accès refusé
          </h1>
          <p className="app-subtitle mb-8">
            Seuls les administrateurs peuvent gérer les signataires.
          </p>
          <Link href="/" className="app-btn app-btn-outline px-8 py-4">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }

  const params = await searchParams;
  const successMessage = SUCCESS_MESSAGES[getSingleValue(params.success)];
  const errorMessage = getSingleValue(params.error);
  const adminClient = createAdminClient();
  const { data: signatories, error } = await adminClient
    .from("signatories")
    .select("id, full_name, initials, document_type, is_active")
    .order("document_type")
    .order("full_name");

  if (error) {
    throw new Error("Impossible de charger les signataires.");
  }

  return (
    <main className="app-page p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="app-card p-8 md:p-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-600">
                Administration
              </p>
              <h1 className="app-title mt-2">Gestion des signataires</h1>
              <p className="app-subtitle">
                Affectez chaque signataire aux engagements, aux correspondances ou aux deux modules.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/users" className="app-btn app-btn-outline">
                Utilisateurs
              </Link>
              <Link href="/engagement/admin" className="app-btn app-btn-outline">
                Retour administration
              </Link>
            </div>
          </div>

          {successMessage && <div className="app-success mt-6">{successMessage}</div>}
          {errorMessage && <div className="app-error mt-6">{errorMessage}</div>}

          <form action={createSignatory} className="mt-8 grid gap-5 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="app-label" htmlFor="fullName">
                Nom complet
              </label>
              <input id="fullName" name="fullName" className="app-input" required />
            </div>
            <div>
              <label className="app-label" htmlFor="initials">
                Initiales
              </label>
              <input
                id="initials"
                name="initials"
                className="app-input uppercase"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="app-label" htmlFor="documentType">
                Module
              </label>
              <select id="documentType" name="documentType" className="app-select" required>
                <option value="engagement">Lettre d’engagement</option>
                <option value="correspondence">Correspondance</option>
                <option value="both">Engagement et correspondance</option>
              </select>
            </div>
            <button type="submit" className="app-btn app-btn-amber md:col-span-4 py-4">
              Ajouter le signataire
            </button>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {(["engagement", "correspondence", "both"] as const).map((documentType) => {
            const moduleSignatories = signatories?.filter(
              (signatory) => signatory.document_type === documentType
            );

            return (
              <div key={documentType} className="app-card p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {documentType === "engagement"
                      ? "Lettres d’engagement"
                      : documentType === "correspondence"
                        ? "Correspondances"
                        : "Les deux modules"}
                  </h2>
                  <p className="app-subtitle">
                    {moduleSignatories?.length ?? 0} signataire(s)
                  </p>
                </div>

                <div className="space-y-4">
                  {moduleSignatories?.map((signatory) => (
                    <div
                      key={signatory.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">{signatory.full_name}</p>
                          <p className="text-sm text-slate-500">
                            Initiales : {signatory.initials}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            signatory.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {signatory.is_active ? "Actif" : "Retiré"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <form action={updateSignatoryModule} className="flex gap-2">
                          <input type="hidden" name="signatoryId" value={signatory.id} />
                          <select
                            name="documentType"
                            defaultValue={signatory.document_type}
                            className="app-select min-w-0"
                          >
                            <option value="engagement">Engagement</option>
                            <option value="correspondence">Correspondance</option>
                            <option value="both">Les deux</option>
                          </select>
                          <button type="submit" className="app-btn app-btn-outline px-3">
                            Affecter
                          </button>
                        </form>

                        <form action={toggleSignatoryStatus}>
                          <input type="hidden" name="signatoryId" value={signatory.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={String(signatory.is_active)}
                          />
                          <button
                            type="submit"
                            className={`app-btn w-full ${
                              signatory.is_active ? "app-btn-outline" : "app-btn-green"
                            }`}
                          >
                            {signatory.is_active ? "Retirer" : "Réactiver"}
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}

                  {!moduleSignatories?.length && (
                    <div className="app-info text-center">Aucun signataire dans ce module.</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
