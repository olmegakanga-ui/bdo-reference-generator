import Link from "next/link";

type Props = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export default async function CorrespondenceResultPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const reference = params.reference ?? "";

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Voici le numéro de référence
        </h1>

        <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-5 mb-8">
          <p className="text-xl font-semibold text-green-900 break-all">
            {reference}
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl"
        >
          Home
        </Link>
      </div>
    </main>
  );
}