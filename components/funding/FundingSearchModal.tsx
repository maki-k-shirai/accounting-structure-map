// components/funding/FundingSearchModal.tsx
"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { FundingMaintenanceModal } from "@/components/funding/FundingMaintenanceModal" // ★追加

type FundingNode = {
  code: string         // 各階層4桁コード（例: "1001"）
  name: string         // 名称
  children?: FundingNode[]
}

export type FundingPickPayload = {
  code1?: string
  code2?: string
  code3?: string
  code4?: string
  /** "1001 文部科学省補助金 / 0001 地域文化振興補助金 / 0001 2025年度分" のようなフルパス */
  namePath: string
}

export type FundingSearchModalProps = {
  open: boolean
  onClose: () => void
  onPick: (payload: FundingPickPayload) => void
  /** 実データを渡したい場合に差し替え可能。未指定ならMOCKを使用 */
  data?: FundingNode[]
  /** 会計情報（保守モーダルに渡す用） */
  accountingCode?: string
  accountingDisplayCode?: string
  accountingName?: string
}

/** ====== モックデータ（現実っぽい財源名）====== */
const MOCK_DATA: FundingNode[] = [
  {
    code: "0001",
    name: "〇〇県補助金",
  },
  {
    code: "0002",
    name: "助成金(研究)",
    children: [
      { code: "0001", name: "地域福祉推進助成金" },
      { code: "0002", name: "障害者支援体制強化助成金" },
    ],
  },
  {
    code: "0003",
    name: "指定寄附金(奨学金)",
    children: [
      { code: "0001", 
        name: "〇〇奨学金",
        children: [
          {code: "0001", name: "2024年度分"},
          {code: "0002", name: "2025年度分"},
        ], 
      },
      { code: "0002", 
        name: "△△奨学金",
        children: [
          {code: "0001", name: "2024年度分"},
          {code: "0002", name: "2025年度分"}
        ]
       },
    ],
  },
]

