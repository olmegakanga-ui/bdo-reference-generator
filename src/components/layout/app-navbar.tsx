import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/admin/sign-out-button";

const RISK_ALLOWED_EMAILS = [
  "olmega.kanga@bdo-ea.com",
  "sarman.ilunga@bdo-ea.com",
  "brakini.biavanga@bdo-ea.com",
];

export default async function AppNavbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const currentEmail = user.email.trim().toLowerCase();

  const { data: appUser } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("email", currentEmail)
    .maybeSingle();

  const fullName = appUser?.full_name ?? currentEmail;
  const isAdmin = appUser?.role === "admin";
  const isRiskUser = RISK_ALLOWED_EMAILS.includes(currentEmail);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        {/* Logo + title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="BDO Logo"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/70">
                BDO DRC
              </p>
              <p className="text-sm text-white/90">
                Portail de gestion des références
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-3 lg:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Accueil
          </Link>

          <Link
            href="/engagement"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Engagement
          </Link>

          <Link
            href="/correspondence"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Correspondance
          </Link>

          <Link
            href="/engagement/requests"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Mes demandes
          </Link>

          {isRiskUser && (
            <Link
              href="/engagement/risk"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10 hover:text-amber-100"
            >
              Team Risque
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/engagement/admin"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 hover:text-rose-100"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* User info + signout */}
        <div className="flex items-center gap-3">
          <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right md:block">
            <p className="text-sm font-semibold text-white">
              {fullName}
            </p>
            <p className="text-xs text-white/60">
              {currentEmail}
            </p>
          </div>

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}