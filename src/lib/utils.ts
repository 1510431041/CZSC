import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind 类名合并工具（Shadcn UI 标准 cn 函数） */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
