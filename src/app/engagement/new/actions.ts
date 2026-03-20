"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildEngagementReference } from "@/lib/reference-utils";

type ActionState = {
  error?: string;
};

export async function createEngagementReference(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientName = String(formData.get("clientName") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const contractDate = String(formData.get("contractDate") ?? "").trim();
  const signatoryId = Number(formData.get("signatoryId"));

  if (!clientName || !departmentId || !contractDate || !signatoryId) {
    return {
      error: "Tous les champs obligatoires doivent être remplis.",
    };
  }

  const supabase = await createClient();

  // 1. Vérifier si un document identique existe déjà
  const { data: existingRecord, error: existingError } = await supabase
    .from("engagement_letters")
    .select(
      `
      id,
      client_name,
      contract_date,
      reference_number,
      departments (
        name
      ),
      signatories (
        full_name,
        initials
      )
    `
    )
    .ilike("client_name", clientName)
    .eq("department_id", departmentId)
    .eq("contract_date", contractDate)
    .eq("signatory_id", signatoryId)
    .maybeSingle();

  if (existingError) {
    return {
      error: `Erreur lors de la vérification du doublon : ${existingError.message}`,
    };
  }

  if (existingRecord) {
    const signatory =
      Array.isArray(existingRecord.signatories)
        ? existingRecord.signatories[0]
        : existingRecord.signatories;

    return {
      error: `Ce client a déjà un document signé par ${signatory?.full_name ?? "ce signataire"} à la date du ${contractDate}.`,
    };
  }

  // 2. Charger le département
  const { data: department, error: departmentError } = await supabase
    .from("departments")
    .select("id, name, engagement_code")
    .eq("id", departmentId)
    .single();

  if (departmentError || !department) {
    return {
      error: "Département introuvable.",
    };
  }

  // 3. Charger le signataire
  const { data: signatory, error: signatoryError } = await supabase
    .from("signatories")
    .select("id, full_name, initials")
    .eq("id", signatoryId)
    .single();

  if (signatoryError || !signatory) {
    return {
      error: "Signataire introuvable.",
    };
  }

  // 4. Charger le compteur du département
  const { data: counter, error: counterError } = await supabase
    .from("engagement_counters")
    .select("id, last_number")
    .eq("department_id", departmentId)
    .single();

  if (counterError || !counter) {
    return {
      error: "Compteur du département introuvable.",
    };
  }

  const nextNumber = counter.last_number + 1;

  // 5. Construire la référence
  const referenceNumber = buildEngagementReference({
    departmentCode: department.engagement_code,
    contractDate,
    sequenceNumber: nextNumber,
    signatoryInitials: signatory.initials,
  });

  // 6. Enregistrer la lettre
  const { data: insertedLetter, error: insertError } = await supabase
    .from("engagement_letters")
    .insert({
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
      sequence_number: nextNumber,
      reference_number: referenceNumber,
      created_by_email: "system",
      updated_by_email: "system",
    })
    .select("id, reference_number")
    .single();

  if (insertError) {
    return {
      error: `Erreur lors de l'enregistrement : ${insertError.message}`,
    };
  }

  // 7. Mettre à jour le compteur
  const { error: updateCounterError } = await supabase
    .from("engagement_counters")
    .update({ last_number: nextNumber })
    .eq("id", counter.id);

  if (updateCounterError) {
    return {
      error: `Le document a été créé, mais le compteur n'a pas pu être mis à jour : ${updateCounterError.message}`,
    };
  }

  // 8. Journal d'audit simple
  await supabase.from("audit_logs").insert({
    user_email: "system",
    action: "CREATE",
    record_type: "engagement_letter",
    record_id: insertedLetter.id,
    new_value: {
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
      sequence_number: nextNumber,
      reference_number: referenceNumber,
    },
  });

  redirect(
    `/engagement/result?reference=${encodeURIComponent(referenceNumber)}`
  );
}