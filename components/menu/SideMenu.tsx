// components/menu/SideMenu.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/cn"
import { Search } from "lucide-react"
import type { SideMenuNode } from "./types"
import { rootMenu } from "./rootmenu"

export function SideMenu() {
  const router = useRouter()
  const [stack, setStack] = useState<{ title?: string; nodes: SideMenuNode[] }[]>([
    { title: "トップメニュー", nodes: rootMenu },
  ])
  const [activeTab, setActiveTab] = useState<"all" | "history">("all")
  const [query, setQuery] = useState("")
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [tourActive, setTourActive] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const tourSequence = ["5", "5-3", "5-3-1", "5-3-1-1"]

  const current = stack[stack.length - 1]
  const canGoBack = stack.length > 1

  const handleGoTop = () => setStack([{ title: "トップメニュー", nodes: rootMenu }])
  const handleBack = () => {
    if (canGoBack) setStack((prev) => prev.slice(0, prev.length - 1))
  }

  const handleClickNode = (node: SideMenuNode) => {
    if (tourActive) {
      const expectedId = tourSequence[tourStepIndex]
      if (node.id === expectedId) {
        if (node.children?.length) {
          setStack((prev) => [...prev, { title: node.label, nodes: node.children! }])
        } else if (node.href) {
          router.push(node.href)
        }

        if (tourStepIndex < tourSequence.length - 1) {
          const nextStep = tourStepIndex + 1
          setTourStepIndex(nextStep)
          setHighlightId(tourSequence[nextStep])
        } else {
          window.dispatchEvent(
            new CustomEvent("accounting:menu-tour-enter")
          )
        }
        return
      }
    }

    if (node.children?.length) {
      setStack((prev) => [...prev, { title: node.label, nodes: node.children! }])
    } else if (node.href) {
      router.push(node.href)
    }
  }

  const breadcrumb = useMemo(() => stack.map((s) => s.title).join(" > "), [stack])

  const findPathById = (
    nodes: SideMenuNode[],
    targetId: string,
    path: SideMenuNode[] = [],
  ): SideMenuNode[] | null => {
    for (const node of nodes) {
      const nextPath = [...path, node]
      if (node.id === targetId) return nextPath
      if (node.children?.length) {
        const found = findPathById(node.children, targetId, nextPath)
        if (found) return found
      }
    }
    return null
  }

  const setStackByPath = (path: SideMenuNode[]) => {
    const nextStack: { title?: string; nodes: SideMenuNode[] }[] = [
      { title: "トップメニュー", nodes: rootMenu },
    ]
    path.forEach((node) => {
      if (node.children?.length) {
        nextStack.push({ title: node.label, nodes: node.children })
      }
    })
    setStack(nextStack)
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ step: number }>).detail
      if (!detail) return

      if (detail.step === 0) {
        setTourActive(true)
        setTourStepIndex(0)
        setStack([{ title: "トップメニュー", nodes: rootMenu }])
        setHighlightId("5")
        return
      }

      if (detail.step === 1) {
        const path = findPathById(rootMenu, "5")
        if (path) setStackByPath(path)
        setHighlightId("5-3")
        return
      }

      if (detail.step === 2) {
        const path = findPathById(rootMenu, "5-3")
        if (path) setStackByPath(path)
        setHighlightId("5-3-1")
        return
      }

      if (detail.step === 3) {
        const path = findPathById(rootMenu, "5-3-1")
        if (path) setStackByPath(path)
        setHighlightId("5-3-1-1")
        router.push("/balance-sheet")
      }
    }

    window.addEventListener("accounting:menu-tour", handler as EventListener)
    return () => window.removeEventListener("accounting:menu-tour", handler as EventListener)
  }, [router])

  useEffect(() => {
    const handler = () => {
      setTourActive(false)
      setHighlightId(null)
    }
    window.addEventListener("accounting:menu-tour-clear", handler as EventListener)
    return () =>
      window.removeEventListener("accounting:menu-tour-clear", handler as EventListener)
  }, [])

  return (
    <aside
      className={cn(
        "w-64 min-h-screen bg-[#e8eef7] border-r border-[#c0c0c0] flex flex-col text-[13px] leading-tight"
      )}
    >
      {/* === 検索・タブ行 === */}
      <div className="p-3 bg-white border-b border-[#c0c0c0]">
        {/* 検索行 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 flex items-center bg-white border border-[#c0c0c0] rounded px-2 h-7 text-sm">
            <Search className="w-4 h-4 text-[#666]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ml-2 flex-1 bg-transparent outline-none text-[#333]"
              placeholder="検索"
            />
          </div>
        </div>

        {/* タブ行 */}
        <div className="flex gap-2 border-b border-[#c0c0c0]">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1 text-sm",
              activeTab === "all"
                ? "border-b-2 border-[#4a7ebb] text-[#4a7ebb] font-medium"
                : "text-[#666]"
            )}
          >
            全て
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-3 py-1 text-sm",
              activeTab === "history"
                ? "border-b-2 border-[#4a7ebb] text-[#4a7ebb] font-medium"
                : "text-[#666]"
            )}
          >
            履歴
          </button>
        </div>
      </div>

      {/* === 戻る／トップ行 === */}
      <div className="p-2 border-b border-[#c0c0c0] bg-[#e8eef7]">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoTop}
            className="flex-1 bg-white border border-[#c0c0c0] rounded px-3 py-2 text-left text-sm hover:bg-[#f0f0f0] flex items-center gap-2"
          >
            <span className="w-5 h-5 bg-[#4a7ebb] rounded-sm flex items-center justify-center text-white text-xs font-bold">
              ⌂
            </span>
            <span>トップメニューへ</span>
          </button>
          {canGoBack && (
            <button
              onClick={handleBack}
              className="bg-white border border-[#c0c0c0] rounded px-3 py-2 text-sm hover:bg-[#f0f0f0] flex items-center gap-1"
            >
              <span className="text-[#4a7ebb]">✕</span>
              <span>戻る</span>
            </button>
          )}
        </div>
      </div>

      {/* === メニューカード群 === */}
      {/* flex-1 + overflow-y-auto で、中身だけスクロール */}
      <div className="flex-1 overflow-y-auto p-2 bg-[#e8eef7]">
        {current.nodes.map((node) => (
          <button
            key={node.displayName ?? node.id}
            onClick={() => handleClickNode(node)}
            className={cn(
              "w-full border border-[#c0c0c0] rounded px-3 py-2 mb-2 text-left text-sm hover:bg-[#f0f0f0] flex items-center justify-between",
              "transition-colors duration-100",
              node.href ? "cursor-pointer" : "cursor-default",
              highlightId === node.id
                ? "border-[#2f5d9f] bg-[#f0f6ff] shadow-[0_0_0_2px_rgba(47,93,159,0.35)]"
                : ""
            )}
          >
<div className="flex items-center gap-2 min-w-0">
  <span className="font-medium text-[#4a7ebb] whitespace-nowrap">{node.displayName ?? node.id}</span>
  <span className="text-[#333] truncate whitespace-nowrap overflow-hidden text-ellipsis block">
    {node.label}
  </span>
</div>

            {/* アイコン */}
            {tourActive && highlightId === node.id && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full border border-[#4a7ebb] bg-white px-2 py-[2px] text-[10px] font-semibold text-[#2f5d9f] shadow-[0_0_0_4px_rgba(74,126,187,0.18)] animate-pulse">
                Click
              </span>
            )}

            {node.icon === "folder" && (
              <div className="w-5 h-5 bg-gradient-to-b from-[#f9d976] to-[#e6b800] rounded-sm flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#8b6914"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7h5l2 2h11v8a2 2 0 01-2 2H3V7z"
                  />
                </svg>
              </div>
            )}

            {node.icon === "gear" && (
              <div className="w-5 h-5 bg-gradient-to-b from-[#ff9966] to-[#ff6633] rounded-sm flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#fff"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"
                  />
                </svg>
              </div>
            )}

            {node.icon === "document" && (
              <div className="w-5 h-5 bg-gradient-to-b from-[#b0b0b0] to-[#808080] rounded-sm flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#fff"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </aside>
  )
}
