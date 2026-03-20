import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatDateDisplay } from "@/lib/reference-utils";
import SignOutButton from "@/components/admin/sign-out-button";

type Props = {
  searchParams: Promise<{
    client?: string;
    contractDate?: string;
    departmentId?: string;
    signatoryId?: string;
  }>;
};

export default async function EngagementAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const client = params.client ?? "";
  const contractDate = params.contractDate ?? "";
  const departmentId = params.departmentId ?? "";
  const signatoryId = params.signatoryId ?? "";

  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Accès administrateur requis
          </h1>
          <p className="text-gray-600 mb-8">
            Veuillez vous connecter avec un compte administrateur.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/login?next=/engagement/admin"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
            >
              Se connecter
            </Link>
            <Link
              href="/"
              className="border border-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!appUser || appUser.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-red-700 mb-4">
            Accès refusé
          </h1>
          <p className="text-gray-700 mb-6">
            Vous n’avez pas le droit de modifier un numéro de référence.
          </p>
          <p className="text-gray-600 mb-8">
            Veuillez contacter l’administrateur ou le partenaire signataire du
            document.
          </p>

          <div className="grid grid-cols-3 gap-4">
            <SignOutButton />

            <Link
              href="/"
              className="border border-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Home
            </Link>

            <Link
              href="/engagement"
              className="border border-gray-300 font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
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
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Éditer un numéro de référence
          </h1>
          <p className="text-gray-600 mb-2">Lettre d’engagement</p>
          <p className="text-sm text-green-700 mb-8">
            Connecté en tant que {appUser.full_name} ({appUser.email})
          </p>

          <form method="GET" className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du client
              </label>
              <input
                type="text"
                name="client"
                defaultValue={client}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date du contrat
              </label>
              <input
                type="date"
                name="contractDate"
                defaultValue={contractDate}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Département
              </label>
              <select
                name="departmentId"
                defaultValue={departmentId}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Signataire
              </label>
              <select
                name="signatoryId"
                defaultValue={signatoryId}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Tous les signataires --</option>
                {signatories?.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 grid md:grid-cols-4 gap-4 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
              >
                Recherche
              </button>

              <Link
                href="/engagement/admin"
                className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                Réinitialiser
              </Link>

              <Link
                href="/"
                className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                Home
              </Link>

              <Link
                href="/engagement"
                className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
              >
                Précédent
              </Link>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Résultats</h2>
            {hasFilters && (
              <span className="text-sm text-gray-500">
                {results?.length ?? 0} résultat(s)
              </span>
            )}
          </div>

          {!hasFilters ? (
            <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center text-gray-500">
              Renseigne au moins un critère de recherche puis clique sur
              Recherche.
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
                    className="border border-gray-200 rounded-2xl p-5 bg-gray-50"
                  >
                    <p className="text-lg font-bold text-blue-800 break-all mb-3">
                      {item.reference_number}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
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

                    <Link
                      href={`/engagement/admin/${item.id}`}
                      className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-3 rounded-xl"
                    >
                      Modifier
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-red-300 bg-red-50 rounded-2xl p-8 text-center text-red-700">
              Aucun numéro de référence trouvé pour cette recherche.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}