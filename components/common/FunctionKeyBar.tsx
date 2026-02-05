// components/common/FunctionKeyBar.tsx
"use client"

import React from "react"

type KeyButton = {
  keyName: string
  label: string
  kind?: "enter" | "active" | "inactive"
  action?: "enter" | "back" | "exit" // クリック時に呼びたい動き
}

export function FunctionKeyBar({
  onEnter,
  onBack,
  onExit,
  showEnterClickBadge = false,
}: {
  onEnter?: () => void
  onBack?: () => void
  onExit?: () => void
  showEnterClickBadge?: boolean
}) {
  const keys: KeyButton[] = [
    { keyName: "↵ Enter", label: "Enter", kind: "enter", action: "enter" },
    { keyName: "F1", label: "ー ー", kind: "inactive" },
    { keyName: "F2", label: "ー ー", kind: "inactive" },
    { keyName: "F3", label: "ー ー", kind: "inactive" },
    { keyName: "F4", label: "終了", kind: "active", action: "exit" },
    { keyName: "F5", label: "ー ー", kind: "inactive" },
    { keyName: "F6", label: "戻る", kind: "active", action: "back" },
    { keyName: "F7", label: "ー ー", kind: "inactive" },
    { keyName: "F8", label: "ー ー", kind: "inactive" },
    { keyName: "F9", label: "ー ー", kind: "inactive" },
    { keyName: "F10", label: "ー ー", kind: "inactive" },
    { keyName: "F11", label: "ー ー", kind: "inactive" },
    { keyName: "F12", label: "ー ー", kind: "inactive" },
  ]

  function handleClick(k: KeyButton) {
    switch (k.action) {
      case "enter":
        onEnter?.()
        break
      case "back":
        onBack?.()
        break
      case "exit":
        onExit?.()
        break
      default:
        break
    }
  }

  return (
    <div
      className="flex w-full items-stretch gap-[4px] border-b border-[#c0c0c0] bg-[#eaf2ff] px-2 py-[4px]"
      style={{ boxShadow: "inset 0 1px 0 #fff" }}
    >
      {keys.map((k, idx) => {
        const isEnter = k.kind === "enter"
        const isInactive = k.kind === "inactive"

        const clickable = !isInactive && k.action
        const baseClasses =
          "flex flex-1 items-center justify-center rounded-[4px] border font-medium h-[38px] px-3 text-[13px] select-none"

        const colorClass = isInactive
          ? "bg-[#f2f4f8] border-[#d0d5db] text-[#999] cursor-default"
          : "bg-white border-[#9faecc] text-[#1a1a1a] shadow-[0_1px_1px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)_inset]"

        const hoverClass = clickable
          ? "cursor-pointer hover:bg-[#eef4ff]"
          : "cursor-default"

        const btn = (
          <button
            type="button"
            id={isEnter ? "function-key-enter-button" : undefined}
            className={[baseClasses, colorClass, hoverClass].join(" ")}
            disabled={!clickable}
            onClick={() => {
              if (clickable) handleClick(k)
            }}
          >
            {isEnter ? (
              <div className="relative flex items-center gap-[4px]">
                <span className="text-[13px] text-[#002b7f]">↵</span>
                <span className="text-[14px] text-[#1a1a1a]">Enter</span>
                {showEnterClickBadge && (
                  <span className="absolute -right-10 -top-3 inline-flex items-center justify-center rounded-full border border-[#4a7ebb] bg-white px-2 py-[2px] text-[10px] font-semibold text-[#2f5d9f] shadow-[0_0_0_4px_rgba(74,126,187,0.18)] animate-pulse">
                    Click
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-[6px] text-[13px] leading-tight">
                <span
                  className={
                    isInactive ? "text-[#999]" : "text-[#1a1a1a]"
                  }
                >
                  {k.keyName}
                </span>
                <span
                  className={
                    isInactive ? "text-[#aaa]" : "text-[#1a1a1a]"
                  }
                >
                  {k.label}
                </span>
              </div>
            )}
          </button>
        )

        return (
          <React.Fragment key={idx}>
            {btn}
          </React.Fragment>
        )
      })}
    </div>
  )
}
