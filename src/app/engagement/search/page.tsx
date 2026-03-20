import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchPageProps = PageProps<"/engagement/search">;

export default async function EngagementSearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;

  const client = searchParams.client ?? "";
  const contractDate = searchParams.contractDate ?? "";
  const departmentId = searchParams.departmentId ?? "";
  const signatoryId = searchParams.signatoryId ?? "";

  const supabase = await createClient();

  // Charger les listes déroulantes
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

  // Construire la requête de recherche
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
        name,
        engagement_code
      ),
      signatories (
        id,
        full_name,
        initials
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
            Recherche ancien numéro de référence
          </h1>
          <p className="text-gray-600 mb-8">
            Lettre d’engagement
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
                placeholder="Ex: FINCA RDC"
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Recherche
              </button>

              <Link
                href="/engagement/search"
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
                    className="border border-gray-200 rounded-2xl p-5 bg-gray-50"
                  >
                    <p className="text-lg font-bold text-blue-800 break-all mb-3">
                      {item.reference_number}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
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
                        {item.contract_date}
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
            <div className="border border-dashed border-red-300 bg-red-50 rounded-2xl p-8 text-center text-red-700">
              Aucun numéro de référence trouvé pour cette recherche.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}