import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import HandheldImageUpload from "../../../components/admin/HandheldImageUpload";
import { createClient } from "../../../lib/supabase/server";
import {
  createHandheld,
  deleteHandheld,
} from "./actions";

interface AdminHandheldsPageProps {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
}

interface DatabaseHandheld {
  id: string;
  name: string;
  slug: string;
  manufacturer: string;
  device_status: string;
  operating_system: string | null;
  processor: string | null;
  memory: string | null;
  storage: string | null;
  display_size: string | null;
  resolution: string | null;
  refresh_rate: string | null;
  battery: string | null;
  weight: string | null;
  image_url: string | null;
  tagline: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

function getStatusStyle(
  status: DatabaseHandheld["status"],
) {
  switch (status) {
    case "published":
      return "border-green-400/30 bg-green-500/15 text-green-400";

    case "archived":
      return "border-red-400/30 bg-red-500/15 text-red-400";

    default:
      return "border-orange-400/30 bg-orange-500/15 text-orange-400";
  }
}

function getDeviceStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "current":
      return "border-cyan-400/30 bg-cyan-500/15 text-cyan-400";

    case "upcoming":
      return "border-purple-400/30 bg-purple-500/15 text-purple-400";

    case "discontinued":
      return "border-slate-500/30 bg-slate-500/15 text-slate-400";

    default:
      return "border-slate-500/30 bg-slate-500/15 text-slate-300";
  }
}

