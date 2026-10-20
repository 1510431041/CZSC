# AI 辅助系统操作手册生成工具 —— 全栈开发规范文档 (PRD & Technical Spec)

> **致 AI 编程助手（Cursor / Windsurf / Claude Code）：**
> 本文档是「AI 辅助系统操作手册生成工具（AutoManual AI）」的完整产品需求与技术实现规范。请严格按照本文档定义的**技术栈、目录结构、TypeScript 数据契约、Prompt 模板与分步实施计划**编写高内聚、低耦合、类型安全的生产级代码。

---

## 1. 项目概述与核心业务流

### 1.1 项目背景与目标
编写软件系统的用户操作手册通常面临大量重复劳动：频繁截图、手工画红框与步骤序号、逐字编写操作说明、整理页面表单字段说明表，以及在 Word 中反复调整图文排版。
本项目旨在构建一款**“多模态截图理解 + 交互式视觉标注 + 结构化步骤编辑 + 一键导出标准 Word（`.docx`）”**的辅助编写软件，将操作手册编写效率提升 70% 以上。

### 1.2 核心用户工作流（Core Workflow）
1. **建立项目与目录树**：用户创建手册项目，维护左侧多级章节目录树（如 `1. 系统登录`、`2. 角色权限管理`），并配置项目专属的「业务术语词典」。
2. **采集截图与视觉标注**：
   - **方式 A（核心 MVP）**：用户在章节内通过剪贴板快捷键（`Ctrl/Cmd + V`）或拖拽批量导入系统界面截图，使用内置 Canvas 标注工具在图上添加**高亮红框、数字序号角标（①②③）、箭头、马赛克脱敏遮罩**。
   - **方式 B（进阶录制）**：通过配套的浏览器录制插件导入包含点击坐标与 DOM 元数据的操作序列，系统自动在对应坐标合成红框与序号。
3. **AI 多模态解析与生成**：用户填写一句简短的意图说明（如“演示如何新建角色并分配菜单权限”），点击「AI 生成当前章节」。系统将**标注后的截图 Base64 + 意图说明 + 业务术语词典**发送给视觉大模型（Vision LLM），模型按严格的 JSON Schema 返回：
   - 章节功能概述与前置条件；
   - 与截图一一对应的分步操作说明；
   - 自动识别提取的「页面字段与控件说明表」；
   - 常见注意事项与 FAQ。
4. **结构化微调与局部润色**：用户在右侧卡片式结构化编辑器中拖拽调整步骤顺序、修改文本、编辑字段表格，或针对单步调用 AI 局部改写（扩写/精简/专业化语气修正）。
5. **标准格式一键导出**：一键将整个手册项目编译导出为符合政企/商业交付标准的 `.docx`（Word 文档，含自动多级标题、标准表格边框、居中图片及自动编号图注 `图 X-Y`）或 `.md`（Markdown 归档包）。

---

## 2. 技术栈规范（Tech Stack Constraints）

为确保 AI 编程工具能够一次性生成可稳定运行、免复杂环境配置的代码，统一采用以下现代 Web 全栈架构（后续可无缝包装为 Electron 桌面端）：

- **核心框架**：React 18+ / TypeScript 5+ / Vite 5+（单页本地优先应用，支持无缝接入 Electron）
- **UI 与样式**：Tailwind CSS + Shadcn UI（Radix UI 基础组件）+ Lucide React（图标库）
- **状态管理与持久化**：
  - 状态管理：`Zustand`
  - 本地大数据存储：`IndexedDB`（使用 `idb-keyval` 或 `Dexie.js`，用于本地持久化包含高清 Base64 截图的项目数据，避免 `localStorage` 5MB 容量上限溢出）
