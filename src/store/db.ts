import { createStore, del, get, set } from "idb-keyval";
import type { AIServiceConfig, ManualProject } from "@/types/manual";

/**
 * 独立的 IndexedDB 数据库（库名 auto-manual-ai / 表 keyval），
 * 避免与其他应用共用默认库造成数据干扰。
 * 相比 localStorage 5MB 上限，IndexedDB 可持久化包含高清 Base64 截图的大体积项目数据。
 */
const manualStore = createStore("auto-manual-ai", "keyval");

export const PROJECT_KEY = "manual:project";
export const AI_CONFIG_KEY = "manual:ai-config";

/** 读取本地保存的手册项目，不存在时返回 null */
export async function loadProject(): Promise<ManualProject | null> {
  const project = await get<ManualProject>(PROJECT_KEY, manualStore);
  return project ?? null;
}

/** 保存手册项目 */
export async function saveProject(project: ManualProject): Promise<void> {
  await set(PROJECT_KEY, project, manualStore);
}

/** 读取本地保存的 AI 模型配置，不存在时返回 null */
export async function loadAIConfig(): Promise<AIServiceConfig | null> {
  const config = await get<AIServiceConfig>(AI_CONFIG_KEY, manualStore);
  return config ?? null;
}

/** 保存 AI 模型配置 */
export async function saveAIConfig(config: AIServiceConfig): Promise<void> {
  await set(AI_CONFIG_KEY, config, manualStore);
}

/** 清空本地手册数据（重置用） */
export async function clearManualStorage(): Promise<void> {
  await del(PROJECT_KEY, manualStore);
  await del(AI_CONFIG_KEY, manualStore);
}
