import { ArrowDown, ArrowUp, ImageOff, Trash2 } from "lucide-react";
import { useManualStore } from "@/store/useManualStore";
import type { ManualStep } from "@/types/manual";

interface StepCardProps {
  chapterId: string;
  step: ManualStep;
  index: number;
  total: number;
  sectionNumber: string;
}

/** 单个操作步骤卡片：就地编辑标题/说明/图注，支持上下移动与删除 */
export function StepCard({
  chapterId,
  step,
  index,
  total,
  sectionNumber,
}: StepCardProps) {
  const { updateStep, moveStep, deleteStep } = useManualStore();

  const fieldClass =
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1 transition-colors hover:border-input focus:border-input focus:outline-none focus:ring-1 focus:ring-ring";
  const iconButtonClass =
    "rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <li className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={step.title}
            onChange={(event) =>
              updateStep(chapterId, step.id, { title: event.target.value })
            }
            placeholder="步骤标题，如：打开新增角色弹窗"
            className={`${fieldClass} font-medium`}
          />
          <textarea
            value={step.instruction}
            onChange={(event) =>
              updateStep(chapterId, step.id, { instruction: event.target.value })
            }
            rows={2}
            placeholder="操作说明：界面按钮用 **【按钮名】** 包裹可高亮，如：点击右上角 **【+ 新增】** 按钮"
            className={`${fieldClass} resize-y text-sm leading-relaxed text-muted-foreground`}
          />

          {step.image ? (
            <figure className="space-y-2">
              <img
                src={step.image.annotatedBase64}
                alt={step.image.caption}
                className="mx-auto max-w-full rounded border"
              />
              <figcaption className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="tabular-nums">
                  图 {sectionNumber}-{index + 1}
                </span>
                <input
                  value={step.image.caption}
                  onChange={(event) =>
                    updateStep(chapterId, step.id, {
                      image: { ...step.image!, caption: event.target.value },
                    })
                  }
                  placeholder="图注，如：新增角色弹窗界面"
                  className={`${fieldClass} max-w-[18rem] text-center text-sm`}
                />
              </figcaption>
              <p className="text-center text-xs text-muted-foreground/70">
                截图标注（红框 / 序号 / 马赛克）将随阶段二标注器上线
              </p>
            </figure>
          ) : (
            <p className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground/70">
              <ImageOff className="h-3.5 w-3.5" />
              纯文字步骤，无截图
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            title="上移"
            disabled={index === 0}
            className={iconButtonClass}
            onClick={() => moveStep(chapterId, step.id, "up")}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="下移"
            disabled={index === total - 1}
            className={iconButtonClass}
            onClick={() => moveStep(chapterId, step.id, "down")}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="删除步骤"
            className={`${iconButtonClass} hover:bg-accent hover:text-destructive`}
            onClick={() => deleteStep(chapterId, step.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
