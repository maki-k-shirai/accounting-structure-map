"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const DIAGRAM_TITLE = "帳票のつながり（v0）"

type NodeKind = "container" | "section"

type DiagramNode = {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
  w: number
  h: number
}

type DiagramEdge = {
  id: string
  from: string
  to: string
  label: string
  type: "line" | "arrow"
  showInSteps: string[]
}

type DiagramStep = {
  id: string
  label: string
  highlightNodes: string[]
  highlightEdges: string[]
  callout?: {
    text: string
    targetId: string
    showClickBadge?: boolean
  }
}

function createDiagramNodes(): DiagramNode[] {
  const boxY = 12
  const leftBoxH = 66
  const rightBoxH = 72
  const boxW = 26
  const gap = 6

  const leftX = 4
  const centerX = leftX + boxW + gap
  const rightX = centerX + boxW + gap

  const sectionPadX = 2.5
  const sectionPadY = 12
  const sectionGapY = 4
  const bsGapX = 2
  const bsSectionW = (boxW - sectionPadX * 2 - bsGapX) / 2
  const bsRightX = bsSectionW + bsGapX

  const bsSectionH = (leftBoxH - sectionPadY * 2 - sectionGapY) / 2
  const rightExtraH = 14

  const plInnerW = boxW - sectionPadX * 2
  const plHalfW = (plInnerW - 2) / 2
  const plSectionH = 18

  return [
    {
      id: "bs_left",
      label: "貸借対照表（期首）",
      kind: "container",
      x: leftX,
      y: boxY,
      w: boxW,
      h: leftBoxH,
    },
    {
      id: "pl_center",
      label: "活動計算書（当期）",
      kind: "container",
      x: centerX,
      y: boxY,
      w: boxW,
      h: leftBoxH,
    },
    {
      id: "bs_right",
      label: "貸借対照表（期末）",
      kind: "container",
      x: rightX,
      y: boxY,
      w: boxW,
      h: rightBoxH,
    },

    {
      id: "bs_left_asset",
      label: "資産",
      kind: "section",
      x: leftX + sectionPadX,
      y: boxY + sectionPadY,
      w: bsSectionW,
      h: bsSectionH * 2 + sectionGapY,
    },
    {
      id: "bs_left_liability",
      label: "負債",
      kind: "section",
      x: leftX + sectionPadX + bsRightX,
      y: boxY + sectionPadY,
      w: bsSectionW,
      h: bsSectionH,
    },
    {
      id: "bs_left_equity",
      label: "純資産",
      kind: "section",
      x: leftX + sectionPadX + bsRightX,
      y: boxY + sectionPadY + bsSectionH + sectionGapY,
      w: bsSectionW,
      h: bsSectionH,
    },

    {
      id: "pl_revenue",
      label: "収益",
      kind: "section",
      x: centerX + sectionPadX,
      y: boxY + 22,
      w: plHalfW,
      h: 34,
    },
    {
      id: "pl_expense",
      label: "費用",
      kind: "section",
      x: centerX + sectionPadX + plHalfW + 2,
      y: boxY + 22,
      w: plHalfW,
      h: 18,
    },
    {
      id: "pl_delta",
      label: "当期増減額",
      kind: "section",
      x: centerX + sectionPadX + plHalfW + 2,
      y: boxY + 46,
      w: plHalfW,
      h: 14,
    },

    {
      id: "bs_right_asset",
      label: "資産",
      kind: "section",
      x: rightX + sectionPadX,
      y: boxY + sectionPadY,
      w: bsSectionW,
      h: bsSectionH * 2 + sectionGapY + rightExtraH,
    },
    {
      id: "bs_right_liability",
      label: "負債",
      kind: "section",
      x: rightX + sectionPadX + bsRightX,
      y: boxY + sectionPadY,
      w: bsSectionW,
      h: bsSectionH,
    },
    {
      id: "bs_right_equity",
      label: "純資産",
      kind: "section",
      x: rightX + sectionPadX + bsRightX,
      y: boxY + sectionPadY + bsSectionH + sectionGapY,
      w: bsSectionW,
      h: bsSectionH + rightExtraH,
    },
    {
      id: "bs_right_equity_increase",
      label: "当期増減額",
      kind: "section",
      x: rightX + sectionPadX + bsRightX,
      y: boxY + sectionPadY + bsSectionH + sectionGapY + bsSectionH,
      w: bsSectionW,
      h: rightExtraH,
    },
  ]
}

