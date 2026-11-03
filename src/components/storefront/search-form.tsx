"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowRightIcon,
  SearchIcon,
  XIcon,
} from "@/components/storefront/icons";
import { formatMoney } from "@/shared/money";
import type { ProductCard } from "@/modules/catalog/catalog.types";
import { liveSearchAction } from "./search-actions";

interface SearchFormProps {
  className?: string;
}

const POPULAR_SUGGESTIONS = [
  "Kornişon",
  "Çubuk Lahana",
  "Doğal Şalgam",
  "Acılı Biber",
  "Karışık Turşu",
];

export function SearchForm({ className = "" }: SearchFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ProductCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  // Debounce mekanizması (1 saniye / 1000ms gecikme ile sunucuya istek atar)
  useEffect(() => {
    const trimmed = query.trim();
    latestQueryRef.current = trimmed;

    if (trimmed.length < 2) {
      setResults([]);
      setTotalCount(0);
      setHasSearched(false);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const data = await liveSearchAction(trimmed);
          // Yarış durumunu önle (stale response protection)
          if (latestQueryRef.current === trimmed) {
            setResults(data.items);
            setTotalCount(data.total);
            setHasSearched(true);
            setIsOpen(true);
          }
        } catch {
          // Arama hatasında kullanıcı deneyimini bozmamak için sessizce geç
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  // Dışarı tıklandığında açılır menüyü kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setTotalCount(0);
    setHasSearched(false);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    setIsOpen(false);
    if (trimmed) {
      router.push(`/ara?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/ara");
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        action="/ara"
        role="search"
        className="relative w-full"
      >
        <input
          ref={inputRef}
          name="q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && hasSearched) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Turşu, şalgam, hediye kutusu ara…"
          aria-label="Ürün ara"
          autoComplete="off"
          spellCheck="false"
          className="h-12 w-full rounded-full border border-slate-200 bg-[#f4f5f0] pr-28 pl-5 text-sm font-semibold text-slate-900 transition-colors outline-none placeholder:font-semibold placeholder:text-slate-500 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />

        {/* Temizleme (X) Butonu */}
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Aramayı temizle"
            className="absolute inset-y-0 right-24 my-auto flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          >
            <XIcon width={14} height={14} />
          </button>
        ) : null}

        <button
          type="submit"
          className="absolute inset-y-0 right-0 inline-flex items-center gap-1.5 rounded-r-full bg-primary px-7 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
        >
          {isPending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span>Ara</span>
          )}
        </button>
      </form>

      {/* Canlı Sonuç Açılır Paneli (Live Search Dropdown) */}
      {isOpen && (
        <div
          role="region"
          aria-label="Canlı arama sonuçları"
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5"
        >
          {isPending && results.length === 0 ? (
            /* Yükleme İskeleti */
            <div className="flex flex-col gap-2.5 p-3.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs font-semibold text-slate-400">
                <span>EŞLEŞEN ÜRÜNLER</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {totalCount} ürün bulundu
                </span>
              </div>

              <ul className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/urun/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center justify-between gap-3 p-3 transition hover:bg-slate-50/80"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-100">
                          <Image
                            src={product.imageUrl ?? "/placeholder.svg"}
                            alt={product.imageAlt || product.name}
                            fill
                            sizes="48px"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-primary">
                            {product.name}
                          </p>
                          {product.brandName ? (
                            <p className="truncate text-xs text-slate-400">
                              {product.brandName}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              Geleneksel ev turşusu
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-bold text-primary">
                          {formatMoney(product.price, product.currency)}
                        </span>
                        {!product.inStock ? (
                          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
                            Tükendi
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Tüm Sonuçlar Alt Butonu */}
              <Link
                href={`/ara?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/80 p-3 text-center text-xs font-bold text-primary transition hover:bg-slate-100"
              >
                <span>Tüm sonuçları gör ({totalCount} ürün)</span>
                <ArrowRightIcon width={14} height={14} />
              </Link>
            </div>
          ) : hasSearched ? (
            /* Sonuç Bulunamadı Durumu */
            <div className="p-5 text-center">
              <p className="text-sm font-semibold text-slate-800">
                “{query.trim()}” için sonuç bulunamadı
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Farklı bir kelime arayabilir veya popüler lezzetlere göz
                atabilirsiniz:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {POPULAR_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
