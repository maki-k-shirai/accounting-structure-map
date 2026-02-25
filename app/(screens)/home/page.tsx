"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type NodeId =
  | "voucher"
  | "ledger"
  | "trial"
  | "bs"
  | "pl"
  | "cashbook"
  | "daily-sheet"
  | "journal"
  | "inventory"
  | "notes"

type NodeData = {
  id: NodeId
  label: string
  role: string
  x: number
  y: number
}

type LayerData = {
  id: "input" | "summary" | "report"
  title: string
  subtitle: string
  y: number
  h: number
}

type EdgeData = {
  id: string
  from: NodeId
  to: NodeId
  label: "記録" | "期間集計" | "確定" | "抽出" | "日次集計" | "ログ" | "詳細化" | "補足"
  why: string
  checkpoint: string
  fromLabel: string
  toLabel: string
}

type SelectedTarget = {
  type: "node" | "edge"
  id: string
}

const NODE_W = 180
const NODE_H = 76
const INVENTORY_IMAGE_SRC = "/pdf/property%20inventory.png"

type InventoryHighlightRect = {
  left: number
  top: number
  width: number
  height: number
}

const BASIC_ASSET_HIGHLIGHTS: InventoryHighlightRect[] = [
  { left: 45, top: 36.2, width: 9, height: 3 },
  { left: 45, top: 44.7, width: 9, height: 3 },
]

const PUBLIC_PURPOSE_HOLDING_HIGHLIGHTS: InventoryHighlightRect[] = [
  { left: 61, top: 36.2, width: 18, height: 3 },
  { left: 61, top: 44.7, width: 18, height: 3 },
]

const LAYERS: LayerData[] = [
  {
    id: "input",
    title: "① 記録・入力層",
    subtitle: "伝票 / 日計表 / 現預金出納帳 / 仕訳帳",
    y: 24,
    h: 208,
  },
  {
    id: "summary",
    title: "② 集計・確認層",
    subtitle: "総勘定元帳 / 試算表",
    y: 252,
    h: 208,
  },
  {
    id: "report",
    title: "③ 決算・表示層",
    subtitle: "貸借対照表 / 活動計算書 / 財産目録 / 注記",
    y: 480,
    h: 208,
  },
]

const RELATION_STYLE: Record<
  EdgeData["label"],
  { badgeBg: string; badgeBorder: string; badgeText: string; line: string }
> = {
  記録: {
    badgeBg: "#edf3ff",
    badgeBorder: "#bdd0f7",
    badgeText: "#234f9a",
    line: "#234f9a",
  },
  ログ: {
    badgeBg: "#f4eeff",
    badgeBorder: "#d2c2ef",
    badgeText: "#5a3d8b",
    line: "#5a3d8b",
  },
  日次集計: {
    badgeBg: "#ecfaef",
    badgeBorder: "#b8ddc0",
    badgeText: "#2f6d3f",
    line: "#2f6d3f",
  },
  期間集計: {
    badgeBg: "#e9f8f9",
    badgeBorder: "#b9dde0",
    badgeText: "#216770",
    line: "#216770",
  },
  抽出: {
    badgeBg: "#fff6ea",
    badgeBorder: "#efd0ad",
    badgeText: "#925d22",
    line: "#925d22",
  },
  確定: {
    badgeBg: "#ffefef",
    badgeBorder: "#efc1c1",
    badgeText: "#8f3232",
    line: "#8f3232",
  },
  詳細化: {
    badgeBg: "#fff3e8",
    badgeBorder: "#efceb2",
    badgeText: "#8a4f1d",
    line: "#8a4f1d",
  },
  補足: {
    badgeBg: "#f2f4f7",
    badgeBorder: "#d2d8df",
    badgeText: "#4f5b6a",
    line: "#4f5b6a",
  },
}

const NODES: NodeData[] = [
  {
    id: "voucher",
    label: "伝票",
    role: "すべての会計データの出発点",
    x: 420,
    y: 108,
  },
  {
    id: "ledger",
    label: "総勘定元帳",
    role: "伝票を科目別に記録した累積帳票",
    x: 520,
    y: 318,
  },
  {
    id: "trial",
    label: "試算表",
    role: "全科目を集計し整合性を確認する中間帳票",
    x: 820,
    y: 318,
  },
  {
    id: "bs",
    label: "貸借対照表",
    role: "期末時点の財政状態を示す帳票",
    x: 620,
    y: 548,
  },
  {
    id: "pl",
    label: "活動計算書",
    role: "一期間の活動結果を示す帳票",
    x: 860,
    y: 548,
  },
  {
    id: "inventory",
    label: "財産目録",
    role: "貸借対照表の残高内訳を具体化する帳票",
    x: 380,
    y: 548,
  },
  {
    id: "notes",
    label: "注記",
    role: "貸借対照表・活動計算書の背景を補足する帳票",
    x: 1100,
    y: 548,
  },
  {
    id: "cashbook",
    label: "現預金出納帳",
    role: "現金・預金取引を抽出して資金の動きを確認する帳票",
    x: 980,
    y: 108,
  },
  {
    id: "daily-sheet",
    label: "日計表",
    role: "1日の取引を集計して入力漏れや異常を確認する日次帳票",
    x: 700,
    y: 108,
  },
  {
    id: "journal",
    label: "仕訳帳",
    role: "すべての仕訳を時系列で確認する監査ログ",
    x: 140,
    y: 108,
  },
]

