"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type AccountingParent = {
  code: string
  name: string
  children?: {
    code: string
    name: string
    note?: string
  }[]
}

// ==== ダミーデータ（親会計＋その配下） ====
// ※本番ではAPI/マスタから取得予定

export const DUMMY_ACCOUNTS: AccountingParent[] = [
  {
    code: "0001",
    name: "公益目的事業会計",
    children: [
      { code: "0001", name: "公1", note: "調査研究" },
      { code: "0002", name: "公2", note: "広報啓発" },
      { code: "0003", name: "公3", note: "講座" },
      { code: "0099", name: "共通" },
    ],
  },
  {
    code: "0051",
    name: "収益事業等会計",
    children: [
      { code: "0001", name: "収1", note: "施設貸与" },
      { code: "0099", name: "共通" },
    ],
  },
  {
    code: "0099",
    name: "法人会計",
    // 子なし
  },
]

export function AccountingSelectModal({
  open,
  onClose,
  onSelect,
  parentOnly = false,
}: {
  open: boolean
  onClose: () => void
  onSelect: (payload: {
    parentCode: string
    parentName: string
    childCode: string
    childName: string
    grandchildCode: string
    grandchildName: string
  }) => void
  // ← これを追加:
  // true のときは親会計だけを表示＆選択可能にする
  parentOnly?: boolean
}) {
  // ===== 先頭ゼロを非表示にするヘルパ =====
  const formatDisplayCode = (code: string): string => {
    return code.replace(/^0+/, "") || "0"
  }

  // ====== 検索フォーム state ======
  const [searchParent, setSearchParent] = useState("")
  const [searchChild, setSearchChild] = useState("")
  const [searchGrandchild, setSearchGrandchild] = useState("")
  const [searchName, setSearchName] = useState("")

  // 全展開チェック（親Onlyのときは使わないので初期trueで固定でもOK）
  const [expandAll, setExpandAll] = useState(true)

  // ユーザーが「これにしたいな」と一時的に選んでいるもの
  const [pendingSelect, setPendingSelect] = useState<{
    parentCode: string
    parentName: string
    childCode: string
    childName: string
    grandchildCode: string
    grandchildName: string
  } | null>(null)

  if (!open) return null

  // pendingSelect と一致するかどうかで行のハイライトを付ける
  function isRowActive(payload: {
    parentCode: string
    childCode: string
    grandchildCode: string
  }) {
    if (!pendingSelect) return false
    return (
      pendingSelect.parentCode === payload.parentCode &&
      pendingSelect.childCode === payload.childCode &&
      pendingSelect.grandchildCode === payload.grandchildCode
    )
  }

  // Enter相当：確定して呼び出し元に返す
  function handleConfirmEnter() {
    if (pendingSelect) {
      onSelect(pendingSelect)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* 背景クリックで閉じる */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* モーダル本体 */}
      <div
        className="
          absolute left-1/2 top-1/2
          w-[min(720px,95vw)]
          max-h-[80vh]
          -translate-x-1/2 -translate-y-1/2
          rounded-[4px] border border-[#7a9bc4] bg-white
          shadow-[0_10px_30px_rgba(0,0,0,0.4)]
          text-[13px] leading-tight text-[#1a1a1a]
          flex flex-col
        "
      >
        {/* ===== ヘッダー：検索条件エリア ===== */}
        <div
          className="border-b border-[#7a9bc4] bg-[#eef4ff] p-3"
          style={{
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.6) inset,0 1px 1px rgba(0,0,0,0.05)",
          }}
        >
          {/* 行1: ■ 検索条件 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-[12px] w-[12px] bg-black text-transparent leading-none select-none">
              ■
            </div>
            <div className="text-[13px] font-semibold text-[#1a1a1a]">
              検索条件
            </div>
          </div>

          {/* 行2: 会計番号(親/子/孫) + F5検索 */}
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <div className="text-[#1a1a1a] whitespace-nowrap leading-[24px]">
              会計番号
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              {/* 親コード */}
              <Input
                value={searchParent}
                onChange={(e) => setSearchParent(e.target.value)}
                className="h-[24px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
              />

              {/* 子コード（親Onlyなら隠す） */}
              {!parentOnly && (
                <Input
                  value={searchChild}
                  onChange={(e) => setSearchChild(e.target.value)}
                  className="h-[24px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                />
              )}

              {/* 孫コード（親Onlyなら隠す） */}
              {!parentOnly && (
                <Input
                  value={searchGrandchild}
                  onChange={(e) => setSearchGrandchild(e.target.value)}
                  className="h-[24px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                />
              )}

              {/* 右寄せスペーサー */}
              <div className="flex-1" />

              {/* F5 検索（ダミー） */}
              <Button
                variant="outline"
                className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[12px] font-medium leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
                onClick={() => {
                  // TODO: 今後ここでフィルタリング処理
                }}
              >
                F5 検索
              </Button>
            </div>
          </div>

          {/* 行3: 会計名 */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="text-[#1a1a1a] whitespace-nowrap leading-[24px]">
              会計名
            </div>
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="h-[24px] w-[220px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
            />
          </div>

          {/* 行4: 全展開（親Onlyなら表示しない） */}
          {!parentOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={expandAll}
                  onChange={(e) => setExpandAll(e.target.checked)}
                  className="h-[14px] w-[14px]"
                />
                <span className="text-[13px] text-[#1a1a1a]">全展開</span>
              </label>
            </div>
          )}
        </div>

        {/* ===== リスト領域 ===== */}
        <div className="flex-1 overflow-y-auto bg-white p-3 text-[13px] leading-[18px]">
          {DUMMY_ACCOUNTS.map((parent, pIdx) => {
            // 親クリック時のpayload
            const parentPayload = {
              parentCode: parent.code,
              parentName: parent.name,
              childCode: "",
              childName: "",
              grandchildCode: "",
              grandchildName: "",
            }
            const parentActive = isRowActive({
              parentCode: parent.code,
              childCode: "",
              grandchildCode: "",
            })

            return (
              <div key={pIdx} className="mb-2">
                {/* 親 行（常に表示・選択可能） */}
                <button
                  className={[
                    "flex w-full text-left rounded-[2px] px-1 py-[2px] hover:bg-[#eef4ff]",
                    parentActive ? "bg-[#dbe8ff]" : "",
                  ].join(" ")}
                  onClick={() => {
                    setPendingSelect(parentPayload)
                  }}
                >
                  <span className="text-[12px] pr-1 text-[#4a4a4a]">■</span>
                  <span className="font-semibold text-[#003399]">
                    {parent.code} {parent.name}
                  </span>
                </button>

                {/* 子 行（parentOnly のときは非表示） */}
                {!parentOnly &&
                  expandAll &&
                  parent.children?.map((child, cIdx) => {
                    const childPayload = {
                      parentCode: parent.code,
                      parentName: parent.name,
                      childCode: child.code,
                      childName:
                        child.name + (child.note ? ` ${child.note}` : ""),
                      grandchildCode: "",
                      grandchildName: "",
                    }
                    const childActive = isRowActive({
                      parentCode: parent.code,
                      childCode: child.code,
                      grandchildCode: "",
                    })

                    return (
                      <button
                        key={cIdx}
                        className={[
                          "ml-5 flex w-full text-left rounded-[2px] px-1 py-[2px] hover:bg-[#eef4ff]",
                          childActive ? "bg-[#dbe8ff]" : "",
                        ].join(" ")}
                        onClick={() => {
                          setPendingSelect(childPayload)
                        }}
                      >
                        <span className="text-[12px] pr-1 text-[#4a4a4a]">
                          ・
                        </span>
                        <span className="whitespace-pre-wrap">
                          <span className="font-medium text-[#1a1a1a]">
                            {child.code} {child.name}
                          </span>
                          <span className="text-[12px] text-[#1a1a1a]">
                            {child.note ? ` ${child.note}` : ""}
                          </span>
                        </span>
                      </button>
                    )
                  })}
              </div>
            )
          })}
        </div>

        {/* ===== フッター（Enter / F6 戻る） ===== */}
        <div className="flex items-center justify-end gap-2 border-t border-[#7a9bc4] bg-[#eef4ff] px-3 py-2 text-[12px] text-[#1a1a1a]">
          <Button
            variant="outline"
            className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[12px] leading-tight shadow-[inset_0_0_0_1px_#fff]"
            onClick={handleConfirmEnter}
          >
            Enter
          </Button>

          <Button
            variant="outline"
            className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[12px] leading-tight shadow-[inset_0_0_0_1px_#fff]"
            onClick={onClose}
          >
            F6 戻る
          </Button>
        </div>
      </div>
    </div>
  )
}
