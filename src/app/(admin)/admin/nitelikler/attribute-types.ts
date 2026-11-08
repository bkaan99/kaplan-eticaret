export interface AttributeView {
  id: string;
  name: string;
  isFilterable: boolean;
  values: { id: string; value: string; productCount: number }[];
}

export interface BrandView {
  id: string;
  name: string;
  productCount: number;
}
