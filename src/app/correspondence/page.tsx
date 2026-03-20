import Link from "next/link";

export default function CorrespondencePage() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-10">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Correspondance
        </h1>

        <div className="grid gap-4">
          <Link
            href="/correspondence/new"
            className="bg-green-600 hover:bg-green-700 text-white text-center font-semibold py-4 rounded-xl"
          >
            Nouveau numéro de référence
          </Link>

          <Link
            href="/correspondence/search"
            className="bg-amber-500 hover:bg-amber-600 text-white text-center font-semibold py-4 rounded-xl"
          >
            Recherche ancien numéro de référence
          </Link>

          <Link
            href="/correspondence/admin"
            className="bg-red-600 hover:bg-red-700 text-white text-center font-semibold py-4 rounded-xl"
          >
            Éditer un numéro de référence
          </Link>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <Link
              href="/"
              className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Home
            </Link>

            <Link
              href="/"
              className="border border-gray-300 text-center font-semibold py-3 rounded-xl hover:bg-gray-50"
            >
              Précédent
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}