- **截图视觉标注引擎**：原生 HTML5 `Canvas` 封装组件（或 `Konva.js` / `Fabric.js`），支持图层无损编辑（保留原图与标注坐标数组，实时合成带标注的导出图）
- **拖拽排序**：`@dnd-kit/core` + `@dnd-kit/sortable`（用于章节排序与操作步骤卡片拖拽排序）
- **AI 接口调用**：原生 `fetch` 或 `openai` 官方 SDK（支持自定义 `baseURL`、API Key 和模型名称，兼容 OpenAI `gpt-4o`、Anthropic `claude-3-5-sonnet`、阿里百炼 `qwen-vl-max`、DeepSeek 等兼容接口）
- **文档排版导出引擎**：
  - Word 导出：`docx`（npm 官方库，纯前端直接生成标准 `.docx` 二进制流）+ `file-saver`
  - Markdown/ZIP 导出：`jszip`（将 Markdown 文本与 `assets/` 截图文件夹打包为 `.zip` 下载）

---

## 3. 项目目录结构规范

请严格按照以下目录结构组织代码：

```text
auto-manual-ai/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── main.tsx                      # 应用入口
│   ├── App.tsx                       # 主工作台布局（左侧目录树 + 中部编辑器 + 顶部工具栏）
│   ├── types/
│   │   └── manual.ts                 # 核心数据结构与 TypeScript 接口定义（严格遵循第4节）
│   ├── store/
│   │   ├── useManualStore.ts         # Zustand 全局状态管理（项目、章节、步骤增删改查）
│   │   └── db.ts                     # IndexedDB 持久化存储封装（保存项目与高清图片）
│   ├── services/
│   │   ├── aiService.ts              # 多模态 Vision LLM 调用封装与 JSON 解析器
│   │   ├── prompts.ts                # System Prompts 与结构化输出 Prompt 模板
│   │   ├── docxExporter.ts           # 基于 docx 库的政企级 Word 文档生成引擎
│   │   └── markdownExporter.ts       # Markdown + 图片资源 ZIP 打包导出器
│   ├── components/
│   │   ├── layout/
│   │   │   ├── HeaderBar.tsx         # 顶部栏（项目切换、AI设置、术语库弹窗、一键导出Word）
│   │   │   └── ChapterSidebar.tsx    # 左侧多级章节目录树（支持增删改、层级调整）
│   │   ├── workspace/
│   │   │   ├── ChapterWorkspace.tsx  # 当前章节主工作区（截图导入区 + 步骤流 + 字段表）
│   │   │   ├── ImageBatchUploader.tsx# 支持 Ctrl+V 粘贴、拖拽上传截图与录制 JSON 导入
│   │   │   ├── StepCardList.tsx      # 步骤图文卡片列表（支持拖拽排序、单步AI润色）
│   │   │   ├── StepCardItem.tsx      # 单个操作步骤卡片组件
│   │   │   └── FieldTableEditor.tsx  # 页面字段说明表可视化编辑器（增删改行、必填标记）
│   │   ├── canvas/
│   │   │   └── ImageAnnotatorModal.tsx # 截图画框标注弹窗（红框、数字角标①②③、箭头、打码）
│   │   └── modals/
│   │       ├── AISettingsModal.tsx   # 模型 BaseURL、API Key、Model Name 配置弹窗
│   │       └── GlossaryModal.tsx     # 业务术语字典管理弹窗（强制统一 AI 用词）
│   └── utils/
│       ├── imageHelper.ts            # 图片压缩、Base64 转换、Canvas 标注图层合成工具
│       └── idGenerator.ts            # UUID 生成工具
```

---

## 4. 核心数据模型与 TypeScript 接口契约 (`src/types/manual.ts`)

所有组件与服务层必须严格使用以下类型定义，禁止使用 `any`：

