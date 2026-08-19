export type CategoryDuplicateInput = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: string;
};

export type CategoryDuplicateGroup = {
  id: string;
  kind: "same-parent" | "cross-parent";
  normalizedName: string;
  displayName: string;
  parentId: number | null;
  parentName: string | null;
  items: CategoryDuplicateInput[];
};

export function normalizeCategoryName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function findDuplicateCategories(categories: CategoryDuplicateInput[]): CategoryDuplicateGroup[] {
  const byParentAndName = new Map<string, CategoryDuplicateInput[]>();
  const byNameOnly = new Map<string, CategoryDuplicateInput[]>();
  const byId = new Map(categories.map((category) => [category.id, category]));

  function isAncestor(ancestorId: number, childId: number) {
    let current = byId.get(childId);
    const seen = new Set<number>();
    while (current?.parentId != null && !seen.has(current.parentId)) {
      if (current.parentId === ancestorId) return true;
      seen.add(current.parentId);
      current = byId.get(current.parentId);
    }
    return false;
  }

  function isConnected(a: CategoryDuplicateInput, b: CategoryDuplicateInput) {
    return a.id === b.id || isAncestor(a.id, b.id) || isAncestor(b.id, a.id);
  }

  for (const category of categories) {
    const normalizedName = normalizeCategoryName(category.name);
    const parentKey = `${category.parentId ?? "root"}::${normalizedName}`;
    const parentList = byParentAndName.get(parentKey) ?? [];
    parentList.push(category);
    byParentAndName.set(parentKey, parentList);

    const nameList = byNameOnly.get(normalizedName) ?? [];
    nameList.push(category);
    byNameOnly.set(normalizedName, nameList);
  }

  const groups: CategoryDuplicateGroup[] = [];
  const seenIds = new Set<string>();

  for (const [key, items] of byParentAndName.entries()) {
    if (items.length < 2) continue;
    const groupId = `parent:${key}`;
    if (seenIds.has(groupId)) continue;
    seenIds.add(groupId);
    const [parentIdPart, normalizedName] = key.split("::");
    groups.push({
      id: groupId,
      kind: "same-parent",
      normalizedName,
      displayName: items[0]?.name ?? normalizedName,
      parentId: parentIdPart === "root" ? null : Number(parentIdPart),
      parentName: items[0]?.parentName ?? null,
      items: [...items].sort((a, b) => a.id - b.id),
    });
  }

  for (const [normalizedName, items] of byNameOnly.entries()) {
    if (items.length < 2) continue;
    const parentIds = new Set(items.map((item) => item.parentId ?? "root"));
    if (parentIds.size <= 1) continue;
    const hasDisconnectedPair = items.some((item, index) =>
      items.slice(index + 1).some((other) => !isConnected(item, other)),
    );
    if (!hasDisconnectedPair) continue;
    const groupId = `cross:${normalizedName}`;
    if (seenIds.has(groupId)) continue;
    seenIds.add(groupId);
    groups.push({
      id: groupId,
      kind: "cross-parent",
      normalizedName,
      displayName: items[0]?.name ?? normalizedName,
      parentId: null,
      parentName: null,
      items: [...items].sort((a, b) => a.id - b.id),
    });
  }

  return groups.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "same-parent" ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, "tr");
  });
}
