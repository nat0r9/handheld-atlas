"use client";

import { useFormStatus } from "react-dom";
import {
  SETTING_IMPACT_CATEGORIES,
  SETTING_IMPACT_COMMONNESS,
  getImpactLabel,
  getSettingCommonnessLabel,
} from "../../lib/settings-impact";

export interface SettingImpactFormValues {
  name: string;
  slug: string;
  category: string;
  commonness: string;
  summary: string;
  description: string;
  performanceImpact: number;
  visualImpact: number;
  vramImpact: number;
  cpuImpact: number;
  latencyImpact: number;
  restartRequired: boolean;
  whenToLower: string;
  whenToKeepHigh: string;
  handheldAdvice: string;
  caveat: string;
  confidence: number;
  aliases: string;
  atlasVerified: boolean;
  status: "draft" | "published" | "archived";
}

interface SettingImpactFormProps {
  action: (formData: FormData) => Promise<void>;
  values: SettingImpactFormValues;
  submitLabel: string;
  canVerify: boolean;
}

export default function SettingImpactForm({
  action,
  values,
  submitLabel,
  canVerify,
}: SettingImpactFormProps) {
  return (
    <form action={action} className="space-y-5">
      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-label">Identity</p>
        <h2 className="mt-2 text-2xl font-black">Name it the way players see it</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Aliases stop the same option from appearing twice when one game says “Shadow Quality” and another says “Shadows”.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Name" name="name" defaultValue={values.name} required />
          <Field label="Slug" name="slug" defaultValue={values.slug} placeholder="shadow-quality" />
          <label>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Category</span>
            <select name="category" defaultValue={values.category} className="mt-2 h-11 w-full rounded-xl px-3">
              {SETTING_IMPACT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Guide depth</span>
            <select name="commonness" defaultValue={values.commonness} className="mt-2 h-11 w-full rounded-xl px-3">
              {SETTING_IMPACT_COMMONNESS.map((level) => (
                <option key={level} value={level}>{getSettingCommonnessLabel(level)}</option>
              ))}
            </select>
          </label>
          <Field label="Aliases" name="aliases" defaultValue={values.aliases} placeholder="Shadows, Shadow Detail, Shadow Resolution" />
        </div>

        <div className="mt-4 grid gap-4">
          <TextArea label="One-sentence summary" name="summary" defaultValue={values.summary} rows={3} required />
          <TextArea label="What it does" name="description" defaultValue={values.description} rows={5} />
        </div>
      </section>

      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-label">Impact scores</p>
        <h2 className="mt-2 text-2xl font-black">One scale, one meaning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          0 means no meaningful impact. 5 means very high. FPS means the likely performance gain from lowering the option; Visual means the likely quality loss.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ImpactSelect label="FPS" name="performanceImpact" value={values.performanceImpact} />
          <ImpactSelect label="Visual" name="visualImpact" value={values.visualImpact} />
          <ImpactSelect label="VRAM" name="vramImpact" value={values.vramImpact} />
          <ImpactSelect label="CPU" name="cpuImpact" value={values.cpuImpact} />
          <ImpactSelect label="Latency" name="latencyImpact" value={values.latencyImpact} />
        </div>
      </section>

      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-label">Player guidance</p>
        <h2 className="mt-2 text-2xl font-black">Tell people what to do, not just what the meter says</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TextArea label="Lower it when" name="whenToLower" defaultValue={values.whenToLower} rows={4} />
          <TextArea label="Keep it high when" name="whenToKeepHigh" defaultValue={values.whenToKeepHigh} rows={4} />
          <TextArea label="Handheld advice" name="handheldAdvice" defaultValue={values.handheldAdvice} rows={5} />
          <TextArea label="Caveat" name="caveat" defaultValue={values.caveat} rows={5} />
        </div>
      </section>

      <section className="atlas-panel p-5 sm:p-6">
        <p className="atlas-section-label">Publishing</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Confidence</span>
            <select name="confidence" defaultValue={values.confidence} className="mt-2 h-11 w-full rounded-xl px-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>{value}/5</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Status</span>
            <select name="status" defaultValue={values.status} className="mt-2 h-11 w-full rounded-xl px-3">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="flex flex-col justify-end gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
              <input type="checkbox" name="restartRequired" defaultChecked={values.restartRequired} className="h-4 w-4" />
              Restart may be required
            </label>
            {canVerify && (
              <label className="flex items-center gap-3 text-sm font-bold text-slate-300">
                <input type="checkbox" name="atlasVerified" defaultChecked={values.atlasVerified} className="h-4 w-4" />
                Atlas reviewed
              </label>
            )}
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex justify-end rounded-2xl border border-white/[0.08] bg-[#05070d]/95 p-3 shadow-2xl backdrop-blur-xl">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, placeholder, required = false }: { label: string; name: string; defaultValue: string; placeholder?: string; required?: boolean }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="mt-2 h-11 w-full rounded-xl px-4" />
    </label>
  );
}

function TextArea({ label, name, defaultValue, rows, required = false }: { label: string; name: string; defaultValue: string; rows: number; required?: boolean }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <textarea name={name} defaultValue={defaultValue} rows={rows} required={required} className="mt-2 w-full rounded-xl px-4 py-3 leading-6" />
    </label>
  );
}

function ImpactSelect({ label, name, value }: { label: string; name: string; value: number }) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <select name={name} defaultValue={value} className="mt-2 h-11 w-full rounded-xl px-3">
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <option key={level} value={level}>{level} — {getImpactLabel(level)}</option>
        ))}
      </select>
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="atlas-button-primary min-w-48 disabled:opacity-50">
      {pending ? "Saving…" : label}
    </button>
  );
}