```typescript
// src/types/manual.ts

/** 视觉标注图形类型 */
export type AnnotationType = 'rect' | 'badge' | 'arrow' | 'mosaic';

/** 单个视觉标注对象（相对坐标 0~1，确保不同分辨率缩放不偏移） */
export interface AnnotationShape {
  id: string;
  type: AnnotationType;
  /** 归一化坐标与尺寸 (0 ~ 1 相对于原图宽高) */
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** 箭头终点归一化坐标 */
  endX?: number;
  endY?: number;
  /** 角标序号或文字标注（如 "1", "2"） */
  label?: string;
  /** 颜色（默认高对比度红 #FF2E2E） */
  color: string;
}

/** 步骤关联的截图数据 */
export interface StepImage {
  id: string;
  /** 原始无标注底图 Base64 (data:image/png;base64,...) */
  rawBase64: string;
  /** 合成红框与序号标注后的最终展示/导出图 Base64 */
  annotatedBase64: string;
  /** 原始图片像素宽高 */
  naturalWidth: number;
  naturalHeight: number;
  /** 标注图形列表（用于二次打开画板微调位置） */
  annotations: AnnotationShape[];
  /** 图注标题（如“新增角色弹窗界面”，导出时自动拼接为“图 2-1 新增角色弹窗界面”） */
  caption: string;
}

/** 单个操作步骤 */
export interface ManualStep {
  id: string;
  /** 步骤序号 (1, 2, 3...) */
  order: number;
  /** 步骤简短小标题（如“打开新增角色弹窗”） */
  title: string;
  /** 详细操作描述（支持加粗标记，如“点击页面右上角的 **【+ 新增】** 按钮...”） */
  instruction: string;
  /** 关联的系统截图（可为空或包含1张主图） */
  image?: StepImage;
  /** 录制器捕获的可选 DOM 元数据（用于辅助 AI 精准生成） */
  domMeta?: {
    tagName?: string;
    innerText?: string;
    placeholder?: string;
    pageUrl?: string;
  };
}

/** 页面表单/列表字段字典项 */
export interface UIFieldItem {
  id: string;
  /** 字段/控件名称（如“角色编码”） */
  fieldName: string;
  /** 控件类型 */
  controlType: '输入框' | '下拉选择' | '单选/复选框' | '日期选择' | '文件上传' | '开关' | '按钮/操作' | '其他';
  /** 是否必填 */
  required: boolean;
  /** 填写规范与业务说明（如“仅支持英文字母与下划线，保存后不可修改”） */
  description: string;
}

/** 单个手册章节（对应左侧目录树的一个节点） */
export interface ManualChapter {
  id: string;
  /** 父章节 ID（顶层章节为 null） */
  parentId: string | null;
  /** 章节排序权重 */
  order: number;
  /** 章节编号（如 "1.1", "2.1"） */
  sectionNumber: string;
  /** 章节标题（如 "角色权限配置"） */
  title: string;
  /** 用户输入的本章操作意图提示（给 AI 的上下文） */
  userPromptHint: string;
  /** 1. 功能概述 */
  overview: string;
  /** 2. 前置条件与适用角色 */
  prerequisites: string;
  /** 3. 核心操作步骤列表 */
  steps: ManualStep[];
  /** 4. 界面字段与控件说明表 */
  fields: UIFieldItem[];
  /** 5. 注意事项与常见异常 FAQ */
  precautions: string[];
  /** 最后更新时间 */
  updatedAt: number;
}

/** 业务术语词典项（用于约束 AI 统一用词） */
export interface GlossaryItem {
  id: string;
  /** 标准术语名称（如“租户空间”） */
  standardTerm: string;
  /** 禁用同义词/易混淆词（如“客户账号、企业号”） */
  forbiddenTerms: string;
  /** 术语业务解释 */
  definition: string;
}

/** 完整操作手册项目 */
export interface ManualProject {
  id: string;
  /** 系统/产品名称（显示在导出 Word 封面） */
  systemName: string;
  /** 文档版本号（如 "V1.0.0"） */
  version: string;
  /** 编写单位/作者 */
  author: string;
  /** 术语词典列表 */
  glossary: GlossaryItem[];
  /** 章节列表 */
  chapters: ManualChapter[];
  createdAt: number;
  updatedAt: number;
}

/** AI 模型配置 */
export interface AIServiceConfig {
  baseUrl: string;       // 默认 "https://api.openai.com/v1" 或兼容端点
  apiKey: string;
  modelName: string;     // 默认 "gpt-4o" 或 "claude-3-5-sonnet-20241022" / "qwen-vl-max"
  temperature: number;   // 默认 0.2，保证工具书严谨性
}
```

---

## 5. 核心功能模块详细设计规范

