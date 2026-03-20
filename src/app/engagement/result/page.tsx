import Link from "next/link";

type Props = {
  searchParams: Promise<{
    reference?: string;
  }>;
};

export default async function EngagementResultPage({ searchParams }: Props) {
  const params = await searchParams;
  const reference = params.reference ?? "";

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Voici le numéro de référence
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 mb-8">
          <p className="text-xl font-semibold text-blue-900 break-all">
            {reference}
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl"
        >
          Home
        </Link>
      </div>
    </main>
  );
}