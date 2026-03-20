import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import CorrespondenceEditForm from "@/components/correspondence/correspondence-edit-form";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CorrespondenceEditPage({ params }: Props) {
  const { id } = await params;
  const recordId = Number(id);

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

          <Link
            href={`/admin/login?next=/correspondence/admin/${recordId}`}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl"
          >
            Se connecter
          </Link>
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
          <p className="text-gray-700 mb-8">
            Vous n’avez pas le droit de modifier ce document.
          </p>

          <Link
            href="/correspondence/admin"
            className="inline-block border border-gray-300 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50"
          >
            Retour
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();

  const { data: record, error: recordError } = await supabase
    .from("correspondences")
    .select(`
      id,
      recipient_name,
      issue_date,
      department_id,
      sender_id,
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
    throw new Error("Impossible de charger les expéditeurs.");
  }

  return (
    <CorrespondenceEditForm
      record={record}
      departments={departments ?? []}
      signatories={signatories ?? []}
    />
  );
}