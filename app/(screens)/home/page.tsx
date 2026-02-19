"use client"

import { useEffect, useMemo, useState } from "react"

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

const RELATION_STYLE: Record<
  EdgeData["label"],
  { badgeBg: string; badgeBorder: string; badgeText: string }
> = {
  記録: {
    badgeBg: "#edf3ff",
    badgeBorder: "#bdd0f7",
    badgeText: "#234f9a",
  },
  ログ: {
    badgeBg: "#f4eeff",
    badgeBorder: "#d2c2ef",
    badgeText: "#5a3d8b",
  },
  日次集計: {
    badgeBg: "#ecfaef",
    badgeBorder: "#b8ddc0",
    badgeText: "#2f6d3f",
  },
  期間集計: {
    badgeBg: "#e9f8f9",
    badgeBorder: "#b9dde0",
    badgeText: "#216770",
  },
  抽出: {
    badgeBg: "#fff6ea",
    badgeBorder: "#efd0ad",
    badgeText: "#925d22",
  },
  確定: {
    badgeBg: "#ffefef",
    badgeBorder: "#efc1c1",
    badgeText: "#8f3232",
  },
  詳細化: {
    badgeBg: "#fff3e8",
    badgeBorder: "#efceb2",
    badgeText: "#8a4f1d",
  },
  補足: {
    badgeBg: "#f2f4f7",
    badgeBorder: "#d2d8df",
    badgeText: "#4f5b6a",
  },
}

