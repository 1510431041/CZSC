import type { ManualChapter } from "@/types/manual";

/** 章节树节点 */
export interface ChapterTreeNode {
  chapter: ManualChapter;
  children: ChapterTreeNode[];
  depth: number;
}

/** 扁平化后的章节节点（便于列表渲染） */
export interface FlatChapterNode {
  chapter: ManualChapter;
  depth: number;
}

/**
 * 自动重新计算章节编号与同级排序。
 * 顶层章节编号为 1, 2, 3...；子章节编号为 1.1, 1.2, 2.1...
 * 同时把每个章节在其父级下的 order 规范化为 1, 2, 3...
 */
export function renumberChapters(chapters: ManualChapter[]): ManualChapter[] {
  const childrenMap = new Map<string | null, ManualChapter[]>();
  for (const chapter of chapters) {
    const key = chapter.parentId;
    const list = childrenMap.get(key);
    if (list) {
      list.push(chapter);
    } else {
      childrenMap.set(key, [chapter]);
    }
  }

  const patchMap = new Map<string, { sectionNumber: string; order: number }>();
  const walk = (parentId: string | null, prefix: string): void => {
    const children = childrenMap.get(parentId) ?? [];
    const sorted = [...children].sort((a, b) => a.order - b.order);
    sorted.forEach((child, index) => {
      const order = index + 1;
      const sectionNumber = prefix ? `${prefix}.${order}` : `${order}`;
      patchMap.set(child.id, { sectionNumber, order });
      walk(child.id, sectionNumber);
    });
  };
  walk(null, "");

  return chapters.map((chapter) => {
    const patch = patchMap.get(chapter.id);
    return patch ? { ...chapter, ...patch } : chapter;
  });
}

/** 收集指定章节及其全部子孙章节的 ID 集合 */
export function collectDescendantIds(chapters: ManualChapter[], chapterId: string): string[] {
  const ids = new Set<string>([chapterId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const chapter of chapters) {
      if (chapter.parentId !== null && ids.has(chapter.parentId) && !ids.has(chapter.id)) {
        ids.add(chapter.id);
        changed = true;
      }
    }
  }
  return Array.from(ids);
}

/** 由扁平章节列表构建多级章节树（按 order 升序） */
export function buildChapterTree(chapters: ManualChapter[]): ChapterTreeNode[] {
  const childrenMap = new Map<string | null, ManualChapter[]>();
  for (const chapter of chapters) {
    const key = chapter.parentId;
    const list = childrenMap.get(key);
    if (list) {
      list.push(chapter);
    } else {
      childrenMap.set(key, [chapter]);
    }
  }

  const build = (parentId: string | null, depth: number): ChapterTreeNode[] =>
    [...(childrenMap.get(parentId) ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((chapter) => ({ chapter, children: build(chapter.id, depth + 1), depth }));

  return build(null, 0);
}

/** 将章节树拍平为带层级深度的数组（深度优先） */
export function flattenChapterTree(tree: ChapterTreeNode[]): FlatChapterNode[] {
  const flat: FlatChapterNode[] = [];
  const walk = (nodes: ChapterTreeNode[]): void => {
    for (const node of nodes) {
      flat.push({ chapter: node.chapter, depth: node.depth });
      walk(node.children);
    }
  };
  walk(tree);
  return flat;
}
