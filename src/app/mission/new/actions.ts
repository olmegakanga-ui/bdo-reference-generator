"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildMissionOrderReference } from "@/lib/reference-utils";

type ActionState = { error?: string };

export async function createMissionOrderReference(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const employeeName = String(formData.get("employeeName") ?? "").trim();
  const missionSubject = String(formData.get("missionSubject") ?? "").trim();
  const issueDate = String(formData.get("issueDate") ?? "").trim();
  const signatoryId = Number(formData.get("signatoryId"));

  if (!employeeName || !missionSubject || !issueDate || !signatoryId) {
    return { error: "Tous les champs obligatoires doivent être remplis." };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("mission_orders")
    .select("id")
    .ilike("employee_name", employeeName)
    .ilike("mission_subject", missionSubject)
    .eq("issue_date", issueDate)
    .eq("signatory_id", signatoryId)
    .maybeSingle();

  if (existingError) {
    return { error: `Erreur lors de la vérification du doublon : ${existingError.message}` };
  }
  if (existing) {
    return { error: "Un ordre de mission identique existe déjà pour cet employé." };
  }

  const { data: signatory, error: signatoryError } = await supabase
    .from("signatories")
    .select("id, full_name, initials")
    .eq("id", signatoryId)
    .eq("is_active", true)
    .single();

  if (signatoryError || !signatory) {
    return { error: "Signataire introuvable." };
  }

  let { data: counter, error: counterError } = await supabase
    .from("mission_order_counters")
    .select("id, last_number")
    .eq("signatory_id", signatoryId)
    .maybeSingle();

  if (!counter && !counterError) {
    const { data: newCounter, error: newCounterError } = await supabase
      .from("mission_order_counters")
      .insert({ signatory_id: signatoryId, last_number: 0 })
      .select("id, last_number")
      .single();
    counter = newCounter;
    counterError = newCounterError;
  }

  if (counterError || !counter) {
    return { error: "Compteur du signataire introuvable." };
  }

  const nextNumber = counter.last_number + 1;
  const referenceNumber = buildMissionOrderReference({
    signatoryInitials: signatory.initials,
    issueDate,
    sequenceNumber: nextNumber,
  });

  const { data: inserted, error: insertError } = await supabase
    .from("mission_orders")
    .insert({
      employee_name: employeeName,
      mission_subject: missionSubject,
      issue_date: issueDate,
      signatory_id: signatoryId,
      sequence_number: nextNumber,
      reference_number: referenceNumber,
      created_by_email: "system",
      updated_by_email: "system",
    })
    .select("id, reference_number")
    .single();

  if (insertError) {
    return { error: `Erreur lors de l’enregistrement : ${insertError.message}` };
  }

  const { error: counterUpdateError } = await supabase
    .from("mission_order_counters")
    .update({ last_number: nextNumber })
    .eq("id", counter.id);

  if (counterUpdateError) {
    return { error: `Le document a été créé, mais le compteur n’a pas pu être mis à jour : ${counterUpdateError.message}` };
  }

  await supabase.from("audit_logs").insert({
    user_email: "system",
    action: "CREATE",
    record_type: "mission_order",
    record_id: inserted.id,
    new_value: {
      employee_name: employeeName,
      mission_subject: missionSubject,
      issue_date: issueDate,
      signatory_id: signatoryId,
      sequence_number: nextNumber,
      reference_number: referenceNumber,
    },
  });

  redirect(`/mission/result?reference=${encodeURIComponent(referenceNumber)}`);
}
