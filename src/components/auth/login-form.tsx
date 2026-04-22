"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
};

export default function LoginForm({ nextPath }: Props) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      router.push(nextPath || "/");
      router.refresh();
    } catch (error) {
      console.error("Erreur login:", error);
      setErrorMessage("Erreur lors de la connexion.");
      setIsLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/bg-login-premium.png"
          alt="Fond premium"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Overlay très léger */}
      <div className="absolute inset-0 bg-white/10" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-7xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_560px]">
            {/* Bloc gauche */}
            <div className="hidden lg:flex flex-col justify-center pl-6">
              <div className="mb-8">
                <img
                  src="/images/logo.png"
                  alt="BDO Logo"
                  className="h-20 w-auto object-contain"
                />
              </div>

              <h1 className="max-w-xl text-6xl font-extrabold leading-[1.05] tracking-tight text-[#0b245b]">
                Portail sécurisé de gestion des référence
              </h1>

              <div className="mt-10 h-1.5 w-20 rounded-full bg-[#ef3b5d]" />
            </div>

            {/* Bloc droit */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[560px] rounded-[36px] border border-white/60 bg-white/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-10">
                <h2 className="text-4xl font-extrabold text-[#0b245b]">
                  Connexion
                </h2>

                <p className="mt-5 max-w-md text-xl leading-10 text-slate-500">
                  Connectez-vous pour accéder au générateur de numéros de référence.
                </p>

                <form onSubmit={handleLogin} className="mt-10 space-y-7">
                  <div>
                    <label className="mb-3 block text-xl font-semibold text-[#0b245b]">
                      Email professionnel
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@bdo-ea.com"
                      className="w-full rounded-[20px] border border-slate-300 bg-white/80 px-5 py-5 text-lg text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-xl font-semibold text-[#0b245b]">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full rounded-[20px] border border-slate-300 bg-white/80 px-5 py-5 text-lg text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                      required
                    />
                  </div>

                  {errorMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-base text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-5 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`inline-flex w-full items-center justify-center rounded-[20px] px-6 py-5 text-xl font-semibold transition ${
                        !isLoading
                          ? "bg-[#2563eb] text-white shadow-lg hover:bg-[#1d4ed8]"
                          : "cursor-not-allowed bg-slate-300 text-slate-500"
                      }`}
                    >
                      {isLoading ? "Connexion..." : "Se connecter"}
                    </button>

                    <Link
                      href="/login"
                      className="inline-flex w-full items-center justify-center rounded-[20px] border border-slate-300 bg-white/70 px-6 py-5 text-xl font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Réinitialiser
                    </Link>
                  </div>
                </form>

                <p className="mt-10 text-center text-lg text-slate-500">
                  Accès sécurisé et confidentiel
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}