import { useMemo, useState } from "react";
import { BookOpen, Database, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useManualStore } from "@/store/useManualStore";
import { buildChapterTree, flattenChapterTree } from "@/utils/chapter";
import { ChapterWorkspace } from "@/components/workspace/ChapterWorkspace";
import type { ManualChapter } from "@/types/manual";

export default function App() {
  const { project, aiConfig, isLoading } = useManualStore();
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  const flatChapters = useMemo(
    () => flattenChapterTree(buildChapterTree(project.chapters)),
    [project.chapters],
  );

  const activeChapter = useMemo<ManualChapter | null>(() => {
    const matched = project.chapters.find((chapter) => chapter.id === activeChapterId);
    return matched ?? project.chapters[0] ?? null;
  }, [activeChapterId, project.chapters]);

  const stepCount = useMemo(
    () => project.chapters.reduce((sum, chapter) => sum + chapter.steps.length, 0),
    [project.chapters],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">正在从 IndexedDB 加载本地手册数据…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-brand text-brand-foreground shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              {project.systemName} — 用户操作手册
            </h1>
            <p className="mt-1 text-xs text-brand-foreground/80">
              版本 {project.version} · {project.author} · 最近更新{" "}
              {new Date(project.updatedAt).toLocaleString("zh-CN")}
            </p>
          </div>
          <span className="rounded-full bg-brand-foreground/15 px-3 py-1 text-xs font-medium">
            截图导入可用 · 标注器建设中
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl items-start gap-6 p-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border bg-card shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold text-muted-foreground">
            <BookOpen className="h-4 w-4" />
            章节目录（{project.chapters.length}）
          </div>
          <ul className="p-2">
            {flatChapters.map(({ chapter, depth }) => (
              <li key={chapter.id}>
                <button
                  type="button"
                  onClick={() => setActiveChapterId(chapter.id)}
                  style={{ paddingLeft: 8 + depth * 14 }}
                  className={cn(
                    "mb-0.5 w-full truncate rounded-md py-1.5 pr-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    chapter.id === activeChapter?.id
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground/80",
                  )}
                >
                  <span className="mr-1.5 tabular-nums text-muted-foreground">
                    {chapter.sectionNumber}
                  </span>
                  {chapter.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          {activeChapter ? (
            <ChapterWorkspace chapter={activeChapter} />
          ) : (
            <p className="text-sm text-muted-foreground">暂无章节，请先创建章节。</p>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border bg-card px-4 py-3 text-xs text-muted-foreground shadow-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground/70">
            <Database className="h-3.5 w-3.5" />
            项目数据已自动持久化到 IndexedDB
          </span>
          <span>· 章节 {project.chapters.length} 个</span>
          <span>· 步骤 {stepCount} 条</span>
          <span>· 术语 {project.glossary.length} 条</span>
          <span>
            · AI 模型：{aiConfig.modelName}（{aiConfig.baseUrl}）
          </span>
        </div>
      </footer>
    </div>
  );
}
