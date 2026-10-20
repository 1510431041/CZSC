import { create } from "zustand";
import type {
  AIServiceConfig,
  GlossaryItem,
  ManualChapter,
  ManualProject,
  ManualStep,
  UIFieldItem,
} from "@/types/manual";
import { createDemoProject } from "@/utils/demoData";
import { generateId } from "@/utils/idGenerator";
import { collectDescendantIds, renumberChapters } from "@/utils/chapter";
import {
  loadAIConfig,
  loadProject,
  saveAIConfig,
  saveProject,
} from "./db";

/** 默认 AI 模型配置（兼容 OpenAI Vision 接口） */
export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  modelName: "gpt-4o",
  temperature: 0.2,
};

export interface NewChapterInput {
  title: string;
  parentId: string | null;
}

export interface ManualState {
  project: ManualProject;
  aiConfig: AIServiceConfig;
  isLoading: boolean;

  /** 启动时从 IndexedDB 加载数据；无本地数据时播种示例项目 */
  initialize: () => Promise<void>;
  /** 清空当前项目并恢复为内置示例数据 */
  resetDemoData: () => Promise<void>;

  // —— 项目元信息 ——
  updateProjectMeta: (
    meta: Partial<Pick<ManualProject, "systemName" | "version" | "author">>,
  ) => void;

  // —— 章节 CRUD ——
  addChapter: (input: NewChapterInput) => string;
  updateChapter: (
    chapterId: string,
    patch: Partial<
      Pick<ManualChapter, "title" | "overview" | "prerequisites" | "userPromptHint">
    >,
  ) => void;
  deleteChapter: (chapterId: string) => void;
  moveChapter: (chapterId: string, direction: "up" | "down") => void;

  // —— 步骤 CRUD ——
  addStep: (
    chapterId: string,
    step?: Partial<Pick<ManualStep, "title" | "instruction" | "image">>,
  ) => string;
  updateStep: (
    chapterId: string,
    stepId: string,
    patch: Partial<Omit<ManualStep, "id" | "order">>,
  ) => void;
  deleteStep: (chapterId: string, stepId: string) => void;
  moveStep: (chapterId: string, stepId: string, direction: "up" | "down") => void;
  reorderSteps: (chapterId: string, orderedStepIds: string[]) => void;

  // —— 字段说明表 CRUD ——
  addField: (
    chapterId: string,
    field?: Partial<Omit<UIFieldItem, "id">>,
  ) => string;
  updateField: (
    chapterId: string,
    fieldId: string,
    patch: Partial<Omit<UIFieldItem, "id">>,
  ) => void;
  deleteField: (chapterId: string, fieldId: string) => void;
  moveField: (chapterId: string, fieldId: string, direction: "up" | "down") => void;

  // —— 术语词典 CRUD ——
  addGlossaryItem: (item?: Partial<Omit<GlossaryItem, "id">>) => string;
  updateGlossaryItem: (
    id: string,
    patch: Partial<Omit<GlossaryItem, "id">>,
  ) => void;
  deleteGlossaryItem: (id: string) => void;

  // —— AI 配置 ——
  updateAIConfig: (patch: Partial<AIServiceConfig>) => void;
}

function touch(project: ManualProject): ManualProject {
  return { ...project, updatedAt: Date.now() };
}

/** 仅将指定章节替换为新版本，其余章节保持原引用 */
function replaceChapter(
  chapters: ManualChapter[],
  chapterId: string,
  next: ManualChapter,
): ManualChapter[] {
  return chapters.map((chapter) => (chapter.id === chapterId ? next : chapter));
}

/** 保持 order 连续性（从 1 开始递增） */
function renumberSteps(steps: ManualStep[]): ManualStep[] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index + 1 }));
}

