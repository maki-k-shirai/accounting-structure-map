// app/(screens)/layout.tsx
"use client"

import { AppHeader } from "@/components/common/AppHeader"
import { SideMenu } from "@/components/menu/SideMenu"

export default function ScreensLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={
        // 画面全体
        // 背景: 薄いブルーグレー / 文字色: 濃いグレー
        // => global.css の .workspace-root と揃える
        "flex h-screen flex-col text-[12px] leading-none workspace-root"
      }
    >
      {/* 共通ヘッダー（グレー -> 白 -> 青バー (+必要ならアクションバー)） */}
      <AppHeader
        breadcrumb="トップ ＞ 伝票・伝票入力 ＞ 伝票入力"
        versionText="令和7年度 infinity2_Cloud Ver2.6.8.0"
        extraCode="KUH0140"
        showActionBar={true}
      />

      {/* メイン領域：サイドメニュー + ワークスペース */}
      <div className="flex min-h-0 flex-1">
        {/* 左メニュー */}
        <aside
          className={
            // サイドメニューの背景や枠線や文字色は
            // global.cssで .side-menu-root が定義済み
            "side-menu-root flex w-[260px] flex-col min-h-0 flex-shrink-0"
          }
        >
          <SideMenu />
        </aside>

        {/* 右側の業務エリア */}
        <main
          className={
            // スクロールする作業エリア
            // 背景/文字色も workspace-root と同じトーンで合わせる
            "flex-1 min-w-0 overflow-auto p-4 workspace-root"
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}
