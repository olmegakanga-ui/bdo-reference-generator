import { createClient } from "@/lib/supabase/server";
import EngagementForm from "@/components/engagement/engagement-form";

export default async function EngagementNewPage() {
  const supabase = await createClient();

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
    <EngagementForm
      departments={departments ?? []}
      signatories={signatories ?? []}
    />
  );
}