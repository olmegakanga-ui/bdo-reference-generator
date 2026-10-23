"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Signatory } from "@/types";
import { createMissionOrderReference } from "@/app/mission/new/actions";

type Props = { signatories: Signatory[] };
type ActionState = { error?: string };
const initialState: ActionState = {};

export default function MissionOrderForm({ signatories }: Props) {
  const [employeeName, setEmployeeName] = useState("");
  const [missionSubject, setMissionSubject] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [signatoryId, setSignatoryId] = useState("");
  const [state, formAction, isPending] = useActionState(
    createMissionOrderReference,
    initialState
  );

  const isFormValid = useMemo(
    () =>
      employeeName.trim() !== "" &&
      missionSubject.trim() !== "" &&
      issueDate.trim() !== "" &&
      signatoryId.trim() !== "",
    [employeeName, missionSubject, issueDate, signatoryId]
  );

  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-4xl p-8 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="app-title">Nouveau numéro</h1>
            <p className="app-subtitle">Ordre de mission</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 font-extrabold text-white shadow-lg md:flex">
            OM
          </div>
        </div>

        <form action={formAction} className="space-y-7">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="app-label">Employé concerné *</label>
              <input name="employeeName" value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} placeholder="Nom complet de l’employé" className="app-input" />
            </div>
            <div>
              <label className="app-label">Objet de la mission *</label>
              <input name="missionSubject" value={missionSubject} onChange={(event) => setMissionSubject(event.target.value)} placeholder="Ex : Mission d’audit à Lubumbashi" className="app-input" />
            </div>
            <div>
              <label className="app-label">Date d’émission *</label>
              <input type="date" name="issueDate" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="app-input" />
            </div>
            <div>
              <label className="app-label">Signataire *</label>
              <select name="signatoryId" value={signatoryId} onChange={(event) => setSignatoryId(event.target.value)} className="app-select">
                <option value="">-- Choisir un signataire --</option>
                {signatories.map((signatory) => (
                  <option key={signatory.id} value={signatory.id}>{signatory.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="app-success">
            Format généré : BDO-DRC Initiales/JJ/MM/AAAA/Numéro.
          </div>
          {state?.error && <div className="app-error">{state.error}</div>}
          <div className="grid gap-4 md:grid-cols-3">
            <button type="submit" disabled={!isFormValid || isPending} className={`app-btn py-4 ${isFormValid && !isPending ? "app-btn-amber" : "cursor-not-allowed bg-gray-300 text-gray-500"}`}>
              {isPending ? "Génération..." : "Générer le numéro"}
            </button>
            <Link href="/" className="app-btn app-btn-outline py-4">Home</Link>
            <Link href="/mission" className="app-btn app-btn-outline py-4">Précédent</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