const edges: DiagramEdge[] = [
  {
    id: "pl_to_bs",
    from: "pl_center",
    to: "bs_right",
    label: "この2枚はセット",
    type: "line",
    showInSteps: ["pair"],
  },
  {
    id: "delta_to_equity",
    from: "pl_delta",
    to: "bs_right_equity_increase",
    label: "当期増減が純資産に反映",
    type: "arrow",
    showInSteps: ["equity"],
  },
]

const steps: DiagramStep[] = [
  {
    id: "pair",
    label: "この2枚はセット",
    highlightNodes: ["pl_center", "bs_right"],
    highlightEdges: [],
  },
  {
    id: "equity",
    label: "結果は純資産へ",
    highlightNodes: ["pl_delta", "bs_right_equity_increase"],
    highlightEdges: ["delta_to_equity"],
  },
  {
    id: "output",
    label: "出力方法をみる",
    highlightNodes: ["bs_right"],
    highlightEdges: [],
    callout: {
      text: "出力方法をみる",
      targetId: "bs_right",
      showClickBadge: true,
    },
  },
]

function NodeBox({
  node,
  isHighlighted,
}: {
  node: DiagramNode
  isHighlighted: boolean
}) {
  const isIncrease = node.id === "bs_right_equity_increase"
  const base = node.kind === "container"
    ? "border border-[#b9c6d8] bg-white"
    : isIncrease
      ? "border border-dashed border-[#8aa2bf] bg-[#f7fbff]"
      : "border border-[#c4cdd8] bg-white"

  const highlight = isHighlighted
    ? node.kind === "container"
      ? "border-2 border-[#2f5d9f] shadow-[0_0_0_2px_rgba(47,93,159,0.15)]"
      : "ring-2 ring-[#4a7ebb]/60 shadow-[0_0_0_3px_rgba(74,126,187,0.12)]"
    : ""

  return (
    <div
      className={`absolute rounded-[4px] ${base} ${highlight}`}
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${node.w}%`,
        height: `${node.h}%`,
      }}
    >
      {node.kind === "container" ? (
        <div className="flex h-full flex-col">
          <div className="border-b border-[#d6deea] bg-[#f6f8fc] px-2 py-1 text-[12px] font-semibold text-[#3a4a5b]">
            {node.label}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-[12px] font-medium text-[#2d3a46] text-center leading-tight">
          {node.label.split("\n").map((line, idx) => (
            <span key={idx} className="block">
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type CalloutPlacement = "right" | "left" | "top" | "bottom"

function computeCalloutPlacement({
  container,
  target,
  callout,
}: {
  container: DOMRect
  target: DOMRect
  callout: DOMRect
}) {
  const candidates: CalloutPlacement[] = ["right", "left", "top", "bottom"]
  const gap = 8

  const fits = (placement: CalloutPlacement) => {
    const pos = getCalloutPosition({
      container,
      target,
      callout,
      placement,
      gap,
    })
    return (
      pos.left >= container.left &&
      pos.top >= container.top &&
      pos.left + callout.width <= container.right &&
      pos.top + callout.height <= container.bottom
    )
  }

  const placement =
    candidates.find((candidate) => fits(candidate)) ?? "left"

  return getCalloutPosition({
    container,
    target,
    callout,
    placement,
    gap,
  })
}

function getCalloutPosition({
  container,
  target,
  callout,
  placement,
  gap,
}: {
  container: DOMRect
  target: DOMRect
  callout: DOMRect
  placement: CalloutPlacement
  gap: number
}) {
  let left = target.right + gap
  let top = target.top + target.height / 2 - callout.height / 2

  if (placement === "left") {
    left = target.left - callout.width - gap
  } else if (placement === "top") {
    left = target.left + target.width / 2 - callout.width / 2
    top = target.top - callout.height - gap
  } else if (placement === "bottom") {
    left = target.left + target.width / 2 - callout.width / 2
    top = target.bottom + gap
  }

  const clampedLeft = Math.min(
    Math.max(left, container.left + 6),
    container.right - callout.width - 6,
  )
  const clampedTop = Math.min(
    Math.max(top, container.top + 6),
    container.bottom - callout.height - 6,
  )

  return {
    left: clampedLeft - container.left,
    top: clampedTop - container.top,
  }
}

function DiagramCanvas({
  nodes,
  activeStep,
  boundsRef,
  onCalloutClick,
}: {
  nodes: DiagramNode[]
  activeStep: DiagramStep
  boundsRef: React.RefObject<HTMLDivElement | null>
  onCalloutClick?: () => void
}) {
  const nodeMap = useMemo(() => {
    return nodes.reduce<Record<string, DiagramNode>>((acc, node) => {
      acc[node.id] = node
      return acc
    }, {})
  }, [nodes])

  const highlightedNodes = new Set(activeStep.highlightNodes)
  const highlightedEdges = new Set(activeStep.highlightEdges)
  const equity = nodeMap["bs_right_equity"]
  const equityIncrease = nodeMap["bs_right_equity_increase"]
  const visibleEdges = edges.filter((edge) =>
    edge.showInSteps.includes(activeStep.id),
  )

  const calloutRef = useRef<HTMLDivElement | null>(null)
  const [calloutStyle, setCalloutStyle] = useState<{
    left: number
    top: number
  } | null>(null)

  useLayoutEffect(() => {
    if (!activeStep.callout) return
    if (!boundsRef.current || !calloutRef.current) return
    const targetNode = nodeMap[activeStep.callout.targetId]
    if (!targetNode) return

    const update = () => {
      if (!boundsRef.current || !calloutRef.current) return
      const container = boundsRef.current.getBoundingClientRect()
      const callout = calloutRef.current.getBoundingClientRect()
      const target = {
        left: container.left + (targetNode.x / 100) * container.width,
        top: container.top + (targetNode.y / 100) * container.height,
        width: (targetNode.w / 100) * container.width,
        height: (targetNode.h / 100) * container.height,
        right: container.left + (targetNode.x / 100) * container.width + (targetNode.w / 100) * container.width,
        bottom: container.top + (targetNode.y / 100) * container.height + (targetNode.h / 100) * container.height,
      } as DOMRect

      const pos = computeCalloutPlacement({
        container,
        target,
        callout,
      })
      setCalloutStyle(pos)
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [activeStep.callout, nodeMap, boundsRef])

  return (
    <div className="relative w-full h-[300px] sm:h-[340px]">
      {nodes.map((node) => (
        <NodeBox
          key={node.id}
          node={node}
          isHighlighted={highlightedNodes.has(node.id)}
        />
      ))}

      {equity && equityIncrease && (
        <div
          className="absolute border-t border-dashed border-[#8aa2bf]"
          style={{
            left: `${equity.x}%`,
            top: `${equityIncrease.y}%`,
            width: `${equity.w}%`,
          }}
        />
      )}

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id="arrow-head"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#4a7ebb" />
          </marker>
        </defs>
        {visibleEdges.map((edge) => {
          const from = nodeMap[edge.from]
          const to = nodeMap[edge.to]
          if (!from || !to) return null

          const startX = from.x + from.w
          const startY = from.y + from.h / 2
          const endX = to.x
          const endY = to.y + to.h / 2

          const active = highlightedEdges.has(edge.id)
          const stroke = active ? "#2f5d9f" : "#7c8fa6"

          return (
            <g key={edge.id}>
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke={stroke}
                strokeWidth={active ? 1.8 : 1.2}
                markerEnd={edge.type === "arrow" ? "url(#arrow-head)" : undefined}
              />
            </g>
          )
        })}
      </svg>

      {visibleEdges.map((edge) => {
        const from = nodeMap[edge.from]
        const to = nodeMap[edge.to]
        if (!from || !to) return null

        const midX = (from.x + from.w + to.x) / 2
        const midY = (from.y + from.h / 2 + to.y + to.h / 2) / 2
        const active = highlightedEdges.has(edge.id)

        return (
          <div
            key={`${edge.id}-label`}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2",
              "rounded-full border bg-white px-3 py-1 text-[12px] font-medium",
              active
                ? "border-[#4a7ebb] text-[#2f5d9f] shadow-[0_0_0_2px_rgba(74,126,187,0.15)]"
                : "border-[#c7d2df] text-[#5a6c82]",
            ].join(" ")}
            style={{ left: `${midX}%`, top: `${midY}%` }}
          >
            {edge.label}
          </div>
        )
      })}

      {activeStep.callout && nodeMap[activeStep.callout.targetId] && (
        <div
          ref={calloutRef}
          className="absolute flex items-start gap-2 rounded-[10px] border border-[#9fb2cc] bg-white px-4 py-2 text-[12px] font-medium text-[#2f5d9f] shadow-[0_0_0_2px_rgba(47,93,159,0.12)] max-w-[240px] max-h-[180px] overflow-auto cursor-pointer"
          style={calloutStyle ? { left: calloutStyle.left, top: calloutStyle.top } : { left: 0, top: 0, opacity: 0 }}
          onClick={() => onCalloutClick?.()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onCalloutClick?.()
          }}
        >
          {activeStep.callout.showClickBadge && (
            <span className="inline-flex items-center whitespace-nowrap leading-none rounded-full bg-[#e8f0fb] px-[10px] py-[4px] text-[10px] font-semibold text-[#2f5d9f]">
              Click
            </span>
          )}
          <span className="leading-tight">{activeStep.callout.text}</span>
        </div>
      )}
    </div>
  )
}

export function TutorialPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const nodes = useMemo(() => createDiagramNodes(), [])
  const activeStep = steps[stepIndex]
  const contentBoundsRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (open) {
      setStepIndex(0)
    }
  }, [open])

  const startMenuTour = () => {
    window.dispatchEvent(
      new CustomEvent("accounting:menu-tour", { detail: { step: 0 } })
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        titleText={DIAGRAM_TITLE}
        className="w-[min(1360px,98vw)] rounded-[6px] border border-[#9fb2cc]"
      >
        <div className="flex items-center justify-between border-b border-[#c6d3e4] bg-[#f2f5fb] px-4 py-2">
          <div className="text-[14px] font-semibold text-[#2c3a4b]">
            {DIAGRAM_TITLE}
          </div>
          <div className="text-[12px] text-[#5c6b7c]">
            ステップ {stepIndex + 1} / {steps.length}
          </div>
        </div>

        <div className="bg-white px-4 py-4 overflow-hidden">
          <div className="relative overflow-hidden" ref={contentBoundsRef}>
            <DiagramCanvas
              nodes={nodes}
              activeStep={activeStep}
              boundsRef={contentBoundsRef}
              onCalloutClick={() => {
                if (activeStep.id === "output") {
                  startMenuTour()
                }
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#e1e7f0] pt-3 text-[12px] text-[#5c6b7c]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[4px] border border-[#c7d2df] bg-white px-4 py-1.5 text-[13px] font-medium text-[#4a5568] hover:bg-[#f2f4f8]"
            >
              閉じる
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStepIndex((prev) => Math.max(prev - 1, 0))
                }
                className="rounded-[4px] border border-[#c7d2df] bg-white px-4 py-1.5 text-[13px] font-medium text-[#4a5568] hover:bg-[#f2f4f8]"
              >
                戻る
              </button>
              {stepIndex < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setStepIndex((prev) =>
                      Math.min(prev + 1, steps.length - 1),
                    )
                  }
                  className="rounded-[4px] border border-[#9fb2cc] bg-white px-4 py-1.5 text-[13px] font-medium text-[#2f5d9f] hover:bg-[#eef4ff]"
                >
                  次へ
                </button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
