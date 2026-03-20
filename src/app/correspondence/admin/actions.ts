"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildCorrespondenceReference } from "@/lib/reference-utils";
import { getCurrentAppUser } from "@/lib/auth";

type ActionState = {
  error?: string;
};

export async function updateCorrespondenceReference(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const recordId = Number(formData.get("recordId"));
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const issueDate = String(formData.get("issueDate") ?? "").trim();
  const senderId = Number(formData.get("senderId"));

  if (!recordId || !recipientName || !departmentId || !issueDate || !senderId) {
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

  if (existingRecordError || !existingRecord) {
    return {
      error: "Document introuvable.",
    };
  }

  const { data: duplicateRecord, error: duplicateError } = await supabase
    .from("correspondences")
    .select("id")
    .ilike("recipient_name", recipientName)
    .eq("department_id", departmentId)
    .eq("issue_date", issueDate)
    .eq("sender_id", senderId)
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
    .select("id, name, correspondence_code")
    .eq("id", departmentId)
    .single();

  if (departmentError || !department) {
    return {
      error: "Département introuvable.",
    };
  }

  const { data: sender, error: senderError } = await supabase
    .from("signatories")
    .select("id, full_name, initials")
    .eq("id", senderId)
    .single();

  if (senderError || !sender) {
    return {
      error: "Expéditeur introuvable.",
    };
  }

  let finalSequenceNumber = existingRecord.sequence_number;

  const senderChanged = existingRecord.sender_id !== senderId;

  if (senderChanged) {
    const { data: counter, error: counterError } = await supabase
      .from("correspondence_counters")
      .select("id, last_number")
      .eq("signatory_id", senderId)
      .single();

    if (counterError || !counter) {
      return {
        error: "Compteur du nouvel expéditeur introuvable.",
      };
    }

    finalSequenceNumber = counter.last_number + 1;

    const { error: updateCounterError } = await supabase
      .from("correspondence_counters")
      .update({ last_number: finalSequenceNumber })
      .eq("id", counter.id);

    if (updateCounterError) {
      return {
        error: `Impossible de mettre à jour le compteur de l’expéditeur : ${updateCounterError.message}`,
      };
    }
  }

  const newReferenceNumber = buildCorrespondenceReference({
    departmentCode: department.correspondence_code,
    senderInitials: sender.initials,
    issueDate,
    sequenceNumber: finalSequenceNumber,
  });

  const { error: updateError } = await supabase
    .from("correspondences")
    .update({
      recipient_name: recipientName,
      department_id: departmentId,
      issue_date: issueDate,
      sender_id: senderId,
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
    record_type: "correspondence",
    record_id: recordId,
    old_value: existingRecord,
    new_value: {
      recipient_name: recipientName,
      department_id: departmentId,
      issue_date: issueDate,
      sender_id: senderId,
      sequence_number: finalSequenceNumber,
      reference_number: newReferenceNumber,
    },
  });

  await supabase.auth.signOut();

  redirect(
    `/correspondence/result?reference=${encodeURIComponent(newReferenceNumber)}`
  );
}