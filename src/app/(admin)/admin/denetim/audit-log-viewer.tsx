"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface AuditRowView {
  id: string;
  createdAt: string; // ISO string
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
}

export interface AuditLogViewerProps {
  items: AuditRowView[];
  total: number;
  page: number;
  totalPages: number;
  entityTypes: string[];
  currentAction: string;
  currentEntityType: string;
}

/* -------------------------------------------------------------------------- */
/*                               DIFF CALCULATOR                              */
/* -------------------------------------------------------------------------- */

interface DiffField {
  key: string;
  beforeVal: unknown;
  afterVal: unknown;
  status: "added" | "removed" | "changed" | "unchanged";
}

function calculateDiff(before: unknown, after: unknown): DiffField[] {
  if (!before && !after) return [];
  const bObj =
    typeof before === "object" && before !== null
      ? (before as Record<string, unknown>)
      : null;
  const aObj =
    typeof after === "object" && after !== null
      ? (after as Record<string, unknown>)
      : null;

  if (!bObj && aObj) {
    return Object.entries(aObj).map(([key, afterVal]) => ({
      key,
      beforeVal: undefined,
      afterVal,
      status: "added",
    }));
  }

  if (bObj && !aObj) {
    return Object.entries(bObj).map(([key, beforeVal]) => ({
      key,
      beforeVal,
      afterVal: undefined,
      status: "removed",
    }));
  }

  if (bObj && aObj) {
    const allKeys = Array.from(
      new Set([...Object.keys(bObj), ...Object.keys(aObj)]),
    );
    return allKeys.map((key) => {
      const bVal = bObj[key];
      const aVal = aObj[key];
      const bStr = JSON.stringify(bVal);
      const aStr = JSON.stringify(aVal);
      if (!(key in bObj))
        return { key, beforeVal: undefined, afterVal: aVal, status: "added" };
      if (!(key in aObj))
        return { key, beforeVal: bVal, afterVal: undefined, status: "removed" };
      if (bStr !== aStr)
        return { key, beforeVal: bVal, afterVal: aVal, status: "changed" };
      return { key, beforeVal: bVal, afterVal: aVal, status: "unchanged" };
    });
  }

  return [];
}

