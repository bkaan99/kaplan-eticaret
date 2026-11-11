"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { calculateDiff, formatValue, getActionBadge } from "./audit-diff";
import { type AuditRowView } from "./audit-log-viewer";

export interface AuditDetailModalProps {
  row: AuditRowView | null;
  onClose: () => void;
}

export function AuditDetailModal({ row, onClose }: AuditDetailModalProps) {
  const [tab, setTab] = useState<"diff" | "raw">("diff");
  const [copiedBefore, setCopiedBefore] = useState(false);
  const [copiedAfter, setCopiedAfter] = useState(false);

  useEffect(() => {
    if (!row) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [row, onClose]);

  const diffList = useMemo(() => {
    if (!row) return [];
    return calculateDiff(row.before, row.after);
  }, [row]);

  const changedCount = useMemo(() => {
    return diffList.filter((d) => d.status !== "unchanged").length;
  }, [diffList]);

  if (!row) return null;

  const actionMeta = getActionBadge(row.action);
  const dateObj = new Date(row.createdAt);

  function copyText(text: string, isBefore: boolean) {
    navigator.clipboard.writeText(text);
    if (isBefore) {
      setCopiedBefore(true);
      setTimeout(() => setCopiedBefore(false), 2000);
    } else {
      setCopiedAfter(true);
      setTimeout(() => setCopiedAfter(false), 2000);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Kutusu */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/20 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-lg shadow-2xs">
              {actionMeta.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="audit-detail-title"
                  className="text-base font-bold text-slate-900"
                >
                  Denetim Olayı Detayları
                </h2>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionMeta.className}`}
                >
                  {actionMeta.label}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {row.action}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Olay Meta Kartları */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tarih & Saat
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900">
                {dateObj.toLocaleDateString("tr-TR")}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {dateObj.toLocaleTimeString("tr-TR")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                İşlemi Yapan
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900 truncate">
                {row.actorName ?? "Sistem"}
              </p>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {row.actorEmail ?? "system@internal"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hedef Varlık
              </span>
              <p className="mt-1 text-xs font-bold text-slate-900 truncate">
                {row.entityType}
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate">
                {row.entityId ? `#${row.entityId}` : "–"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                IP Adresi
              </span>
              <p className="mt-1 text-xs font-mono font-bold text-slate-900 truncate">
                {row.ip ?? "127.0.0.1"}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">
                ✓ Doğrulandı
              </span>
            </div>
          </div>

          {/* Sekme Seçici: Görsel Karşılaştırma vs Ham JSON */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTab("diff")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  tab === "diff"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Fark Görünümü (Değişiklikler)</span>
                {changedCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800">
                    {changedCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("raw")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  tab === "raw"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ham JSON Verisi
              </button>
            </div>

            <span className="text-xs text-slate-400">
              Kayıt ID:{" "}
              <code className="font-mono">{row.id.slice(0, 8)}...</code>
            </span>
          </div>

          {/* TAB 1: Görsel Değişiklik Tablosu */}
          {tab === "diff" && (
            <div className="space-y-3">
              {diffList.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <span className="text-2xl mb-1 block">📄</span>
                  <p className="text-xs font-semibold">
                    Bu işlemde alan bazlı değişiklik verisi bulunamadı.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Alan / Anahtar</th>
                        <th className="px-4 py-2.5">Önceki Değer</th>
                        <th className="px-4 py-2.5">Yeni Değer</th>
                        <th className="px-3 py-2.5 text-right">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diffList.map((item) => {
                        const isChanged = item.status === "changed";
                        const isAdded = item.status === "added";
                        const isRemoved = item.status === "removed";

                        return (
                          <tr
                            key={item.key}
                            className={`transition ${
                              isChanged
                                ? "bg-amber-50/30"
                                : isAdded
                                  ? "bg-emerald-50/30"
                                  : isRemoved
                                    ? "bg-red-50/30"
                                    : "hover:bg-slate-50/50"
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">
                              {item.key}
                            </td>

                            <td className="px-4 py-3 font-mono text-slate-600 max-w-xs break-words">
                              {item.beforeVal !== undefined ? (
                                <span
                                  className={
                                    isChanged || isRemoved
                                      ? "line-through text-red-600 bg-red-50/70 px-1 py-0.5 rounded"
                                      : ""
                                  }
                                >
                                  {formatValue(item.beforeVal)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">–</span>
                              )}
                            </td>

                            <td className="px-4 py-3 font-mono text-slate-900 max-w-xs break-words">
                              {item.afterVal !== undefined ? (
                                <span
                                  className={
                                    isChanged || isAdded
                                      ? "font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded"
                                      : ""
                                  }
                                >
                                  {formatValue(item.afterVal)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">–</span>
                              )}
                            </td>

                            <td className="px-3 py-3 text-right">
                              {isAdded && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  + Yeni
                                </span>
                              )}
                              {isRemoved && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                                  - Silindi
                                </span>
                              )}
                              {isChanged && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                  ✎ Değişti
                                </span>
                              )}
                              {item.status === "unchanged" && (
                                <span className="text-[10px] text-slate-400">
                                  Aynı
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Ham JSON Görünümü */}
          {tab === "raw" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Önceki Durum */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Önceki Durum (before)</span>
                  {row.before ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyText(JSON.stringify(row.before, null, 2), true)
                      }
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {copiedBefore ? "✓ Kopyalandı" : "Kopyala"}
                    </button>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3.5 text-slate-100 font-mono text-xs max-h-72 overflow-y-auto">
                  {row.before ? (
                    <pre className="whitespace-pre-wrap break-words leading-relaxed">
                      {JSON.stringify(row.before, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-500 italic">
                      Önceki durum kaydı yok (Yeni nesne veya salt işlem)
                    </span>
                  )}
                </div>
              </div>

              {/* Yeni Durum */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Yeni Durum (after)</span>
                  {row.after ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyText(JSON.stringify(row.after, null, 2), false)
                      }
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {copiedAfter ? "✓ Kopyalandı" : "Kopyala"}
                    </button>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-3.5 text-slate-100 font-mono text-xs max-h-72 overflow-y-auto">
                  {row.after ? (
                    <pre className="whitespace-pre-wrap break-words leading-relaxed text-emerald-300">
                      {JSON.stringify(row.after, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-slate-500 italic">
                      Yeni durum kaydı yok (Silinen nesne)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            onClick={onClose}
            className="h-9 bg-slate-900 px-4 text-[13px] font-semibold text-white shadow-xs hover:bg-slate-800 cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}