const EDGES: EdgeData[] = [
  {
    id: "voucher-ledger",
    from: "voucher",
    to: "ledger",
    label: "記録",
    why: "科目別に積み上げないと、集計や検証ができない。",
    checkpoint: "科目単位で取引が追える状態になっているか",
    fromLabel: "伝票",
    toLabel: "総勘定元帳",
  },
  {
    id: "ledger-trial",
    from: "ledger",
    to: "trial",
    label: "期間集計",
    why: "全体の整合（借方＝貸方）を確認し、次の帳票の土台を作る。",
    checkpoint: "借方合計＝貸方合計になっているか",
    fromLabel: "総勘定元帳",
    toLabel: "試算表",
  },
  {
    id: "trial-bs",
    from: "trial",
    to: "bs",
    label: "確定",
    why: "試算表で整合した数値を、決算書（貸借対照表・活動計算書）として確定する。",
    checkpoint: "決算整理後の期末残高が確定しているか",
    fromLabel: "試算表",
    toLabel: "決算書（貸借対照表・活動計算書）",
  },
  {
    id: "bs-inventory",
    from: "bs",
    to: "inventory",
    label: "詳細化",
    why: "貸借対照表の残高の中身を具体化し、実在性を説明するため。",
    checkpoint: "貸借対照表の残高内訳が追跡できるか。",
    fromLabel: "貸借対照表",
    toLabel: "財産目録",
  },
  {
    id: "bs-notes",
    from: "bs",
    to: "notes",
    label: "補足",
    why: "貸借対照表・活動計算書をまとめた決算書群の背景情報を説明するため。",
    checkpoint: "主要な残高に必要な説明が付されているか。",
    fromLabel: "決算書（貸借対照表・活動計算書）",
    toLabel: "注記",
  },
  {
    id: "voucher-journal",
    from: "voucher",
    to: "journal",
    label: "ログ",
    why: "すべての仕訳を時系列で確認し、取引の根拠を追跡するため。",
    checkpoint: "修正や訂正があっても履歴を追えるか。",
    fromLabel: "伝票",
    toLabel: "仕訳帳",
  },
  {
    id: "voucher-cashbook",
    from: "voucher",
    to: "cashbook",
    label: "抽出",
    why: "現金・預金に関係する取引だけを取り出し、資金の動きを確認するため。",
    checkpoint: "実際の通帳残高と一致しているか。",
    fromLabel: "伝票",
    toLabel: "現預金出納帳",
  },
  {
    id: "voucher-daily-sheet",
    from: "voucher",
    to: "daily-sheet",
    label: "日次集計",
    why: "1日の取引をまとめ、入力漏れや異常を早期に発見するため。",
    checkpoint: "当日の借方合計と貸方合計が一致しているか。",
    fromLabel: "伝票",
    toLabel: "日計表",
  },
]

const STATEMENT_GROUP_FRAME = (() => {
  const bs = NODES.find((node) => node.id === "bs")
  const pl = NODES.find((node) => node.id === "pl")
  if (!bs || !pl) return null

  const pad = 22
  const left = Math.min(bs.x, pl.x) - pad
  const top = Math.min(bs.y, pl.y) - pad
  const right = Math.max(bs.x, pl.x) + NODE_W + pad
  const bottom = Math.max(bs.y, pl.y) + NODE_H + pad

  return { x: left, y: top, w: right - left, h: bottom - top }
})()

function centerY(node: NodeData) {
  return node.y + NODE_H / 2
}

function centerX(node: NodeData) {
  return node.x + NODE_W / 2
}

function collectUpstream(start: NodeId, edges: EdgeData[]) {
  const visited = new Set<NodeId>([start])
  const queue: NodeId[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()!
    edges.forEach((edge) => {
      if (edge.to !== current) return
      if (visited.has(edge.from)) return
      visited.add(edge.from)
      queue.push(edge.from)
    })
  }

  return visited
}

function collectDownstream(start: NodeId, edges: EdgeData[]) {
  const visited = new Set<NodeId>([start])
  const queue: NodeId[] = [start]

  while (queue.length > 0) {
    const current = queue.shift()!
    edges.forEach((edge) => {
      if (edge.from !== current) return
      if (visited.has(edge.to)) return
      visited.add(edge.to)
      queue.push(edge.to)
    })
  }

  return visited
}

function edgeIsHighlighted(edge: EdgeData, related: Set<NodeId> | null) {
  if (!related) return true
  return related.has(edge.from) && related.has(edge.to)
}

function edgePoints(edge: EdgeData, from: NodeData, to: NodeData) {
  if (edge.id === "voucher-cashbook") {
    const startX = centerX(from)
    const startY = from.y
    const endX = centerX(to)
    const endY = to.y
    const detourY = Math.min(startY, endY) - 34
    return `${startX},${startY} ${startX},${detourY} ${endX},${detourY} ${endX},${endY}`
  }

  if (edge.id === "trial-bs" && STATEMENT_GROUP_FRAME) {
    const startX = centerX(from)
    const startY = from.y + NODE_H
    const endX = STATEMENT_GROUP_FRAME.x + STATEMENT_GROUP_FRAME.w / 2
    const endY = STATEMENT_GROUP_FRAME.y
    const midY = (startY + endY) / 2
    return `${startX},${startY} ${startX},${midY} ${endX},${midY} ${endX},${endY}`
  }

  if (edge.id === "bs-notes" && STATEMENT_GROUP_FRAME) {
    const startX = STATEMENT_GROUP_FRAME.x + STATEMENT_GROUP_FRAME.w / 2
    const startY = STATEMENT_GROUP_FRAME.y + STATEMENT_GROUP_FRAME.h
    const endX = centerX(to)
    const endY = to.y + NODE_H
    const detourY = Math.max(startY, endY) + 36
    return `${startX},${startY} ${startX},${detourY} ${endX},${detourY} ${endX},${endY}`
  }

  const startX = centerX(from)
  const startY = centerY(from)
  const endX = centerX(to)
  const endY = centerY(to)
  return `${startX},${startY} ${endX},${endY}`
}

