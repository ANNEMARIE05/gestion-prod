import { MenuItem } from '../models/menu';

export function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  function walk(nodes: MenuItem[]) {
    for (const n of nodes) {
      out.push(n);
      if (n.children?.length) {
        walk(n.children);
      }
    }
  }
  walk(items);
  return out;
}

export function collectMenuIds(items: MenuItem[]): string[] {
  return flattenMenuItems(items).map((m) => m.id);
}

/** Affiche un nœud si lui-même ou au moins un descendant est autorisé. */
export function filterMenusForProfile(items: MenuItem[], visibleIds: Set<string>): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    const children = item.children?.length
      ? filterMenusForProfile(item.children, visibleIds)
      : undefined;
    const showSelf = visibleIds.has(item.id);
    const hasVisibleChildren = !!children?.length;
    if (showSelf || hasVisibleChildren) {
      result.push({
        ...item,
        children: hasVisibleChildren ? children : item.children,
      });
    }
  }
  return result;
}

export function findMenuById(items: MenuItem[], id: string): MenuItem | null {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children?.length) {
      const found = findMenuById(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/** Correspondance route la plus longue (URL normalisée sans query). */
export function findMenuByRoute(items: MenuItem[], urlPath: string): MenuItem | null {
  let best: MenuItem | null = null;
  let bestLen = -1;
  function walk(nodes: MenuItem[]) {
    for (const n of nodes) {
      if (n.route) {
        const route = n.route.split('?')[0];
        if (urlPath === route || urlPath.startsWith(route + '/')) {
          if (route.length > bestLen) {
            best = n;
            bestLen = route.length;
          }
        }
      }
      if (n.children?.length) {
        walk(n.children);
      }
    }
  }
  walk(items);
  return best;
}

export function removeMenuById(items: MenuItem[], id: string): MenuItem[] {
  return items
    .filter((i) => i.id !== id)
    .map((i) => ({
      ...i,
      children: i.children?.length ? removeMenuById(i.children, id) : undefined,
    }));
}

export function replaceMenuById(items: MenuItem[], updated: MenuItem): MenuItem[] {
  return items.map((i) => {
    if (i.id === updated.id) {
      return { ...updated };
    }
    if (i.children?.length) {
      return { ...i, children: replaceMenuById(i.children, updated) };
    }
    return i;
  });
}

export function insertChildMenu(items: MenuItem[], parentId: string, child: MenuItem): MenuItem[] {
  return items.map((i) => {
    if (i.id === parentId) {
      const children = [...(i.children ?? []), child];
      return { ...i, children };
    }
    if (i.children?.length) {
      return { ...i, children: insertChildMenu(i.children, parentId, child) };
    }
    return i;
  });
}

export function appendRootMenu(items: MenuItem[], item: MenuItem): MenuItem[] {
  return [...items, item];
}

/** Retourne l'id du menu parent direct, ou null si racine. */
export function findParentIdOf(items: MenuItem[], id: string): string | null {
  for (const item of items) {
    if (item.children?.some((c) => c.id === id)) {
      return item.id;
    }
    if (item.children?.length) {
      const sub = findParentIdOf(item.children, id);
      if (sub !== null) {
        return sub;
      }
    }
  }
  return null;
}

/** Ids du menu et de tous ses descendants (évite les cycles parent/enfant). */
export function collectMenuDescendantIds(root: MenuItem | undefined | null): string[] {
  if (!root?.children?.length) {
    return [];
  }
  const out: string[] = [];
  for (const child of root.children) {
    out.push(child.id, ...collectMenuDescendantIds(child));
  }
  return out;
}

export function flattenMenuWithDepth(
  items: MenuItem[],
  depth = 0,
): { item: MenuItem; depth: number }[] {
  const out: { item: MenuItem; depth: number }[] = [];
  for (const item of items) {
    out.push({ item, depth });
    if (item.children?.length) {
      out.push(...flattenMenuWithDepth(item.children, depth + 1));
    }
  }
  return out;
}
