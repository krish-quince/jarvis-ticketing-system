export type MasterCategory = {
  category_id: number;
  category_name: string;
  parent_category_id?: number | null;
};

export type SubCategory = {
  subcategory_id: number;
  subcategory_name: string;
};
