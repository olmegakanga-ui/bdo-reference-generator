"use client";

import { useState } from "react";

type Props = {
  value: string;
  color?: "blue" | "green";
};

export default function CopyReferenceButton({
  value,
  color = "blue",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie :", error);
    }
  }

  const colorClass =
    color === "green"
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`app-btn px-6 py-4 ${colorClass}`}
    >
      {copied ? "Copié !" : "Copier le numéro"}
    </button>
  );
}