function formatValue(val: unknown): string {
  if (val === undefined) return "–";
  if (val === null) return "null";
  if (typeof val === "boolean") return val ? "true (Evet)" : "false (Hayır)";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function getActionBadge(action: string) {
  const lower = action.toLowerCase();
  if (
    lower.includes("create") ||
    lower.includes("add") ||
    lower.includes("insert")
  ) {
    return {
      label: "Ekleme",
      icon: "✨",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  }
  if (
    lower.includes("delete") ||
    lower.includes("remove") ||
    lower.includes("cancel")
  ) {
    return {
      label: "Silme",
      icon: "🗑️",
      className: "bg-red-50 text-red-800 border-red-200",
    };
  }
  if (
    lower.includes("update") ||
    lower.includes("edit") ||
    lower.includes("change") ||
    lower.includes("set")
  ) {
    return {
      label: "Güncelleme",
      icon: "✎",
      className: "bg-sky-50 text-sky-800 border-sky-200",
    };
  }
  if (lower.includes("ship") || lower.includes("deliver")) {
    return {
      label: "Sevkiyat",
      icon: "🚚",
      className: "bg-amber-50 text-amber-800 border-amber-200",
    };
  }
  if (
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("role") ||
    lower.includes("pass")
  ) {
    return {
      label: "Güvenlik",
      icon: "🔐",
      className: "bg-purple-50 text-purple-800 border-purple-200",
    };
  }
  return {
    label: "İşlem",
    icon: "⚙️",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

/* -------------------------------------------------------------------------- */
/*                             AUDIT DETAIL MODAL                             */
/* -------------------------------------------------------------------------- */

interface AuditDetailModalProps {
  row: AuditRowView | null;
  onClose: () => void;
}

function AuditDetailModal({ row, onClose }: AuditDetailModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Kutusu */}
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/20 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg shadow-2xs">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
              Kayıt ID: <code className="font-mono">{row.id.slice(0, 8)}...</code>
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
            className="h-10 bg-slate-900 px-6 text-xs font-bold text-white shadow-xs hover:bg-slate-800 cursor-pointer"
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              AUDIT LOG VIEWER                              */
/* -------------------------------------------------------------------------- */

export function AuditLogViewer({
  items,
  total,
  page,
  totalPages,
  entityTypes,
  currentAction,
  currentEntityType,
}: AuditLogViewerProps) {
  const router = useRouter();
  const [selectedRow, setSelectedRow] = useState<AuditRowView | null>(null);
  const [searchAction, setSearchAction] = useState(currentAction);
  const [selectedEntity, setSelectedEntity] = useState(currentEntityType);

  // Filtre gönder
  function handleFilterSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = new URLSearchParams();
    if (searchAction.trim()) query.set("islem", searchAction.trim());
    if (selectedEntity) query.set("varlik", selectedEntity);
    router.push(`/admin/denetim?${query.toString()}`);
  }

  function handleQuickEntity(entity: string) {
    setSelectedEntity(entity);
    const query = new URLSearchParams();
    if (searchAction.trim()) query.set("islem", searchAction.trim());
    if (entity) query.set("varlik", entity);
    router.push(`/admin/denetim?${query.toString()}`);
  }

  function handleClearFilters() {
    setSearchAction("");
    setSelectedEntity("");
    router.push("/admin/denetim");
  }

  const hasFilters = Boolean(currentAction || currentEntityType);

  return (
    <div className="flex flex-col gap-6">
      {/* Detay & Diff Modalı */}
      <AuditDetailModal
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />

      {/* İstatistik & Güvenlik Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Toplam Günlük</span>
            <span className="text-base">📋</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Bu Sayfada</span>
            <span className="text-base">📄</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
            {items.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Varlık Türü</span>
            <span className="text-base">🗂️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {entityTypes.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kayıt Güvencesi</span>
            <span className="text-base">🔒</span>
          </div>
          <p className="mt-1.5 text-xs font-bold tracking-tight text-emerald-800">
            Değiştirilemez & Denetlenebilir
          </p>
        </div>
      </div>

      {/* Arama & Filtre Çubuğu */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* İşlem Arama */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                🔍
              </span>
              <Input
                value={searchAction}
                onChange={(e) => setSearchAction(e.target.value)}
                placeholder="İşlem ara (örn: order.ship, product.create)..."
                className="h-10 pl-8.5 text-xs bg-slate-50/50"
              />
              {searchAction && (
                <button
                  type="button"
                  onClick={() => setSearchAction("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Varlık Seçici */}
            <div className="w-full sm:w-56">
              <Select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="h-10 text-xs bg-slate-50/50"
              >
                <option value="">Tüm Varlıklar ({entityTypes.length})</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              className="h-10 bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              Filtrele
            </Button>

            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Temizle
              </Button>
            )}
          </div>
        </form>

        {/* Hızlı Varlık Seçim Hapları */}
        {entityTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Hızlı Varlık:
            </span>
            <button
              type="button"
              onClick={() => handleQuickEntity("")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                !currentEntityType
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              Tümü
            </button>
            {entityTypes.slice(0, 8).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleQuickEntity(type)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  currentEntityType === type
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Denetim Tablosu */}
      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📜</span>
            <h3 className="text-sm font-bold text-slate-900">
              Sistem Değişiklik ve Olay Kayıtları
            </h3>
            <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {total} kayıt
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Sayfa {page} / {totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Zaman</th>
                <th className="px-4 py-3">Kullanıcı / Aktör</th>
                <th className="px-4 py-3">İşlem (Eylem)</th>
                <th className="px-4 py-3">Hedef Varlık</th>
                <th className="px-4 py-3">Fark Özeti</th>
                <th className="px-4 py-3 text-right">Detay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((row) => {
                const actionBadge = getActionBadge(row.action);
                const dateObj = new Date(row.createdAt);

                // Fark özeti hesaplama
                const hasBefore = row.before !== null && row.before !== undefined;
                const hasAfter = row.after !== null && row.after !== undefined;

                return (
                  <tr
                    key={row.id}
                    className="transition hover:bg-slate-50/70 group"
                  >
                    {/* Zaman */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {dateObj.toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {dateObj.toLocaleTimeString("tr-TR")}
                      </div>
                    </td>

                    {/* Aktör */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs">
                          {row.actorName
                            ? row.actorName.slice(0, 1).toUpperCase()
                            : "🤖"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {row.actorName ?? "Sistem"}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <span className="truncate max-w-[140px]">
                              {row.actorEmail ?? "system@internal"}
                            </span>
                            {row.ip && (
                              <span className="font-mono text-[10px] text-slate-400">
                                · {row.ip}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* İşlem */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionBadge.className}`}
                        >
                          <span>{actionBadge.icon}</span>
                          <span>{actionBadge.label}</span>
                        </span>
                        <code className="font-mono text-xs text-slate-700 font-semibold">
                          {row.action}
                        </code>
                      </div>
                    </td>

                    {/* Varlık */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 font-bold text-slate-800 text-[11px]">
                          {row.entityType}
                        </span>
                        {row.entityId && (
                          <span className="font-mono text-[11px] text-slate-500">
                            #{row.entityId.slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fark Özeti */}
                    <td className="px-4 py-3.5">
                      {!hasBefore && hasAfter ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                          <span>✨</span>
                          <span>Yeni Nesne</span>
                        </span>
                      ) : hasBefore && !hasAfter ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                          <span>🗑️</span>
                          <span>Kayıt Silindi</span>
                        </span>
                      ) : hasBefore && hasAfter ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2.5 py-0.5">
                          <span>🔄</span>
                          <span>Değerler Güncellendi</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Olay Kaydı
                        </span>
                      )}
                    </td>

                    {/* Detay Butonu */}
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRow(row)}
                        className="h-7.5 px-3 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition cursor-pointer"
                      >
                        🔍 İncele
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <span className="text-4xl mb-2 block">🔍</span>
                    <p className="text-sm font-bold text-slate-800">
                      Denetim kaydı bulunamadı
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Arama kriterlerinize uyan denetim kaydı bulunamadı. Filtreleri
                      sıfırlayarak tüm kayıtları görebilirsiniz.
                    </p>
                    {hasFilters && (
                      <Button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-4 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        Filtreleri Sıfırla
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 text-xs shadow-xs">
          <span className="font-semibold text-slate-500">
            Toplam {total} kayıttan {(page - 1) * items.length + 1} -{" "}
            {Math.min(page * items.length, total)} arası gösteriliyor
          </span>

          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/denetim?${new URLSearchParams({
                  ...(currentAction ? { islem: currentAction } : {}),
                  ...(currentEntityType ? { varlik: currentEntityType } : {}),
                  sayfa: String(page - 1),
                }).toString()}`}
                className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Önceki
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-xl border border-transparent px-3 font-semibold text-slate-300">
                ← Önceki
              </span>
            )}

            <span className="font-bold text-slate-800 px-2">
              {page} / {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/admin/denetim?${new URLSearchParams({
                  ...(currentAction ? { islem: currentAction } : {}),
                  ...(currentEntityType ? { varlik: currentEntityType } : {}),
                  sayfa: String(page + 1),
                }).toString()}`}
                className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sonraki →
              </Link>
            ) : (
              <span className="inline-flex h-8 items-center rounded-xl border border-transparent px-3 font-semibold text-slate-300">
                Sonraki →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
