"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DOCUMENT_TYPES = ["engagement", "correspondence"] as const;
type DocumentType = (typeof DOCUMENT_TYPES)[number];

function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

function redirectWithError(message: string): never {
  redirect(`/admin/signatories?error=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const { authUser, appUser } = await getCurrentAppUser();

  if (!authUser || appUser?.role !== "admin") {
    redirectWithError("Accès administrateur requis.");
  }
}

export async function createSignatory(formData: FormData) {
  await requireAdmin();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const initials = String(formData.get("initials") ?? "").trim().toUpperCase();
  const documentType = String(formData.get("documentType") ?? "");

  if (!fullName || !initials || !isDocumentType(documentType)) {
    redirectWithError("Les informations du signataire sont invalides.");
  }

  const adminClient = createAdminClient();
  const { data: signatory, error } = await adminClient
    .from("signatories")
    .insert({
      full_name: fullName,
      initials,
      document_type: documentType,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !signatory) {
    redirectWithError(
      `Impossible d'ajouter le signataire : ${error?.message ?? "réponse invalide"}`
    );
  }

  if (documentType === "correspondence") {
    const { error: counterError } = await adminClient
      .from("correspondence_counters")
      .insert({ signatory_id: signatory.id, last_number: 0 });

    if (counterError) {
      await adminClient.from("signatories").delete().eq("id", signatory.id);
      redirectWithError(
        `Impossible de créer le compteur du signataire : ${counterError.message}`
      );
    }
  }

  revalidatePath("/admin/signatories");
  redirect("/admin/signatories?success=created");
}

export async function updateSignatoryModule(formData: FormData) {
  await requireAdmin();

  const signatoryId = Number(formData.get("signatoryId"));
  const documentType = String(formData.get("documentType") ?? "");

  if (!Number.isInteger(signatoryId) || !isDocumentType(documentType)) {
    redirectWithError("La nouvelle affectation est invalide.");
  }

  const adminClient = createAdminClient();

  if (documentType === "correspondence") {
    const { error: counterError } = await adminClient
      .from("correspondence_counters")
      .upsert(
        { signatory_id: signatoryId, last_number: 0 },
        { onConflict: "signatory_id", ignoreDuplicates: true }
      );

    if (counterError) {
      redirectWithError(
        `Impossible de préparer le compteur du signataire : ${counterError.message}`
      );
    }
  }

  const { error } = await adminClient
    .from("signatories")
    .update({ document_type: documentType })
    .eq("id", signatoryId);

  if (error) {
    redirectWithError(`Impossible de modifier l'affectation : ${error.message}`);
  }

  revalidatePath("/admin/signatories");
  redirect("/admin/signatories?success=updated");
}

export async function toggleSignatoryStatus(formData: FormData) {
  await requireAdmin();

  const signatoryId = Number(formData.get("signatoryId"));
  const isActive = String(formData.get("isActive")) === "true";

  if (!Number.isInteger(signatoryId)) {
    redirectWithError("Signataire invalide.");
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("signatories")
    .update({ is_active: !isActive })
    .eq("id", signatoryId);

  if (error) {
    redirectWithError(`Impossible de modifier le signataire : ${error.message}`);
  }

  revalidatePath("/admin/signatories");
  redirect(`/admin/signatories?success=${isActive ? "disabled" : "enabled"}`);
}
