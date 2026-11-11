import Link from "next/link";
import type {
  ProductListQuery,
  SortOption,
} from "@/modules/catalog/catalog.types";
import { toSearchString } from "@/modules/catalog/query-params";

const LABELS: Record<SortOption, string> = {
  newest: "En yeni",
  "price-asc": "Fiyat (artan)",
  "price-desc": "Fiyat (azalan)",
  name: "İsim (A-Z)",
};

export function SortLinks({
  basePath,
  query,
}: {
  basePath: string;
  query: ProductListQuery;
}) {
  return (
    <nav
      aria-label="Sıralama"
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <span className="text-muted-foreground">Sırala:</span>
      {(Object.keys(LABELS) as SortOption[]).map((option) => (
        <Link
          key={option}
          href={`${basePath}${toSearchString({ ...query, sort: option }, { page: 1 })}`}
          aria-current={query.sort === option ? "true" : undefined}
          className={
            query.sort === option
              ? "inline-flex min-h-11 items-center rounded-theme bg-primary px-3.5 text-sm font-semibold text-primary-foreground"
              : "inline-flex min-h-11 items-center rounded-theme border border-border px-3.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          }
        >
          {LABELS[option]}
        </Link>
      ))}
    </nav>
  );
}
