"use client";

import {
  type IngredientGroup,
  type IngredientView,
} from "@/modules/custom-pickle/custom-pickle.types";

export interface FormState {
  name: string;
  group: IngredientGroup;
  pricePerKg: string;
  stockKg: string;
  minStockKg: string;
  seasonStartMonth: string;
  seasonEndMonth: string;
  sortOrder: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export const EMPTY: FormState = {
  name: "",
  group: "VEGETABLE",
  pricePerKg: "",
  stockKg: "",
  minStockKg: "",
  seasonStartMonth: "",
  seasonEndMonth: "",
  sortOrder: "0",
  description: "",
  imageUrl: "",
  isActive: true,
};

export function toForm(item: IngredientView): FormState {
  return {
    name: item.name,
    group: item.group,
    pricePerKg: item.pricePerKg,
    stockKg: item.stockKg ?? "",
    minStockKg: item.minStockKg ?? "",
    seasonStartMonth: item.seasonStartMonth
      ? String(item.seasonStartMonth)
      : "",
    seasonEndMonth: item.seasonEndMonth ? String(item.seasonEndMonth) : "",
    sortOrder: String(item.sortOrder),
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? "",
    isActive: item.isActive,
  };
}

export function toPayload(form: FormState) {
  return {
    name: form.name,
    group: form.group,
    pricePerKg: form.pricePerKg,
    stockKg: form.stockKg.trim() === "" ? null : form.stockKg.trim(),
    minStockKg: form.minStockKg.trim() === "" ? null : form.minStockKg.trim(),
    seasonStartMonth:
      form.seasonStartMonth !== "" ? Number(form.seasonStartMonth) : null,
    seasonEndMonth:
      form.seasonEndMonth !== "" ? Number(form.seasonEndMonth) : null,
    sortOrder: form.sortOrder || "0",
    description: form.description,
    imageUrl: form.imageUrl,
    isActive: form.isActive,
  };
}