function edgeLabelPosition(edge: EdgeData, from: NodeData, to: NodeData) {
  if (edge.id === "voucher-cashbook") {
    const startX = centerX(from)
    const endX = centerX(to)
    const detourY = Math.min(from.y, to.y) - 34
    return {
      x: (startX + endX) / 2,
      y: detourY - 10,
    }
  }

  if (edge.id === "trial-bs" && STATEMENT_GROUP_FRAME) {
    const startX = centerX(from)
    const endX = STATEMENT_GROUP_FRAME.x + STATEMENT_GROUP_FRAME.w / 2
    const startY = from.y + NODE_H
    const endY = STATEMENT_GROUP_FRAME.y
    return {
      x: (startX + endX) / 2,
      y: (startY + endY) / 2 - 12,
    }
  }

  if (edge.id === "bs-notes" && STATEMENT_GROUP_FRAME) {
    const startX = STATEMENT_GROUP_FRAME.x + STATEMENT_GROUP_FRAME.w / 2
    const endX = centerX(to)
    const startY = STATEMENT_GROUP_FRAME.y + STATEMENT_GROUP_FRAME.h
    const endY = to.y + NODE_H
    const detourY = Math.max(startY, endY) + 36
    return {
      x: (startX + endX) / 2,
      y: detourY - 12,
    }
  }

  return {
    x: (centerX(from) + centerX(to)) / 2,
    y: (centerY(from) + centerY(to)) / 2 - 14,
  }
}

