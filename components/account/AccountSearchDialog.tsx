// components/account/AccountSearchDialog.tsx
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
import {
  BASIC_ACCOUNT_CATEGORIES,
  type AccountCategory,
  type AccountNode,
  getAccountFullName,
} from "@/components/account/account-data"

// ==== タブ定義 ====
const DEFAULT_TAB_ITEMS = [
  { id: "myShared", label: "マイ科目（共用）" },
  { id: "myPersonal", label: "マイ科目（個人）" },
  { id: "all", label: "全科目" },
  { id: "bs", label: "貸借科目" },
  { id: "activity", label: "収支科目" },
  { id: "pl", label: "活動科目" },
  { id: "netAssetsPl", label: "純資産科目" },
] as const

// 現金出納帳の科目範囲選択から使うときのタブセット
const DEPOSIT_TAB_ITEMS = [
  { id: "myShared", label: "マイ科目（共用）" },
  { id: "myPersonal", label: "マイ科目（個人）" },
  { id: "deposit", label: "普通・当座預金科目" },
] as const

type TabId =
  | (typeof DEFAULT_TAB_ITEMS)[number]["id"]
  | (typeof DEPOSIT_TAB_ITEMS)[number]["id"]

// ===== 型定義 =====
export type PickedAccount = {
  code: string
  /** 伝票入力などで使う表示名（name1 + name2） */
  name: string
  name1?: string
  name2?: string
  /** 系統の1段目（親） */
  parentName?: string
  /** 系統の2段目（子） */
  childName?: string
  /** 系統の3段目（孫） */
  grandchildName?: string
  isParent?: boolean
}

export type AccountSearchDialogProps = {
  open: boolean
  onClose: () => void
  title?: string
  onPick?: (row: PickedAccount) => void
  disabledCodes?: string[]

  // 初期タブ & 初期展開ノード
  initialCategoryId?: TabId
  initialExpandedCodes?: string[]

 // タブ構成モード
  tabMode?: "default" | "depositOnly"

}

// =====================================================
// 「表示タブ」の単一の真実：account-data.ts の meta.uiTab を参照する
// =====================================================

type UiTabId = "netAssetsPl"

function collectNodesByUiTab(
  categories: AccountCategory[],
  uiTab: UiTabId,
): AccountNode[] {
  const out: AccountNode[] = []
  const walk = (n: AccountNode) => {
    if (n.meta.uiTab === uiTab) out.push(n)
    n.children?.forEach(walk)
  }
  categories.forEach((c) => c.nodes.forEach(walk))
  return out
}

function removeUiTabNodes(node: AccountNode, uiTab: UiTabId): AccountNode | null {
  // 自分が該当なら丸ごと非表示
  if (node.meta.uiTab === uiTab) return null

  if (!node.children || node.children.length === 0) return node

  const filteredChildren = node.children
    .map((c) => removeUiTabNodes(c, uiTab))
    .filter(Boolean) as AccountNode[]

  return {
    ...node,
    children: filteredChildren.length > 0 ? filteredChildren : undefined,
  }
}

// ==== 普通・当座預金科目（accountTypeCode = 1114）のみ抽出したツリーを作る ====
function buildDepositAccountNodes(): AccountNode[] {
  const result: AccountNode[] = []

  const assetCategory = BASIC_ACCOUNT_CATEGORIES.find((c) => c.id === "asset")
  if (!assetCategory) return result

  // 再帰的に 1114 科目だけをコピーしていく
  const dfs = (
    node: AccountNode,
    hasDepositAncestor: boolean,
    pushToRoot: (n: AccountNode) => void,
  ): AccountNode | null => {
    const isDeposit = node.meta.accountTypeCode === "1114"

    // 子ノードを再帰的にチェック（1114 のものだけ残す）
    const filteredChildren: AccountNode[] = []
    if (node.children) {
      for (const child of node.children) {
        const clonedChild = dfs(child, hasDepositAncestor || isDeposit, pushToRoot)
        if (clonedChild) {
          filteredChildren.push(clonedChild)
        }
      }
    }

    // 自分自身が 1114 の場合だけノードとして残す
    if (isDeposit) {
      const cloned: AccountNode = {
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      }

      // 自分より上に 1114 の祖先がいなければ「子科目（ルート）」として登録
      if (!hasDepositAncestor) {
        pushToRoot(cloned)
      }

      return cloned
    }

    // 自分が 1114 じゃなくて、1114 の子孫もいなければ破棄
    if (filteredChildren.length === 0) {
      return null
    }

    // 自分が 1114 じゃなくても、下に 1114 がある場合は、
    // ここでは親としては使わず（親も 1114 だけにしたいので）、子がルート or その配下に入るので何も返さない
    return null
  }

  for (const root of assetCategory.nodes) {
    dfs(root, false, (n) => result.push(n))
  }

  return result
}

