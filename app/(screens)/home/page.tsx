"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

type RelationType = "transfer" | "check" | "supplement"

type ReportCard = {
  id: string
  title: string
  subtitle: string
  href: string
  external?: boolean
  x: number
  y: number
  previewTone: string
}

type Edge = {
  from: string
  to: string
  type: RelationType
}

const relationMeta: Record<
  RelationType,
  { label: string; stroke: string; dash?: string; description: string }
> = {
  transfer: {
    label: "転記",
    stroke: "#4f81bd",
    description: "数値が次の帳票へ受け渡される関係",
  },
  check: {
    label: "整合",
    stroke: "#2f8f63",
    dash: "6 4",
    description: "帳票間を突合して整合性を確認する関係",
  },
  supplement: {
    label: "補足",
    stroke: "#8f6db8",
    dash: "2 5",
    description: "注記・内訳で読み解きを補強する関係",
  },
}

const cards: ReportCard[] = [
  {
    id: "voucher",
    title: "伝票入力",
    subtitle: "日次の起点",
    href: "/voucher-entry",
    x: 8,
    y: 16,
    previewTone: "from-[#f8fbff] to-[#e8f1ff]",
  },
  {
    id: "cashbook",
    title: "現預金出納帳",
    subtitle: "日次確認",
    href: "/cashbook",
    x: 8,
    y: 62,
    previewTone: "from-[#f8fbff] to-[#eaf6ff]",
  },
  {
    id: "monthly",
    title: "月次集計",
    subtitle: "月次整理",
    href: "/funding-list",
    x: 38,
    y: 16,
    previewTone: "from-[#f8fcff] to-[#eef4ff]",
  },
  {
    id: "inventory",
    title: "財産目録",
    subtitle: "整合帳票",
    href: "/pdf/bs-of-which-breakdown.pdf",
    external: true,
    x: 38,
    y: 62,
    previewTone: "from-[#faf8ff] to-[#f0ecff]",
  },
  {
    id: "bs",
    title: "貸借対照表",
    subtitle: "中心帳票",
    href: "/balance-sheet",
    x: 66,
    y: 39,
    previewTone: "from-[#eef5ff] to-[#dfeeff]",
  },
  {
    id: "notes",
    title: "注記・内訳",
    subtitle: "補足資料",
    href: "/pdf/account-system-changes.png",
    external: true,
    x: 66,
    y: 70,
    previewTone: "from-[#fbf8ff] to-[#f2ecff]",
  },
  {
    id: "output",
    title: "決算帳票セット",
    subtitle: "最終出力",
    href: "/pdf/bs.pdf",
    external: true,
    x: 86,
    y: 39,
    previewTone: "from-[#fff9f2] to-[#fff0dd]",
  },
]

const edges: Edge[] = [
  { from: "voucher", to: "monthly", type: "transfer" },
  { from: "cashbook", to: "monthly", type: "check" },
  { from: "monthly", to: "bs", type: "transfer" },
  { from: "inventory", to: "bs", type: "check" },
  { from: "notes", to: "bs", type: "supplement" },
  { from: "bs", to: "output", type: "transfer" },
]

const CARD_W = 20
const CARD_H = 22

function cardCenter(c: ReportCard) {
  return {
    x: c.x + CARD_W / 2,
    y: c.y + CARD_H / 2,
  }
}

function connectedIds(targetId: string) {
  const ids = new Set<string>([targetId])
  edges.forEach((e) => {
    if (e.from === targetId) ids.add(e.to)
    if (e.to === targetId) ids.add(e.from)
  })
  return ids
}