function Node({
  node,
  isDimmed,
  isSelected,
  onHover,
  onLeave,
  onClick,
  onOpenDetail,
}: {
  node: NodeData
  isDimmed: boolean
  isSelected: boolean
  onHover: (id: NodeId) => void
  onLeave: () => void
  onClick: (id: NodeId) => void
  onOpenDetail: (id: NodeId) => void
}) {
  const isReferenceRelated = node.id === "cashbook" || node.id === "daily-sheet" || node.id === "journal" || node.id === "inventory"
  const isSupplementRelated = node.id === "notes"
  const isRelated = isReferenceRelated || isSupplementRelated
  const nodeTone = "border-[#b6cbe3] bg-white"

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={onLeave}
      onClick={() => onClick(node.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick(node.id)
        }
      }}
      className={`absolute text-left transition ${
        isDimmed ? "opacity-25" : "opacity-100"
      } ${
        isRelated
          ? "cursor-pointer hover:opacity-90"
          : `${isSelected ? "border-[#2d5e9a] ring-2 ring-[#a8c3e2]" : nodeTone} rounded-lg border bg-white px-3 py-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md`
      }`}
      style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${NODE_W}px`, height: `${NODE_H}px` }}
    >
      {!isRelated && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpenDetail(node.id)
          }}
          className="absolute right-1.5 top-1.5 rounded border border-[#d4dfec] bg-white px-1.5 py-0.5 text-[9px] text-[#4f6784]"
        >
          詳細
        </button>
      )}
      {isReferenceRelated ? (
        <div className="flex h-full items-center justify-center">
          <div
            className={`flex h-9 min-w-[138px] max-w-[154px] items-center justify-center rounded-full border bg-[#f3f5f7] px-4 text-[13px] font-semibold text-[#465869] ${
              isSelected ? "border-[#9db2c7]" : "border-[#d3d8df]"
            }`}
          >
            {node.label}
          </div>
        </div>
      ) : isSupplementRelated ? (
        <div className="flex h-full items-center justify-center">
          <div
            className={`relative flex h-[52px] w-[154px] items-center justify-center border bg-[#f7f8fa] text-[13px] font-semibold text-[#465869] [clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,0_100%)] ${
              isSelected ? "border-[#9db2c7]" : "border-[#d3d8df]"
            }`}
          >
            {node.label}
          </div>
        </div>
      ) : (
        <>
          <div className="text-[15px] font-bold text-[#1f3f66]">{node.label}</div>
          <div className="mt-1 text-[11px] text-[#5f7693]">{node.role}</div>
        </>
      )}
    </div>
  )
}

function Edge({
  edge,
  from,
  to,
  highlighted,
  selected,
  onClick,
}: {
  edge: EdgeData
  from: NodeData
  to: NodeData
  highlighted: boolean
  selected: boolean
  onClick: (id: string) => void
}) {
  const points = edgePoints(edge, from, to)
  const labelPos = edgeLabelPosition(edge, from, to)
  const fontSize = 13
  const padX = 7
  const padY = 3
  const labelWidth = Math.max(34, edge.label.length * fontSize + padX * 2)
  const labelHeight = fontSize + padY * 2
  const strokeWidth = selected ? 4.5 : highlighted ? 4 : 2
  const lineOpacity = selected ? 1 : highlighted ? 0.95 : 0.18
  const labelOpacity = selected ? 1 : highlighted ? 1 : 0.45
  const boxOpacity = selected ? 1 : highlighted ? 0.96 : 0.35
  const style = RELATION_STYLE[edge.label]

  return (
    <g>
      <polyline
        points={points}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        pointerEvents="stroke"
        className="cursor-pointer"
        onClick={() => onClick(edge.id)}
      />
      <polyline
        points={points}
        fill="none"
        stroke={style.line}
        strokeWidth={strokeWidth}
        opacity={lineOpacity}
        strokeLinejoin="round"
        strokeLinecap="round"
        data-edge={`${edge.from}-${edge.to}`}
      />
      <rect
        x={labelPos.x - labelWidth / 2}
        y={labelPos.y - labelHeight / 2}
        width={labelWidth}
        height={labelHeight}
        rx={6}
        fill={style.badgeBg}
        stroke={style.badgeBorder}
        opacity={boxOpacity}
        className="cursor-pointer"
        onClick={() => onClick(edge.id)}
      />
      <text
        x={labelPos.x}
        y={labelPos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={style.badgeText}
        fontSize={fontSize}
        fontWeight={selected || highlighted ? 700 : 600}
        opacity={labelOpacity}
        className="cursor-pointer select-none"
        onClick={() => onClick(edge.id)}
      >
        {edge.label}
      </text>
    </g>
  )
}

function DetailPanel({
  node,
  edge,
  edges,
  nodes,
  onSelectNode,
}: {
  node: NodeData | null
  edge: EdgeData | null
  edges: EdgeData[]
  nodes: NodeData[]
  onSelectNode: (id: NodeId) => void
}) {
  const incoming = useMemo(() => {
    if (!node) return []
    const baseIncoming = edges
      .filter((e) => e.to === node.id)
      .map((e) => nodes.find((n) => n.id === e.from)?.label)
      .filter((v): v is string => !!v)

    if (node.id === "pl" && !baseIncoming.includes("試算表")) {
      baseIncoming.push("試算表")
    }

    if (node.id === "notes" && !baseIncoming.includes("活動計算書")) {
      baseIncoming.push("活動計算書")
    }

    return baseIncoming
  }, [node, edges, nodes])

  const outgoing = useMemo(() => {
    if (!node) return []
    return edges
      .filter((e) => e.from === node.id)
      .map((e) => nodes.find((n) => n.id === e.to)?.label)
      .filter((v): v is string => !!v)
  }, [node, edges, nodes])

  const [activeBsBox, setActiveBsBox] = useState<"assets" | "liabilities" | "netAssets" | null>(null)
  const [isBasicAssetModalOpen, setIsBasicAssetModalOpen] = useState(false)
  const [isPublicPurposeHoldingModalOpen, setIsPublicPurposeHoldingModalOpen] = useState(false)
  const [inventoryHighlights, setInventoryHighlights] = useState<InventoryHighlightRect[]>(BASIC_ASSET_HIGHLIGHTS)
  const [publicPurposeHoldingHighlights, setPublicPurposeHoldingHighlights] = useState<InventoryHighlightRect[]>(
    PUBLIC_PURPOSE_HOLDING_HIGHLIGHTS
  )
  const [isHighlightEditorOpen, setIsHighlightEditorOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (node?.id !== "bs") {
      setActiveBsBox(null)
    }
  }, [node])

  useEffect(() => {
    if (node?.id !== "inventory") {
      setIsBasicAssetModalOpen(false)
      setIsPublicPurposeHoldingModalOpen(false)
      setIsHighlightEditorOpen(false)
      setIsCopied(false)
    }
  }, [node])

  function updateInventoryHighlight(index: number, key: keyof InventoryHighlightRect, rawValue: string) {
    const value = Number.parseFloat(rawValue)
    if (Number.isNaN(value)) return
    setInventoryHighlights((prev) => prev.map((rect, i) => (i === index ? { ...rect, [key]: value } : rect)))
  }

  function updatePublicPurposeHoldingHighlight(index: number, key: keyof InventoryHighlightRect, rawValue: string) {
    const value = Number.parseFloat(rawValue)
    if (Number.isNaN(value)) return
    setPublicPurposeHoldingHighlights((prev) => prev.map((rect, i) => (i === index ? { ...rect, [key]: value } : rect)))
  }

  async function copyHighlightSettings() {
    const payload = JSON.stringify(
      {
        basicAssetHighlights: inventoryHighlights,
        publicPurposeHoldingHighlights,
      },
      null,
      2
    )
    try {
      await navigator.clipboard.writeText(payload)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1200)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <div className="h-full overflow-auto rounded-t-2xl border border-[#a9c0dd] bg-white p-4 shadow-2xl">
      {!node && !edge ? (
        <div className="text-[12px] text-[#5f7693]">ノードをクリックすると詳細を表示します。</div>
      ) : edge ? (
        <>
          <h2 className="text-[18px] font-bold text-[#1f3f66]">
            {edge.fromLabel} → {edge.toLabel}
          </h2>

          <div className="mt-4 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
            <div className="text-[11px] font-semibold text-[#335a88]">関係</div>
            <div className="mt-1 text-[12px] text-[#4f6784]">{edge.label}</div>
          </div>

          <div className="mt-3 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
            <div className="text-[11px] font-semibold text-[#335a88]">なぜ</div>
            <div className="mt-1 text-[12px] text-[#4f6784]">{edge.why}</div>
          </div>

          <div className="mt-3 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
            <div className="text-[11px] font-semibold text-[#335a88]">チェックポイント</div>
            <div className="mt-1 text-[12px] text-[#4f6784]">{edge.checkpoint}</div>
          </div>
        </>
      ) : node ? (
        <>
          <h2 className="text-[18px] font-bold text-[#1f3f66]">{node.label}</h2>
          <p className="mt-2 text-[13px] text-[#4f6784]">{node.role}</p>

          <div className="mt-4 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
            <div className="text-[11px] font-semibold text-[#335a88]">入力元</div>
            <div className="mt-1 text-[12px] text-[#4f6784]">{incoming.length > 0 ? incoming.join(" / ") : "なし"}</div>
          </div>

          <div className="mt-3 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
            <div className="text-[11px] font-semibold text-[#335a88]">出力先</div>
            <div className="mt-1 text-[12px] text-[#4f6784]">{outgoing.length > 0 ? outgoing.join(" / ") : "なし"}</div>
          </div>

          {node.id === "inventory" && (
            <div className="mt-3 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold text-[#335a88]">帳票イメージ</div>
                <button
                  type="button"
                  onClick={() => setIsHighlightEditorOpen((prev) => !prev)}
                  className="rounded border border-[#b8cbe0] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3e5f84] hover:bg-[#f3f8fd]"
                >
                  {isHighlightEditorOpen ? "編集を閉じる" : "ハイライト編集"}
                </button>
              </div>
              <div className="relative mt-2 overflow-hidden rounded border border-[#d7e1ee] bg-white">
                <object data={INVENTORY_IMAGE_SRC} type="image/png" className="h-auto w-full">
                  <div className="p-3 text-[12px] text-[#5f7693]">
                    画像が見つかりません。`public/pdf/inventory-format.png` にPNGを配置してください。
                  </div>
                </object>
                {inventoryHighlights.map((rect, index) => (
                  <button
                    key={`basic-asset-highlight-${index}`}
                    type="button"
                    aria-label="基本財産の解説を表示"
                    onClick={() => setIsBasicAssetModalOpen(true)}
                    className="absolute cursor-pointer rounded-[6px] border-2 border-[#d89d00] bg-transparent shadow-[0_0_0_2px_rgba(255,214,102,0.35),0_0_12px_rgba(216,157,0,0.25)] transition hover:shadow-[0_0_0_3px_rgba(255,214,102,0.45),0_0_16px_rgba(216,157,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d89d00]"
                    style={{
                      left: `${rect.left}%`,
                      top: `${rect.top}%`,
                      width: `${rect.width}%`,
                      height: `${rect.height}%`,
                    }}
                  />
                ))}
                {publicPurposeHoldingHighlights.map((rect, index) => (
                  <button
                    key={`public-purpose-holding-highlight-${index}`}
                    type="button"
                    aria-label="公益目的保有財産の解説を表示"
                    onClick={() => setIsPublicPurposeHoldingModalOpen(true)}
                    className="absolute cursor-pointer rounded-[6px] border-2 border-[#2f8a66] bg-transparent shadow-[0_0_0_2px_rgba(135,226,188,0.28),0_0_12px_rgba(47,138,102,0.22)] transition hover:shadow-[0_0_0_3px_rgba(135,226,188,0.38),0_0_16px_rgba(47,138,102,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2f8a66]"
                    style={{
                      left: `${rect.left}%`,
                      top: `${rect.top}%`,
                      width: `${rect.width}%`,
                      height: `${rect.height}%`,
                    }}
                  />
                ))}
              </div>
              {isHighlightEditorOpen && (
                <div className="mt-2 rounded border border-[#d6e2f2] bg-white p-3 text-[11px] text-[#3f5978]">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-semibold text-[#335a88]">基本財産ハイライト座標（%）</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInventoryHighlights(BASIC_ASSET_HIGHLIGHTS)
                          setPublicPurposeHoldingHighlights(PUBLIC_PURPOSE_HOLDING_HIGHLIGHTS)
                        }}
                        className="rounded border border-[#c7d8ec] bg-white px-2 py-1 text-[11px] hover:bg-[#f8fbff]"
                      >
                        リセット
                      </button>
                      <button
                        type="button"
                        onClick={copyHighlightSettings}
                        className="rounded border border-[#b8cbe0] bg-[#f6fbff] px-2 py-1 text-[11px] font-semibold text-[#3e5f84] hover:bg-[#edf6ff]"
                      >
                        {isCopied ? "コピー済み" : "JSONをコピー"}
                      </button>
                    </div>
                  </div>
                  {inventoryHighlights.map((rect, index) => (
                    <div key={`editor-row-${index}`} className="mb-2 grid grid-cols-4 gap-2 last:mb-0">
                      <label className="flex flex-col gap-1">
                        <span>left</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.left}
                          onChange={(event) => updateInventoryHighlight(index, "left", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>top</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.top}
                          onChange={(event) => updateInventoryHighlight(index, "top", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>width</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.width}
                          onChange={(event) => updateInventoryHighlight(index, "width", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>height</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.height}
                          onChange={(event) => updateInventoryHighlight(index, "height", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                    </div>
                  ))}
                  <div className="mb-2 mt-3 font-semibold text-[#2a6a53]">公益目的保有財産ハイライト座標（%）</div>
                  {publicPurposeHoldingHighlights.map((rect, index) => (
                    <div key={`public-editor-row-${index}`} className="mb-2 grid grid-cols-4 gap-2 last:mb-0">
                      <label className="flex flex-col gap-1">
                        <span>left</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.left}
                          onChange={(event) => updatePublicPurposeHoldingHighlight(index, "left", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>top</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.top}
                          onChange={(event) => updatePublicPurposeHoldingHighlight(index, "top", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>width</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.width}
                          onChange={(event) => updatePublicPurposeHoldingHighlight(index, "width", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span>height</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rect.height}
                          onChange={(event) => updatePublicPurposeHoldingHighlight(index, "height", event.target.value)}
                          className="rounded border border-[#ccd8e8] px-2 py-1"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={isBasicAssetModalOpen} onOpenChange={setIsBasicAssetModalOpen}>
                <DialogContent titleText="基本財産の解説" className="w-[min(560px,94vw)] p-0">
                  <div className="border-b border-[#dbe5f1] bg-[#f6fbff] px-5 py-3 text-[16px] font-bold text-[#1f3f66]">
                    基本財産
                  </div>
                  <div className="px-5 py-4 text-[14px] leading-7 text-[#2f425a]">
                    <p>法人の基盤となる財産。原則として元本は維持され、</p>
                    <p>運用収益を公益目的事業などに活用する。</p>
                  </div>
                  <div className="flex justify-end border-t border-[#dbe5f1] bg-[#fbfdff] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setIsBasicAssetModalOpen(false)}
                      className="rounded border border-[#b8cbe0] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#3e5f84] hover:bg-[#f3f8fd]"
                    >
                      閉じる
                    </button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isPublicPurposeHoldingModalOpen} onOpenChange={setIsPublicPurposeHoldingModalOpen}>
                <DialogContent titleText="公益目的保有財産の解説" className="w-[min(560px,94vw)] p-0">
                  <div className="border-b border-[#d6ece3] bg-[#f3fbf7] px-5 py-3 text-[16px] font-bold text-[#1f5f49]">
                    公益目的保有財産
                  </div>
                  <div className="px-5 py-4 text-[14px] leading-7 text-[#2f425a]">
                    <p>公益目的事業に直接使用する、またはその実施のために保有する財産。</p>
                  </div>
                  <div className="flex justify-end border-t border-[#d6ece3] bg-[#fbfffd] px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setIsPublicPurposeHoldingModalOpen(false)}
                      className="rounded border border-[#b9dbc9] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#2a6a53] hover:bg-[#f2fbf6]"
                    >
                      閉じる
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {node.id === "bs" && (
            <div className="mt-4 rounded-md border border-[#d2deec] bg-[#f8fbff] p-3">
              <div className="grid grid-cols-1 justify-center gap-3 md:grid-cols-[220px_220px]">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveBsBox(activeBsBox === "assets" ? null : "assets")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setActiveBsBox(activeBsBox === "assets" ? null : "assets")
                    }
                  }}
                  className={`h-full min-h-[300px] rounded border p-3 text-left transition ${
                    activeBsBox === "assets"
                      ? "border-[#8fb1d8] bg-[#f2f8ff]"
                      : "border-[#b9cdea] bg-white hover:bg-[#f8fbff]"
                  }`}
                >
                  <div className="text-[13px] font-semibold text-[#2b5687]">資産</div>
                  {activeBsBox === "assets" && (
                    <div className="relative mt-3 min-h-[250px]">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectNode("inventory")
                        }}
                        className="absolute left-[-186px] top-6 rounded-md border border-[#b9d0ea] bg-[#f4f9ff] px-3 py-1.5 text-[11px] font-semibold text-[#355f89] shadow-sm"
                      >
                        財産目録
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectNode("notes")
                        }}
                        className="absolute left-[-186px] top-[64px] rounded-md border border-[#b9d0ea] bg-[#f4f9ff] px-3 py-1.5 text-[11px] font-semibold text-[#355f89] shadow-sm"
                      >
                        注記
                      </button>
                      <div className="absolute left-[-140px] top-[24px] h-px w-[140px] bg-[#c9d8ec]" />
                      <div className="absolute left-[-140px] top-[82px] h-px w-[140px] bg-[#c9d8ec]" />

                      <div className="mx-auto w-[170px] space-y-2 text-[12px] text-[#4f6784]">
                        <div className="rounded border border-[#d6e2f2] bg-white px-3 py-2.5">流動資産</div>
                        <div className="rounded border border-[#d6e2f2] bg-white px-3 py-2.5">
                          固定資産
                          <div className="mt-2 space-y-1 text-[11px]">
                            <div className="rounded border border-[#dde8f5] bg-[#fafcff] px-2 py-1.5">有形固定資産</div>
                            <div className="rounded border border-[#dde8f5] bg-[#fafcff] px-2 py-1.5">無形固定資産</div>
                            <div className="rounded border border-[#dde8f5] bg-[#fafcff] px-2 py-1.5">その他固定資産</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveBsBox(activeBsBox === "liabilities" ? null : "liabilities")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setActiveBsBox(activeBsBox === "liabilities" ? null : "liabilities")
                      }
                    }}
                    className={`w-full min-h-[150px] rounded border p-3 text-left transition ${
                      activeBsBox === "liabilities"
                        ? "border-[#d5b597] bg-[#fff8f2]"
                        : "border-[#e2c2a8] bg-white hover:bg-[#fffaf6]"
                    }`}
                  >
                    <div className="text-[13px] font-semibold text-[#8b5a34]">負債</div>
                    {activeBsBox === "liabilities" && (
                      <div className="relative mt-3 min-h-[150px]">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSelectNode("notes")
                          }}
                          className="absolute right-[-186px] top-6 rounded-md border border-[#e2c9b5] bg-[#fff7f1] px-3 py-1.5 text-[11px] font-semibold text-[#7b5638] shadow-sm"
                        >
                          注記
                        </button>
                        <div className="absolute right-[-140px] top-[24px] h-px w-[140px] bg-[#e5d2c2]" />

                        <div className="mx-auto w-[170px] space-y-2 text-[12px] text-[#7a563a]">
                          <div className="rounded border border-[#efd8c7] bg-white px-3 py-2.5">流動負債</div>
                          <div className="rounded border border-[#efd8c7] bg-white px-3 py-2.5">固定負債</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveBsBox(activeBsBox === "netAssets" ? null : "netAssets")}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setActiveBsBox(activeBsBox === "netAssets" ? null : "netAssets")
                      }
                    }}
                    className={`w-full min-h-[170px] rounded border p-3 text-left transition ${
                      activeBsBox === "netAssets"
                        ? "border-[#bca9d7] bg-[#faf6ff]"
                        : "border-[#cab9df] bg-white hover:bg-[#fcf8ff]"
                    }`}
                  >
                    <div className="text-[13px] font-semibold text-[#5f4a80]">純資産</div>
                    {activeBsBox === "netAssets" && (
                      <div className="relative mt-3 min-h-[170px]">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSelectNode("pl")
                          }}
                          className="absolute right-[-186px] top-10 rounded-md border border-[#d8c9eb] bg-[#f9f4ff] px-3 py-1.5 text-[11px] font-semibold text-[#5f4c7a] shadow-sm"
                        >
                          活動計算書
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onSelectNode("notes")
                          }}
                          className="absolute right-[-186px] top-[98px] rounded-md border border-[#d8c9eb] bg-[#f9f4ff] px-3 py-1.5 text-[11px] font-semibold text-[#5f4c7a] shadow-sm"
                        >
                          注記
                        </button>
                        <div className="absolute right-[-140px] top-[24px] h-px w-[140px] bg-[#ddd4e9]" />
                        <div className="absolute right-[-140px] top-[112px] h-px w-[140px] bg-[#ddd4e9]" />

                        <div className="mx-auto w-[170px] space-y-2 text-[12px] text-[#5d4f73]">
                          <div className="rounded border border-[#e4dcef] bg-white px-3 py-2.5">一般純資産</div>
                          <div className="rounded border border-[#e4dcef] bg-white px-3 py-2.5">指定純資産</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null
      }
    </div>
  )
}

function StructureMap() {
  const [hoveredId, setHoveredId] = useState<NodeId | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<SelectedTarget | null>(null)
  const [allRelationsVisible, setAllRelationsVisible] = useState(false)
  const [relationFocusNodeId, setRelationFocusNodeId] = useState<NodeId | null>(null)

  const isRelationNode = (id: string) =>
    id === "cashbook" || id === "daily-sheet" || id === "journal" || id === "inventory" || id === "notes"
  const isRelationEdge = (id: string) =>
    id === "voucher-cashbook" ||
    id === "voucher-daily-sheet" ||
    id === "voucher-journal" ||
    id === "bs-inventory" ||
    id === "bs-notes"

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedTarget(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const relationNodeMap: Partial<Record<NodeId, NodeId[]>> = {
    voucher: ["daily-sheet", "journal", "cashbook"],
    bs: ["inventory", "notes"],
    pl: ["inventory", "notes"],
  }
  const relationEdgeMap: Partial<Record<NodeId, string[]>> = {
    voucher: ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal"],
    bs: ["bs-inventory", "bs-notes"],
    pl: ["bs-inventory", "bs-notes"],
  }

  useEffect(() => {
    const visibleRelationNodes = new Set<NodeId>(
      allRelationsVisible
        ? (["cashbook", "daily-sheet", "journal", "inventory", "notes"] as NodeId[])
        : relationFocusNodeId
          ? (relationNodeMap[relationFocusNodeId] ?? [])
          : [],
    )
    const visibleRelationEdges = new Set<string>(
      allRelationsVisible
        ? ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal", "bs-inventory", "bs-notes"]
        : relationFocusNodeId
          ? (relationEdgeMap[relationFocusNodeId] ?? [])
          : [],
    )

    if (hoveredId && isRelationNode(hoveredId) && !visibleRelationNodes.has(hoveredId)) {
      setHoveredId(null)
    }
    if (selectedTarget?.type === "node" && isRelationNode(selectedTarget.id) && !visibleRelationNodes.has(selectedTarget.id as NodeId)) {
      setSelectedTarget(null)
    }
    if (selectedTarget?.type === "edge" && isRelationEdge(selectedTarget.id) && !visibleRelationEdges.has(selectedTarget.id)) {
      setSelectedTarget(null)
    }
  }, [allRelationsVisible, relationFocusNodeId, hoveredId, selectedTarget])

  const visibleNodes = useMemo(
    () => {
      const relationNodes = allRelationsVisible
        ? (["cashbook", "daily-sheet", "journal", "inventory", "notes"] as NodeId[])
        : relationFocusNodeId
          ? (relationNodeMap[relationFocusNodeId] ?? [])
          : []
      const relationSet = new Set<NodeId>(relationNodes)
      return NODES.filter((node) => (isRelationNode(node.id) ? relationSet.has(node.id) : true))
    },
    [allRelationsVisible, relationFocusNodeId],
  )

  const visibleEdges = useMemo(
    () => {
      const relationEdges = allRelationsVisible
        ? ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal", "bs-inventory", "bs-notes"]
        : relationFocusNodeId
          ? (relationEdgeMap[relationFocusNodeId] ?? [])
          : []
      const relationSet = new Set<string>(relationEdges)
      return EDGES.filter((edge) => (isRelationEdge(edge.id) ? relationSet.has(edge.id) : true))
    },
    [allRelationsVisible, relationFocusNodeId],
  )

  const relatedIds = useMemo(() => {
    if (!hoveredId) return null
    const traversalStart: NodeId = hoveredId === "pl" ? "bs" : hoveredId
    const upstream = collectUpstream(traversalStart, visibleEdges)
    const downstream = collectDownstream(traversalStart, visibleEdges)
    const merged = new Set<NodeId>([...Array.from(upstream), ...Array.from(downstream)])
    merged.add(hoveredId)
    const keepBsPlPaired = hoveredId !== "inventory"
    if (keepBsPlPaired) {
      if (merged.has("bs")) merged.add("pl")
      if (merged.has("pl")) merged.add("bs")
    }
    return merged
  }, [hoveredId, visibleEdges])

  const selectedNode =
    selectedTarget?.type === "node" ? visibleNodes.find((n) => n.id === selectedTarget.id) ?? null : null
  const selectedEdge =
    selectedTarget?.type === "edge" ? visibleEdges.find((e) => e.id === selectedTarget.id) ?? null : null
  const drawerOpen = !!selectedTarget

  return (
    <div className="h-full w-full overflow-auto bg-[#f3f7fc] p-0">
      <div className="w-full">
        <section className="h-full rounded-none border-0 bg-white p-4 shadow-none">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[18px] font-bold text-[#1f3f66]">会計構造理解ツール v0</h1>
              <p className="mt-1 text-[12px] text-[#5f7693]">入力 → 集計 → 表示 の3層で、帳票の役割を段階的に整理しています。</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAllRelationsVisible((prev) => !prev)
                if (!allRelationsVisible) {
                  setRelationFocusNodeId(null)
                }
              }}
              className={`rounded-md border px-3 py-1.5 text-[11px] font-semibold ${
                allRelationsVisible
                  ? "border-[#5d7fa7] bg-[#edf5ff] text-[#2e567f]"
                  : "border-[#bfd1e8] bg-white text-[#4f6784]"
              }`}
            >
              {allRelationsVisible ? "関係帳票を非表示" : "関係帳票を表示"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto overflow-y-hidden">
            <div className="relative h-[720px] w-[1480px] rounded-lg border border-[#d2deec] bg-[#fbfdff]">
              <div className="absolute inset-0">
                {LAYERS.map((layer) => (
                  <div
                    key={layer.id}
                    className="absolute left-3 right-3 rounded-md border border-[#d9e3f1] bg-white/80 px-4 pt-3"
                    style={{ top: `${layer.y}px`, height: `${layer.h}px` }}
                  >
                    <div className="text-[14px] font-bold text-[#2a537f]">{layer.title}</div>
                    <div className="mt-1 text-[11px] text-[#6a819f]">{layer.subtitle}</div>
                  </div>
                ))}
              </div>

              {STATEMENT_GROUP_FRAME && (
                <div
                  className="pointer-events-none absolute rounded-lg border border-dashed border-[#a8b9d1] bg-white/45"
                  style={{
                    left: `${STATEMENT_GROUP_FRAME.x}px`,
                    top: `${STATEMENT_GROUP_FRAME.y}px`,
                    width: `${STATEMENT_GROUP_FRAME.w}px`,
                    height: `${STATEMENT_GROUP_FRAME.h}px`,
                  }}
                />
              )}

              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1480 720" preserveAspectRatio="none">
                {visibleEdges.map((edge) => {
                  const from = visibleNodes.find((n) => n.id === edge.from)!
                  const to = visibleNodes.find((n) => n.id === edge.to)!
                  return (
                    <Edge
                      key={edge.id}
                      edge={edge}
                      from={from}
                      to={to}
                      highlighted={edgeIsHighlighted(edge, relatedIds)}
                      selected={selectedTarget?.type === "edge" && selectedTarget.id === edge.id}
                      onClick={(id) => {
                        setSelectedTarget({ type: "edge", id })
                      }}
                    />
                  )
                })}
              </svg>

              {visibleNodes.map((node) => (
                <Node
                  key={node.id}
                  node={node}
                  isDimmed={relatedIds ? !relatedIds.has(node.id) : false}
                  isSelected={selectedTarget?.type === "node" && selectedTarget.id === node.id}
                  onHover={setHoveredId}
                  onLeave={() => setHoveredId(null)}
                  onClick={(id) => {
                    if (id === "voucher" || id === "bs" || id === "pl") {
                      setRelationFocusNodeId((prev) => (prev === id ? null : id))
                    } else if (isRelationNode(id)) {
                      if (id === "cashbook" || id === "daily-sheet" || id === "journal") {
                        setRelationFocusNodeId("voucher")
                      } else if (id === "inventory") {
                        setRelationFocusNodeId("bs")
                      } else if (id === "notes") {
                        setRelationFocusNodeId("bs")
                      }
                      setSelectedTarget({ type: "node", id })
                    }
                  }}
                  onOpenDetail={(id) => setSelectedTarget({ type: "node", id })}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-[#122840]/30" onClick={() => setSelectedTarget(null)} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[72vw] min-w-[720px] transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full border-l border-[#9db8d7] bg-white p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold text-[#335a88]">詳細</div>
            <button
              type="button"
              onClick={() => setSelectedTarget(null)}
              className="rounded-md border border-[#bfd1e8] px-2 py-1 text-[11px] text-[#4f6784]"
            >
              閉じる
            </button>
          </div>
          <DetailPanel
            node={selectedNode}
            edge={selectedEdge}
            edges={visibleEdges}
            nodes={visibleNodes}
            onSelectNode={(id) => {
              if (id === "voucher" || id === "bs" || id === "pl" || isRelationNode(id)) {
                setRelationFocusNodeId(id === "inventory" || id === "notes" ? "bs" : id === "cashbook" || id === "daily-sheet" || id === "journal" ? "voucher" : id)
              }
              setSelectedTarget({ type: "node", id })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return <StructureMap />
}
