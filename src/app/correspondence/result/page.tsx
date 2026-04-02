import Link from "next/link";

type Props = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export default async function CorrespondenceResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = params.reference ?? "";

  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-2xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-white text-2xl shadow-lg">
          ✓
        </div>

        <h1 className="app-title">Numéro généré</h1>
        <p className="app-subtitle mb-8">
          Correspondance
        </p>

        <div className="app-success break-all text-lg font-bold">
          {reference}
        </div>

        <div className="mt-8">
          <Link href="/" className="app-btn app-btn-green px-8 py-4">
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}