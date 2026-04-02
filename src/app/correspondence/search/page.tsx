import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateDisplay } from "@/lib/reference-utils";

type Props = {
  searchParams: Promise<{
    recipient?: string | string[];
    issueDate?: string | string[];
    departmentId?: string | string[];
    senderId?: string | string[];
  }>;
};

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function CorrespondenceSearchPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const recipient = getSingleValue(params.recipient);
  const issueDate = getSingleValue(params.issueDate);
  const departmentId = getSingleValue(params.departmentId);
  const senderId = getSingleValue(params.senderId);

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
        name,
        correspondence_code
      ),
      signatories (
        id,
        full_name,
        initials
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
    <main className="app-page p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="app-card p-8 md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="app-title">Recherche</h1>
              <p className="app-subtitle">Correspondance</p>
            </div>

            <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white font-extrabold shadow-lg">
              CO
            </div>
          </div>

          <form method="GET" className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Destinataire</label>
              <input
                type="text"
                name="recipient"
                defaultValue={recipient}
                placeholder="Ex: Rawbank"
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Date d’émission</label>
              <input
                type="date"
                name="issueDate"
                defaultValue={issueDate}
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
              <label className="app-label">Expéditeur</label>
              <select
                name="senderId"
                defaultValue={senderId}
                className="app-select"
              >
                <option value="">-- Tous les expéditeurs --</option>
                {signatories?.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 grid gap-4 md:grid-cols-4 pt-2">
              <button type="submit" className="app-btn app-btn-green py-4">
                Recherche
              </button>

              <Link href="/correspondence/search" className="app-btn app-btn-outline py-4">
                Réinitialiser
              </Link>

              <Link href="/" className="app-btn app-btn-outline py-4">
                Home
              </Link>

              <Link href="/correspondence" className="app-btn app-btn-outline py-4">
                Précédent
              </Link>
            </div>
          </form>
        </div>

        <div className="app-card p-8 md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Résultats</h2>
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

                const sender = Array.isArray(item.signatories)
                  ? item.signatories[0]
                  : item.signatories;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="break-all text-lg font-extrabold text-green-800">
                        {item.reference_number}
                      </p>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                        N° {item.sequence_number}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
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