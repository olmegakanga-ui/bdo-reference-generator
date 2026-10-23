import Link from "next/link";

type Props = { searchParams: Promise<{ reference?: string }> };

export default async function MissionOrderResultPage({ searchParams }: Props) {
  const { reference = "" } = await searchParams;
  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-2xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-600 text-2xl text-white shadow-lg">✓</div>
        <h1 className="app-title">Numéro généré</h1>
        <p className="app-subtitle mb-8">Ordre de mission</p>
        <div className="app-success break-all text-lg font-bold">{reference}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/mission/new" className="app-btn app-btn-amber px-8 py-4">Nouvel ordre</Link>
          <Link href="/" className="app-btn app-btn-outline px-8 py-4">Accueil</Link>
        </div>
      </div>
    </main>
  );
}
