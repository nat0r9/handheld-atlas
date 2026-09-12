"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export default function DataNotice({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div
      role="status"
      className="my-4 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4"
    >
      <p className="text-sm text-slate-200">{label}</p>
      <button
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
        className="atlas-button-secondary mt-3"
      >
        {pending ? "Loading…" : "Try again"}
      </button>
    </div>
  );
}
