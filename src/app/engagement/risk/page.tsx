import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDateDisplay } from "@/lib/reference-utils";

type Props = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

function getSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Approuvée";
    case "rejected":
      return "Refusée";
    default:
      return "En attente";
  }
}

const ALLOWED_RISK_EMAILS = [
  "olmega.kanga@bdo-ea.com",
  "sarman.ilunga@bdo-ea.com",
  "brakini.biavanga@bdo-ea.com",
];

export default async function RiskDashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = getSingleValue(params.status);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="app-title mb-4">Connexion requise</h1>
          <p className="app-subtitle mb-8">
            Veuillez vous connecter pour accéder au dashboard risque.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/login?next=/engagement/risk"
              className="app-btn app-btn-blue py-4"
            >
              Se connecter
            </Link>
            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentEmail = user.email.trim().toLowerCase();

  if (!ALLOWED_RISK_EMAILS.includes(currentEmail)) {
    return (
      <main className="app-page flex items-center justify-center p-6">
        <div className="app-card w-full max-w-2xl p-8 text-center">
          <h1 className="text-3xl font-extrabold text-red-700 mb-4">
            Accès refusé
          </h1>
          <p className="text-slate-700 mb-4">
            Vous n’êtes pas autorisé à accéder au dashboard Team Risque.
          </p>
          <p className="app-subtitle mb-8">
            Cette page est réservée à la Team Risque et aux administrateurs autorisés.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/" className="app-btn app-btn-outline py-4">
              Retour à l’accueil
            </Link>
            <Link href="/engagement" className="app-btn app-btn-outline py-4">
              Module engagement
            </Link>
          </div>
        </div>
      </main>
    );
  }

  let query = supabase
    .from("engagement_requests")
    .select(`
      id,
      requester_name,
      requester_email,
      client_name,
      contract_date,
      status,
      reference_number,
      rejection_reason,
      review_token,
      created_at,
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
    .order("created_at", { ascending: false });

  if (status.trim()) {
    query = query.eq("status", status);
  }

  const { data: requests, error } = await query;

  if (error) {
    throw new Error("Impossible de charger les demandes.");
  }

  const pendingCount =
    requests?.filter((item) => item.status === "pending").length ?? 0;
  const approvedCount =
    requests?.filter((item) => item.status === "approved").length ?? 0;
  const rejectedCount =
    requests?.filter((item) => item.status === "rejected").length ?? 0;

  return (
    <main className="app-page p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="app-card overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="bg-gradient-to-br from-[#0b245b] to-[#2563eb] p-8 text-white md:p-10">
              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-blue-100">
                Team risque
              </p>
              <h1 className="text-4xl font-extrabold leading-tight">
                Dashboard de validation
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">
                Suivez toutes les demandes de lettres d’engagement, filtrez par statut
                et ouvrez rapidement chaque demande pour approbation ou refus.
              </p>
            </div>

            <div className="bg-slate-50 p-8 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Vue rapide
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">En attente</p>
                  <p className="mt-1 text-3xl font-extrabold text-amber-800">
                    {pendingCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700">Approuvées</p>
                  <p className="mt-1 text-3xl font-extrabold text-green-800">
                    {approvedCount}
                  </p>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">Refusées</p>
                  <p className="mt-1 text-3xl font-extrabold text-red-800">
                    {rejectedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="app-card p-8 md:p-10">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Liste des demandes
              </h2>
              <p className="mt-2 text-slate-500">
                Filtrez les demandes puis ouvrez la fiche détaillée.
              </p>
            </div>

            <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-lg">
              RK
            </div>
          </div>

          <form method="GET" className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="app-label">Filtrer par statut</label>
              <select
                name="status"
                defaultValue={status}
                className="app-select"
              >
                <option value="">-- Tous les statuts --</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvée</option>
                <option value="rejected">Refusée</option>
              </select>
            </div>

            <div className="flex items-end">
              <button type="submit" className="app-btn app-btn-amber w-full py-4">
                Filtrer
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/engagement/risk"
                className="app-btn app-btn-outline w-full py-4"
              >
                Réinitialiser
              </Link>
            </div>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <a
                href="/api/engagement/risk/export"
                className="app-btn app-btn-amber py-4 text-center"
            >
                Exporter en CSV
            </a>

            <Link href="/" className="app-btn app-btn-outline py-4">
              Retour à l’accueil
            </Link>

            <Link href="/engagement" className="app-btn app-btn-outline py-4">
             Module engagement
            </Link>
          </div>
        </div>

        <div className="app-card p-8 md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Résultats
            </h2>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {requests?.length ?? 0} demande(s)
            </span>
          </div>

          {!requests || requests.length === 0 ? (
            <div className="app-info text-center">
              Aucune demande trouvée pour ce filtre.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const department = Array.isArray(request.departments)
                  ? request.departments[0]
                  : request.departments;

                const signatory = Array.isArray(request.signatories)
                  ? request.signatories[0]
                  : request.signatories;

                return (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-extrabold text-slate-900">
                          {request.client_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Demande #{request.id}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
                          request.status
                        )}`}
                      >
                        {getStatusLabel(request.status)}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                      <p>
                        <span className="font-semibold">Demandeur :</span>{" "}
                        {request.requester_name}
                      </p>
                      <p>
                        <span className="font-semibold">Email :</span>{" "}
                        {request.requester_email}
                      </p>
                      <p>
                        <span className="font-semibold">Département :</span>{" "}
                        {department?.name ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Date :</span>{" "}
                        {formatDateDisplay(request.contract_date)}
                      </p>
                      <p>
                        <span className="font-semibold">Signataire :</span>{" "}
                        {signatory?.full_name ?? "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Créée le :</span>{" "}
                        {formatDateDisplay(request.created_at)}
                      </p>
                    </div>

                    {request.status === "approved" && request.reference_number && (
                      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-green-800">
                        <span className="font-semibold">Numéro généré :</span>{" "}
                        <span className="break-all">{request.reference_number}</span>
                      </div>
                    )}

                    {request.status === "rejected" && request.rejection_reason && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-800">
                        <span className="font-semibold">Motif du refus :</span>{" "}
                        {request.rejection_reason}
                      </div>
                    )}

                    <div className="mt-5">
                      <Link
                        href={`/engagement/request/review/${request.review_token}`}
                        className={`app-btn px-5 py-3 ${
                          request.status === "pending"
                            ? "app-btn-amber"
                            : "app-btn-outline"
                        }`}
                      >
                        {request.status === "pending"
                          ? "Traiter la demande"
                          : "Voir la demande"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}