export const useManualStore = create<ManualState>()((set, get) => ({
  project: createDemoProject(),
  aiConfig: DEFAULT_AI_CONFIG,
  isLoading: true,

  initialize: async () => {
    const [project, aiConfig] = await Promise.all([loadProject(), loadAIConfig()]);
    const nextProject = project ?? createDemoProject();
    set({
      project: nextProject,
      aiConfig: aiConfig ?? DEFAULT_AI_CONFIG,
      isLoading: false,
    });
    if (!project) {
      void saveProject(nextProject);
    }
  },

  resetDemoData: async () => {
    const project = createDemoProject();
    set({ project });
    await saveProject(project);
  },

  updateProjectMeta: (meta) => {
    const project = touch({ ...get().project, ...meta });
    set({ project });
    void saveProject(project);
  },

  addChapter: ({ title, parentId }) => {
    const id = generateId();
    const { project } = get();
    const siblings = project.chapters.filter(
      (chapter) => chapter.parentId === parentId,
    );
    const nextOrder = siblings.reduce((max, chapter) => Math.max(max, chapter.order), 0) + 1;
    const chapter: ManualChapter = {
      id,
      parentId,
      order: nextOrder,
      sectionNumber: "",
      title,
      userPromptHint: "",
      overview: "",
      prerequisites: "",
      steps: [],
      fields: [],
      precautions: [],
      updatedAt: Date.now(),
    };
    const nextProject = touch({
      ...project,
      chapters: renumberChapters([...project.chapters, chapter]),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
    return id;
  },

  updateChapter: (chapterId, patch) => {
    const { project } = get();
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...project.chapters.find((chapter) => chapter.id === chapterId)!,
        ...patch,
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  deleteChapter: (chapterId) => {
    const { project } = get();
    const removeIds = collectDescendantIds(project.chapters, chapterId);
    const nextProject = touch({
      ...project,
      chapters: renumberChapters(
        project.chapters.filter((chapter) => !removeIds.includes(chapter.id)),
      ),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  moveChapter: (chapterId, direction) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const siblings = project.chapters
      .filter((chapter) => chapter.parentId === current.parentId)
      .sort((a, b) => a.order - b.order);
    const pos = siblings.findIndex((chapter) => chapter.id === chapterId);
    const target = direction === "up" ? pos - 1 : pos + 1;
    if (target < 0 || target >= siblings.length) return;
    const swapChapter = siblings[target];
    const nextProject = touch({
      ...project,
      chapters: renumberChapters(
        project.chapters.map((chapter) => {
          if (chapter.id === current.id) return { ...chapter, order: swapChapter.order };
          if (chapter.id === swapChapter.id) return { ...chapter, order: current.order };
          return chapter;
        }),
      ),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  addStep: (chapterId, step) => {
    const id = generateId();
    const { project } = get();
    const newStep: ManualStep = {
      id,
      order: 1,
      title: step?.title ?? "新步骤",
      instruction: step?.instruction ?? "",
      ...(step?.image ? { image: step.image } : {}),
    };
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return id;
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        steps: renumberSteps([...current.steps, newStep]),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
    return id;
  },

  updateStep: (chapterId, stepId, patch) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        steps: current.steps.map((step) =>
          step.id === stepId ? { ...step, ...patch } : step,
        ),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  deleteStep: (chapterId, stepId) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        steps: renumberSteps(current.steps.filter((step) => step.id !== stepId)),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  moveStep: (chapterId, stepId, direction) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const steps = renumberSteps(current.steps);
    const pos = steps.findIndex((step) => step.id === stepId);
    const target = direction === "up" ? pos - 1 : pos + 1;
    if (pos === -1 || target < 0 || target >= steps.length) return;
    const swapStep = steps[target];
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        steps: renumberSteps(
          steps.map((step) => {
            if (step.id === stepId) return { ...step, order: target + 1 };
            if (step.id === swapStep.id) return { ...step, order: pos + 1 };
            return step;
          }),
        ),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  reorderSteps: (chapterId, orderedStepIds) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const byId = new Map(current.steps.map((step) => [step.id, step]));
    const ordered: ManualStep[] = [];
    orderedStepIds.forEach((stepId, index) => {
      const step = byId.get(stepId);
      if (step) ordered.push({ ...step, order: index + 1 });
    });
    // 防御：补齐未出现在 orderedStepIds 中的步骤
    current.steps.forEach((step) => {
      if (!orderedStepIds.includes(step.id)) ordered.push(step);
    });
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        steps: renumberSteps(ordered),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  addField: (chapterId, field) => {
    const id = generateId();
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return id;
    const newField: UIFieldItem = {
      id,
      fieldName: field?.fieldName ?? "新字段",
      controlType: field?.controlType ?? "输入框",
      required: field?.required ?? false,
      description: field?.description ?? "",
    };
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        fields: [...current.fields, newField],
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
    return id;
  },

  updateField: (chapterId, fieldId, patch) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        fields: current.fields.map((field) =>
          field.id === fieldId ? { ...field, ...patch } : field,
        ),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  deleteField: (chapterId, fieldId) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        fields: current.fields.filter((field) => field.id !== fieldId),
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  moveField: (chapterId, fieldId, direction) => {
    const { project } = get();
    const current = project.chapters.find((chapter) => chapter.id === chapterId);
    if (!current) return;
    const fields = [...current.fields];
    const pos = fields.findIndex((field) => field.id === fieldId);
    const target = direction === "up" ? pos - 1 : pos + 1;
    if (pos === -1 || target < 0 || target >= fields.length) return;
    const [moved] = fields.splice(pos, 1);
    fields.splice(target, 0, moved);
    const nextProject = touch({
      ...project,
      chapters: replaceChapter(project.chapters, chapterId, {
        ...current,
        fields,
        updatedAt: Date.now(),
      }),
    });
    set({ project: nextProject });
    void saveProject(nextProject);
  },

  addGlossaryItem: (item) => {
    const id = generateId();
    const newItem: GlossaryItem = {
      id,
      standardTerm: item?.standardTerm ?? "新术语",
      forbiddenTerms: item?.forbiddenTerms ?? "",
      definition: item?.definition ?? "",
    };
    const project = touch({
      ...get().project,
      glossary: [...get().project.glossary, newItem],
    });
    set({ project });
    void saveProject(project);
    return id;
  },

  updateGlossaryItem: (id, patch) => {
    const project = touch({
      ...get().project,
      glossary: get().project.glossary.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
    set({ project });
    void saveProject(project);
  },

  deleteGlossaryItem: (id) => {
    const project = touch({
      ...get().project,
      glossary: get().project.glossary.filter((item) => item.id !== id),
    });
    set({ project });
    void saveProject(project);
  },

  updateAIConfig: (patch) => {
    const aiConfig = { ...get().aiConfig, ...patch };
    set({ aiConfig });
    void saveAIConfig(aiConfig);
  },
}));
