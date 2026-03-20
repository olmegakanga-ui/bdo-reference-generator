"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type { Department, Signatory } from "@/types";
import { updateCorrespondenceReference } from "@/app/correspondence/admin/actions";

type RecordType = {
  id: number;
  recipient_name: string;
  issue_date: string;
  department_id: number;
  sender_id: number;
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

export default function CorrespondenceEditForm({
  record,
  departments,
  signatories,
}: Props) {
  const [recipientName, setRecipientName] = useState(record.recipient_name);
  const [departmentId, setDepartmentId] = useState(String(record.department_id));
  const [issueDate, setIssueDate] = useState(record.issue_date);
  const [senderId, setSenderId] = useState(String(record.sender_id));

  const [state, formAction, isPending] = useActionState(
    updateCorrespondenceReference,
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
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Modifier un numéro de référence
        </h1>

        <p className="text-gray-600 mb-2">Numéro actuel :</p>
        <p className="text-green-800 font-semibold break-all mb-8">
          {record.reference_number}
        </p>

        <form action={formAction} className="space-y-6">
          <input type="hidden" name="recordId" value={record.id} />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destinataire *
            </label>
            <input
              type="text"
              name="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Département *
            </label>
            <select
              name="departmentId"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date d’émission *
            </label>
            <input
              type="date"
              name="issueDate"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expéditeur *
            </label>
            <select
              name="senderId"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Choisir un expéditeur --</option>
              {signatories.map((signatory) => (
                <option key={signatory.id} value={signatory.id}>
                  {signatory.full_name}
                </option>
              ))}
            </select>
          </div>

          {state?.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isPending}
              className={`font-semibold py-3 rounded-xl transition ${
                isFormValid && !isPending
                  ? "bg-amber-500 hover:bg-amber-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>

            <Link
              href="/correspondence/admin"
              className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Annuler
            </Link>

            <Link
              href="/"
              className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}