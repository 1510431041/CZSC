import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  ImagePlus,
  Info,
  Plus,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useManualStore } from "@/store/useManualStore";
import { importScreenshotFile } from "@/utils/imageHelper";
import { StepCard } from "./StepCard";
import type { ManualChapter } from "@/types/manual";

interface ChapterWorkspaceProps {
  chapter: ManualChapter;
}

interface ImportHint {
  text: string;
  at: number;
}

/** 当前章节主工作区：截图导入区 + 步骤流 + 字段说明表 */
export function ChapterWorkspace({ chapter }: ChapterWorkspaceProps) {
  const { addStep } = useManualStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importHint, setImportHint] = useState<ImportHint | null>(null);

  const importFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        setImportHint({ text: "未识别到图片文件", at: Date.now() });
        return;
      }
      let imported = 0;
      for (const file of imageFiles) {
        try {
          const image = await importScreenshotFile(file);
          addStep(chapter.id, {
            title: image.caption,
            instruction: "",
            image,
          });
          imported += 1;
        } catch {
          // 单张导入失败不中断整批导入
        }
      }
      setImportHint({
        text: imported > 0 ? `已导入 ${imported} 张截图` : "截图导入失败",
        at: Date.now(),
      });
    },
    [addStep, chapter.id],
  );

  // 全局粘贴：在软件任意位置 Ctrl+V 粘贴剪贴板截图，即导入当前章节
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) return;
      event.preventDefault();
      void importFiles(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [importFiles]);

  // 导入提示 2.5 秒后自动消失
  useEffect(() => {
    if (!importHint) return;
    const timer = window.setTimeout(() => setImportHint(null), 2500);
    return () => window.clearTimeout(timer);
  }, [importHint]);

  const steps = useMemo(
    () => [...chapter.steps].sort((a, b) => a.order - b.order),
    [chapter.steps],
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">
          <span className="mr-2 tabular-nums text-muted-foreground">
            {chapter.sectionNumber}
          </span>
          {chapter.title}
        </h2>
        <span className="text-xs text-muted-foreground">
          更新于 {new Date(chapter.updatedAt).toLocaleString("zh-CN")}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-brand" />
            1. 功能概述
          </h3>
          {chapter.overview ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {chapter.overview}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60">
              （尚未生成，可接入 AI 能力自动生成）
            </p>
          )}
        </section>
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Info className="h-4 w-4 text-brand" />
            2. 前置条件与适用角色
          </h3>
          {chapter.prerequisites ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {chapter.prerequisites}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground/60">（尚未生成）</p>
          )}
        </section>
      </div>

      <section className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-brand" />
            3. 操作步骤（{steps.length}）
          </h3>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
            onClick={() => addStep(chapter.id, { title: "新步骤" })}
          >
            <Plus className="h-3.5 w-3.5" />
            添加文字步骤
          </button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void importFiles(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragging ? "border-brand bg-accent" : "border-border",
          )}
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            拖拽截图到此处，或按{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Ctrl</kbd>{" "}
            +{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">V</kbd>{" "}
            粘贴剪贴板截图
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            上传截图
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              if (files.length > 0) void importFiles(files);
              event.target.value = "";
            }}
          />
          {importHint ? (
            <p className="text-xs font-medium text-brand">{importHint.text}</p>
          ) : null}
        </div>

        {steps.length > 0 ? (
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <StepCard
                key={step.id}
                chapterId={chapter.id}
                step={step}
                index={index}
                total={steps.length}
                sectionNumber={chapter.sectionNumber}
              />
            ))}
          </ol>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground/60">
            <Type className="h-3.5 w-3.5" />
            本章还没有步骤，导入第一张截图试试
          </p>
        )}
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="h-4 w-4 text-brand" />
          4. 页面字段与控件说明（{chapter.fields.length}）
        </h3>
        {chapter.fields.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "53%" }} />
              </colgroup>
              <thead>
                <tr className="bg-muted">
                  <th className="border px-3 py-2 text-left font-semibold">
                    字段/控件名称
                  </th>
                  <th className="border px-3 py-2 text-left font-semibold">控件类型</th>
                  <th className="border px-3 py-2 text-center font-semibold">是否必填</th>
                  <th className="border px-3 py-2 text-left font-semibold">
                    填写规范与业务说明
                  </th>
                </tr>
              </thead>
              <tbody>
                {chapter.fields.map((field) => (
                  <tr key={field.id}>
                    <td className="border px-3 py-2">{field.fieldName}</td>
                    <td className="border px-3 py-2 text-muted-foreground">
                      {field.controlType}
                    </td>
                    <td
                      className={cn(
                        "border px-3 py-2 text-center",
                        field.required
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {field.required ? "是" : "否"}
                    </td>
                    <td className="border px-3 py-2 text-muted-foreground">
                      {field.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60">（本章节无字段说明数据）</p>
        )}
      </section>

      {chapter.precautions.length > 0 ? (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-brand" />
            5. 注意事项
          </h3>
          <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
            {chapter.precautions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
