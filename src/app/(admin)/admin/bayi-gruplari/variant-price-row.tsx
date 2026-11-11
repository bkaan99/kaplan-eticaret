"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatTierText,
  parseTierText,
} from "@/modules/admin/pricing/price-list.schema";
import { setGroupPriceAction, setTiersAction } from "./actions";

export interface VariantRowData {
  variantId: string;
  sku: string;
  productName: string;
  optionLabel: string;
  listPrice: string;
  groupPrice: string | null;
  groupTiers: { minQuantity: number; price: string }[];
  generalTiers: { minQuantity: number; price: string }[];
}

export function VariantPriceRow({
  groupId,
  row,
  layout = "row",
}: {
  groupId: string;
  row: VariantRowData;
  layout?: "row" | "card";
}) {
  const [pending, startTransition] = useTransition();
  const [price, setPrice] = useState(
    row.groupPrice ? String(Number(row.groupPrice)) : "",
  );
  const [tiers, setTiers] = useState(formatTierText(row.groupTiers));
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function save() {
    startTransition(async () => {
      const priceResult = await setGroupPriceAction(
        groupId,
        row.variantId,
        price,
      );
      if (!priceResult.ok) {
        setMessage({
          text: priceResult.error ?? "Fiyat kaydedilemedi",
          error: true,
        });
        return;
      }

      const tierResult = await setTiersAction(
        groupId,
        row.variantId,
        parseTierText(tiers),
      );
      setMessage(
        tierResult.ok
          ? { text: "Kaydedildi", error: false }
          : {
              text: tierResult.error ?? "Kademeler kaydedilemedi",
              error: true,
            },
      );
    });
  }

  const priceInput = (
    <Input
      value={price}
      onChange={(e) => setPrice(e.target.value)}
      inputMode="decimal"
      placeholder="Liste/iskonto"
      aria-label={`${row.sku} grup fiyatı`}
      className={layout === "card" ? "w-full" : "w-32"}
    />
  );

  const tiersInput = (
    <>
      <Input
        value={tiers}
        onChange={(e) => setTiers(e.target.value)}
        placeholder="10:90, 50:75"
        aria-label={`${row.sku} adet kademeleri`}
        className={layout === "card" ? "w-full" : "w-44"}
      />
      {row.generalTiers.length > 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Genel kademe: {formatTierText(row.generalTiers)}
        </p>
      ) : null}
    </>
  );

  const saveControl = (
    <>
      <Button
        size="sm"
        className={layout === "card" ? "w-full" : undefined}
        disabled={pending}
        onClick={save}
      >
        Kaydet
      </Button>
      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={
            message.error
              ? "mt-1 text-xs text-red-600"
              : "mt-1 text-xs text-green-700"
          }
        >
          {message.text}
        </p>
      ) : null}
    </>
  );

  if (layout === "card") {
    return (
      <li className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="mb-3">
          <p className="text-[13px] font-semibold text-slate-900">
            {row.productName}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {row.sku}
            {row.optionLabel ? ` · ${row.optionLabel}` : ""}
            {" · "}Liste {row.listPrice} TL
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
            Grup fiyatı
            {priceInput}
          </label>
          <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
            Adet kademeleri
            {tiersInput}
          </label>
          <div>{saveControl}</div>
        </div>
      </li>
    );
  }

  return (
    <tr className="align-top">
      <td className="px-3 py-3">
        <div className="font-medium">{row.productName}</div>
        <div className="text-xs text-muted-foreground">
          {row.sku}
          {row.optionLabel ? ` · ${row.optionLabel}` : ""}
        </div>
      </td>
      <td className="px-3 py-3">{row.listPrice} TL</td>
      <td className="px-3 py-3">{priceInput}</td>
      <td className="px-3 py-3">{tiersInput}</td>
      <td className="px-3 py-3">{saveControl}</td>
    </tr>
  );
}