// ==== 親判定ヘルパ ====
function isParentNode(node: AccountNode): boolean {
  const hasChildren = !!node.children && node.children.length > 0
  const looksParent = !!node.code && /(00|000)$/.test(node.code)
  return !!node.code && (hasChildren || looksParent)
}

export function AccountSearchDialog({
  open,
  onClose,
  title = "科目検索",
  onPick,
  disabledCodes,
  initialCategoryId,
  initialExpandedCodes,
  tabMode = "default",
}: AccountSearchDialogProps) {
  // ここでモードに応じてタブ配列を決定
  const TAB_ITEMS: readonly { id: TabId; label: string }[] =
    tabMode === "depositOnly" ? DEPOSIT_TAB_ITEMS : DEFAULT_TAB_ITEMS

  // タブ
  const [activeTab, setActiveTab] = React.useState<TabId>(
    initialCategoryId ?? "all",
  )

  const [query, setQuery] = React.useState("")
  const [showSummary, setShowSummary] = React.useState(false)

  // 展開状態
  const [expandedCodes, setExpandedCodes] = React.useState<Set<string>>(
    () => new Set(initialExpandedCodes ?? []),
  )

  const isSearching = query.trim().length > 0

  const handleToggleExpand = React.useCallback((code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }, [])

  
  // ★ モーダルが開くたびに初期タブ＆初期展開を反映
  React.useEffect(() => {
    if (!open) return

    if (initialCategoryId) {
      setActiveTab(initialCategoryId)
    }
    if (initialExpandedCodes && initialExpandedCodes.length > 0) {
      setExpandedCodes(new Set(initialExpandedCodes))
    } else {
      setExpandedCodes(new Set())
    }
  }, [open, initialCategoryId, initialExpandedCodes])

  // 無効コードセット
  const disabledCodeSet = React.useMemo(
    () => new Set(disabledCodes ?? []),
    [disabledCodes],
  )

  const isCodeDisabled = React.useCallback(
    (code?: string) => !!(code && disabledCodeSet.has(code)),
    [disabledCodeSet],
  )

  // 選択状態
  const [selectedNode, setSelectedNode] = React.useState<AccountNode | null>(
    null,
  )
  const [selectedLineage, setSelectedLineage] = React.useState<string[]>([])

  const handleChangeTab = (id: TabId) => {
    setActiveTab(id)
    setSelectedNode(null)
    setSelectedLineage([])
    setExpandedCodes(new Set())
  }

  // タブごとの表示カテゴリ
const visibleCategories = React.useMemo<AccountCategory[]>(() => {
  if (activeTab === "all") {
    return BASIC_ACCOUNT_CATEGORIES
  }

  if (activeTab === "bs") {
    return BASIC_ACCOUNT_CATEGORIES.filter(
      (c) =>
        c.id === "asset" ||
        c.id === "liability" ||
        c.id === "netAssets",
    )
  }

  if (activeTab === "activity") {
    return BASIC_ACCOUNT_CATEGORIES.filter(
      (c) => c.id === "activityIncome" || c.id === "activityExpense",
    )
  }

  if (activeTab === "pl") {
    // 収益・費用（活動科目）に属していても、UI上は「純資産科目」タブに出したいノードは除外
    return BASIC_ACCOUNT_CATEGORIES
      .filter((c) => c.id === "revenue" || c.id === "expense")
      .map((cat) => ({
        ...cat,
        nodes: cat.nodes
          .map((n) => removeUiTabNodes(n, "netAssetsPl"))
          .filter(Boolean) as AccountNode[],
      }))
  }

  // ★ 普通・当座預金科目タブ
  if (activeTab === "deposit") {
    const depositNodes = buildDepositAccountNodes()
    if (depositNodes.length === 0) return []

    return [
      {
        id: "asset",
        label: "普通・当座預金科目",
        nodes: depositNodes, // 初期表示は「子科目」だけ／孫はツリー展開
      },
    ]
  }

  if (
    activeTab === "myShared" ||
    activeTab === "myPersonal" ||
    activeTab === "netAssetsPl"
  ) {
    return []
  }

  return BASIC_ACCOUNT_CATEGORIES
}, [activeTab])

  // 「純資産科目」タブに表示するノード（account-data.ts の meta.uiTab が唯一の条件）
  const netAssetsPlNodes = React.useMemo(
    () => collectNodesByUiTab(BASIC_ACCOUNT_CATEGORIES, "netAssetsPl"),
    [],
  )

 // ハイライト表示をセットにして子へ渡す
  // ==== 確定 ====
  function commitSelection() {
    if (!selectedNode || !selectedNode.code) return

    const displayName = getAccountFullName(selectedNode)
    const p0 = selectedLineage[0] || undefined
    const p1 = selectedLineage[1] || undefined
    const p2 = selectedLineage[2] || undefined

    onPick?.({
      code: selectedNode.code,
      name: displayName,
      name1: selectedNode.name1,
      name2: selectedNode.name2,
      parentName: p0,
      childName: p1,
      grandchildName: p2,
      isParent: isParentNode(selectedNode),
    })
    onClose()
  }

  // キーボード Enter でも確定
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        commitSelection()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, selectedNode, selectedLineage])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="h-[720px] w-[960px] max-h-[720px] max-w-[960px]">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* ===== ヘッダー ===== */}
        <div className="flex items-start justify-between border-b border-[#bfbfbf] bg-[#d4e4ff] px-2 py-1 text-[12px]">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="h-[20px] w-[20px] rounded-[2px] border border-[#7a9bc4] bg-white"
          >
            ×
          </button>
        </div>

        <DialogBody className="bg-white p-0 text-[12px]">      
          {/* 検索条件 */}
          <div className="border-b border-[#bfbfbf] bg-[#eef3ff] p-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[12px]">
                  <div>◾️検索条件</div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div>科目名／コード</div>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-[24px] flex-1 border border-[#7a9bc4] px-1 text-[12px]"
                  />
                </div>
              </div>

              <div className="flex w-[110px] flex-col gap-2">
                <Button
                  variant="outline"
                  className="h-[28px] text-[12px]"
                  onClick={() => {
                    setQuery("")
                    setSelectedNode(null)
                    setSelectedLineage([])
                    setExpandedCodes(new Set())
                  }}
                >
                  クリア
                </Button>
                <Button
                  variant="outline"
                  className="h-[28px] text-[12px]"
                  disabled
                >
                  マイ科目保守
                </Button>
              </div>
            </div>

            {/* タブバー */}
            <div className="mt-3 flex flex-wrap gap-[2px] border-t border-[#bfbfbf] pt-2">
              {TAB_ITEMS.map((tab) => {
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleChangeTab(tab.id)}
                    className={`rounded-[2px] border px-2 py-[4px] text-[12px] ${
                      active
                        ? "border-[#7a9bc4] bg-[#dbe4ff] font-semibold"
                        : "border-[#bfbfbf] bg-white hover:bg-[#eef4ff]"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 科目リスト */}
          <div 
            className="h-[520px] overflow-auto bg-white p-2">
            {activeTab === "netAssetsPl" ? (
              netAssetsPlNodes.map((n, i) => (
                <CategoryNodeView
                  key={i}
                  node={n}
                  depth={0}
                  lineageNames={[]}
                  onSelect={(node, lineage) => {
                    if (node.code) {
                      setSelectedNode(node)
                      setSelectedLineage(lineage)
                    }
                  }}
                  selectedNode={selectedNode}
                  query={query}
                  showSummary={showSummary}
                  isCodeDisabled={isCodeDisabled}
                  expandedCodes={expandedCodes}
                  onToggleExpand={handleToggleExpand}
                  isSearching={isSearching}
                />
              ))
            ) : visibleCategories.length === 0 ? (
              <div className="text-[12px] text-[#777]" />
            ) : (
              visibleCategories.map((cat) => (
                <div key={cat.id} className="mb-2">
                  {cat.nodes.map((n, i) => (
                    <CategoryNodeView
                      key={i}
                      node={n}
                      depth={0}
                      lineageNames={[]}
                      onSelect={(node, lineage) => {
                        if (node.code) {
                          setSelectedNode(node)
                          setSelectedLineage(lineage)
                        }
                      }}
                      selectedNode={selectedNode}
                      query={query}
                      showSummary={showSummary}
                      isCodeDisabled={isCodeDisabled}
                      expandedCodes={expandedCodes}
                      onToggleExpand={handleToggleExpand}
                      isSearching={isSearching}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogBody>

        {/* ===== フッター（Enter / 戻る） ===== */}
        <DialogFooter className="flex justify-end gap-2 border-t border-[#ccc] bg-[#f9f9f9] px-3 py-2">
          <Button
            variant="outline"
            className="h-[28px] min-w-[80px] bg-[#e0ebff] text-[12px] font-semibold"
            onClick={commitSelection}
          >
            Enter
          </Button>
          <Button
            variant="outline"
            className="h-[28px] min-w-[80px] bg-white text-[12px]"
            onClick={onClose}
          >
            戻る
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// ==== CategoryNodeView ====
function CategoryNodeView({
  node,
  depth,
  lineageNames,
  onSelect,
  selectedNode,
  query,
  showSummary,
  isCodeDisabled,
  expandedCodes,
  onToggleExpand,
  isSearching,
}: {
  node: AccountNode
  depth: number
  lineageNames: string[]
  onSelect: (node: AccountNode, lineage: string[]) => void
  selectedNode: AccountNode | null
  query: string
  showSummary: boolean
  isCodeDisabled?: (code?: string) => boolean
  expandedCodes: Set<string>
  onToggleExpand: (code: string) => void
  isSearching: boolean
}) {
  const hasChildren = !!node.children && node.children.length > 0

  const baseFullName = getAccountFullName(node)

  const currentLineage = React.useMemo(
    () => [...lineageNames, baseFullName],
    [lineageNames, baseFullName],
  )

  const hit = query
    ? baseFullName.includes(query) || node.code?.includes(query)
    : true

  const isSelected = selectedNode?.code === node.code && !!node.code
  const isDisabled = isCodeDisabled?.(node.code) ?? false

  const isExpanded = node.code ? expandedCodes.has(node.code) : false
  const shouldShowChildren = hasChildren && (isSearching || isExpanded)

  const isParent = hasChildren || isParentNode(node)

  const row = (
  <div
    data-account-code={node.code ?? ""}
    className={`
      flex items-center rounded-[2px] py-[2px] pr-2
      ${
        isSelected
          ? "border border-[#d4c45a] bg-[#fff7cc]"
          : ""
      }
      ${
        isDisabled
          ? "cursor-default text-[#999999] opacity-80"
          : "cursor-pointer"
      }
    `}
    onClick={() => {
      if (!node.code || isDisabled) return
      if (isParent) {
        onToggleExpand(node.code)
      }
      onSelect(node, currentLineage)
    }}
  >
    <div
      className="flex items-center"
      style={{ paddingLeft: depth * 12 }}
    >
      {hasChildren ? (
        <button
          type="button"
          className="mr-1 flex h-[14px] w-[14px] items-center justify-center rounded-[2px] border border-[#b0b0b0] bg-white text-[10px] leading-[10px]"
          onClick={(e) => {
            e.stopPropagation()
            if (node.code) onToggleExpand(node.code)
          }}
        >
          {isSearching || isExpanded ? "－" : "＋"}
        </button>
      ) : (
        <span className="mr-1 w-[14px]" />
      )}
    </div>

    <div className="min-w-[90px] max-w-[90px] px-2 text-right tabular-nums">
      {node.code ?? ""}
    </div>
    <div className={`ml-2 flex-1 ${!hit ? "opacity-50" : ""}`}>
      {baseFullName}
      {showSummary && !node.code && (
        <span className="ml-2 text-[11px] text-[#666]">＜集計科目＞</span>
      )}
    </div>
  </div>
)

  return (
    <div className="text-[12px] leading-tight text-[#1a1a1a]">
      {row}

      {shouldShowChildren && (
        <div className="ml-4 border-l border-dotted border-[#999] pl-2">
          {node.children!.map((child, idx) => (
            <CategoryNodeView
              key={idx}
              node={child}
              depth={depth + 1}
              lineageNames={currentLineage}
              onSelect={onSelect}
              selectedNode={selectedNode}
              query={query}
              showSummary={showSummary}
              isCodeDisabled={isCodeDisabled}
              expandedCodes={expandedCodes}
              onToggleExpand={onToggleExpand}
              isSearching={isSearching}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ★ 普通・当座預金用: 指定 accountTypeCode のノードだけを抽出
function collectNodesByAccountTypeCode(
  nodes: AccountNode[],
  targetTypeCode: string,
): AccountNode[] {
  const result: AccountNode[] = []

  const cloneWithChildren = (node: AccountNode): AccountNode => ({
    ...node,
    children: node.children
      ? node.children
          .filter((c) => c.meta.accountTypeCode === targetTypeCode)
          .map(cloneWithChildren)
      : undefined,
  })

  const walk = (node: AccountNode) => {
    if (node.meta.accountTypeCode === targetTypeCode) {
      result.push(cloneWithChildren(node))
    }
    node.children?.forEach(walk)
  }

  nodes.forEach(walk)
  return result
}
