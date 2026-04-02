import Link from "next/link";

export default function CorrespondencePage() {
  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-3xl p-8 md:p-10">
        <div className="mb-8">
          <h1 className="app-title">Correspondance</h1>
          <p className="app-subtitle">
            Générez, recherchez ou modifiez un numéro de référence.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/correspondence/new"
            className="app-btn app-btn-green py-4 text-base"
          >
            Nouveau numéro de référence
          </Link>

          <Link
            href="/correspondence/search"
            className="app-btn app-btn-outline py-4 text-base"
          >
            Recherche ancien numéro de référence
          </Link>

          <Link
            href="/correspondence/admin"
            className="app-btn app-btn-amber py-4 text-base"
          >
            Éditer un numéro de référence
          </Link>

          <div className="grid grid-cols-2 gap-4 pt-3">
            <Link href="/" className="app-btn app-btn-outline">
              Home
            </Link>
            <Link href="/" className="app-btn app-btn-outline">
              Précédent
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}