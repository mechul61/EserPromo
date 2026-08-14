import { prisma } from "./db";

export {
  getVariantSiblings,
  listProductGroups,
  resolveProduct,
  upsertCategory,
  upsertProductTree,
} from "./etkin/catalog";

export async function resolveCategory(slug: string) {
  const exact = await prisma.category.findUnique({ where: { slug } });
  if (exact) return exact;
  const rows = await prisma.category.findMany({
    where: { slug: { startsWith: `${slug}-` } },
  });
  const re = new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`);
  return rows.find((row) => re.test(row.slug)) ?? null;
}

export async function categoryIdsWithChildren(id: number) {
  const kids = await prisma.category.findMany({
    where: { parentId: id },
    select: { id: true },
  });
  return [id, ...kids.map((kid) => kid.id)];
}

export async function getAllCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      imageLocalPath: true,
    },
  });
}

export async function getCategoryTree() {
  const all = await getAllCategories();
  const childrenOf = (parentId: number) => all.filter((row) => row.parentId === parentId);
  return all
    .filter((row) => !row.parentId)
    .map((row) => ({ ...row, children: childrenOf(row.id) }));
}

export async function getHomepageCategories() {
  return prisma.category.findMany({
    where: { showOnHomepage: true },
    orderBy: [{ homepageOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      imageLocalPath: true,
    },
  });
}

