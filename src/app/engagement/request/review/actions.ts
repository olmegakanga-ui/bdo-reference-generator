"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildEngagementReference } from "@/lib/reference-utils";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

type ActionState = {
  error?: string;
};

const ALLOWED_RISK_EMAILS = [
  "olmega.kanga@bdo-ea.com",
  "sarman.ilunga@bdo-ea.com",
  "brakini.biavanga@bdo-ea.com",
];

export async function approveEngagementRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const requestId = Number(formData.get("requestId"));
  const reviewToken = String(formData.get("reviewToken") ?? "").trim();

  if (!requestId || !reviewToken) {
    return { error: "Demande invalide." };
  }

  const supabase = await createClient();

  // Utilisateur connecté = reviewer risque
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reviewerEmail = user?.email?.trim().toLowerCase() ?? "";

  if (!reviewerEmail) {
    return { error: "Utilisateur non connecté." };
  }

  if (!ALLOWED_RISK_EMAILS.includes(reviewerEmail)) {
    return { error: "Vous n’êtes pas autorisé à traiter cette demande." };
  }

  const { data: request, error: requestError } = await supabase
    .from("engagement_requests")
    .select(`
      id,
      requester_name,
      requester_email,
      client_name,
      contract_date,
      department_id,
      signatory_id,
      status,
      review_token,
      reference_number,
      departments (
        id,
        name,
        engagement_code
      ),
      signatories (
        id,
        full_name,
        initials
      )
    `)
    .eq("id", requestId)
    .eq("review_token", reviewToken)
    .single();

  if (requestError || !request) {
    return { error: "Demande introuvable." };
  }

  if (request.status !== "pending") {
    return { error: "Cette demande a déjà été traitée." };
  }

  const department = Array.isArray(request.departments)
    ? request.departments[0]
    : request.departments;

  const signatory = Array.isArray(request.signatories)
    ? request.signatories[0]
    : request.signatories;

  if (!department || !signatory) {
    return { error: "Informations liées à la demande introuvables." };
  }

  const { data: counter, error: counterError } = await supabase
    .from("engagement_counters")
    .select("id, last_number")
    .eq("department_id", request.department_id)
    .single();

  if (counterError || !counter) {
    return { error: "Compteur du département introuvable." };
  }

  const nextNumber = counter.last_number + 1;

  const referenceNumber = buildEngagementReference({
    departmentCode: department.engagement_code,
    contractDate: request.contract_date,
    sequenceNumber: nextNumber,
    signatoryInitials: signatory.initials,
  });

  // Vérifie si la lettre existe déjà avant insertion
  const { data: existingLetter } = await supabase
    .from("engagement_letters")
    .select("id, reference_number")
    .eq("reference_number", referenceNumber)
    .maybeSingle();

  let insertedLetterId: number | null = null;

  if (existingLetter) {
    insertedLetterId = existingLetter.id;
  } else {
    const { data: insertedLetter, error: insertError } = await supabase
      .from("engagement_letters")
      .insert({
        client_name: request.client_name,
        department_id: request.department_id,
        contract_date: request.contract_date,
        signatory_id: request.signatory_id,
        sequence_number: nextNumber,
        reference_number: referenceNumber,
        created_by_email: request.requester_email,
        updated_by_email: request.requester_email,
      })
      .select("id")
      .single();

    if (insertError || !insertedLetter) {
      return {
        error: `Erreur lors de la création du document : ${insertError?.message ?? "Insertion impossible."}`,
      };
    }

    insertedLetterId = insertedLetter.id;
  }

  const { error: counterUpdateError } = await supabase
    .from("engagement_counters")
    .update({ last_number: nextNumber })
    .eq("id", counter.id);

  if (counterUpdateError) {
    return {
      error: `Document créé mais compteur non mis à jour : ${counterUpdateError.message}`,
    };
  }

  const { error: requestUpdateError } = await supabase
    .from("engagement_requests")
    .update({
      status: "approved",
      reference_number: referenceNumber,
      sequence_number: nextNumber,
      risk_reviewer_email: reviewerEmail,
    })
    .eq("id", request.id);

  if (requestUpdateError) {
    return { error: `Erreur mise à jour demande : ${requestUpdateError.message}` };
  }

  await supabase.from("audit_logs").insert({
    user_email: reviewerEmail,
    action: "APPROVE_REQUEST",
    record_type: "engagement_request",
    record_id: request.id,
    new_value: {
      reference_number: referenceNumber,
      sequence_number: nextNumber,
      engagement_letter_id: insertedLetterId,
    },
  });

  await sendApprovalEmail({
    requesterEmail: request.requester_email,
    requesterName: request.requester_name,
    referenceNumber,
  });

  redirect(`/engagement/request/review/${reviewToken}`);
}

export async function rejectEngagementRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const requestId = Number(formData.get("requestId"));
  const reviewToken = String(formData.get("reviewToken") ?? "").trim();
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!requestId || !reviewToken || !rejectionReason) {
    return { error: "Le motif du refus est obligatoire." };
  }

  const supabase = await createClient();

  // Utilisateur connecté = reviewer risque
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reviewerEmail = user?.email?.trim().toLowerCase() ?? "";

  if (!reviewerEmail) {
    return { error: "Utilisateur non connecté." };
  }

  if (!ALLOWED_RISK_EMAILS.includes(reviewerEmail)) {
    return { error: "Vous n’êtes pas autorisé à traiter cette demande." };
  }

  const { data: request, error: requestError } = await supabase
    .from("engagement_requests")
    .select("id, requester_name, requester_email, status, review_token")
    .eq("id", requestId)
    .eq("review_token", reviewToken)
    .single();

  if (requestError || !request) {
    return { error: "Demande introuvable." };
  }

  if (request.status !== "pending") {
    return { error: "Cette demande a déjà été traitée." };
  }

  const { error: updateError } = await supabase
    .from("engagement_requests")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      risk_reviewer_email: reviewerEmail,
    })
    .eq("id", request.id);

  if (updateError) {
    return { error: `Erreur lors du refus : ${updateError.message}` };
  }

  await supabase.from("audit_logs").insert({
    user_email: reviewerEmail,
    action: "REJECT_REQUEST",
    record_type: "engagement_request",
    record_id: request.id,
    new_value: {
      rejection_reason: rejectionReason,
    },
  });

  await sendRejectionEmail({
    requesterEmail: request.requester_email,
    requesterName: request.requester_name,
    rejectionReason,
  });

  redirect(`/engagement/request/review/${reviewToken}`);
}