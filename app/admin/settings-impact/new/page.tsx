import Link from "next/link";
import SettingImpactForm from "../../../../components/admin/SettingImpactForm";
import { CONTENT_EDITOR_ROLES } from "../../../../lib/auth/roles";
import { requireRole } from "../../../../lib/auth/require-role";
import { createSettingImpact } from "../actions";

export default async function NewSettingImpactPage() {
  const { role } = await requireRole(CONTENT_EDITOR_ROLES, "/");

  return (
    <main className="atlas-page pb-16 text-white">
      <div className="atlas-shell pt-8 sm:pt-10">
        <Link href="/admin/settings-impact" className="text-sm font-black text-cyan-400 transition hover:text-white">
          ← Back to Settings Guide
        </Link>
        <p className="atlas-section-label mt-7">New canonical setting</p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">Add a settings guide</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400">
          Create one clear page, then add every alternate in-game name as an alias. Do not clone a page just because a developer renamed the menu option.
        </p>

        <div className="mt-7">
          <SettingImpactForm
            action={createSettingImpact}
            canVerify={role === "atlas_editor" || role === "admin"}
            submitLabel="Create setting guide"
            values={{
              name: "",
              slug: "",
              category: "Other",
              commonness: "common",
              summary: "",
              description: "",
              performanceImpact: 2,
              visualImpact: 2,
              vramImpact: 1,
              cpuImpact: 1,
              latencyImpact: 0,
              restartRequired: false,
              whenToLower: "",
              whenToKeepHigh: "",
              handheldAdvice: "",
              caveat: "",
              confidence: 2,
              aliases: "",
              atlasVerified: false,
              status: "draft",
            }}
          />
        </div>
      </div>
    </main>
  );
}
