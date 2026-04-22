"use client";

import { useActionState, useState } from "react";
import {
  approveEngagementRequest,
  rejectEngagementRequest,
} from "@/app/engagement/request/review/actions";
import { formatDateDisplay } from "@/lib/reference-utils";

type RequestData = {
  id: number;
  requester_name: string;
  requester_email: string;
  client_name: string;
  contract_date: string;
  status: string;
  review_token: string;
  department_name: string;
  department_code: string;
  signatory_name: string;
  signatory_initials: string;
};

type Props = {
  request: RequestData;
};

type ActionState = {
  error?: string;
};

const initialState: ActionState = {};

export default function RiskReviewForm({ request }: Props) {
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [approveState, approveAction, approvePending] = useActionState(
    approveEngagementRequest,
    initialState
  );

  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectEngagementRequest,
    initialState
  );

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[1fr_1.2fr]">
            {/* Bloc gauche */}
            <div className="bg-gradient-to-br from-[#0b245b] to-[#2563eb] p-8 text-white md:p-10">
              <div className="mb-6">
                <img
                  src="/images/logo.png"
                  alt="BDO Logo"
                  className="h-14 w-auto object-contain"
                />
              </div>

              <p className="mb-3 text-sm uppercase tracking-[0.25em] text-blue-100">
                Team risque
              </p>

              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
                Validation d’une demande de référence
              </h1>

              <p className="mt-5 text-base leading-7 text-white/80">
                Vérifiez les informations de la demande avant approbation ou refus.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/70">Statut actuel</p>
                <p className="mt-2 text-xl font-bold">En attente de traitement</p>
              </div>
            </div>

            {/* Bloc droit */}
            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Détails de la demande
                </h2>
                <p className="mt-2 text-slate-500">
                  Vérifiez soigneusement les éléments ci-dessous.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <span className="font-semibold">Demandeur :</span>{" "}
                    {request.requester_name}
                  </p>
                  <p>
                    <span className="font-semibold">Email :</span>{" "}
                    {request.requester_email}
                  </p>
                  <p>
                    <span className="font-semibold">Client :</span>{" "}
                    {request.client_name}
                  </p>
                  <p>
                    <span className="font-semibold">Département :</span>{" "}
                    {request.department_name}
                  </p>
                  <p>
                    <span className="font-semibold">Date du contrat :</span>{" "}
                    {formatDateDisplay(request.contract_date)}
                  </p>
                  <p>
                    <span className="font-semibold">Signataire :</span>{" "}
                    {request.signatory_name}
                  </p>
                </div>
              </div>

              {approveState?.error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                  {approveState.error}
                </div>
              )}

              {rejectState?.error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                  {rejectState.error}
                </div>
              )}

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <form action={approveAction}>
                  <input type="hidden" name="requestId" value={request.id} />
                  <input
                    type="hidden"
                    name="reviewToken"
                    value={request.review_token}
                  />

                  <button
                    type="submit"
                    disabled={approvePending}
                    className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold transition ${
                      approvePending
                        ? "cursor-not-allowed bg-slate-300 text-slate-500"
                        : "bg-green-600 text-white shadow-lg hover:bg-green-700"
                    }`}
                  >
                    {approvePending ? "Approbation..." : "Approuver"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
                >
                  Refuser
                </button>
              </div>

              {showRejectBox && (
                <form action={rejectAction} className="mt-6 space-y-4">
                  <input type="hidden" name="requestId" value={request.id} />
                  <input
                    type="hidden"
                    name="reviewToken"
                    value={request.review_token}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Motif du refus *
                    </label>
                    <textarea
                      name="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                      placeholder="Explique la raison du refus..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="submit"
                      disabled={rejectPending || rejectionReason.trim() === ""}
                      className={`inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold transition ${
                        !rejectPending && rejectionReason.trim() !== ""
                          ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
                          : "cursor-not-allowed bg-slate-300 text-slate-500"
                      }`}
                    >
                      {rejectPending ? "Envoi..." : "Envoyer le refus"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectBox(false);
                        setRejectionReason("");
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}