const NODES: NodeData[] = [
  {
    id: "voucher",
    label: "伝票",
    role: "すべての会計データの出発点",
    x: 280,
    y: 300,
  },
  {
    id: "ledger",
    label: "総勘定元帳",
    role: "伝票を科目別に記録した累積帳票",
    x: 530,
    y: 300,
  },
  {
    id: "trial",
    label: "試算表",
    role: "全科目を集計し整合性を確認する中間帳票",
    x: 780,
    y: 300,
  },
  {
    id: "bs",
    label: "貸借対照表",
    role: "期末時点の財政状態を示す帳票",
    x: 1030,
    y: 240,
  },
  {
    id: "pl",
    label: "活動計算書",
    role: "一期間の活動結果を示す帳票",
    x: 1030,
    y: 380,
  },
  {
    id: "inventory",
    label: "財産目録",
    role: "貸借対照表の残高内訳を具体化する帳票",
    x: 1030,
    y: 110,
  },
  {
    id: "notes",
    label: "注記",
    role: "貸借対照表・活動計算書の背景を補足する帳票",
    x: 1280,
    y: 310,
  },
  {
    id: "cashbook",
    label: "現預金出納帳",
    role: "現金・預金取引を抽出して資金の動きを確認する帳票",
    x: 280,
    y: 470,
  },
  {
    id: "daily-sheet",
    label: "日計表",
    role: "1日の取引を集計して入力漏れや異常を確認する日次帳票",
    x: 280,
    y: 130,
  },
  {
    id: "journal",
    label: "仕訳帳",
    role: "すべての仕訳を時系列で確認する監査ログ",
    x: 40,
    y: 300,
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
    why: "期末時点の残高を“公式な姿”として固定する。",
    checkpoint: "決算整理後の期末残高が確定しているか",
    fromLabel: "試算表",
    toLabel: "貸借対照表",
  },
  {
    id: "trial-pl",
    from: "trial",
    to: "pl",
    label: "確定",
    why: "一定期間の増減を“公式な結果”として固定する。",
    checkpoint: "対象期間の増減が確定しているか",
    fromLabel: "試算表",
    toLabel: "活動計算書",
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
    why: "貸借対照表の数値の背景情報を説明するため。",
    checkpoint: "主要な残高に必要な説明が付されているか。",
    fromLabel: "貸借対照表",
    toLabel: "注記",
  },
  {
    id: "pl-notes",
    from: "pl",
    to: "notes",
    label: "補足",
    why: "活動計算書の数値の背景情報を説明するため。",
    checkpoint: "重要な増減要因が説明されているか。",
    fromLabel: "活動計算書",
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

function centerY(node: NodeData) {
  return node.y + NODE_H / 2
}

function rightX(node: NodeData) {
  return node.x + NODE_W
}

function leftX(node: NodeData) {
  return node.x
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
  if (edge.id === "voucher-daily-sheet" || edge.id === "voucher-cashbook") {
    const x = centerX(from)
    const startY = to.y < from.y ? from.y : from.y + NODE_H
    const endY = to.y < from.y ? to.y + NODE_H : to.y
    return `${x},${startY} ${x},${endY}`
  }

  if (edge.id === "voucher-journal") {
    const y = centerY(from)
    return `${from.x},${y} ${to.x + NODE_W},${y}`
  }

  if (edge.id === "bs-inventory") {
    const x = centerX(from)
    const startY = from.y
    const endY = to.y + NODE_H
    return `${x},${startY} ${x},${endY}`
  }

  const startX = rightX(from)
  const startY = centerY(from)
  const endX = leftX(to)
  const endY = centerY(to)

  if (startY === endY) {
    return `${startX},${startY} ${endX},${endY}`
  }

  const branchX = startX + 70
  return `${startX},${startY} ${branchX},${startY} ${branchX},${endY} ${endX},${endY}`
}

function edgeLabelPosition(edge: EdgeData, from: NodeData, to: NodeData) {
  if (edge.id === "voucher-daily-sheet" || edge.id === "voucher-cashbook") {
    const x = centerX(from)
    const startY = to.y < from.y ? from.y : from.y + NODE_H
    const endY = to.y < from.y ? to.y + NODE_H : to.y
    return {
      x: x + 44,
      y: (startY + endY) / 2,
    }
  }

  if (edge.id === "voucher-journal") {
    return {
      x: (from.x + (to.x + NODE_W)) / 2,
      y: centerY(from) - 18,
    }
  }

  if (edge.id === "bs-inventory") {
    const x = centerX(from)
    const startY = from.y
    const endY = to.y + NODE_H
    return {
      x: x + 46,
      y: (startY + endY) / 2,
    }
  }

  const startX = rightX(from)
  const startY = centerY(from)
  const endX = leftX(to)
  const endY = centerY(to)

  if (startY === endY) {
    return {
      x: (startX + endX) / 2,
      y: startY,
    }
  }

  const branchX = startX + 70
  return {
    x: (startX + branchX) / 2,
    y: startY,
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
  const isDailySheet = node.id === "daily-sheet"
  const isCashbook = node.id === "cashbook"
  const isJournal = node.id === "journal"
  const isSubNode = isDailySheet || isCashbook || isJournal
  const nodeTone = "border-[#b6cbe3] bg-white"
  const nodeWidth = isSubNode ? 160 : NODE_W
  const nodeHeight = isSubNode ? 66 : NODE_H

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
      className={`absolute rounded-lg border bg-white px-3 py-2 text-left shadow-sm transition ${
        isDimmed ? "opacity-25" : "opacity-100"
      } ${isSelected ? "border-[#2d5e9a] ring-2 ring-[#a8c3e2]" : nodeTone} ${isSubNode ? "hover:-translate-y-0.5 hover:shadow-md" : ""}`}
      style={{ left: `${node.x}px`, top: `${node.y}px`, width: `${nodeWidth}px`, height: `${nodeHeight}px` }}
    >
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
      {(isDailySheet || isCashbook || isJournal) && (
        <div className="mb-1">
          <span
            className="rounded-full border border-[#cbd7e7] bg-[#f6f9fd] px-1.5 py-0.5 text-[9px] font-semibold text-[#516985]"
          >
            {isDailySheet ? "日次" : isCashbook ? "抽出" : "ログ"}
          </span>
        </div>
      )}
      <div className={`${isSubNode ? "text-[14px]" : "text-[15px]"} font-bold text-[#1f3f66]`}>{node.label}</div>
      <div className={`${isSubNode ? "text-[10px]" : "text-[11px]"} mt-1 text-[#5f7693]`}>{node.role}</div>
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
        stroke="#2d5e9a"
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
    return edges
      .filter((e) => e.to === node.id)
      .map((e) => nodes.find((n) => n.id === e.from)?.label)
      .filter((v): v is string => !!v)
  }, [node, edges, nodes])

  const outgoing = useMemo(() => {
    if (!node) return []
    return edges
      .filter((e) => e.from === node.id)
      .map((e) => nodes.find((n) => n.id === e.to)?.label)
      .filter((v): v is string => !!v)
  }, [node, edges, nodes])

  const [activeBsBox, setActiveBsBox] = useState<"assets" | "liabilities" | "netAssets" | null>(null)

  useEffect(() => {
    if (node?.id !== "bs") {
      setActiveBsBox(null)
    }
  }, [node])

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
    id === "bs-notes" ||
    id === "pl-notes"

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
    pl: ["notes"],
  }
  const relationEdgeMap: Partial<Record<NodeId, string[]>> = {
    voucher: ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal"],
    bs: ["bs-inventory", "bs-notes"],
    pl: ["pl-notes"],
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
        ? ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal", "bs-inventory", "bs-notes", "pl-notes"]
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
        ? ["voucher-cashbook", "voucher-daily-sheet", "voucher-journal", "bs-inventory", "bs-notes", "pl-notes"]
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
    const upstream = collectUpstream(hoveredId, visibleEdges)
    const downstream = collectDownstream(hoveredId, visibleEdges)
    return new Set<NodeId>([...Array.from(upstream), ...Array.from(downstream)])
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
              <p className="mt-1 text-[12px] text-[#5f7693]">会計は一本のデータフローであり、試算表から決算帳票へ分岐します。</p>
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
            <div className="relative h-[640px] w-[1550px] rounded-lg border border-[#d2deec] bg-[#fbfdff]">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1550 640" preserveAspectRatio="none">
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
