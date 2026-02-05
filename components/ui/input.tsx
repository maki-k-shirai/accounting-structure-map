// components/ui/input.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/cn"

/**
 * 会計システム用 Input コンポーネント
 *
 * デザイン方針:
 * - 背景は白固定、グレー枠 (#bfbfbf)
 * - 高さは業務システムの定番 h-7（22〜28px 程度）
 * - disabled / readOnly 時は背景をうっすらグレー (#f2f2f2)
 * - フォーカス時は淡い青の枠線 (#4a6dcf)
 * - 余白は狭めで、文字位置は中央寄り（入力しやすく）
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // === ベーススタイル ===
          "flex h-7 w-full rounded-[3px] border border-[#bfbfbf] bg-white",
          "px-2 text-[13px] text-[#222]",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4a6dcf]",
          "disabled:cursor-not-allowed disabled:bg-[#f2f2f2]",
          "read-only:bg-[#f2f2f2]",
          // === オプション追加 ===
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }
