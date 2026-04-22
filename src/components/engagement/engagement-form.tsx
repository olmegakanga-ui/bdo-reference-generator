"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Department, Signatory } from "@/types";
import { createEngagementRequest } from "@/app/engagement/new/actions";

type Props = {
  departments: Department[];
  signatories: Signatory[];
};

type ActionState = {
  error?: string;
};

const initialState: ActionState = {};

export default function EngagementForm({ departments, signatories }: Props) {
  const [clientName, setClientName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [signatoryId, setSignatoryId] = useState("");

 const [state, formAction, isPending] = useActionState(
  createEngagementRequest,
  initialState
);

  const isFormValid = useMemo(() => {
    return (
      clientName.trim() !== "" &&
      departmentId.trim() !== "" &&
      contractDate.trim() !== "" &&
      signatoryId.trim() !== ""
    );
  }, [clientName, departmentId, contractDate, signatoryId]);

  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-4xl p-8 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="app-title">Nouvelle demande</h1>
            <p className="app-subtitle">Lettre d’engagement</p>
          </div>

          <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white font-extrabold shadow-lg">
            LE
          </div>
        </div>

        <form action={formAction} className="space-y-7">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Nom du client *</label>
              <input
                type="text"
                name="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: FINCA RDC"
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Département *</label>
              <select
                name="departmentId"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="app-select"
              >
                <option value="">-- Choisir un département --</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="app-label">Date du contrat *</label>
              <input
                type="date"
                name="contractDate"
                value={contractDate}
                onChange={(e) => setContractDate(e.target.value)}
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Signataire *</label>
              <select
                name="signatoryId"
                value={signatoryId}
                onChange={(e) => setSignatoryId(e.target.value)}
                className="app-select"
              >
                <option value="">-- Choisir un signataire --</option>
                {signatories.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="app-info">
            Tous les champs marqués d’un astérisque sont obligatoires pour spumettre la demande à la team risque.
          </div>

          {state?.error && <div className="app-error">{state.error}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`app-btn py-4 ${
                isFormValid && !isPending
                  ? "app-btn-blue"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              {isPending ? "Génération..." : "Soumettre la demande"}
            </button>

            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>

            <Link href="/engagement" className="app-btn app-btn-outline py-4">
              Précédent
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}