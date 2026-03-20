import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  // Déconnexion automatique à chaque retour sur la page Home
  await supabase.auth.signOut();

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-10 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl">
            LOGO
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          BDO DRC
        </h1>
        <p className="text-gray-600 mb-10">
          Générateur de numéros de référence
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/engagement"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition"
          >
            Lettre d’engagement
          </Link>

          <Link
            href="/correspondence"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition"
          >
            Correspondance
          </Link>
        </div>
      </div>
    </main>
  );
}