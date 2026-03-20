import { getCurrentAppUser } from "@/lib/auth";

export default async function AdminDebugPage() {
  const { authUser, appUser } = await getCurrentAppUser();

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Diagnostic Admin
        </h1>

        <div className="space-y-4 text-sm">
          <div className="border rounded-xl p-4">
            <p className="font-semibold mb-2">Utilisateur Auth</p>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  email: authUser?.email ?? null,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="border rounded-xl p-4">
            <p className="font-semibold mb-2">Utilisateur App</p>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(appUser, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}