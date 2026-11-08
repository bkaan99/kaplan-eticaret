"use client";

export interface CategoryRow {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  productCount: number;
  depth: number;
}

export interface FormState {
  id: string | null;
  name: string;
  slug: string;
  parentId: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
  isActive: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const blank: FormState = {
  id: null,
  name: "",
  slug: "",
  parentId: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
  seoTitle: "",
  seoDescription: "",
};

export function fromRow(row: CategoryRow): FormState {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId ?? "",
    description: row.description ?? "",
    imageUrl: row.imageUrl ?? "",
    sortOrder: String(row.sortOrder),
    isActive: row.isActive,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}
