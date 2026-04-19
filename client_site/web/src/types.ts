export type Category = {
  id: number;
  key: string;
  name: string;
  description: string;
  featured: number;
  sort_order: number;
};

export type Tool = {
  id: number;
  name: string;
  slug: string;
  description: string;
  daily_rate: string | number;
  deposit: string | number;
  delivery_only: number;
  image_url: string | null;
  category_key: string;
  category_name: string;
  available_units: number;
  type_name?: string;
};
