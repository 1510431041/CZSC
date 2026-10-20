import type {
  AnnotationShape,
  GlossaryItem,
  ManualChapter,
  ManualProject,
  ManualStep,
  StepImage,
  UIFieldItem,
} from "@/types/manual";
import { generateId } from "./idGenerator";
import { MOCK_ANNOTATION_COORDS, renderMockScreenshot, type MockVariant } from "./placeholderImage";
import { renumberChapters } from "./chapter";

function createStepImage(variant: MockVariant, caption: string): StepImage {
  const mock = renderMockScreenshot(variant);
  const [rx, ry, rw, rh] = MOCK_ANNOTATION_COORDS[variant].rect;
  const [bx, by] = MOCK_ANNOTATION_COORDS[variant].badge;

  const annotations: AnnotationShape[] = [
    {
      id: generateId(),
      type: "rect",
      x: rx,
      y: ry,
      width: rw,
      height: rh,
      color: "#FF2E2E",
    },
    {
      id: generateId(),
      type: "badge",
      x: bx,
      y: by,
      label: "1",
      color: "#FF2E2E",
    },
  ];

  return {
    id: generateId(),
    rawBase64: mock.rawBase64,
    annotatedBase64: mock.annotatedBase64,
    naturalWidth: mock.naturalWidth,
    naturalHeight: mock.naturalHeight,
    annotations,
    caption,
  };
}

function createStep(input: { title: string; instruction: string; image?: StepImage }): ManualStep {
  return {
    id: generateId(),
    order: 0,
    title: input.title,
    instruction: input.instruction,
    ...(input.image ? { image: input.image } : {}),
  };
}

function createField(input: {
  fieldName: string;
  controlType: UIFieldItem["controlType"];
  required: boolean;
  description: string;
}): UIFieldItem {
  return { id: generateId(), ...input };
}

function createChapter(input: {
  title: string;
  parentId: string | null;
  order: number;
  overview?: string;
  prerequisites?: string;
  userPromptHint?: string;
  steps?: ManualStep[];
  fields?: UIFieldItem[];
  precautions?: string[];
}): ManualChapter {
  return {
    id: generateId(),
    parentId: input.parentId,
    order: input.order,
    sectionNumber: "",
    title: input.title,
    userPromptHint: input.userPromptHint ?? "",
    overview: input.overview ?? "",
    prerequisites: input.prerequisites ?? "",
    steps: input.steps ?? [],
    fields: input.fields ?? [],
    precautions: input.precautions ?? [],
    updatedAt: Date.now(),
  };
}

/** 将章节内步骤序号规范化为 1, 2, 3... */
function renumberChapterSteps(chapters: ManualChapter[]): ManualChapter[] {
  return chapters.map((chapter) => ({
    ...chapter,
    steps: chapter.steps.map((step, index) => ({ ...step, order: index + 1 })),
  }));
}

/**
 * 内置示例项目：开箱即用的演示数据。
 * 包含两级章节树、带标注截图的步骤、字段说明表与术语词典，
 * 确保首次启动时界面即有直观的演示内容。
 */
