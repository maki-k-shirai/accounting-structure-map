// components/funding/FundingMaintenanceModal.tsx
"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type FundingNode = {
  code: string
  name: string
  children?: FundingNode[]
}

export type FundingLevel = "parent" | "child" | "grandchild" | "greatGrandchild"

export type FundingMaintenanceModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  accountingCode: string
  accountingDisplayCode: string
  accountingName: string
  fundingTree: FundingNode[]
  onDecide?: (codes: {
    parent: string
    child: string
    grandchild: string
    greatGrandchild: string
  }) => void
}

const PROCESS_MODES = [
  { id: "create", label: "登録" },
  { id: "fix", label: "訂正" },
  { id: "change", label: "変更" },
  { id: "abolish", label: "廃止" },
  { id: "cancelCreate", label: "登録取消" },
  { id: "cancelChange", label: "変更取消" },
  { id: "cancelAbolish", label: "廃止取消" },
] as const

type ProcessMode = (typeof PROCESS_MODES)[number]["id"]

const REG_DATES = [
  { id: "r8", label: "令和8年4月1日" },
  { id: "r9", label: "令和9年4月1日" },
] as const

const LEVEL_OPTIONS: { id: FundingLevel; label: string }[] = [
  { id: "parent", label: "親財源" },
  { id: "child", label: "子財源" },
  { id: "grandchild", label: "孫財源" },
  { id: "greatGrandchild", label: "ひ孫財源" },
]

const levelIndexMap: Record<FundingLevel, number> = {
  parent: 0,
  child: 1,
  grandchild: 2,
  greatGrandchild: 3,
}

type FundingPath = { nodes: FundingNode[] }
type FlattenItem = { path: FundingPath; depth: number }

/** 最大階層までのツリーを平坦化（インデント付き） */
function flattenFundingTree(
  tree: FundingNode[],
  maxLevelIndex: number,
): FlattenItem[] {
  const result: FlattenItem[] = []

  const dfs = (nodes: FundingNode[], prefix: FundingNode[], depth: number) => {
    for (const node of nodes) {
      const pathNodes = [...prefix, node]
      const depthIndex = pathNodes.length - 1 // 0=親,1=子,...

      if (depthIndex <= maxLevelIndex) {
        result.push({ path: { nodes: pathNodes }, depth: depthIndex })
      }
      if (node.children && depthIndex < maxLevelIndex) {
        dfs(node.children, pathNodes, depth + 1)
      }
    }
  }

  dfs(tree, [], 0)
  return result
}

function getDisplayName(path: FundingPath, level: FundingLevel): string {
  const idx = levelIndexMap[level]
  const nodes = path.nodes
  const node = nodes[idx] ?? nodes[nodes.length - 1]
  return node?.name ?? ""
}

function getPathKey(path: FundingPath): string {
  return path.nodes.map((n) => n.code).join("/")
}

