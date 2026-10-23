import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateDisplay } from "@/lib/reference-utils";

type Props = {
  searchParams: Promise<{
    employee?: string | string[];
    subject?: string | string[];
    issueDate?: string | string[];
    signatoryId?: string | string[];
  }>;
};

function single(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function MissionOrderSearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const employee = single(params.employee);
  const subject = single(params.subject);
  const issueDate = single(params.issueDate);
  const signatoryId = single(params.signatoryId);
  const supabase = await createClient();

  const { data: signatories, error: signatoriesError } = await supabase
    .from("signatories")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");
  if (signatoriesError) throw new Error("Impossible de charger les signataires.");

  let query = supabase
    .from("mission_orders")
    .select(`
      id, employee_name, mission_subject, issue_date,
      sequence_number, reference_number,
      signatories (id, full_name, initials)
    `)
    .order("created_at", { ascending: false });

  if (employee.trim()) query = query.ilike("employee_name", `%${employee.trim()}%`);
  if (subject.trim()) query = query.ilike("mission_subject", `%${subject.trim()}%`);
  if (issueDate.trim()) query = query.eq("issue_date", issueDate);
  if (signatoryId.trim()) query = query.eq("signatory_id", Number(signatoryId));

  const hasFilters = Boolean(employee.trim() || subject.trim() || issueDate.trim() || signatoryId.trim());
  const { data: results, error } = hasFilters ? await query : { data: [], error: null };
  if (error) throw new Error("Impossible d’effectuer la recherche.");

  return (
    <main className="app-page p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="app-card p-8 md:p-10">
          <div className="mb-8">
            <h1 className="app-title">Recherche</h1>
            <p className="app-subtitle">Ordres de mission</p>
          </div>
          <form method="GET" className="grid gap-6 md:grid-cols-2">
            <div><label className="app-label">Employé</label><input name="employee" defaultValue={employee} className="app-input" /></div>
            <div><label className="app-label">Objet de la mission</label><input name="subject" defaultValue={subject} className="app-input" /></div>
            <div><label className="app-label">Date d’émission</label><input type="date" name="issueDate" defaultValue={issueDate} className="app-input" /></div>
            <div>
              <label className="app-label">Signataire</label>
              <select name="signatoryId" defaultValue={signatoryId} className="app-select">
                <option value="">-- Tous les signataires --</option>
                {signatories?.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}
              </select>
            </div>
            <div className="grid gap-4 pt-2 md:col-span-2 md:grid-cols-4">
              <button className="app-btn app-btn-amber py-4">Rechercher</button>
              <Link href="/mission/search" className="app-btn app-btn-outline py-4">Réinitialiser</Link>
              <Link href="/" className="app-btn app-btn-outline py-4">Home</Link>
              <Link href="/mission" className="app-btn app-btn-outline py-4">Précédent</Link>
            </div>
          </form>
        </div>

        <div className="app-card p-8 md:p-10">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Résultats</h2>
          {!hasFilters ? (
            <div className="app-info text-center">Renseignez au moins un critère de recherche.</div>
          ) : results && results.length > 0 ? (
            <div className="space-y-4">
              {results.map((item) => {
                const signatory = Array.isArray(item.signatories) ? item.signatories[0] : item.signatories;
                return (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <p className="mb-4 break-all text-lg font-extrabold text-amber-800">{item.reference_number}</p>
                    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                      <p><span className="font-semibold">Employé :</span> {item.employee_name}</p>
                      <p><span className="font-semibold">Objet :</span> {item.mission_subject}</p>
                      <p><span className="font-semibold">Date :</span> {formatDateDisplay(item.issue_date)}</p>
                      <p><span className="font-semibold">Signataire :</span> {signatory?.full_name ?? "-"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="app-error text-center">Aucun ordre de mission trouvé.</div>}
        </div>
      </div>
    </main>
  );
}
