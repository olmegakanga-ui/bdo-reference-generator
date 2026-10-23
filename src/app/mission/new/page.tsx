import { createClient } from "@/lib/supabase/server";
import MissionOrderForm from "@/components/mission/mission-order-form";

export default async function MissionOrderNewPage() {
  const supabase = await createClient();
  const { data: signatories, error } = await supabase
    .from("signatories")
    .select("id, full_name, initials")
    .eq("is_active", true)
    .order("full_name");

  if (error) {
    throw new Error("Impossible de charger les signataires.");
  }

  return <MissionOrderForm signatories={signatories ?? []} />;
}
