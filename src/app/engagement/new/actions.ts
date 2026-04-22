"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { sendRiskReviewRequestEmail } from "@/lib/email";

type ActionState = {
  error?: string;
};

export async function createEngagementRequest(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientName = String(formData.get("clientName") ?? "").trim();
  const departmentId = Number(formData.get("departmentId"));
  const contractDate = String(formData.get("contractDate") ?? "").trim();
  const signatoryId = Number(formData.get("signatoryId"));

  if (!clientName || !departmentId || !contractDate || !signatoryId) {
    return { error: "Tous les champs sont obligatoires." };
  }

  const supabase = await createClient();

  // 🔐 récupérer utilisateur connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Utilisateur non connecté." };
  }

  const authEmail = user.email.trim().toLowerCase();

  // ✅ récupérer infos complémentaires depuis la bonne table
  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("email", authEmail)
    .single();

  if (appUserError) {
    console.warn(
      "Impossible de retrouver l'utilisateur métier :",
      appUserError.message
    );
  }

  // ✅ fallback intelligent si full_name absent
  const requesterName =
    appUser?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    authEmail.split("@")[0];

  const requesterEmail = appUser?.email?.trim().toLowerCase() || authEmail;

  // récupérer département
  const { data: department } = await supabase
    .from("departments")
    .select("id, name")
    .eq("id", departmentId)
    .single();

  // récupérer signataire
  const { data: signatory } = await supabase
    .from("signatories")
    .select("id, full_name")
    .eq("id", signatoryId)
    .single();

  if (!department || !signatory) {
    return { error: "Informations invalides." };
  }

  // 🔑 token unique
  const reviewToken = randomUUID();

  // 💾 créer la demande
  const { data: request, error } = await supabase
    .from("engagement_requests")
    .insert({
      requester_name: requesterName,
      requester_email: requesterEmail,
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
      status: "pending",
      review_token: reviewToken,
    })
    .select()
    .single();

  if (error || !request) {
    console.error("Erreur création demande :", error);
    return {
      error: "Erreur lors de la création de la demande.",
    };
  }

  // 📧 envoyer email à la team risque
  await sendRiskReviewRequestEmail({
    requestId: request.id,
    reviewToken,
    requesterName,
    requesterEmail,
    clientName,
    departmentName: department.name,
    contractDate,
    signatoryName: signatory.full_name,
  });

  // 📊 audit log
  await supabase.from("audit_logs").insert({
    user_email: requesterEmail,
    action: "CREATE_REQUEST",
    record_type: "engagement_request",
    record_id: request.id,
    new_value: {
      client_name: clientName,
      department_id: departmentId,
      contract_date: contractDate,
      signatory_id: signatoryId,
    },
  });

  // 🚀 redirection vers page confirmation
  redirect(`/engagement/request/success?id=${request.id}`);
}