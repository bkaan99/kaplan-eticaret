"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AuditDetailModal } from "./audit-detail-modal";
import { getActionBadge } from "./audit-diff";

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
                className="h-9 pl-8.5 text-xs bg-slate-50/50"
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
                className="h-9 text-xs bg-slate-50/50"
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
              className="min-h-10 bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer sm:h-9 sm:min-h-0"
            >
              Filtrele
            </Button>

            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="min-h-10 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer sm:h-9 sm:min-h-0"
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

        {/* Mobil: kart listesi */}
        <ul className="divide-y divide-slate-100 md:hidden">
          {items.map((row) => {
            const actionBadge = getActionBadge(row.action);
            const dateObj = new Date(row.createdAt);
            const hasBefore = row.before !== null && row.before !== undefined;
            const hasAfter = row.after !== null && row.after !== undefined;

            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRow(row)}
                  className="flex w-full min-h-[4.5rem] flex-col justify-center gap-1.5 px-4 py-3.5 text-left active:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-bold text-slate-900">
                      {dateObj.toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      <span className="font-mono text-[11px] font-normal text-slate-400">
                        {dateObj.toLocaleTimeString("tr-TR")}
                      </span>
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionBadge.className}`}
                    >
                      <span>{actionBadge.icon}</span>
                      <span>{actionBadge.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] font-semibold text-slate-800">
                      {row.actorName ?? "Sistem"}
                    </span>
                    <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                      {row.entityType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                    <code className="truncate font-mono font-semibold text-slate-600">
                      {row.action}
                    </code>
                    <span className="shrink-0">
                      {!hasBefore && hasAfter
                        ? "Yeni nesne"
                        : hasBefore && !hasAfter
                          ? "Silindi"
                          : hasBefore && hasAfter
                            ? "Güncellendi"
                            : "Olay"}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}

          {items.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <span className="mb-2 block text-4xl">🔍</span>
              <p className="text-sm font-bold text-slate-800">
                Denetim kaydı bulunamadı
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Arama kriterlerinize uyan denetim kaydı bulunamadı. Filtreleri
                sıfırlayarak tüm kayıtları görebilirsiniz.
              </p>
              {hasFilters ? (
                <Button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 min-h-10 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Filtreleri Sıfırla
                </Button>
              ) : null}
            </li>
          ) : null}
        </ul>

        {/* Masaüstü: tablo */}
        <div className="hidden overflow-x-auto md:block">
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
                const hasBefore =
                  row.before !== null && row.before !== undefined;
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
                      Arama kriterlerinize uyan denetim kaydı bulunamadı.
                      Filtreleri sıfırlayarak tüm kayıtları görebilirsiniz.
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
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-xs shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-5">
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
                className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 sm:h-8 sm:min-h-0"
              >
                ← Önceki
              </Link>
            ) : (
              <span className="inline-flex min-h-10 items-center rounded-xl border border-transparent px-3.5 font-semibold text-slate-300 sm:h-8 sm:min-h-0">
                ← Önceki
              </span>
            )}

            <span className="px-2 font-bold text-slate-800">
              {page} / {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/admin/denetim?${new URLSearchParams({
                  ...(currentAction ? { islem: currentAction } : {}),
                  ...(currentEntityType ? { varlik: currentEntityType } : {}),
                  sayfa: String(page + 1),
                }).toString()}`}
                className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3.5 font-semibold text-slate-700 transition hover:bg-slate-50 sm:h-8 sm:min-h-0"
              >
                Sonraki →
              </Link>
            ) : (
              <span className="inline-flex min-h-10 items-center rounded-xl border border-transparent px-3.5 font-semibold text-slate-300 sm:h-8 sm:min-h-0">
                Sonraki →
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