### 5.1 模块一：多模态截图导入与 Canvas 标注器 (`ImageAnnotatorModal.tsx`)
1. **剪贴板无缝粘贴**：在 `ChapterWorkspace` 中监听全局或局部的 `paste` 事件。当用户在目标系统用微信/系统截图工具截图后，在软件界面直接按 `Ctrl + V`，自动将剪贴板中的图片读取为 `StepImage` 并追加为一个新的 `ManualStep`。
2. **非破坏性 Canvas 标注**：
   - 点击任意步骤卡片上的截图，弹出 `ImageAnnotatorModal`。
   - 底层绘制 `rawBase64` 原图，上层维护 `annotations: AnnotationShape[]` 数组。
   - **支持 4 种高频手册标注工具**：
     1. **高亮红框 (`rect`)**：边框宽度 `3px`，颜色 `#FF2E2E`，圆角 `4px`，内部半透明填充 `rgba(255, 46, 46, 0.06)`。
     2. **步骤序号角标 (`badge`)**：每次点击自动递增序号（`1, 2, 3...`），绘制半径 `14px` 的实心红底白字圆圈，带白色描边，极为醒目。
     3. **指示箭头 (`arrow`)**：指向关键按钮或菜单项。
     4. **马赛克/模糊遮罩 (`mosaic`)**：用于遮挡截图中包含的真实客户手机号、身份证或金额等敏感数据。
   - 点击「保存标注」时，利用离屏 Canvas 将原图与所有 `annotations` 合并渲染导出为 `annotatedBase64`。这样发送给 Vision LLM 时，**AI 能直接看到你在图上画的红框和序号 ①、②、③**，从而写出极其精准的步骤说明！

### 5.2 模块二：AI 多模态生成引擎与 Prompt 规范 (`prompts.ts` & `aiService.ts`)

调用支持 Vision 的大模型接口时，采用 OpenAI 兼容的 `messages` 多模态格式（包含 `type: "text"` 和多个 `type: "image_url"`）。

#### 系统级提示词 (`SYSTEM_PROMPT`)
```markdown
你是一位拥有 10 年经验的企业级软件技术文档工程师（Technical Writer）。
你的任务是根据用户提供的【系统界面截图序列】（图中可能包含红色高亮框与数字序号角标）以及【操作意图说明】，编写严谨、清晰、规范的《系统用户操作手册》章节内容。

### 写作风格与规范要求：
1. **用语严谨客观**：采用祈使句与标准软件交互术语（如“在左侧导航栏点击【系统管理】>【角色管理】”、“在弹出的抽屉面板中填写以下信息”、“点击右上角【确定】按钮完成提交”）。
2. **符号高亮规范**：所有界面上的菜单名称、按钮文字、页签名称、弹窗标题，必须使用加粗方括号包裹，例如 **【+ 新增角色】**、**【查询】**。
3. **视觉标注对齐**：如果截图中包含红色高亮框或数字角标（①、②、③），请在操作步骤说明中严格按照角标顺序逐一解释对应控件的操作动作。
4. **字段自动提取**：仔细观察截图中的表单输入框、下拉框、单选框或列表表头，自动提取并整理为结构化的「字段说明表」，合理推断其是否必填（例如带有红色星号 `*` 的字段必为 `required: true`）并给出填写规范说明。
5. **严格遵守术语字典**：如果上下文中提供了【业务术语字典】，必须严格使用标准术语，严禁出现禁用同义词。
```

#### 强制 JSON 结构化输出要求 (`USER_PROMPT_TEMPLATE`)
要求 AI 严格返回符合以下结构的 JSON 对象（使用 `response_format: { type: "json_object" }` 或提取 Markdown JSON 代码块）：

```json
{
  "overview": "本章节功能的简要业务概述（50~150字）",
  "prerequisites": "执行该操作所需的角色权限或前置准备条件",
  "steps": [
    {
      "imageIndex": 0,
      "title": "步骤简短标题（如：进入角色管理页面）",
      "instruction": "详细操作指引，界面按钮用 **【按钮名】** 标记，如有序号角标请按 ①、② 顺序说明",
      "caption": "该截图的标准图注名称（不含图号，如：角色管理列表页）"
    }
  ],
  "fields": [
    {
      "fieldName": "字段名称（识别图中带 * 号或关键表单项）",
      "controlType": "输入框 | 下拉选择 | 单选/复选框 | 日期选择 | 文件上传 | 开关 | 按钮/操作 | 其他",
      "required": true,
      "description": "该字段的业务含义、格式校验规则或操作说明"
    }
  ],
  "precautions": [
    "注意事项 1（如：角色编码保存后不可修改，请谨慎填写）",
    "注意事项 2（如：删除角色前需先解除该角色下的所有关联用户）"
  ]
}
```

