import { createClient } from "@/lib/supabase/server";
import { formatDateDisplay } from "@/lib/reference-utils";
import RiskReviewForm from "@/components/engagement/risk-review-form";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="text-sm text-slate-700">
      <span className="font-semibold">{label} :</span> {value}
    </p>
  );
}

export default async function RiskReviewPage({ params }: Props) {
  const { token } = await params;

  const supabase = await createClient();

  const { data: request, error } = await supabase
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
    .eq("review_token", token)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de charger la demande.");
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-8 text-white">
              <h1 className="text-3xl font-extrabold">Demande introuvable</h1>
              <p className="mt-2 text-white/85">
                Le lien fourni est invalide ou la demande n’existe plus.
              </p>
            </div>

            <div className="p-8 md:p-10">
              <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
                Veuillez vérifier le lien reçu par e-mail ou contacter l’équipe concernée.
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const department = Array.isArray(request.departments)
    ? request.departments[0]
    : request.departments;

  const signatory = Array.isArray(request.signatories)
    ? request.signatories[0]
    : request.signatories;

  if (request.status === "approved") {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-8 text-white">
              <h1 className="text-3xl font-extrabold">Demande déjà approuvée</h1>
              <p className="mt-2 text-white/85">
                Cette demande a déjà été validée par la team risque.
              </p>
            </div>

            <div className="p-8 md:p-10 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow label="Demandeur" value={request.requester_name} />
                  <InfoRow label="Email" value={request.requester_email} />
                  <InfoRow label="Client" value={request.client_name} />
                  <InfoRow
                    label="Département"
                    value={department?.name ?? "-"}
                  />
                  <InfoRow
                    label="Date du contrat"
                    value={formatDateDisplay(request.contract_date)}
                  />
                  <InfoRow
                    label="Signataire"
                    value={signatory?.full_name ?? "-"}
                  />
                </div>
              </div>

              {request.reference_number && (
                <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                    Numéro généré
                  </p>
                  <p className="mt-2 break-all text-2xl font-extrabold text-green-800">
                    {request.reference_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (request.status === "rejected") {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-8 text-white">
              <h1 className="text-3xl font-extrabold">Demande déjà refusée</h1>
              <p className="mt-2 text-white/85">
                Cette demande a déjà été rejetée par la team risque.
              </p>
            </div>

            <div className="p-8 md:p-10 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoRow label="Demandeur" value={request.requester_name} />
                  <InfoRow label="Email" value={request.requester_email} />
                  <InfoRow label="Client" value={request.client_name} />
                  <InfoRow
                    label="Département"
                    value={department?.name ?? "-"}
                  />
                  <InfoRow
                    label="Date du contrat"
                    value={formatDateDisplay(request.contract_date)}
                  />
                  <InfoRow
                    label="Signataire"
                    value={signatory?.full_name ?? "-"}
                  />
                </div>
              </div>

              {request.rejection_reason && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                    Motif du refus
                  </p>
                  <p className="mt-2 text-base leading-7 text-red-800">
                    {request.rejection_reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <RiskReviewForm
      request={{
        id: request.id,
        requester_name: request.requester_name,
        requester_email: request.requester_email,
        client_name: request.client_name,
        contract_date: request.contract_date,
        status: request.status,
        review_token: request.review_token,
        department_name: department?.name ?? "",
        department_code: department?.engagement_code ?? "",
        signatory_name: signatory?.full_name ?? "",
        signatory_initials: signatory?.initials ?? "",
      }}
    />
  );
}