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
  if (exact?.removed) return null;
  if (exact) return exact;
  const rows = await prisma.category.findMany({
    where: { slug: { startsWith: `${slug}-` } },
  });
  const re = new RegExp(`^${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-\\d+$`);
  return rows.find((row) => re.test(row.slug) && !row.removed) ?? null;
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
    where: { removed: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      imageLocalPath: true,
      showOnHomepage: true,
    },
  });
}

export async function getCategoryTree(opts?: { homepageOnly?: boolean }) {
  const all = await getAllCategories();
  const childrenOf = (parentId: number) => all.filter((row) => row.parentId === parentId);
  return all
    .filter((row) => !row.parentId)
    .filter((row) => (opts?.homepageOnly ? row.showOnHomepage : true))
    .map((row) => ({ ...row, children: childrenOf(row.id) }));
}

export async function getHomepageCategories() {
  return prisma.category.findMany({
    where: { showOnHomepage: true, removed: false },
    orderBy: [{ homepageOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      imageLocalPath: true,
    },
  });
}

