"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { runImportAction, type ImportFormState } from "./actions";

const initial: ImportFormState = { kind: "idle" };

export function ImportForm() {
  const [state, action, pending] = useActionState(runImportAction, initial);

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>İşlem</span>
          <Select name="mode" defaultValue="urunler" className="max-w-sm">
            <option value="urunler">Yeni ürünleri içe aktar</option>
            <option value="guncelle">Toplu fiyat / stok güncelle (SKU)</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>CSV dosyası (en fazla 2 MB)</span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="text-sm"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="submit"
            name="intent"
            value="preview"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={pending}
          >
            Önizle (kaydetme)
          </Button>
          <Button
            type="submit"
            name="intent"
            value="apply"
            className="w-full sm:w-auto"
            disabled={pending}
          >
            {pending ? "İşleniyor..." : "İçe aktar"}
          </Button>
        </div>
      </form>

      {state.kind === "error" ? (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      ) : null}

      {state.kind === "report" ? <Report state={state} /> : null}
    </div>
  );
}

function Report({
  state,
}: {
  state: Extract<ImportFormState, { kind: "report" }>;
}) {
  const { report, mode } = state;
  const ok = report.issues.length === 0;
  const done =
    mode === "urunler"
      ? "created" in report
        ? report.created
        : 0
      : "updated" in report
        ? report.updated
        : 0;
  const noun = mode === "urunler" ? "ürün" : "varyant";

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={ok ? "success" : "warning"}>
          {report.dryRun ? "Önizleme" : "Tamamlandı"}
        </Badge>
        <p className="text-sm">
          {report.dryRun
            ? ok
              ? "Dosya geçerli; “İçe aktar” ile kaydedebilirsiniz."
              : "Düzeltilmesi gereken satırlar var."
            : `${done} ${noun} işlendi.`}
          {mode === "guncelle" && !report.dryRun && !ok
            ? " Hata olduğu için hiçbir güncelleme uygulanmadı."
            : null}
        </p>
      </div>

      {report.issues.length > 0 ? (
        <>
          {/* Mobil: kart listesi */}
          <ul className="flex flex-col gap-2 md:hidden">
            {report.issues.map((issue, index) => (
              <li
                key={`${issue.row}-${index}`}
                className="rounded-xl border border-amber-200/80 bg-amber-50/40 px-3.5 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  Satır {issue.row}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-slate-800">
                  {issue.message}
                </p>
              </li>
            ))}
          </ul>

          {/* Masaüstü: tablo */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <THead>
                <tr>
                  <TH>Satır</TH>
                  <TH>Sorun</TH>
                </tr>
              </THead>
              <TBody>
                {report.issues.map((issue, index) => (
                  <TR key={`${issue.row}-${index}`}>
                    <TD>{issue.row}</TD>
                    <TD>{issue.message}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </>
      ) : null}
    </section>
  );
}
