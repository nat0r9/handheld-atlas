import Link from "next/link";
import { catalogUrl, PAGE_SIZE } from "../../lib/catalog/query";
export default function Pagination({
  path,
  values,
  page,
  total,
}: {
  path: string;
  values: Record<string, string>;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <nav
      aria-label="Results pages"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link prefetch={false}
          scroll={true}
          className="atlas-button-secondary"
          href={catalogUrl(path, { ...values, page: page - 1 })}
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-slate-300">
        Page {page} of {pages} · {total} results
      </p>
      {page < pages ? (
        <Link prefetch={false}
          scroll={true}
          className="atlas-button-primary"
          href={catalogUrl(path, { ...values, page: page + 1 })}
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
