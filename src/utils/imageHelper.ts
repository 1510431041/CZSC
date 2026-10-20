import type { StepImage } from "@/types/manual";
import { generateId } from "./idGenerator";

/** 将 File 读取为 Base64 DataURL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("文件读取结果异常"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

/** 加载图片以获取原始像素宽高 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片加载失败"));
    image.src = src;
  });
}

/** 从文件名生成默认图注/标题（去掉扩展名） */
export function captionFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return base || "系统截图";
}

/**
 * 大图等比压缩：宽超过 maxWidth 时通过离屏 Canvas 降采样。
 * UI 截图以文字为主，保持 PNG 无损格式，避免文字发虚。
 */
export async function compressImage(
  dataUrl: string,
  maxWidth = 1920,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width <= maxWidth) {
    return { dataUrl, width, height };
  }
  const scale = maxWidth / width;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { dataUrl, width, height };
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

/**
 * 从 Base64 截图创建 StepImage（初始无标注，annotatedBase64 = rawBase64）。
 * 标注器上线后，保存标注时会重新合成 annotatedBase64。
 */
export function createStepImage(rawBase64: string, caption: string): StepImage {
  return {
    id: generateId(),
    rawBase64,
    annotatedBase64: rawBase64,
    naturalWidth: 0,
    naturalHeight: 0,
    annotations: [],
    caption,
  };
}

/**
 * 导入用户本地截图文件：读取 → 压缩 → 生成 StepImage。
 * 默认图注取文件名（去扩展名），用户可在步骤卡片中修改。
 */
export async function importScreenshotFile(file: File): Promise<StepImage> {
  const original = await fileToDataUrl(file);
  const compressed = await compressImage(original);
  return {
    id: generateId(),
    rawBase64: compressed.dataUrl,
    annotatedBase64: compressed.dataUrl,
    naturalWidth: compressed.width,
    naturalHeight: compressed.height,
    annotations: [],
    caption: captionFromFileName(file.name),
  };
}
