"use client";

import { useTransition } from "react";
import { signOutAdmin } from "@/app/admin/actions";

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOutAdmin())}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
        !isPending
          ? "bg-white text-slate-900 hover:bg-slate-200"
          : "cursor-not-allowed bg-slate-400 text-slate-700"
      }`}
    >
      {isPending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}