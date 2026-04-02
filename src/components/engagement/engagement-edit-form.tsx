"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Department, Signatory } from "@/types";
import { updateEngagementReference } from "@/app/engagement/admin/actions";

type RecordType = {
  id: number;
  client_name: string;
  contract_date: string;
  department_id: number;
  signatory_id: number;
  sequence_number: number;
  reference_number: string;
};

type Props = {
  record: RecordType;
  departments: Department[];
  signatories: Signatory[];
};

type ActionState = {
  error?: string;
};

const initialState: ActionState = {};

export default function EngagementEditForm({
  record,
  departments,
  signatories,
}: Props) {
  const [clientName, setClientName] = useState(record.client_name);
  const [departmentId, setDepartmentId] = useState(String(record.department_id));
  const [contractDate, setContractDate] = useState(record.contract_date);
  const [signatoryId, setSignatoryId] = useState(String(record.signatory_id));

  const [state, formAction, isPending] = useActionState(
    updateEngagementReference,
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
            <h1 className="app-title">Modifier un numéro</h1>
            <p className="app-subtitle">Lettre d’engagement</p>
          </div>

          <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white font-extrabold shadow-lg">
            AD
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
          <p className="text-sm font-semibold text-slate-600 mb-2">
            Numéro actuel
          </p>
          <p className="break-all text-lg font-extrabold text-blue-800">
            {record.reference_number}
          </p>
        </div>

        <form action={formAction} className="space-y-7">
          <input type="hidden" name="recordId" value={record.id} />

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Nom du client *</label>
              <input
                type="text"
                name="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
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

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            Toute modification recalculera le numéro si les champs impactant la référence sont modifiés.
          </div>

          {state?.error && <div className="app-error">{state.error}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`app-btn py-4 ${
                isFormValid && !isPending
                  ? "app-btn-amber"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>

            <Link href="/engagement/admin" className="app-btn app-btn-outline py-4">
              Annuler
            </Link>

            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}