export function FundingMaintenanceModal({
  open,
  onOpenChange,
  accountingCode,
  accountingDisplayCode,
  accountingName,
  fundingTree,
  onDecide,
}: FundingMaintenanceModalProps) {
  const [processMode, setProcessMode] = React.useState<ProcessMode>("create")
  const [regDateId, setRegDateId] = React.useState<"r8" | "r9">("r8")
  const [level, setLevel] = React.useState<FundingLevel>("parent")
  const [showCode, setShowCode] = React.useState(false)

  const [selectedPath, setSelectedPath] = React.useState<FundingPath | null>(
    null,
  )

  // 財源コード入力欄
  const [parentCode, setParentCode] = React.useState("")
  const [childCode, setChildCode] = React.useState("")
  const [grandchildCode, setGrandchildCode] = React.useState("")
  const [greatGrandchildCode, setGreatGrandchildCode] = React.useState("")

  // 登録作業エリア表示フラグ
  const [showDetailArea, setShowDetailArea] = React.useState(false)

  // 登録作業エリアの入力値
  const [fundingName, setFundingName] = React.useState("")
  const [fundingShortName, setFundingShortName] = React.useState("")
  const [grantor, setGrantor] = React.useState("")
  const [grantUsageNote, setGrantUsageNote] = React.useState("")
  const [isDesignatedDonation, setIsDesignatedDonation] =
    React.useState(false)

  const editIndex = levelIndexMap[level]
  const maxLevelIndex = editIndex

  // 親子区分（単独）表示用
  const parentChildLabel = React.useMemo(() => {
    switch (level) {
      case "parent":
        return "親単独"
      case "child":
        return "子単独"
      case "grandchild":
        return "孫単独"
      case "greatGrandchild":
        return "ひ孫単独"
      default:
        return ""
    }
  }, [level])

  // 階層ツリーのフラットリスト（インデント用）
  const flatItems = React.useMemo(
    () => flattenFundingTree(fundingTree, maxLevelIndex),
    [fundingTree, maxLevelIndex],
  )

  const selectedKey = React.useMemo(
    () => (selectedPath ? getPathKey(selectedPath) : null),
    [selectedPath],
  )

  // ===== モーダルオープンごとに初期化 =====
  React.useEffect(() => {
    if (!open) return
    setProcessMode("create")
    setRegDateId("r8")
    setLevel("parent")
    setShowCode(false)
    setSelectedPath(null)

    setParentCode("")
    setChildCode("")
    setGrandchildCode("")
    setGreatGrandchildCode("")

    setShowDetailArea(false)
    setFundingName("")
    setFundingShortName("")
    setGrantor("")
    setGrantUsageNote("")
    setIsDesignatedDonation(false)
  }, [open])

  // ===== Enterキー（キーボード）のキャプチャ：財源コード欄で押されたら作業エリアを開く =====
  React.useEffect(() => {
    if (!open) return

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      const target = e.target as HTMLElement | null
      if (
        target &&
        target.tagName === "INPUT" &&
        (target as HTMLInputElement).dataset.fundingCode === "true"
      ) {
        e.preventDefault()
        e.stopPropagation()
        setShowDetailArea(true)
      }
    }

    window.addEventListener("keydown", handler, true)
    return () => {
      window.removeEventListener("keydown", handler, true)
    }
  }, [open])

  // ===== path → 財源コード欄セット =====
  React.useEffect(() => {
    applyCodesFromPath(selectedPath, level)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, level])

  const applyCodesFromPath = (
    path: FundingPath | null,
    lvl: FundingLevel,
  ): void => {
    const idx = levelIndexMap[lvl]
    const nodes = path?.nodes ?? []

    const newParent = idx > 0 && nodes[0] ? nodes[0].code : ""
    const newChild = idx > 1 && nodes[1] ? nodes[1].code : ""
    const newGrandchild = idx > 2 && nodes[2] ? nodes[2].code : ""

    setParentCode(newParent)
    setChildCode(newChild)
    setGrandchildCode(newGrandchild)
    setGreatGrandchildCode("")
  }

  // ===== Enterボタン（フッター） =====
  const handleDecide = () => {
    // まだ作業エリアが開いてない → まず開くだけ
    if (!showDetailArea) {
      setShowDetailArea(true)
      return
    }

    // 作業エリア表示中 → 確定処理
    if (onDecide) {
      onDecide({
        parent: parentCode,
        child: childCode,
        grandchild: grandchildCode,
        greatGrandchild: greatGrandchildCode,
      })
    }
    onOpenChange(false)
  }

  // ===== 戻るボタン =====
  const handleBack = () => {
    if (showDetailArea) {
      // 作業エリアを閉じて、財源コード入力状態に戻る
      setShowDetailArea(false)
    } else {
      // すでに作業エリア閉 → モーダル自体を閉じる
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="
          fixed left-1/2 top-1/2 
          z-[220]
          w-[960px] max-w-[98vw]
          max-h-[92vh]
          -translate-x-1/2 -translate-y-1/2
          rounded-[4px] border border-[#7a9bc4]
          bg-[#f2f7ff] p-0
          shadow-[0_20px_40px_rgba(0,0,0,0.45)]
        "
      >
        <DialogTitle className="sr-only">財源保守</DialogTitle>

        {/* 財源検索に合わせたヘッダー */}
        <div className="px-3 py-[6px] text-[12px] bg-[#eef2fa] border-b border-[#7a9bc4]">
          財源保守
        </div>

        <DialogBody className="space-y-2 p-3 text-[13px] text-[#1a1a1a]">
          {/* ===== 処理モード ===== */}
          <div className="grid grid-cols-[110px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
            <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
              処理モード
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#eaf3ff] px-3 py-1.5">
              {PROCESS_MODES.map((m) => (
                <label key={m.id} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3 w-3"
                    checked={processMode === m.id}
                    onChange={() => setProcessMode(m.id)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ===== 登録年月日 ===== */}
          <div className="grid grid-cols-[110px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
            <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
              登録年月日
            </div>
            <div className="flex items-center gap-8 bg-[#eaf3ff] px-3 py-1.5">
              {REG_DATES.map((d) => (
                <label key={d.id} className="inline-flex items-center gap-1">
                  <input
                    type="radio"
                    className="h-3 w-3"
                    checked={regDateId === d.id}
                    onChange={() => setRegDateId(d.id)}
                  />
                  <span>{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ===== 会計（表示のみ） ===== */}
          <div className="grid grid-cols-[110px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
            <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
              会計
            </div>
            <div className="flex items-center gap-2 bg-[#eaf3ff] px-3 py-1.5">
              <div className="flex items-center gap-1">
                <Input
                  value={accountingDisplayCode}
                  readOnly
                  className="h-[24px] w-[70px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[13px]"
                />
                <span>－</span>
                <Input
                  value="0"
                  readOnly
                  className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-[#f5f5f5] px-1 text-right text-[13px]"
                />
                <span>－</span>
                <Input
                  value="0"
                  readOnly
                  className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-[#f5f5f5] px-1 text-right text-[13px]"
                />
              </div>
              <div className="flex-1">
                <span className="px-1 text-[13px]">{accountingName}</span>
              </div>
            </div>
          </div>

          {/* ===== 階層 + 財源ツリー ===== */}
          <div className="grid grid-cols-[110px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
            <div className="flex items-center justify-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
              階層
            </div>

            <div className="bg-[#eaf3ff] px-3 py-2">
              <div className="mb-1 flex flex-wrap items-center gap-x-6 gap-y-1">
                {LEVEL_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className="inline-flex items-center gap-1"
                  >
                    <input
                      type="radio"
                      className="h-3 w-3"
                      checked={level === opt.id}
                      onChange={() => setLevel(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-3 w-3"
                    checked={showCode}
                    onChange={(e) => setShowCode(e.target.checked)}
                  />
                  <span>コード表示</span>
                </label>
              </div>

              <div className="h-[260px] overflow-y-auto border border-[#7a9bc4] bg-white px-2 py-1">
                {flatItems.length === 0 && (
                  <div className="py-2 text-[12px] text-[#777]">
                    財源が登録されていません。
                  </div>
                )}

                {flatItems.map((item, idx) => {
                  const { path, depth } = item
                  const label = getDisplayName(path, level)
                  const rowKey = getPathKey(path)
                  const isSelected = selectedKey === rowKey
                  const displayCodeNode =
                    path.nodes[levelIndexMap[level]] ??
                    path.nodes[path.nodes.length - 1]
                  const displayCode = displayCodeNode?.code ?? ""

                  return (
                    <div
                      key={`${rowKey}-${idx}`}
                      className={`flex cursor-pointer items-center gap-2 px-1 py-[2px] text-[13px] ${
                        isSelected ? "bg-[#c0d8ff]" : "hover:bg-[#edf3ff]"
                      }`}
                      style={{ paddingLeft: 4 + depth * 16 }}
                      onClick={() => setSelectedPath(path)}
                    >
                      {showCode && (
                        <span className="inline-block w-[70px] text-right tabular-nums">
                          {displayCode}
                        </span>
                      )}
                      <span className="flex-1 truncate">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ===== 財源コード ===== */}
          <div className="grid grid-cols-[110px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
            <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
              財源コード
            </div>
            <div className="flex items-center gap-1 bg-[#eaf3ff] px-3 py-1.5">
              <Input
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                disabled={editIndex !== 0}
                data-funding-code="true"
                className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[13px]"
              />
              <span>－</span>
              <Input
                value={childCode}
                onChange={(e) => setChildCode(e.target.value)}
                disabled={editIndex !== 1}
                data-funding-code="true"
                className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[13px]"
              />
              <span>－</span>
              <Input
                value={grandchildCode}
                onChange={(e) => setGrandchildCode(e.target.value)}
                disabled={editIndex !== 2}
                data-funding-code="true"
                className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[13px]"
              />
              <span>－</span>
              <Input
                value={greatGrandchildCode}
                onChange={(e) => setGreatGrandchildCode(e.target.value)}
                disabled={editIndex !== 3}
                data-funding-code="true"
                className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[13px]"
              />
            </div>
          </div>

{/* ===== 登録作業エリア ===== */}
{showDetailArea && (
  <div className="border border-[#7a9bc4] bg-[#c8ddff]">
    {/* 登録年月日 / 有効期間（1行・左寄せ） */}
    <div className="flex items-center gap-8 border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 text-[13px]">
      <div>登録年月日： 令和8年4月1日</div>
      <div>有効期間： 令和8年4月1日 ～</div>
    </div>

    {/* 明細エリア：4列グリッド
        1列目・3列目 … タイトル
        2列目・4列目 … 入力エリア
    */}
    <div className="grid grid-cols-[110px_1fr_110px_1fr] border-t border-[#7a9bc4] bg-[#eaf3ff] text-[13px]">
      {/* ===== 行1：財源名（タイトル＋右3列まとめて入力） ===== */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        財源名
      </div>
      <div className="col-span-3 border-b border-[#7a9bc4] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-[#d00000]">*</span>
          <Input
            value={fundingName}
            onChange={(e) => setFundingName(e.target.value)}
            className="h-[24px] flex-1 rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px]"
          />
        </div>
      </div>

      {/* ===== 行2：省略名 ＋ 親子区分（左右2組） ===== */}
      {/* 左：省略名 */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        省略名
      </div>
      <div className="border-r border-b border-[#7a9bc4] px-3 py-1.5">
        <Input
          value={fundingShortName}
          onChange={(e) => setFundingShortName(e.target.value)}
          className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px]"
        />
      </div>
      {/* 右：親子区分 */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        親子区分
      </div>
      <div className="border-b border-[#7a9bc4] px-3 py-1.5">
        <span className="text-[13px]">{parentChildLabel}</span>
      </div>

      {/* ===== 行3：交付者 ＋ 指定寄附資金（左右2組） ===== */}
      {/* 左：交付者 */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        交付者
      </div>
      <div className="border-r border-b border-[#7a9bc4] px-3 py-1.5">
        <Input
          value={grantor}
          onChange={(e) => setGrantor(e.target.value)}
          className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px]"
        />
      </div>
      {/* 右：指定寄附資金 */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        指定寄附資金
      </div>
      <div className="border-b border-[#7a9bc4] px-3 py-1.5">
        <label className="inline-flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            className="h-[14px] w-[14px]"
            checked={isDesignatedDonation}
            onChange={(e) => setIsDesignatedDonation(e.target.checked)}
          />
          <span>指定寄附資金（指定純資産）</span>
        </label>
      </div>

      {/* ===== 行4：交付者の定めた使途（タイトル＋右3列まとめて入力） ===== */}
      <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#c8ddff] px-3 py-2 font-bold">
        交付者の定めた使途
      </div>
      <div className="col-span-3 border-b border-[#7a9bc4] px-3 py-1.5">
        <textarea
          value={grantUsageNote}
          onChange={(e) => setGrantUsageNote(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[13px] leading-relaxed"
        />
      </div>
    </div>
  </div>
)}
        </DialogBody>

        <DialogFooter className="flex justify-end gap-2 border-t border-[#7a9bc4] bg-[#eef2fa] px-3 py-2">
          <Button
            type="button"
            className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
            onClick={handleDecide}
          >
            ↵ Enter
          </Button>
          <Button
            type="button"
            className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
            onClick={handleBack}
          >
            F6 戻る
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
