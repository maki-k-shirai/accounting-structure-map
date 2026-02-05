// lib/cn.ts
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Tailwindクラスをマージする小ユーティリティ
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}
