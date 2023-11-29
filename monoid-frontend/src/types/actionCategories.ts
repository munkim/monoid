type TActionCategory = {
  name: string;
  description: string | null;
};

type TActionCategoryWithId = TActionCategory & { id: number };

export type TActionCategoriesResponse = TActionCategoryWithId[];
