import Link from "next/link";

type Props = {
  searchParams: Promise<{
    id?: string;
  }>;
};

export default async function RequestSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const id = params.id ?? "";

  return (
    <main className="app-page flex items-center justify-center p-6">
      <div className="app-card w-full max-w-2xl p-10 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white text-2xl shadow-lg">
          ✓
        </div>

        <h1 className="app-title">Demande envoyée</h1>

        <p className="app-subtitle mb-8">
          Votre demande de numéro de référence a été envoyée à la team risque pour validation.
        </p>

        <div className="app-info mb-6">
          Vous recevrez un email dès que la demande sera traitée.
        </div>

        {id && (
          <div className="text-sm text-slate-500 mb-6">
            ID de la demande : {id}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/" className="app-btn app-btn-blue py-4">
            Retour à l’accueil
          </Link>

          <Link href="/engagement" className="app-btn app-btn-outline py-4">
            Nouvelle demande
          </Link>
        </div>
      </div>
    </main>
  );
}