export default function HomePage() {
  const [activeId, setActiveId] = useState<string | null>("bs")
  const [hoverId, setHoverId] = useState<string | null>(null)

  const focusId = hoverId ?? activeId

  const activeCard = useMemo(
    () => cards.find((c) => c.id === (activeId ?? "")) ?? cards.find((c) => c.id === "bs")!,
    [activeId],
  )

  const focusIds = useMemo(() => {
    if (!focusId) return null
    return connectedIds(focusId)
  }, [focusId])

  const isDimCard = (id: string) => {
    if (!focusIds) return false
    return !focusIds.has(id)
  }

  const isDimEdge = (e: Edge) => {
    if (!focusId) return false
    return e.from !== focusId && e.to !== focusId
  }

  return (
    <div className="h-full w-full overflow-auto bg-[radial-gradient(circle_at_top,_#f8fcff_0%,_#ebf3ff_55%,_#dce8f9_100%)] p-4">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4">
        <header className="rounded-xl border border-[#9fb6d8] bg-white/90 p-4 shadow-sm">
          <h1 className="text-[18px] font-bold text-[#1f3f66]">帳票関連図モック（2Dサムネイル）</h1>
          <p className="mt-1 text-[12px] text-[#566f8e]">
            帳票をカードで俯瞰し、関係線を見ながら理解する。ホバーで関連を強調、クリックで説明表示。
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-xl border border-[#9fb6d8] bg-[#edf4ff] p-3 shadow-inner">
            <div className="relative hidden min-h-[620px] overflow-hidden rounded-lg border border-[#bfd1e8] bg-white md:block">
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {edges.map((e, idx) => {
                  const from = cards.find((c) => c.id === e.from)
                  const to = cards.find((c) => c.id === e.to)
                  if (!from || !to) return null
                  const p1 = cardCenter(from)
                  const p2 = cardCenter(to)
                  const meta = relationMeta[e.type]
                  return (
                    <line
                      key={`${e.from}-${e.to}-${idx}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={meta.stroke}
                      strokeWidth={isDimEdge(e) ? 0.5 : 1.8}
                      strokeDasharray={meta.dash}
                      opacity={isDimEdge(e) ? 0.2 : 0.95}
                    />
                  )
                })}
              </svg>

              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveId(card.id)}
                  onMouseEnter={() => setHoverId(card.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`absolute rounded-lg border bg-white p-2 text-left shadow-sm transition ${
                    isDimCard(card.id) ? "opacity-35" : "opacity-100"
                  } ${activeId === card.id ? "border-[#4f81bd] ring-2 ring-[#9fc0e4]" : "border-[#bfd1e8]"}`}
                  style={{ left: `${card.x}%`, top: `${card.y}%`, width: `${CARD_W}%`, minHeight: `${CARD_H}%` }}
                >
                  <div className={`h-[68px] rounded-md border border-[#d4e0f0] bg-gradient-to-br ${card.previewTone} p-1.5`}>
                    <div className="h-full rounded border border-[#d6e3f2] bg-white/85 p-1">
                      <div className="h-1.5 w-2/3 rounded bg-[#c7d8ec]" />
                      <div className="mt-1 h-1.5 w-5/6 rounded bg-[#d6e4f4]" />
                      <div className="mt-1 h-1.5 w-1/2 rounded bg-[#dce8f6]" />
                      <div className="mt-2 h-1.5 w-4/5 rounded bg-[#cfdef0]" />
                    </div>
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-[#23466f]">{card.title}</div>
                  <div className="mt-0.5 text-[11px] text-[#5c7390]">{card.subtitle}</div>
                </button>
              ))}
            </div>

            <div className="space-y-2 md:hidden">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveId(card.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left ${
                    activeId === card.id ? "border-[#4f81bd] bg-[#edf5ff]" : "border-[#bfd1e8] bg-white"
                  }`}
                >
                  <div className="text-[12px] font-semibold text-[#23466f]">{card.title}</div>
                  <div className="text-[11px] text-[#5c7390]">{card.subtitle}</div>
                </button>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-[#9fb6d8] bg-white p-3 shadow-sm">
            <div className="rounded-lg border border-[#bfd1e8] bg-[#f7fbff] px-3 py-2">
              <div className="text-[12px] font-semibold text-[#2d4869]">選択中の帳票</div>
              <div className="mt-1 text-[15px] font-bold text-[#1f4f84]">{activeCard.title}</div>
              <div className="mt-1 text-[12px] text-[#5d7390]">{activeCard.subtitle}</div>
              <Link
                href={activeCard.href}
                target={activeCard.external ? "_blank" : undefined}
                rel={activeCard.external ? "noopener noreferrer" : undefined}
                className="mt-3 inline-block rounded-md border border-[#8fb1d8] bg-[#edf5ff] px-3 py-1.5 text-[12px] font-semibold text-[#2b5687]"
              >
                帳票を開く
              </Link>
            </div>

            <div className="mt-3 rounded-lg border border-[#c7d6e8] bg-white px-3 py-2">
              <div className="text-[12px] font-semibold text-[#2d4869]">関係型の凡例</div>
              <div className="mt-2 space-y-2">
                {(Object.keys(relationMeta) as RelationType[]).map((key) => {
                  const meta = relationMeta[key]
                  return (
                    <div key={key} className="rounded-md border border-[#d7e2f0] bg-[#fbfdff] px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`block w-10 border-t-2 ${meta.line}`} />
                        <span className="text-[11px] font-semibold text-[#315984]">{meta.label}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#60728b]">{meta.description}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-[#d0ddef] bg-white px-3 py-2">
              <div className="text-[12px] font-semibold text-[#2d4869]">この帳票と直接つながる関係</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {edges
                  .filter((e) => e.from === activeCard.id || e.to === activeCard.id)
                  .map((e, idx) => (
                    <span
                      key={`${e.from}-${e.to}-${idx}`}
                      className="rounded-full border border-[#bfd1e8] bg-[#f7fbff] px-2 py-0.5 text-[10px] text-[#4f6683]"
                    >
                      {relationMeta[e.type].label}: {cards.find((c) => c.id === (e.from === activeCard.id ? e.to : e.from))?.title}
                    </span>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
