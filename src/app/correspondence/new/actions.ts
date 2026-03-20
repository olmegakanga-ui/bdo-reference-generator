"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildCorrespondenceReference } from "@/lib/reference-utils";

type ActionState = {
  error?: string;
};

export async function createCorrespondenceReference(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const issueDate = String(formData.get("issueDate") ?? "").trim();
  const senderId = Number(formData.get("senderId"));

  if (!recipientName || !departmentId || !issueDate || !senderId) {
    return {
      error: "Tous les champs obligatoires doivent être remplis.",
    };
  }

  const supabase = await createClient();

  // 1) Vérifier si la correspondance existe déjà
  const { data: existingRecord, error: existingError } = await supabase
    .from("correspondences")
    .select(
      `
      id,
      recipient_name,
      issue_date,
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
    .ilike("recipient_name", recipientName)
    .eq("department_id", departmentId)
    .eq("issue_date", issueDate)
    .eq("sender_id", senderId)
    .maybeSingle();

  if (existingError) {
    return {
      error: `Erreur lors de la vérification du doublon : ${existingError.message}`,
    };
  }

  if (existingRecord) {
    const sender = Array.isArray(existingRecord.signatories)
      ? existingRecord.signatories[0]
      : existingRecord.signatories;

    return {
      error: `Ce destinataire a déjà une correspondance signée par ${sender?.full_name ?? "cet expéditeur"} à la date du ${issueDate}.`,
    };
  }

  // 2) Charger le département
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

  // 3) Charger l’expéditeur
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

  // 4) Charger le compteur de l’expéditeur
  const { data: counter, error: counterError } = await supabase
    .from("correspondence_counters")
    .select("id, last_number")
    .eq("signatory_id", senderId)
    .single();

  if (counterError || !counter) {
    return {
      error: "Compteur de l’expéditeur introuvable.",
    };
  }

  const nextNumber = counter.last_number + 1;

  // 5) Construire la référence
  const referenceNumber = buildCorrespondenceReference({
    departmentCode: department.correspondence_code,
    senderInitials: sender.initials,
    issueDate,
    sequenceNumber: nextNumber,
  });

  // 6) Enregistrer la correspondance
  const { data: insertedRecord, error: insertError } = await supabase
    .from("correspondences")
    .insert({
      recipient_name: recipientName,
      department_id: departmentId,
      issue_date: issueDate,
      sender_id: senderId,
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

  // 7) Mettre à jour le compteur
  const { error: updateCounterError } = await supabase
    .from("correspondence_counters")
    .update({ last_number: nextNumber })
    .eq("id", counter.id);

  if (updateCounterError) {
    return {
      error: `Le document a été créé, mais le compteur n'a pas pu être mis à jour : ${updateCounterError.message}`,
    };
  }

  // 8) Audit log
  await supabase.from("audit_logs").insert({
    user_email: "system",
    action: "CREATE",
    record_type: "correspondence",
    record_id: insertedRecord.id,
    new_value: {
      recipient_name: recipientName,
      department_id: departmentId,
      issue_date: issueDate,
      sender_id: senderId,
      sequence_number: nextNumber,
      reference_number: referenceNumber,
    },
  });

  redirect(
    `/correspondence/result?reference=${encodeURIComponent(referenceNumber)}`
  );
}