export function createDemoProject(): ManualProject {
  const now = Date.now();

  const chapterSystemLogin = createChapter({
    title: "系统登录",
    parentId: null,
    order: 1,
    overview:
      "本章介绍智能办公管理系统的两种登录方式（账号密码登录、企业微信扫码登录），以及首次登录后的密码修改流程。",
    prerequisites: "操作人员需已获得系统管理员分配的账号；建议使用 Chrome 或 Edge 浏览器访问系统。",
    userPromptHint: "演示账号密码登录方式，并说明首次登录强制改密的要求",
    steps: [
      createStep({
        title: "打开系统登录页面",
        instruction:
          "在浏览器地址栏输入系统访问地址，进入 **【智能办公管理系统】** 登录页面。",
        image: createStepImage("login", "系统登录页面"),
      }),
      createStep({
        title: "输入账号密码并登录",
        instruction:
          "在登录卡片中依次填写 **【账号】** 与 **【密码】**，点击 **【登 录】** 按钮进入系统工作台；若忘记密码，可联系系统管理员重置。",
      }),
    ],
    fields: [
      createField({
        fieldName: "账号",
        controlType: "输入框",
        required: true,
        description: "企业工号或管理员设定的登录账号，区分大小写。",
      }),
      createField({
        fieldName: "密码",
        controlType: "输入框",
        required: true,
        description: "初始密码通过短信发送，首次登录后强制修改。",
      }),
      createField({
        fieldName: "记住登录状态",
        controlType: "开关",
        required: false,
        description: "开启后 7 天内无需重复登录，公共电脑请勿开启。",
      }),
    ],
    precautions: [
      "连续 5 次输入错误密码将锁定账号 30 分钟，请稍后重试。",
      "首次登录必须修改初始密码，新密码长度不少于 8 位且同时包含字母与数字。",
    ],
  });

  const chapterRoleManage = createChapter({
    title: "角色权限管理",
    parentId: null,
    order: 2,
    overview:
      "角色权限管理用于按岗位职责划分系统功能权限。管理员通过新建角色、勾选菜单权限并关联用户，实现最小化授权，避免越权访问。",
    prerequisites: "需使用具有【系统管理】权限的管理员账号登录系统。",
    userPromptHint: "演示如何新建角色并分配菜单权限",
  });

  const chapterCreateRole = createChapter({
    title: "新增角色",
    parentId: chapterRoleManage.id,
    order: 1,
    overview: "介绍如何创建新角色并完成角色编码、名称、状态等基础信息的配置。",
    prerequisites: "已明确该角色需要访问的菜单范围与关联用户名单。",
    userPromptHint: "演示如何新建角色并填写基础信息",
    steps: [
      createStep({
        title: "进入角色管理列表页",
        instruction:
          "在左侧导航栏点击 **【系统管理】** > **【角色权限】**，进入角色管理列表页。",
      }),
      createStep({
        title: "打开新增角色抽屉",
        instruction:
          "在角色列表右上角点击 **【+ 新增角色】** 按钮，页面右侧弹出新增角色抽屉面板。",
        image: createStepImage("roleList", "角色管理列表页"),
      }),
      createStep({
        title: "填写角色基础信息并提交",
        instruction:
          "在抽屉面板中填写 **【角色编码】** 与 **【角色名称】**，选择 **【状态】**，点击右下角 **【确定】** 按钮完成创建。",
        image: createStepImage("roleForm", "新增角色抽屉界面"),
      }),
    ],
    fields: [
      createField({
        fieldName: "角色编码",
        controlType: "输入框",
        required: true,
        description: "仅支持英文字母与下划线，保存后不可修改。",
      }),
      createField({
        fieldName: "角色名称",
        controlType: "输入框",
        required: true,
        description: "建议按岗位命名，如“财务审核员”。",
      }),
      createField({
        fieldName: "状态",
        controlType: "开关",
        required: true,
        description: "停用后该角色下所有用户将立即失去对应权限。",
      }),
      createField({
        fieldName: "备注",
        controlType: "其他",
        required: false,
        description: "可填写该角色的职责说明，不超过 200 字。",
      }),
    ],
    precautions: [
      "角色编码保存后不可修改，请谨慎填写。",
      "删除角色前需先解除该角色下的所有关联用户。",
    ],
  });

  const chapterAssignPermission = createChapter({
    title: "分配菜单权限",
    parentId: chapterRoleManage.id,
    order: 2,
    overview: "为角色勾选可访问的菜单与操作按钮，实现精细化的功能权限控制。",
    prerequisites: "角色已创建完成；管理员清楚各岗位的菜单访问范围。",
    userPromptHint: "演示如何为角色分配菜单权限",
    steps: [
      createStep({
        title: "打开菜单权限配置",
        instruction: "在角色列表中找到目标角色，点击该行 **【分配权限】** 按钮。",
      }),
      createStep({
        title: "勾选菜单并保存",
        instruction:
          "在弹出的权限树中勾选该角色可访问的菜单节点，点击 **【保存】** 按钮后即时生效。",
      }),
    ],
    precautions: ["权限修改后，对应用户需重新登录方可生效。"],
  });

  const glossary: GlossaryItem[] = [
    {
      id: generateId(),
      standardTerm: "组织架构",
      forbiddenTerms: "部门树、公司结构",
      definition: "系统中对公司与部门的层级化建模，是用户、角色与数据权限的载体。",
    },
    {
      id: generateId(),
      standardTerm: "角色",
      forbiddenTerms: "权限组、身份",
      definition: "一组菜单与操作权限的集合，可通过关联用户实现快速授权。",
    },
    {
      id: generateId(),
      standardTerm: "账号",
      forbiddenTerms: "用户名、登录名",
      definition: "用户登录系统的唯一凭证，由工号或管理员指定。",
    },
  ];

  const project: ManualProject = {
    id: generateId(),
    systemName: "智能办公管理系统",
    version: "V1.0.0",
    author: "信息化管理部",
    glossary,
    chapters: [
      chapterSystemLogin,
      chapterRoleManage,
      chapterCreateRole,
      chapterAssignPermission,
    ],
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...project,
    chapters: renumberChapterSteps(renumberChapters(project.chapters)),
  };
}
