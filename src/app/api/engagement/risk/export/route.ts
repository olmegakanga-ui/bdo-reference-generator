import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_RISK_EMAILS = [
  "olmega.kanga@bdo-ea.com",
  "sarman.ilunga@bdo-ea.com",
  "brakini.biavanga@bdo-ea.com",
];

function escapeCsvValue(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function normalizeDate(value: string | null | undefined) {
  return value ?? "";
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const currentEmail = user.email.trim().toLowerCase();

  if (!ALLOWED_RISK_EMAILS.includes(currentEmail)) {
    return new NextResponse("Accès refusé", { status: 403 });
  }

  // 1) Références finales officielles
  const { data: letters, error: lettersError } = await supabase
    .from("engagement_letters")
    .select(`
      reference_number,
      contract_date,
      client_name,
      created_at,
      departments (
        name
      ),
      signatories (
        full_name
      )
    `)
    .order("created_at", { ascending: false });

  if (lettersError) {
    return new NextResponse(
      `Erreur export engagement_letters: ${lettersError.message}`,
      { status: 500 }
    );
  }

  // 2) Demandes encore non finalisées
  const { data: requests, error: requestsError } = await supabase
    .from("engagement_requests")
    .select(`
      reference_number,
      contract_date,
      client_name,
      status,
      created_at,
      departments (
        name
      ),
      signatories (
        full_name
      )
    `)
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false });

  if (requestsError) {
    return new NextResponse(
      `Erreur export engagement_requests: ${requestsError.message}`,
      { status: 500 }
    );
  }

  const headers = [
    "Numero de reference",
    "Date de la demande",
    "Date du contrat",
    "Client",
    "Signataire",
    "Departement",
    "Statut",
    "Source",
  ];

  const letterRows = (letters ?? []).map((item) => {
    const department = Array.isArray(item.departments)
      ? item.departments[0]
      : item.departments;

    const signatory = Array.isArray(item.signatories)
      ? item.signatories[0]
      : item.signatories;

    return [
      escapeCsvValue(item.reference_number ?? ""),
      escapeCsvValue(normalizeDate(item.created_at)),
      escapeCsvValue(normalizeDate(item.contract_date)),
      escapeCsvValue(item.client_name ?? ""),
      escapeCsvValue(signatory?.full_name ?? ""),
      escapeCsvValue(department?.name ?? ""),
      escapeCsvValue("Approuvée"),
      escapeCsvValue("engagement_letters"),
    ].join(",");
  });

  const requestRows = (requests ?? []).map((item) => {
    const department = Array.isArray(item.departments)
      ? item.departments[0]
      : item.departments;

    const signatory = Array.isArray(item.signatories)
      ? item.signatories[0]
      : item.signatories;

    const statusLabel =
      item.status === "pending"
        ? "En attente"
        : item.status === "rejected"
        ? "Refusée"
        : item.status ?? "";

    return [
      escapeCsvValue(item.reference_number ?? ""),
      escapeCsvValue(normalizeDate(item.created_at)),
      escapeCsvValue(normalizeDate(item.contract_date)),
      escapeCsvValue(item.client_name ?? ""),
      escapeCsvValue(signatory?.full_name ?? ""),
      escapeCsvValue(department?.name ?? ""),
      escapeCsvValue(statusLabel),
      escapeCsvValue("engagement_requests"),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...letterRows, ...requestRows].join("\n");

  const today = new Date().toISOString().slice(0, 10);
  const fileName = `engagement-export-sans-doublons-${today}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}