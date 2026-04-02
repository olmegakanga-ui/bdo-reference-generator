import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatDateDisplay } from "@/lib/reference-utils";
import SignOutButton from "@/components/admin/sign-out-button";

type Props = {
  searchParams: Promise<{
    client?: string | string[];
    contractDate?: string | string[];
    departmentId?: string | string[];
    signatoryId?: string | string[];
  }>;
};

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function EngagementAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const client = getSingleValue(params.client);
  const contractDate = getSingleValue(params.contractDate);
  const departmentId = getSingleValue(params.departmentId);
  const signatoryId = getSingleValue(params.signatoryId);

  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser) {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="app-title mb-4">Accès administrateur requis</h1>
          <p className="app-subtitle mb-8">
            Veuillez vous connecter avec un compte administrateur.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/login?next=/engagement/admin"
              className="app-btn app-btn-blue py-4"
            >
              Se connecter
            </Link>
            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!appUser || appUser.role !== "admin") {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="text-3xl font-extrabold text-red-700 mb-4">
            Accès refusé
          </h1>
          <p className="text-slate-700 mb-4">
            Vous n’avez pas le droit de modifier un numéro de référence.
          </p>
          <p className="app-subtitle mb-8">
            Veuillez contacter l’administrateur ou le partenaire signataire du document.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <SignOutButton />
            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>
            <Link href="/engagement" className="app-btn app-btn-outline py-4">
              Précédent
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: departments, error: departmentsError } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { data: signatories, error: signatoriesError } = await supabase
    .from("signatories")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  if (departmentsError) {
    throw new Error("Impossible de charger les départements.");
  }

  if (signatoriesError) {
    throw new Error("Impossible de charger les signataires.");
  }

  let query = supabase
    .from("engagement_letters")
    .select(`
      id,
      client_name,
      contract_date,
      sequence_number,
      reference_number,
      departments (
        id,
        name
      ),
      signatories (
        id,
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (client.trim()) {
    query = query.ilike("client_name", `%${client.trim()}%`);
  }

  if (contractDate.trim()) {
    query = query.eq("contract_date", contractDate);
  }

  if (departmentId.trim()) {
    query = query.eq("department_id", Number(departmentId));
  }

  if (signatoryId.trim()) {
    query = query.eq("signatory_id", Number(signatoryId));
  }

  const hasFilters =
    client.trim() !== "" ||
    contractDate.trim() !== "" ||
    departmentId.trim() !== "" ||
    signatoryId.trim() !== "";

  const { data: results, error: resultsError } = hasFilters
    ? await query
    : { data: [], error: null };

  if (resultsError) {
    throw new Error("Impossible d'effectuer la recherche.");
  }

  return (
    <main className="app-page p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="app-card p-8 md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="app-title">Administration</h1>
              <p className="app-subtitle">Édition des lettres d’engagement</p>
            </div>

            <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-lg">
              AD
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Connecté en tant que <span className="font-bold">{appUser.full_name}</span> ({appUser.email})
          </div>

          <form method="GET" className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Nom du client</label>
              <input
                type="text"
                name="client"
                defaultValue={client}
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Date du contrat</label>
              <input
                type="date"
                name="contractDate"
                defaultValue={contractDate}
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Département</label>
              <select
                name="departmentId"
                defaultValue={departmentId}
                className="app-select"
              >
                <option value="">-- Tous les départements --</option>
                {departments?.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="app-label">Signataire</label>
              <select
                name="signatoryId"
                defaultValue={signatoryId}
                className="app-select"
              >
                <option value="">-- Tous les signataires --</option>
                {signatories?.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 grid gap-4 md:grid-cols-4 pt-2">
              <button type="submit" className="app-btn app-btn-amber py-4">
                Recherche
              </button>

              <Link href="/engagement/admin" className="app-btn app-btn-outline py-4">
                Réinitialiser
              </Link>

              <Link href="/" className="app-btn app-btn-outline py-4">
                Home
              </Link>

              <Link href="/engagement" className="app-btn app-btn-outline py-4">
                Précédent
              </Link>
            </div>
          </form>
        </div>

        <div className="app-card p-8 md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Documents trouvés</h2>
            {hasFilters && (
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {results?.length ?? 0} résultat(s)
              </span>
            )}
          </div>

          {!hasFilters ? (
            <div className="app-info text-center">
              Renseigne au moins un critère de recherche puis clique sur Recherche.
            </div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              {results.map((item) => {
                const department = Array.isArray(item.departments)
                  ? item.departments[0]
                  : item.departments;

                const signatory = Array.isArray(item.signatories)
                  ? item.signatories[0]
                  : item.signatories;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="break-all text-lg font-extrabold text-amber-700">
                        {item.reference_number}
                      </p>

                      <Link
                        href={`/engagement/admin/${item.id}`}
                        className="app-btn app-btn-amber px-5 py-3"
                      >
                        Modifier
                      </Link>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Nom du client :</span>{" "}
                        {item.client_name}
                      </p>
                      <p>
                        <span className="font-semibold">Département :</span>{" "}
                        {department?.name ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Date du contrat :</span>{" "}
                        {formatDateDisplay(item.contract_date)}
                      </p>
                      <p>
                        <span className="font-semibold">Signataire :</span>{" "}
                        {signatory?.full_name ?? "-"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="app-error text-center">
              Aucun numéro de référence trouvé pour cette recherche.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}