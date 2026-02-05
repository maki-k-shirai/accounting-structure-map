"use client"

import * as React from "react"
import * as RadixDialog from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

/**
 * sr-only:
 * Tailwindデフォルトのユーティリティを想定。
 * もし環境に sr-only が無い場合は、グローバルCSSに以下っぽいのを追加してOK。
 *
 * .sr-only {
 *   position: absolute;
 *   width: 1px;
 *   height: 1px;
 *   padding: 0;
 *   margin: -1px;
 *   overflow: hidden;
 *   clip: rect(0, 0, 0, 0);
 *   white-space: nowrap;
 *   border-width: 0;
 * }
 */

//
// <Dialog />
//
export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  )
}

//
// <DialogTitle />
// - RadixDialog.Title の薄いラッパー
//
export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <RadixDialog.Title
      className={cn(className)}
    >
      {children}
    </RadixDialog.Title>
  )
}

//
// <DialogContent />
// - Overlay + Content をまとめたラッパー
// - titleTextを受け取り、画面上には表示しなくても
//   RadixDialog.Titleをsr-onlyで埋め込んでアクセシビリティ要件を満たす
//
export function DialogContent({
  className,
  children,
  titleText,
}: {
  className?: string
  children: React.ReactNode
  titleText?: string
}) {
  return (
    <RadixDialog.Portal>
      {/* 背景のオーバーレイ */}
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 z-[100] bg-black/40",
          // アニメ系がもし既存で使われているなら残す
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        )}
      />

      {/* ダイアログ本体 */}
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2",
          "max-h-[90vh] overflow-hidden rounded-[4px] bg-white text-[#1a1a1a]",
          "shadow-[0_10px_40px_rgba(0,0,0,0.4)]",
          className
        )}
      >
        {/* アクセシビリティ用のタイトル（視覚的には非表示） */}
        <DialogTitle className="sr-only">
          {titleText ?? "ダイアログ"}
        </DialogTitle>

        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
}

//
// <DialogBody />
// - 中身（スクロールする領域など）用のコンテナ
//
export function DialogBody({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "text-[14px] leading-tight text-[#1a1a1a]",
        className
      )}
    >
      {children}
    </div>
  )
}

//
// <DialogFooter />
// - フッターボタンなど右寄せに並べる領域
//
export function DialogFooter({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 p-2",
        className
      )}
    >
      {children}
    </div>
  )
}
