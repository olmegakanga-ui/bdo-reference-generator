import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  await supabase.auth.signOut();

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

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 md:px-16">
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
              className="app-btn app-btn-blue w-full py-4"
            >
              Lettre d’engagement
            </Link>

            <Link
              href="/correspondence"
              className="app-btn app-btn-green w-full py-4"
            >
              Correspondance
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}