export default async function AdminHandheldsPage({
  searchParams,
}: AdminHandheldsPageProps) {
  const { error, success } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/admin/login");
  }

  const { data, error: handheldsError } =
    await supabase
      .from("handhelds")
      .select(
        "id, name, slug, manufacturer, device_status, operating_system, processor, memory, storage, display_size, resolution, refresh_rate, battery, weight, image_url, tagline, status, created_at, updated_at",
      )
      .order("created_at", {
        ascending: false,
      });

  const handhelds =
    (data ?? []) as DatabaseHandheld[];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Link
              href="/admin"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              ← Back to dashboard
            </Link>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
              Content Management
            </p>

            <h1 className="mt-3 text-5xl font-black">
              Handhelds
            </h1>

            <p className="mt-4 max-w-2xl text-slate-400">
              Add handheld devices, upload clean product
              images and manage their specifications and
              publishing state.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Database total
            </p>

            <p className="mt-2 text-3xl font-black">
              {handhelds.length}
            </p>
          </div>
        </div>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {(error || handheldsError) && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error ?? handheldsError?.message}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            New Handheld
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Add handheld
          </h2>

          <form action={createHandheld} className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Handheld name"
                name="name"
                placeholder="ROG Ally X"
                required
              />

              <FormField
                label="Slug"
                name="slug"
                placeholder="rog-ally-x"
                helpText="Leave empty to generate it from the name."
              />

              <FormField
                label="Manufacturer"
                name="manufacturer"
                placeholder="ASUS"
                required
              />

              <FormField
                label="Device status"
                name="deviceStatus"
                placeholder="Current"
                defaultValue="Current"
                helpText="Examples: Current, Upcoming, Discontinued."
              />

              <FormField
                label="Operating system"
                name="operatingSystem"
                placeholder="Windows 11"
              />

              <FormField
                label="Processor"
                name="processor"
                placeholder="AMD Ryzen Z1 Extreme"
              />

              <FormField
                label="Memory"
                name="memory"
                placeholder="24 GB LPDDR5X"
              />

              <FormField
                label="Storage"
                name="storage"
                placeholder="1 TB NVMe SSD"
              />

              <FormField
                label="Display size"
                name="displaySize"
                placeholder="7 inch"
              />

              <FormField
                label="Resolution"
                name="resolution"
                placeholder="1920 × 1080"
              />

              <FormField
                label="Refresh rate"
                name="refreshRate"
                placeholder="120 Hz VRR"
              />

              <FormField
                label="Battery"
                name="battery"
                placeholder="80 Wh"
              />

              <FormField
                label="Weight"
                name="weight"
                placeholder="678 g"
              />

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
                >
                  Content status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">
                    Published
                  </option>
                  <option value="archived">
                    Archived
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <HandheldImageUpload />
            </div>

            <div className="mt-6">
              <label
                htmlFor="tagline"
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
              >
                Tagline
              </label>

              <textarea
                id="tagline"
                name="tagline"
                rows={4}
                placeholder="High-performance Windows handheld with strong battery life and broad game compatibility."
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
            >
              Create handheld
            </button>
          </form>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
                Existing Content
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Handheld database
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {handhelds.length}{" "}
              {handhelds.length === 1
                ? "handheld"
                : "handhelds"}
            </p>
          </div>

          {handhelds.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <h3 className="text-xl font-black">
                No handhelds in Supabase yet
              </h3>

              <p className="mt-2 text-slate-400">
                Add the first handheld using the form
                above.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {handhelds.map((handheld) => (
                <article
                  key={handheld.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900"
                >
                  <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6">
                    <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

                    {handheld.image_url ? (
                      <div className="relative h-64 w-full max-w-xl">
                        <Image
                          src={handheld.image_url}
                          alt={handheld.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-contain object-center drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)]"
                        />
                      </div>
                    ) : (
                      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950">
                        <p className="px-6 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-700">
                          No handheld image
                        </p>
                      </div>
                    )}

                    <div className="absolute left-5 top-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getDeviceStatusStyle(
                          handheld.device_status,
                        )}`}
                      >
                        {handheld.device_status}
                      </span>
                    </div>

                    <div className="absolute right-5 top-5">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${getStatusStyle(
                          handheld.status,
                        )}`}
                      >
                        {handheld.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                      {handheld.manufacturer}
                    </p>

                    <h3 className="mt-2 text-3xl font-black">
                      {handheld.name}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      /handhelds/{handheld.slug}
                    </p>

                    {handheld.tagline && (
                      <p className="mt-4 leading-7 text-slate-400">
                        {handheld.tagline}
                      </p>
                    )}

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <HandheldStat
                        label="Processor"
                        value={
                          handheld.processor ?? "Not set"
                        }
                      />

                      <HandheldStat
                        label="Memory"
                        value={
                          handheld.memory ?? "Not set"
                        }
                      />

                      <HandheldStat
                        label="Display"
                        value={
                          handheld.display_size ??
                          "Not set"
                        }
                      />

                      <HandheldStat
                        label="Battery"
                        value={
                          handheld.battery ?? "Not set"
                        }
                      />

                      <HandheldStat
                        label="Operating system"
                        value={
                          handheld.operating_system ??
                          "Not set"
                        }
                      />

                      <HandheldStat
                        label="Weight"
                        value={
                          handheld.weight ?? "Not set"
                        }
                      />
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
                      <Link
                        href={`/admin/handhelds/${handheld.id}/edit`}
                        className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950"
                      >
                        Edit
                      </Link>

                      {handheld.status ===
                        "published" && (
                        <Link
                          href={`/handhelds/${handheld.slug}`}
                          target="_blank"
                          className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                        >
                          View public
                        </Link>
                      )}

                      <form action={deleteHandheld}>
                        <input
                          type="hidden"
                          name="handheldId"
                          value={handheld.id}
                        />

                        <button
                          type="submit"
                          className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500 hover:text-white"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  required?: boolean;
}

function FormField({
  label,
  name,
  placeholder,
  helpText,
  defaultValue,
  required = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
      />

      {helpText && (
        <p className="mt-2 text-xs text-slate-600">
          {helpText}
        </p>
      )}
    </div>
  );
}

interface HandheldStatProps {
  label: string;
  value: string;
}

function HandheldStat({
  label,
  value,
}: HandheldStatProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-200">
        {value}
      </p>
    </div>
  );
}