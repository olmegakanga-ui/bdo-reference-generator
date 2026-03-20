"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildEngagementReference } from "@/lib/reference-utils";
import { getCurrentAppUser } from "@/lib/auth";

type ActionState = {
  error?: string;
};

export async function updateEngagementReference(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const recordId = Number(formData.get("recordId"));
  const clientName = String(formData.get("clientName") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const contractDate = String(formData.get("contractDate") ?? "").trim();
  const signatoryId = Number(formData.get("signatoryId"));

  if (!recordId || !clientName || !departmentId || !contractDate || !signatoryId) {
    return {
      error: "Tous les champs obligatoires doivent être remplis.",
    };
  }

  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser || !appUser || appUser.role !== "admin") {
    return {
      error: "Vous n’avez pas le droit de modifier ce document.",
    };
  }

  const supabase = await createClient();

  const { data: existingRecord, error: existingRecordError } = await supabase
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

  if (existingRecordError || !existingRecord) {
    return {
      error: "Document introuvable.",
    };
  }

  const { data: duplicateRecord, error: duplicateError } = await supabase
    .from("engagement_letters")
    .select("id")
    .ilike("client_name", clientName)
    .eq("department_id", departmentId)
    .eq("contract_date", contractDate)
    .eq("signatory_id", signatoryId)
    .neq("id", recordId)
    .maybeSingle();

  if (duplicateError) {
    return {
      error: `Erreur lors de la vérification du doublon : ${duplicateError.message}`,
    };
  }

  if (duplicateRecord) {
    return {
      error: "Un autre document existe déjà avec ces mêmes informations.",
    };
  }

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

  let finalSequenceNumber = existingRecord.sequence_number;

  const departmentChanged = existingRecord.department_id !== departmentId;

  if (departmentChanged) {
    const { data: counter, error: counterError } = await supabase
      .from("engagement_counters")
      .select("id, last_number")
      .eq("department_id", departmentId)
      .single();

    if (counterError || !counter) {
      return {
        error: "Compteur du nouveau département introuvable.",
      };
    }

    finalSequenceNumber = counter.last_number + 1;

    const { error: updateCounterError } = await supabase
      .from("engagement_counters")
      .update({ last_number: finalSequenceNumber })
      .eq("id", counter.id);

    if (updateCounterError) {
      return {
        error: `Impossible de mettre à jour le compteur du département : ${updateCounterError.message}`,
      };
    }
  }

  const newReferenceNumber = buildEngagementReference({
    departmentCode: department.engagement_code,
    contractDate,
    sequenceNumber: finalSequenceNumber,
    signatoryInitials: signatory.initials,
  });

  const { error: updateError } = await supabase
    .from("engagement_letters")
    .update({
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
      sequence_number: finalSequenceNumber,
      reference_number: newReferenceNumber,
      updated_by_email: appUser.email,
    })
    .eq("id", recordId);

  if (updateError) {
    return {
      error: `Erreur lors de la modification : ${updateError.message}`,
    };
  }

  await supabase.from("audit_logs").insert({
    user_email: appUser.email,
    action: "UPDATE",
    record_type: "engagement_letter",
    record_id: recordId,
    old_value: existingRecord,
    new_value: {
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
      sequence_number: finalSequenceNumber,
      reference_number: newReferenceNumber,
    },
  });

  redirect(
    `/engagement/result?reference=${encodeURIComponent(newReferenceNumber)}`
  );
}