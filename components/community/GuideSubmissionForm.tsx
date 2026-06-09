"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

export interface GuideRelationOption {
  name: string;
  slug: string;
}

export interface GuideSubmissionInitialData {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  readingTime: string;
  difficulty: string;
  coverImageUrl: string;
  relatedGameSlug: string;
  relatedHandheldSlug: string;
}

interface GuideSubmissionFormProps {
  games: GuideRelationOption[];
  handhelds: GuideRelationOption[];
  action: (
    formData: FormData,
  ) => Promise<void>;
  initialData?: GuideSubmissionInitialData;
  mode?: "create" | "edit";
}

const categories = [
  "Optimization",
  "Setup",
  "Troubleshooting",
  "Performance",
  "Battery",
  "Hardware",
  "Software",
  "Game guide",
  "Other",
];

export default function GuideSubmissionForm({
  games,
  handhelds,
  action,
  initialData,
  mode = "create",
}: GuideSubmissionFormProps) {
  const [content, setContent] =
    useState(
      initialData?.content ?? "",
    );

  const wordCount = useMemo(
    () =>
      content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    [content],
  );

  return (
    <form
      action={action}
      className="atlas-panel p-4 sm:p-6"
    >
      {initialData && (
        <input
          type="hidden"
          name="submissionId"
          value={initialData.id}
        />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <FormField
          label="Guide title"
          name="title"
          placeholder="Fix unstable frame pacing on ROG Ally X"
          required
          maxLength={140}
          className="md:col-span-2"
          defaultValue={initialData?.title}
        />

        <SelectField
          label="Category"
          name="category"
          placeholder="Select category"
          options={categories.map(
            (category) => ({
              label: category,
              value: category,
            }),
          )}
          required
          defaultValue={initialData?.category}
        />

        <SelectField
          label="Difficulty"
          name="difficulty"
          placeholder="Select difficulty"
          options={[
            {
              label: "Beginner",
              value: "Beginner",
            },
            {
              label: "Intermediate",
              value:
                "Intermediate",
            },
            {
              label: "Advanced",
              value: "Advanced",
            },
          ]}
          defaultValue={initialData?.difficulty}
        />

        <FormField
          label="Reading time"
          name="readingTime"
          type="number"
          min="1"
          step="1"
          placeholder="5"
          defaultValue={initialData?.readingTime}
        />

        <FormField
          label="Cover image URL"
          name="coverImageUrl"
          type="url"
          placeholder="/images/guides/example.jpg"
          defaultValue={initialData?.coverImageUrl}
        />

        <RelationSelect
          label="Related game"
          name="relatedGameSlug"
          placeholder="No related game"
          options={games}
          defaultValue={initialData?.relatedGameSlug}
        />

        <RelationSelect
          label="Related handheld"
          name="relatedHandheldSlug"
          placeholder="No related handheld"
          options={handhelds}
          defaultValue={initialData?.relatedHandheldSlug}
        />
      </div>

      <div className="mt-6">
        <FieldLabel
          htmlFor="excerpt"
          label="Excerpt"
        />

        <textarea
          id="excerpt"
          name="excerpt"
          required
          maxLength={320}
          rows={3}
          placeholder="Explain what the guide solves and who it is for."
          defaultValue={initialData?.excerpt}
          className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
        />

        <p className="mt-2 text-xs leading-5 text-slate-600">
          Keep it short. This appears on the public guide card.
        </p>
      </div>

      <section className="mt-8 border-t border-white/[0.07] pt-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="atlas-section-label">
              Guide body
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Write structured content
            </h2>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3 text-xs text-slate-500">
            {wordCount}{" "}
            {wordCount === 1
              ? "word"
              : "words"}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <FieldLabel
              htmlFor="content"
              label="Guide content"
            />

            <textarea
              id="content"
              name="content"
              required
              rows={24}
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              placeholder={`Introduction paragraph.

What you need

- First requirement
- Second requirement

Step-by-step process

1. First action
2. Second action

Final notes

Explain caveats, expected results and anything that can go wrong.`}
              className="w-full resize-y rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 font-mono text-sm leading-7 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
            />
          </div>

          <aside className="rounded-2xl border border-white/[0.07] bg-black/20 p-5 lg:self-start">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-cyan-400">
              Formatting guide
            </p>

            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-400">
              <FormattingTip
                title="Paragraphs"
                text="Separate paragraphs with an empty line."
              />

              <FormattingTip
                title="Headings"
                text="Use a short standalone line without punctuation."
              />

              <FormattingTip
                title="Bullet lists"
                text="Start every list item with -, * or •."
              />

              <FormattingTip
                title="Numbered steps"
                text="Start every step with 1. or 1)."
              />
            </div>

            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
              <p className="text-xs font-black text-red-300">
                Write what you tested
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Avoid copied filler, fabricated benchmarks and vague AI soup.
                Moderators may return the guide for changes.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/my-guide-submissions"
          className="atlas-button-secondary text-center"
        >
          Cancel
        </Link>

        <div className="grid gap-3 sm:flex">
          <button
            type="submit"
            name="intent"
            value="draft"
            className="atlas-button-secondary"
          >
            {mode === "edit"
              ? "Save changes"
              : "Save draft"}
          </button>

          <button
            type="submit"
            name="intent"
            value="submit"
            className="atlas-button-primary"
          >
            {mode === "edit"
              ? "Resubmit for review"
              : "Submit for review"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldLabel({
  htmlFor,
  label,
}: {
  htmlFor: string;
  label: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[0.58rem] font-black uppercase tracking-[0.14em] text-slate-600"
    >
      {label}
    </label>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "number" | "url";
  min?: string;
  step?: string;
  maxLength?: number;
  className?: string;
  defaultValue?: string;
}

function FormField({
  label,
  name,
  placeholder,
  required = false,
  type = "text",
  min,
  step,
  maxLength,
  className = "",
  defaultValue,
}: FormFieldProps) {
  return (
    <div className={className}>
      <FieldLabel
        htmlFor={name}
        label={label}
      />

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        step={step}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-500"
      />
    </div>
  );
}

interface SelectOption {
  label: string;
  value: string;
}

function SelectField({
  label,
  name,
  placeholder,
  options,
  required = false,
  defaultValue = "",
}: {
  label: string;
  name: string;
  placeholder: string;
  options: SelectOption[];
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <FieldLabel
        htmlFor={name}
        label={label}
      />

      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-500"
      >
        <option
          value=""
          disabled={required}
        >
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function RelationSelect({
  label,
  name,
  placeholder,
  options,
  defaultValue = "",
}: {
  label: string;
  name: string;
  placeholder: string;
  options: GuideRelationOption[];
  defaultValue?: string;
}) {
  return (
    <div>
      <FieldLabel
        htmlFor={name}
        label={label}
      />

      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-cyan-500"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.slug}
            value={option.slug}
          >
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormattingTip({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <p className="font-black text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {text}
      </p>
    </div>
  );
}
