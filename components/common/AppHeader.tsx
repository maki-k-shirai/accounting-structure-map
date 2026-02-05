// components/common/AppHeader.tsx
"use client"

import { useState } from "react"
import {
  MenuIcon,
  SettingsIcon,
  CalendarIcon,
  HelpCircleIcon,
  MinusIcon,
  SquareIcon,
  XIcon,
} from "lucide-react"
import { TutorialPanel } from "@/components/tutorial/TutorialPanel"

type AppHeaderProps = {
  breadcrumb: string
  versionText: string
  extraCode?: string
  showActionBar?: boolean
}

export function AppHeader({
  breadcrumb,
  versionText,
  extraCode,
  showActionBar,
}: AppHeaderProps) {
  const [selectedSubSubmenu, setSelectedSubSubmenu] = useState(1)
  const [tutorialOpen, setTutorialOpen] = useState(false)

  return (
    <div className="flex flex-col bg-[#e8eef7] font-sans">
      {/* Window Title Bar */}
      <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#4a7ebb] rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-sm text-[#333]">
            会計システム　一般財団法人　満喜財団
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-6 hover:bg-[#e0e0e0] flex items-center justify-center">
            <MinusIcon className="w-4 h-4 text-[#333]" />
          </button>
          <button className="w-8 h-6 hover:bg-[#e0e0e0] flex items-center justify-center">
            <SquareIcon className="w-3 h-3 text-[#333]" />
          </button>
          <button className="w-8 h-6 hover:bg-red-500 hover:text-white flex items-center justify-center">
            <XIcon className="w-4 h-4 text-[#333]" />
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white border-b border-[#c0c0c0] px-4 py-2 flex items-center justify-end gap-4">
        {/* 既存メニュー群 */}
        <button className="flex items-center gap-2 text-sm text-[#333] hover:bg-[#e8eef7] px-2 py-1">
          <MenuIcon className="w-4 h-4" />
          <span>メニュー(M)</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-[#333] hover:bg-[#e8eef7] px-2 py-1">
          <SettingsIcon className="w-4 h-4" />
          <span>画面設定(K)</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-[#333] hover:bg-[#e8eef7] px-2 py-1">
          <CalendarIcon className="w-4 h-4" />
          <span>年度選択(N)</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-[#333] hover:bg-[#e8eef7] px-2 py-1">
          <HelpCircleIcon className="w-4 h-4" />
          <span>ヘルプ(H)</span>
        </button>
        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          className="flex items-center gap-2 text-sm text-[#1f3b61] border border-[#9fb2cc] bg-white hover:bg-[#eef4ff] px-3 py-1 rounded-[4px]"
        >
          チュートリアル
        </button>

      </div>

      {/* Blue Header Bar */}
      <div className="bg-[#4a7ebb] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-sm">{breadcrumb}</span>
        <span className="text-white text-xs">
          {versionText} {selectedSubSubmenu === 1 && extraCode}
        </span>
      </div>

      <TutorialPanel open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  )
}
