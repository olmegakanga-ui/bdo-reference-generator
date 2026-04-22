import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const RISK_ALLOWED_EMAILS = [
  "olmega.kanga@bdo-ea.com",
  "sarman.ilunga@bdo-ea.com",
  "brakini.biavanga@bdo-ea.com",
];

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentEmail = user?.email?.trim().toLowerCase() ?? "";
  const isRiskUser = RISK_ALLOWED_EMAILS.includes(currentEmail);

  let isAdmin = false;

  if (currentEmail) {
    const { data: appUser } = await supabase
      .from("users")
      .select("role")
      .eq("email", currentEmail)
      .maybeSingle();

    isAdmin = appUser?.role === "admin";
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/images/bg.jpg"
          alt="Background"
          className="h-full w-full object-cover object-left"
        />
      </div>

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-10 md:px-16">
        <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white/12 p-8 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-6 flex justify-center">
            <img
              src="/images/logo.png"
              alt="BDO Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
              Générateur de références
            </h1>
            <p className="mt-3 text-sm text-white/85 md:text-base">
              Lettres d’engagement et correspondances
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            <Link
              href="/engagement"
              className="rounded-2xl bg-blue-600 px-6 py-4 text-center font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              Lettre d’engagement
            </Link>

            <Link
              href="/correspondence"
              className="rounded-2xl bg-green-600 px-6 py-4 text-center font-semibold text-white shadow-lg transition hover:bg-green-700"
            >
              Correspondance
            </Link>
          </div>

          <div className="mt-4 grid gap-4">
            <Link
              href="/engagement/requests"
              className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/15"
            >
              Mes demandes
            </Link>

            <Link
              href="/engagement/search"
              className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center font-semibold text-white transition hover:bg-white/15"
            >
              Rechercher un numéro
            </Link>

            {isRiskUser && (
              <Link
                href="/engagement/risk"
                className="rounded-2xl border border-amber-300/30 bg-amber-500/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-amber-500/20"
              >
                Dashboard Team Risque
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/engagement/admin"
                className="rounded-2xl border border-rose-300/30 bg-rose-500/15 px-6 py-4 text-center font-semibold text-white transition hover:bg-rose-500/20"
              >
                Administration engagement
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}