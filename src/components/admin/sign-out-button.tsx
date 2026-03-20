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
      className={`font-semibold py-3 px-4 rounded-xl transition ${
        !isPending
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-gray-300 text-gray-500 cursor-not-allowed"
      }`}
    >
      {isPending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}