export function FundingSearchModal({
  open,
  onClose,
  onPick,
  data = MOCK_DATA,
  accountingCode = "",
  accountingDisplayCode = "",
  accountingName = "",
}: FundingSearchModalProps) {
  // --- 検索フォーム（コード4分割 & 名称）
  const [code1, setCode1] = React.useState("")
  const [code2, setCode2] = React.useState("")
  const [code3, setCode3] = React.useState("")
  const [code4, setCode4] = React.useState("")
  const [nameLike, setNameLike] = React.useState("")

  // --- 展開／選択
  const [expandAll, setExpandAll] = React.useState(true)
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set<string>(["/"]),
  )
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null)

  // ★ F7 保守モーダルの開閉
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setCode1("")
      setCode2("")
      setCode3("")
      setCode4("")
      setNameLike("")
      setExpandAll(true)
      setExpanded(new Set<string>(["/"]))
      setSelectedPath(null)
      setMaintenanceOpen(false) // 保守モーダルも閉じる
    }
  }, [open])

  // Pathキー（例: "/1001|文部科学省補助金/0001|地域文化振興補助金"）
  const makePath = (parent: string, node: FundingNode) =>
    `${parent}${parent.endsWith("/") ? "" : "/"}${node.code}|${node.name}`

  // フィルタリング
  const filteredData = React.useMemo(() => {
    const matchCodes = [code1, code2, code3, code4].map((c) => c.trim())
    const hasCodeFilter = matchCodes.some((c) => c)
    const nameFilter = nameLike.trim()

    const dfs = (nodes: FundingNode[], depth = 0): FundingNode[] => {
      return nodes
        .map((n) => {
          const children = n.children ? dfs(n.children, depth + 1) : undefined
          const codeOk =
            !hasCodeFilter ||
            (depth === 0 && (!matchCodes[0] || n.code === matchCodes[0])) ||
            (depth === 1 && (!matchCodes[1] || n.code === matchCodes[1])) ||
            (depth === 2 && (!matchCodes[2] || n.code === matchCodes[2])) ||
            (depth >= 3 && (!matchCodes[3] || n.code === matchCodes[3]))

          const nameOk = !nameFilter || n.name.includes(nameFilter)
          const selfMatch = codeOk && nameOk
          const childMatch = !!children && children.length > 0

          if (selfMatch || childMatch) {
            return {
              ...n,
              children:
                children && children.length > 0
                  ? children
                  : n.children && selfMatch
                  ? []
                  : children,
            }
          }
          return null
        })
        .filter(Boolean) as FundingNode[]
    }

    return dfs(data)
  }, [data, code1, code2, code3, code4, nameLike])

  // 全展開切替
  React.useEffect(() => {
    if (!open) return
    if (expandAll) {
      const all = new Set<string>(["/"])
      const walk = (nodes: FundingNode[], parent = "/") => {
        nodes.forEach((n) => {
          const p = makePath(parent, n)
          all.add(p)
          if (n.children?.length) walk(n.children, p)
        })
      }
      walk(filteredData)
      setExpanded(all)
    } else {
      setExpanded(new Set<string>(["/"]))
    }
  }, [expandAll, filteredData, open])

  const toggleExpand = (path: string) => {
    const next = new Set(expanded)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    setExpanded(next)
  }

  const handleEnter = () => {
    if (!selectedPath) return
    const parts = selectedPath
      .split("/")
      .filter(Boolean)
      .map((seg) => seg.split("|")[0])
    const names = selectedPath
      .split("/")
      .filter(Boolean)
      .map((seg) => seg.split("|")[1])
    onPick({
      code1: parts[0],
      code2: parts[1],
      code3: parts[2],
      code4: parts[3],
      namePath: names.join(" / "),
    })
    onClose()
  }

  const Tree: React.FC<{
    nodes: FundingNode[]
    parent?: string
    depth?: number
  }> = ({ nodes, parent = "/", depth = 0 }) => (
    <ul className="pl-4">
      {nodes.map((n) => {
        const path = makePath(parent, n)
        const isExpanded = expanded.has(path)
        const hasChildren = !!n.children && n.children.length > 0
        const isSelected = selectedPath === path

        return (
          <li key={path} className="leading-[22px]">
            <div
              className={cn(
                "flex items-center gap-1 rounded-[2px] px-1 cursor-pointer",
                isSelected
                  ? "bg-[#cfe0ff] outline outline-1 outline-[#7a9bc4]"
                  : "hover:bg-[#eef4ff]",
              )}
              onClick={() => setSelectedPath(path)}
              onDoubleClick={handleEnter}
            >
              <button
                className="w-[18px] text-left select-none"
                aria-label={isExpanded ? "collapse" : "expand"}
                onClick={(e) => {
                  e.stopPropagation()
                  if (hasChildren) toggleExpand(path)
                }}
              >
                {hasChildren ? (
                  isExpanded ? (
                    "－"
                  ) : (
                    "＋"
                  )
                ) : (
                  <span className="opacity-0">•</span>
                )}
              </button>
              <span className="tabular-nums">{n.code}</span>
              <span className="ml-2">{n.name}</span>
            </div>
            {hasChildren && isExpanded && (
              <Tree nodes={n.children!} parent={path} depth={depth + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="fixed left-1/2 top-1/2 z-[210] w-[min(900px,96vw)] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-[#7a9bc4] bg-white p-0 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
          {/* タイトル帯 */}
          <div className="px-3 py-[6px] text-[12px] bg-[#eef2fa] border-b border-[#7a9bc4]">
            財源検索
          </div>

          {/* 本体 */}
          <div className="bg-[#eaf2ff] border-b border-[#7a9bc4]">
            {/* 検索エリア */}
            <div className="grid grid-cols-[1fr_120px] gap-2 px-2 py-2">
              {/* 左列：条件 */}
              <div className="rounded-[3px] bg-white/40 p-2">
                <div className="text-[12px] font-medium mb-2">■ 検索条件</div>

                {/* 財源コード 4分割 */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="w-[80px] text-[12px]">財源コード</div>
                  <Input
                    value={code1}
                    onChange={(e) => setCode1(e.target.value)}
                    className="h-[24px] w-[90px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span>—</span>
                  <Input
                    value={code2}
                    onChange={(e) => setCode2(e.target.value)}
                    className="h-[24px] w-[90px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span>—</span>
                  <Input
                    value={code3}
                    onChange={(e) => setCode3(e.target.value)}
                    className="h-[24px] w-[90px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span>—</span>
                  <Input
                    value={code4}
                    onChange={(e) => setCode4(e.target.value)}
                    className="h-[24px] w-[90px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                </div>

                {/* 名称 */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="w-[80px] text-[12px]">財源名</div>
                  <Input
                    value={nameLike}
                    onChange={(e) => setNameLike(e.target.value)}
                    className="h-[24px] flex-1 rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                </div>

                {/* 全展開 */}
                <label className="flex items-center gap-2 text-[12px] select-none">
                  <input
                    type="checkbox"
                    className="h-[14px] w-[14px]"
                    checked={expandAll}
                    onChange={(e) => setExpandAll(e.target.checked)}
                  />
                  全展開
                </label>
              </div>

              {/* 右列：縦ボタン群 */}
              <div className="flex flex-col gap-2">
                {/* F7 保守 */}
                <Button
                  type="button"
                  className="h-[48px] rounded-[4px] border border-[#7a9bc4] bg-white text-[13px] text-[#1a46a3] shadow-[inset_0_0_0_1px_#fff]"
                  onClick={() => setMaintenanceOpen(true)}
                >
                  F7 保守
                </Button>

                {/* F5 検索 */}
                <Button
                  type="button"
                  className="h-[100px] rounded-[4px] border border-[#7a9bc4] bg-white text-[13px] text-[#1a46a3] shadow-[inset_0_0_0_1px_#fff]"
                  onClick={() => {
                    /* フィルタは useMemo 依存で即反映されるので何もしない */
                  }}
                >
                  F5 検索
                </Button>
              </div>
            </div>

            {/* ツリー */}
            <div className="border-t border-[#7a9bc4] bg-white max-h-[420px] overflow-auto px-2 py-2">
              <Tree nodes={filteredData} />
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end gap-2 bg-[#eef2fa] px-3 py-2">
            <Button
              type="button"
              className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
              onClick={handleEnter}
            >
              ↵ Enter
            </Button>
            <Button
              type="button"
              className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
              onClick={onClose}
            >
              F6 戻る
            </Button>
          </div>

          <DialogTitle className="sr-only">財源検索</DialogTitle>
        </DialogContent>
      </Dialog>

      {/* ★ F7 保守で開く財源保守モーダル */}
      <FundingMaintenanceModal
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
        accountingCode={accountingCode}
        accountingDisplayCode={accountingDisplayCode}
        accountingName={accountingName}
        fundingTree={data}
        onDecide={(codes) => {
          // いまは表示だけ。必要になったらここで連携処理を書く
          console.log("保守で決定された財源コード", codes)
        }}
      />
    </>
  )
}
