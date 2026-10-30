"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteGroupAction, saveGroupAction } from "./actions";

export interface GroupView {
  id: string;
  name: string;
  discountPercent: string | null;
  customerCount: number;
}

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  name: string;
  setName: (v: string) => void;
  discount: string;
  setDiscount: (v: string) => void;
  onSave: () => void;
  pending: boolean;
  message: { text: string; error: boolean } | null;
}

function GroupModal({
  isOpen,
  onClose,
  editingId,
  name,
  setName,
  discount,
  setDiscount,
  onSave,
  pending,
  message,
}: GroupModalProps) {
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              👥
            </span>
            <div>
              <h2
                id="group-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingId ? "Müşteri Grubunu Düzenle" : "Yeni Grup Tanımla"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bayi ve toptan müşteriler için indirim grubu oluşturun
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

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {message && (
            <div
              role={message.error ? "alert" : "status"}
              className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span>{message.error ? "⚠️" : "✓"}</span>
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">Grup Adı *</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: VIP Bayiler, Restoranlar..."
              className="h-10 text-xs font-semibold bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">Genel İskonto (%)</Label>
            <Input
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              inputMode="decimal"
              placeholder="Örn: 15"
              className="h-10 text-xs font-semibold bg-white"
            />
            <span className="text-[11px] text-slate-400">
              Bu gruba dahil müşteriler ürünlerde bu oranda otomatik indirim alır.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending}
            className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !name.trim()}
            onClick={onSave}
            className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
          >
            {pending ? (
              <div className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Kaydediliyor...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>💾</span>
                <span>{editingId ? "Değişiklikleri Güncelle" : "Grubu Kaydet"}</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function GroupManager({
  groups,
  selectedId,
}: {
  groups: GroupView[];
  selectedId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function reset() {
    setEditingId(null);
    setName("");
    setDiscount("");
  }

  function handleCreateNew() {
    reset();
    setMessage(null);
    setIsModalOpen(true);
  }

  function handleEdit(group: GroupView) {
    setEditingId(group.id);
    setName(group.name);
    setDiscount(
      group.discountPercent ? String(Number(group.discountPercent)) : "",
    );
    setMessage(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    reset();
    setIsModalOpen(false);
  }

  function save() {
    startTransition(async () => {
      const result = await saveGroupAction(editingId, {
        name,
        discountPercent: discount,
      });
      setMessage(
        result.ok
          ? { text: "Kaydedildi", error: false }
          : { text: result.error ?? "Kaydedilemedi", error: true },
      );
      if (result.ok) {
        reset();
        setIsModalOpen(false);
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Grup silinsin mi?")) return;
    startTransition(async () => {
      const result = await deleteGroupAction(id);
      setMessage(
        result.ok
          ? { text: "Silindi", error: false }
          : { text: result.error ?? "Silinemedi", error: true },
      );
      if (result.ok && editingId === id) {
        reset();
        setIsModalOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Modal Penceresi */}
      <GroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingId={editingId}
        name={name}
        setName={setName}
        discount={discount}
        setDiscount={setDiscount}
        onSave={save}
        pending={pending}
        message={message}
      />

      {message && !isModalOpen && (
        <div
          role={message.error ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between ${
            message.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.error ? "⚠️" : "✓"}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Müşteri Grupları Listesi - Tam Genişlik */}
      <Card className="overflow-hidden border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Müşteri ve Bayi Grupları
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Farklı müşteri segmentlerine özel iskonto oranları ve fiyatlandırma
            </p>
          </div>

          <Button
            type="button"
            onClick={handleCreateNew}
            className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
          >
            + Yeni Grup Ekle
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100 text-sm">
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-slate-50/80"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs">
                    👥
                  </span>
                  <div>
                    <Link
                      href={`/admin/bayi-gruplari?grup=${group.id}`}
                      className={`text-xs font-bold hover:text-emerald-700 transition ${
                        selectedId === group.id
                          ? "text-emerald-800 underline"
                          : "text-slate-900"
                      }`}
                    >
                      {group.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="text-[10px] font-semibold">
                        {group.discountPercent
                          ? `%${Number(group.discountPercent)} iskonto`
                          : "İskonto yok"}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {group.customerCount} kayıtlı bayi
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                    className="h-7.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => remove(group.id)}
                    className="h-7.5 px-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Sil
                  </Button>
                </div>
              </li>
            ))}

            {groups.length === 0 && (
              <li className="py-12 px-4 text-center">
                <span className="text-3xl mb-1">👥</span>
                <p className="text-xs font-bold text-slate-700">
                  Henüz müşteri grubu tanımlanmadı
                </p>
                <Button
                  type="button"
                  onClick={handleCreateNew}
                  className="mt-3 bg-emerald-700 text-xs font-semibold text-white"
                >
                  + İlk Grubu Ekle
                </Button>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