### 5.3 模块三：政企级标准 Word (`.docx`) 导出引擎 (`docxExporter.ts`)
使用 `docx` 库生成 `.docx` 文件时，必须满足以下商业交付排版标准：
1. **封面页（Cover Page）**：
   - 居中大标题：`{systemName} — 用户操作手册`（一号字、加粗、深海蓝 `#1E3A8A`）
   - 副标题与元信息：版本号 `{version}`、编写单位 `{author}`、生成日期 `YYYY-MM-DD`，结尾插入分页符 `PageBreak`。
2. **多级标题样式（Heading Styles）**：
   - 一级标题（`Heading 1`）：小二号字、加粗、段前段后间距，对应顶层章节（如 `1. 系统登录与工作台`）。
   - 二级标题（`Heading 2`）：三号字、加粗，对应子章节（如 `1.1 账号密码登录`）。
   - 三级小节（`Heading 3`）：四号字、加粗，自动为每个章节生成 `X.Y.1 功能概述`、`X.Y.2 操作步骤详解`、`X.Y.3 页面字段说明`、`X.Y.4 注意事项`。
3. **图文混排与自动图注编号**：
   - 每个 `ManualStep` 先输出带序号的段落文本（解析 `**文本**` 转换为 Word 的 `TextRun({ bold: true })`）。
   - 若步骤包含图片 `annotatedBase64`，将其转换为 `Uint8Array` 插入 `ImageRun`，按页面最大宽度 `520px` 等比缩放并居中对齐。
   - 图片正下方紧跟居中图注段落：`图 {章节号}-{图序号} {step.image.caption}`（五号字、灰色 `#4B5563`），例如 `图 2-1 新增角色弹窗界面`。
4. **标准字段说明表（Word Table）**：
   - 表头固定 4 列：`字段/控件名称`（宽 20%）、`控件类型`（宽 15%）、`是否必填`（宽 12%）、`填写规范与业务说明`（宽 53%）。
   - 表头背景填充浅蓝灰 `#F1F5F9`，文字加粗居中；必填项的“是”使用红色字体高亮。

### 5.4 模块四（二期扩展预留）：浏览器录制器导入协议
为支持从浏览器插件一键导入操作流，`ImageBatchUploader.tsx` 需支持导入 `.json` 录制包，格式契约如下：
```json
{
  "recordingTitle": "新建采购合同流程",
  "capturedSteps": [
    {
      "screenshotBase64": "data:image/png;base64,...",
      "clickRect": { "x": 0.82, "y": 0.14, "width": 0.08, "height": 0.04 },
      "domMeta": {
        "tagName": "BUTTON",
        "innerText": "新增合同",
        "pageUrl": "https://erp.example.com/contract/list"
      }
    }
  ]
}
```
导入该 JSON 时，系统自动将 `clickRect` 转换为 `AnnotationShape`（红框 + 递增序号角标），自动合成 `annotatedBase64` 并生成步骤列表。

---

## 6. 交给 AI 编程工具的分步实施指令（Prompts for AI Coder）

> **使用说明**：当你在 Cursor、Windsurf 或 Claude Code 中打开一个空文件夹时，先将本文档保存为根目录下的 `AI_MANUAL_GENERATOR_SPEC.md`，然后按顺序复制以下 4 条指令发给 AI 助手，即可稳步完成整套系统的构建。

### 第一步：初始化工程与数据层
```text
请仔细阅读项目根目录下的 @AI_MANUAL_GENERATOR_SPEC.md 文档。
现在执行【阶段 1：项目脚手架、类型定义与本地持久化状态库】：
1. 初始化 Vite + React + TypeScript + Tailwind CSS 项目结构，配置所需依赖（zustand, idb-keyval, lucide-react, docx, file-saver, jszip, @dnd-kit/core, @dnd-kit/sortable）。
2. 创建 `src/types/manual.ts`，严格实现文档第 4 节中的所有 TypeScript 接口。
3. 创建 `src/store/db.ts` 和 `src/store/useManualStore.ts`，使用 Zustand + IndexedDB 实现项目、章节、步骤、字段表、术语词典和 AI 配置的增删改查与本地自动持久化，并内置一个开箱即用的示例项目（包含示例章节、步骤与字段），确保启动后界面有直观的演示数据。
```

