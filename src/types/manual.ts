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
