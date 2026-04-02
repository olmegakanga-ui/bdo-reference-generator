"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Department, Signatory } from "@/types";
import { createCorrespondenceReference } from "@/app/correspondence/new/actions";

type Props = {
  departments: Department[];
  signatories: Signatory[];
};

type ActionState = {
  error?: string;
};

const initialState: ActionState = {};

export default function CorrespondenceForm({
  departments,
  signatories,
}: Props) {
  const [recipientName, setRecipientName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [senderId, setSenderId] = useState("");

  const [state, formAction, isPending] = useActionState(
    createCorrespondenceReference,
    initialState
  );

  const isFormValid = useMemo(() => {
    return (
      recipientName.trim() !== "" &&
      departmentId.trim() !== "" &&
      issueDate.trim() !== "" &&
      senderId.trim() !== ""
    );
  }, [recipientName, departmentId, issueDate, senderId]);

  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-4xl p-8 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="app-title">Nouveau numéro</h1>
            <p className="app-subtitle">Correspondance</p>
          </div>

          <div className="hidden md:flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-white font-extrabold shadow-lg">
            CO
          </div>
        </div>

        <form action={formAction} className="space-y-7">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Destinataire *</label>
              <input
                type="text"
                name="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Rawbank"
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
              <label className="app-label">Date d’émission *</label>
              <input
                type="date"
                name="issueDate"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="app-input"
              />
            </div>

            <div>
              <label className="app-label">Expéditeur *</label>
              <select
                name="senderId"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="app-select"
              >
                <option value="">-- Choisir un expéditeur --</option>
                {signatories.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>
                    {signatory.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="app-success">
            Le numéro de référence sera généré automatiquement après validation du formulaire.
          </div>

          {state?.error && <div className="app-error">{state.error}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`app-btn py-4 ${
                isFormValid && !isPending
                  ? "app-btn-green"
                  : "cursor-not-allowed bg-gray-300 text-gray-500"
              }`}
            >
              {isPending ? "Génération..." : "Générer le numéro"}
            </button>

            <Link href="/" className="app-btn app-btn-outline py-4">
              Home
            </Link>

            <Link href="/correspondence" className="app-btn app-btn-outline py-4">
              Précédent
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}