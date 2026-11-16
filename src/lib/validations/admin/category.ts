import { z } from "zod";

export const categoryNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre tiene que tener al menos 2 letras")
  .max(60, "El nombre es muy largo");

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  parentId: z.string().min(1).nullable(),
});

export const renameCategorySchema = z.object({
  id: z.string().min(1),
  name: categoryNameSchema,
});

export const reorderCategoriesSchema = z.object({
  parentId: z.string().min(1).nullable(),
  orderedIds: z.array(z.string().min(1)).min(1),
});
