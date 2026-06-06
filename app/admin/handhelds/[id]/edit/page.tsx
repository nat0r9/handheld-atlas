import Link from "next/link";
import { redirect } from "next/navigation";
import HandheldImageUpload from "../../../../../components/admin/HandheldImageUpload";
import { createClient } from "../../../../../lib/supabase/server";
import { updateHandheld } from "../../actions";

interface EditHandheldPageProps {
  params: Promise<{
    id: string;
  }>;

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
}

export default async function EditHandheldPage({
  params,
  searchParams,
}: EditHandheldPageProps) {
  const { id } = await params;
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

  const { data, error: handheldError } = await supabase
    .from("handhelds")
    .select(
      "id, name, slug, manufacturer, device_status, operating_system, processor, memory, storage, display_size, resolution, refresh_rate, battery, weight, image_url, tagline, status",
    )
    .eq("id", id)
    .single();

  if (handheldError || !data) {
    redirect(
      "/admin/handhelds?error=Handheld%20not%20found",
    );
  }

  const handheld = data as DatabaseHandheld;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin/handhelds"
          className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          ← Back to handhelds
        </Link>

        <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">
          Content Management
        </p>

        <h1 className="mt-3 text-5xl font-black">
          Edit handheld
        </h1>

        <p className="mt-4 text-slate-400">
          Update device specifications, product image and publishing state.
        </p>

        {success && (
          <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <section className="mt-10 rounded-[2rem] border border-slate-800 bg-slate-900 p-6 md:p-8">
          <form action={updateHandheld}>
            <input
              type="hidden"
              name="handheldId"
              value={handheld.id}
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <FormField
                label="Handheld name"
                name="name"
                defaultValue={handheld.name}
                required
              />

              <FormField
                label="Slug"
                name="slug"
                defaultValue={handheld.slug}
                helpText="Used in the public URL."
              />

              <FormField
                label="Manufacturer"
                name="manufacturer"
                defaultValue={handheld.manufacturer}
                required
              />

              <FormField
                label="Device status"
                name="deviceStatus"
                defaultValue={handheld.device_status}
                helpText="Examples: Current, Upcoming, Discontinued."
              />

              <FormField
                label="Operating system"
                name="operatingSystem"
                defaultValue={handheld.operating_system ?? ""}
              />

              <FormField
                label="Processor"
                name="processor"
                defaultValue={handheld.processor ?? ""}
              />

              <FormField
                label="Memory"
                name="memory"
                defaultValue={handheld.memory ?? ""}
              />

              <FormField
                label="Storage"
                name="storage"
                defaultValue={handheld.storage ?? ""}
              />

              <FormField
                label="Display size"
                name="displaySize"
                defaultValue={handheld.display_size ?? ""}
              />

              <FormField
                label="Resolution"
                name="resolution"
                defaultValue={handheld.resolution ?? ""}
              />

              <FormField
                label="Refresh rate"
                name="refreshRate"
                defaultValue={handheld.refresh_rate ?? ""}
              />

              <FormField
                label="Battery"
                name="battery"
                defaultValue={handheld.battery ?? ""}
              />

              <FormField
                label="Weight"
                name="weight"
                defaultValue={handheld.weight ?? ""}
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
                  defaultValue={handheld.status}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <HandheldImageUpload
                defaultUrl={handheld.image_url ?? ""}
              />
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
                rows={5}
                defaultValue={handheld.tagline ?? ""}
                className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-400"
              >
                Save changes
              </button>

              <Link
                href="/admin/handhelds"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 font-bold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Cancel
              </Link>

              {handheld.status === "published" && (
                <Link
                  href={`/handhelds/${handheld.slug}`}
                  target="_blank"
                  className="rounded-xl border border-green-500/40 bg-green-500/10 px-6 py-3 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
                >
                  Open public page ↗
                </Link>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  defaultValue?: string;
  helpText?: string;
  required?: boolean;
}

function FormField({
  label,
  name,
  defaultValue = "",
  helpText,
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
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500"
      />

      {helpText && (
        <p className="mt-2 text-xs text-slate-600">
          {helpText}
        </p>
      )}
    </div>
  );
}