### 第二步：构建主工作台、粘贴上传与 Canvas 视觉标注器
```text
请继续参考 @AI_MANUAL_GENERATOR_SPEC.md，执行【阶段 2：核心工作台与 Canvas 截图视觉标注器】：
1. 实现 `HeaderBar.tsx` 和 `ChapterSidebar.tsx`，支持多章节树切换、新建/删除章节、修改章节编号与标题。
2. 实现 `ChapterWorkspace.tsx`、`StepCardList.tsx`、`StepCardItem.tsx` 和 `FieldTableEditor.tsx`：
   - 支持在当前章节按 `Ctrl+V` 直接粘贴剪贴板截图，自动创建新的操作步骤卡片。
   - 支持步骤卡片上下移动/拖拽排序、实时编辑步骤标题、说明文字（支持 **【按钮】** 高亮预览）与图注。
   - 支持字段说明表的可视化增删改查。
3. 实现核心组件 `src/components/canvas/ImageAnnotatorModal.tsx` 和 `src/utils/imageHelper.ts`：
   - 点击步骤图片打开弹窗，在 Canvas 上支持绘制：1) 高亮红框、2) 自动递增的数字序号角标（①②③）、3) 指示箭头、4) 马赛克遮罩。
   - 支持撤销最后一步标注、清空标注，点击保存时将原图与标注合成为 `annotatedBase64` 并更新到 Store 中。
```

### 第三步：接入多模态 Vision LLM 生成引擎与配置弹窗
```text
请继续参考 @AI_MANUAL_GENERATOR_SPEC.md 第 5.2 节，执行【阶段 3：AI 多模态生成引擎与术语库约束】：
1. 实现 `AISettingsModal.tsx`（配置 BaseURL、API Key、Model Name，支持一键测试连通性）和 `GlossaryModal.tsx`（管理项目专属的业务术语字典）。
2. 实现 `src/services/prompts.ts` 和 `src/services/aiService.ts`：
   - 构建多模态请求负载，将当前章节所有步骤的 `annotatedBase64` 截图、章节标题、`userPromptHint` 以及项目的 `glossary` 术语表组合发送给兼容 OpenAI Vision 格式的接口。
   - 解析返回的 JSON，自动回填当前章节的「功能概述」、「前置条件」、每个步骤的「标题/操作说明/图注」、「页面字段说明表」以及「注意事项」。
   - 增加「单步 AI 润色」功能：允许用户点击单个步骤卡片上的 AI 按钮，仅针对当前步骤的截图与草稿文字进行重新识别或润色扩写。
```

### 第四步：实现企业级 Word (`.docx`) 与 Markdown ZIP 导出引擎
```text
请继续参考 @AI_MANUAL_GENERATOR_SPEC.md 第 5.3 节，执行【阶段 4：Word (.docx) 与 Markdown 打包导出引擎】：
1. 实现 `src/services/docxExporter.ts`：
   - 使用 `docx` 库将整个 `ManualProject` 编译为标准 `.docx` 文档。
   - 包含：标准封面页、多级章节标题（Heading 1/2/3）、功能概述与前置条件段落、带 **【按钮】** 加粗解析的步骤指令、等比缩放居中的标注截图、自动编号的图注（如 `图 1-1 xxx`）、带表头底色与边框的 4 列字段说明表，以及注意事项列表。
2. 实现 `src/services/markdownExporter.ts`：
   - 使用 `jszip` 将整个手册导出为 Markdown 文件，并将所有 `annotatedBase64` 截图提取到压缩包内的 `assets/` 目录中引用。
3. 在顶部 `HeaderBar.tsx` 绑定「导出标准 Word (.docx)」与「导出 Markdown 压缩包」按钮，并确保完整项目无任何 TypeScript 编译错误。
```