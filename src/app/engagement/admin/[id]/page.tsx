import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import EngagementEditForm from "@/components/engagement/engagement-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EngagementEditPage({ params }: Props) {
  const { id } = await params;
  const recordId = Number(id);

  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser) {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="app-title mb-4">Accès administrateur requis</h1>
          <p className="app-subtitle mb-8">
            Veuillez vous connecter avec un compte administrateur.
          </p>

          <Link
            href={`/admin/login?next=/engagement/admin/${recordId}`}
            className="app-btn app-btn-blue px-8 py-4"
          >
            Se connecter
          </Link>
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
          <p className="text-slate-700 mb-8">
            Vous n’avez pas le droit de modifier ce document.
          </p>

          <Link
            href="/engagement/admin"
            className="app-btn app-btn-outline px-8 py-4"
          >
            Retour
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: record, error: recordError } = await supabase
    .from("engagement_letters")
    .select(`
      id,
      client_name,
      contract_date,
      department_id,
      signatory_id,
      sequence_number,
      reference_number
    `)
    .eq("id", recordId)
    .single();

  if (recordError || !record) {
    throw new Error("Document introuvable.");
  }

  const { data: departments, error: departmentsError } = await supabase
    .from("departments")
    .select("id, name, engagement_code, correspondence_code")
    .order("name");

  const { data: signatories, error: signatoriesError } = await supabase
    .from("signatories")
    .select("id, full_name, initials")
    .eq("is_active", true)
    .order("full_name");

  if (departmentsError) {
    throw new Error("Impossible de charger les départements.");
  }

  if (signatoriesError) {
    throw new Error("Impossible de charger les signataires.");
  }

  return (
    <EngagementEditForm
      record={record}
      departments={departments ?? []}
      signatories={signatories ?? []}
    />
  );
}