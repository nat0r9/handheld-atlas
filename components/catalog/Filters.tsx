import type { ReactNode } from "react";
export function Field({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={`catalog-${name}`}
        className="mb-2 block text-sm font-bold text-slate-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
export function Select({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Field label={label} name={name}>
      <select
        key={`${name}-${value}`}
        id={`catalog-${name}`}
        name={name}
        defaultValue={value}
        className="w-full min-w-0 rounded-lg px-3 py-3 text-sm"
      >
        <option value="">
          {name === "sort" ? `${options[0]?.label} (default)` : "All"}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
