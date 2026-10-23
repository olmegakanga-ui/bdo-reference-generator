import Link from "next/link";

export default function MissionPage() {
  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-3xl p-8 md:p-10">
        <div className="mb-8">
          <h1 className="app-title">Ordres de mission</h1>
          <p className="app-subtitle">
            Générez ou recherchez un numéro de lettre de mission.
          </p>
        </div>

        <div className="grid gap-4">
          <Link href="/mission/new" className="app-btn app-btn-amber py-4 text-base">
            Nouveau numéro de référence
          </Link>
          <Link href="/mission/search" className="app-btn app-btn-outline py-4 text-base">
            Rechercher un numéro de référence
          </Link>
          <Link href="/" className="app-btn app-btn-outline py-4 text-base">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
