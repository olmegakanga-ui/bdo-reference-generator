import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { formatDateDisplay } from "@/lib/reference-utils";
import SignOutButton from "@/components/admin/sign-out-button";

type Props = {
  searchParams: Promise<{
    recipient?: string;
    issueDate?: string;
    departmentId?: string;
    senderId?: string;
  }>;
};

export default async function CorrespondenceAdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const recipient = params.recipient ?? "";
  const issueDate = params.issueDate ?? "";
  const departmentId = params.departmentId ?? "";
  const senderId = params.senderId ?? "";

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
              href="/admin/login?next=/correspondence/admin"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
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
            Veuillez contacter l’administrateur ou le partenaire expéditeur du document.
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
              href="/correspondence"
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
    throw new Error("Impossible de charger les expéditeurs.");
  }

  let query = supabase
    .from("correspondences")
    .select(`
      id,
      recipient_name,
      issue_date,
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

  if (recipient.trim()) {
    query = query.ilike("recipient_name", `%${recipient.trim()}%`);
  }

  if (issueDate.trim()) {
    query = query.eq("issue_date", issueDate);
  }

  if (departmentId.trim()) {
    query = query.eq("department_id", Number(departmentId));
  }

  if (senderId.trim()) {
    query = query.eq("sender_id", Number(senderId));
  }

  const hasFilters =
    recipient.trim() !== "" ||
    issueDate.trim() !== "" ||
    departmentId.trim() !== "" ||
    senderId.trim() !== "";

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
          <p className="text-gray-600 mb-2">Correspondance</p>
          <p className="text-sm text-green-700 mb-8">
            Connecté en tant que {appUser.full_name} ({appUser.email})
          </p>

          <form method="GET" className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destinataire
              </label>
              <input
                type="text"
                name="recipient"
                defaultValue={recipient}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date d’émission
              </label>
              <input
                type="date"
                name="issueDate"
                defaultValue={issueDate}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Département
              </label>
              <select
                name="departmentId"
                defaultValue={departmentId}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
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
                Expéditeur
              </label>
              <select
                name="senderId"
                defaultValue={senderId}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Tous les expéditeurs --</option>
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
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl"
              >
                Recherche
              </button>

              <Link
                href="/correspondence/admin"
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
                href="/correspondence"
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

                const sender = Array.isArray(item.signatories)
                  ? item.signatories[0]
                  : item.signatories;

                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-2xl p-5 bg-gray-50"
                  >
                    <p className="text-lg font-bold text-green-800 break-all mb-3">
                      {item.reference_number}
                    </p>

                    <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                      <p>
                        <span className="font-semibold">Destinataire :</span>{" "}
                        {item.recipient_name}
                      </p>
                      <p>
                        <span className="font-semibold">Département :</span>{" "}
                        {department?.name ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Date d’émission :</span>{" "}
                        {formatDateDisplay(item.issue_date)}
                      </p>
                      <p>
                        <span className="font-semibold">Expéditeur :</span>{" "}
                        {sender?.full_name ?? "-"}
                      </p>
                    </div>

                    <Link
                      href={`/correspondence/admin/${item.id}`}
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