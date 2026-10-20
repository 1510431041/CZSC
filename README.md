# AutoManual AI

> **AI 辅助系统操作手册生成工具** —— 多模态截图理解 + 交互式视觉标注 + 结构化步骤编辑 + 一键导出 Word

[![Version](https://img.shields.io/badge/version-0.1.0-blue)](.) [![Build](https://img.shields.io/badge/build-passing-brightgreen)](.) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](.) [![License](https://img.shields.io/badge/license-MIT-lightgrey)](.)

粘贴系统截图，AI 视觉模型看懂界面，自动生成结构化操作手册，一键导出政企级 `.docx`。目标：**将手册编写效率提升 70% 以上**。

---

## 解决什么问题

编写软件系统的用户操作手册是典型的高重复劳动：频繁截图、手工画红框标序号、逐字编写操作说明、整理页面字段说明表、在 Word 里反复调整图文排版。

本项目的工作流：**截图贴进来 → 标注点两句 → AI 写成章 → 一键变 Word**。

| 痛点 | 传统做法 | 本项目 |
|---|---|---|
| 采集截图 | 手动截屏、命名、归档 | Ctrl+V / 拖拽直接导入，自动生成步骤卡片 |
| 视觉标注 | 画图工具手工画红框、序号 | Canvas 标注器（红框 / ①②③ / 箭头 / 马赛克），坐标归一化存储 |
| 写操作说明 | 逐字敲 Word，格式反复调 | 视觉大模型按 JSON Schema 生成，结构化编辑 |
| 字段说明表 | 手搓表格，必填项靠记 | AI 从截图自动识别字段、控件类型、是否必填 |
| 排版导出 | Word 里插图、编号、调样式 | 一键导出：多级标题、居中图、自动图注「图 X-Y」 |
| 术语不一致 | 同样功能叫法五花八门 | 项目级术语词典（标准词 + 禁用词）约束 AI |

**目标用户**：政企 / 商业软件的实施顾问、产品文档工程师、技术支持、交付团队。

---

## 快速开始

```bash
git clone https://github.com/1510431041/CZSC.git
cd CZSC
npm install
npm run dev        # 打开 http://localhost:5173
```

首次打开会自动播种示例项目《智能办公管理系统》（4 章节 / 7 步骤 / 7 字段 / 3 术语），**无需任何配置即可体验**。

```bash
npm run build      # 类型检查 + 生产构建
npm run typecheck  # 仅 TypeScript 严格检查（零 any）
npm run preview    # 预览生产构建产物
```

---

## 功能现状

| 功能 | 状态 |
|---|---|
| 章节树 + 自动编号（1 / 1.1 / 2.1，增删自动重排） | ✅ 已实现 |
| 截图导入：全局 Ctrl+V / 拖拽 / 文件多选（>1920px 自动等比压缩） | ✅ 已实现 |
| 步骤卡片就地编辑（标题 / 操作说明 `**【按钮】**` 加粗标记 / 图注） | ✅ 已实现 |
| 页面字段说明表（必填项高亮） | ✅ 已实现 |
| 数据写穿 IndexedDB，刷新不丢失；内置示例项目 | ✅ 已实现 |
| Canvas 标注器（红框 / 序号角标 / 箭头 / 马赛克） | 🔨 建设中 |
| 视觉大模型一键生成章节（OpenAI 兼容 Vision API） | 🔨 契约就绪，引擎建设中 |
| 一键导出 .docx / Markdown ZIP | 📋 规划中 |

---

## 技术栈

- **框架**：React 18 + TypeScript 5.7（strict，零 `any`）+ Vite 5
- **UI**：Tailwind CSS + Shadcn UI（Radix）+ Lucide React
- **状态**：Zustand 5（写穿式持久化：每次变更立即落盘）
- **存储**：IndexedDB（idb-keyval，独立库 `auto-manual-ai`，规避 localStorage 5MB 上限）
- **标注引擎**：原生 HTML5 Canvas（原图与标注坐标分离，图层无损编辑）
- **拖拽**：@dnd-kit
- **AI**：OpenAI 兼容 Vision API（fetch 直连，可换 gpt-4o / claude-3-5-sonnet / qwen-vl-max / DeepSeek）
- **导出**：docx + file-saver + jszip（纯前端生成标准 .docx 二进制流）

---

## 目录结构

```text
src/
├── types/manual.ts            # 核心数据契约（8 个接口，全项目唯一事实来源）
├── store/
│   ├── useManualStore.ts      # Zustand 状态：项目/章节/步骤/字段/术语/AI 配置全量 CRUD
│   └── db.ts                  # IndexedDB 持久化封装（项目与 AI 配置隔离存储）
├── components/workspace/      # ChapterWorkspace · StepCard
├── utils/
│   ├── imageHelper.ts         # Base64 转换 / 大图压缩 / 截图导入
│   ├── chapter.ts             # 章节自动编号、目录树、子孙收集
│   ├── demoData.ts            # 内置示例项目
│   └── placeholderImage.ts    # Canvas 程序化绘制的模拟截图（带红框 + 序号角标）
└── App.tsx                    # 主工作台布局
```

## 数据契约的三个设计亮点

1. **标注坐标归一化（0~1）**：`AnnotationShape` 所有坐标相对原图宽高存储，分辨率变化 / 窗口缩放，红框绝不偏移。
2. **每张图存两份 Base64**：`StepImage` 同时保存 `rawBase64`（原图）与 `annotatedBase64`（标注合成图）+ `annotations` 坐标数组——**发给 AI 的是合成图，AI 真的能看见红框和序号**；之后打开画板还能基于坐标无损微调。
3. **章节模型即文档结构**：`ManualChapter` 字段排布（overview → prerequisites → steps → fields → precautions）与最终 Word 章节一一对应，「编辑即所见，所见即导出」。

---

## 路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| 一 | 脚手架 + 数据契约 + IndexedDB/Zustand 持久化 | ✅ 完成 |
| 二 | 工作台 + Canvas 标注器 + 拖拽排序 + 章节树管理 | 🔶 进行中（截图导入已上线） |
| 三 | AI 引擎：Vision LLM 调用 + 术语库约束 + JSON 解析 | 🔶 契约就绪 |
| 四 | 导出引擎：政企级 .docx + Markdown ZIP | 📋 规划中 |

二期预留：浏览器录制插件 JSON 导入协议（clickRect 自动转红框 + 序号）。

---

## 相关文档

- [`PROJECT_ANALYSIS.md`](PROJECT_ANALYSIS.md) —— 项目分析（架构、亮点、演示话术、常见提问预答）
- [`analysis.html`](analysis.html) —— 可视化项目分析页（浏览器直接打开）
- [`AI_MANUAL_GENERATOR_SPEC.md`](AI_MANUAL_GENERATOR_SPEC.md) —— 完整产品需求与技术规范

## 已知边界

- 纯本地存储（浏览器 IndexedDB），换浏览器 / 清站点数据会丢，本地优先的设计取舍
- AI Key 用户自理，工具不托管任何密钥；支持任意 OpenAI 兼容端点
- 当前为单项目结构，多项目切换后续增强
