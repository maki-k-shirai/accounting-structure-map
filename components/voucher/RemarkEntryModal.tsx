// components/voucher/RemarkEntryModal.tsx
"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FundingSearchModal,
  type FundingPickPayload,
} from "@/components/funding/FundingSearchModal"

type AccountKind = "PL" | "IncomeExpense" | "BS" | "Other"

export type RemarkSubmitPayload = {
  remarkCode: string
  remarkMain: string
  remarkSub: string
  party?: { name?: string; regNo?: string }
  project?: {
    code1?: string
    code2?: string
    code3?: string
    code4?: string
  }
  funding?: {
    code1?: string
    code2?: string
    code3?: string
    code4?: string
  }
  /** 財源保留フラグ */
  fundingOnHold?: boolean
  fundingType?: "一般" | "指定"
  tax: {
    category: string
    taxableAmount?: string | null
    innerTaxAmount?: string | null
    display: string
  }
}

export type RemarkEntryModalProps = {
  open: boolean
  onClose: () => void
  side: "debit" | "credit"
  initialRemark?: string
  lineLabel?: string
  accountKind?: AccountKind
  onSubmit: (payload: RemarkSubmitPayload) => void
  initialFundingType?: "一般" | "指定"
  accountingCode: string
  accountingDisplayCode: string
  accountingName: string
  // ★ フォーカス先（デフォルトは「一般・指定」）
  autoFocusField?: "fundingType" | "remark"
}

export function RemarkEntryModal({
  open,
  onClose,
  side,
  initialRemark = "",
  lineLabel,
  accountKind = "Other",
  onSubmit,
  initialFundingType = "一般",
  accountingCode,
  accountingDisplayCode,
  accountingName,
  autoFocusField = "fundingType",
}: RemarkEntryModalProps) {
  // --- 関係者・摘要
  const [partyName, setPartyName] = useState("")
  const [partyRegNo, setPartyRegNo] = useState("")
  const [memoCode, setMemoCode] = useState("")
  const [memoText, setMemoText] = useState("")
  const [memoText2, setMemoText2] = useState("")

  // --- 事業
  const [projectCode1, setProjectCode1] = useState("")
  const [projectCode2, setProjectCode2] = useState("")
  const [projectCode3, setProjectCode3] = useState("")
  const [projectCode4, setProjectCode4] = useState("")

  // --- 財源（コード＋名称フルパス）
  const [fundingCode1, setFundingCode1] = useState("")
  const [fundingCode2, setFundingCode2] = useState("")
  const [fundingCode3, setFundingCode3] = useState("")
  const [fundingCode4, setFundingCode4] = useState("")
  const [fundingNamePath, setFundingNamePath] = useState("") // 親〜ひ孫まで
  const [fundingModalOpen, setFundingModalOpen] = useState(false)

  // --- 財源保留フラグ
  const [fundingOnHold, setFundingOnHold] = useState(false)

  // --- 一般・指定
  const [fundingType, setFundingType] = useState<"一般" | "指定">("一般")

  // --- 消費税
  const [taxCategory, setTaxCategory] = useState(
    "112:課税仕入10%、課税"
  )

  // === 表示制御 ===
  const showFundingTypeRow =
    accountKind === "PL" || accountKind === "IncomeExpense"
  const showTaxBlocks = accountKind !== "BS"
  const showProjectBlocks = accountKind !== "BS"
  const showFundingBlocks = showProjectBlocks

  const renderFundingTypeRow =
    showFundingTypeRow && showProjectBlocks

  // === フォーカス対象 ref ===
  const fundingTypeRef = useRef<HTMLDivElement | null>(null)
  const remarkCodeRef = useRef<HTMLInputElement | null>(null)

  // 追加：モーダル内でのガイド起動タイミング制御
  const [focusReady, setFocusReady] = useState(false)

  // 開いたときの初期化
  useEffect(() => {
    if (open) {
      setMemoCode("")
      setMemoText(initialRemark ?? "")
      setMemoText2("")
      setPartyName("")
      setPartyRegNo("")
      // 事業
      setProjectCode1("")
      setProjectCode2("")
      setProjectCode3("")
      setProjectCode4("")
      // 財源
      setFundingCode1("")
      setFundingCode2("")
      setFundingCode3("")
      setFundingCode4("")
      setFundingNamePath("")
      setFundingModalOpen(false)
      setFundingOnHold(false)
      // 区分
      setFundingType(initialFundingType ?? "一般")
      // 税
      setTaxCategory("112:課税仕入10%、課税")
    }
  }, [open, initialRemark, initialFundingType])

  // Dialogの内部autoFocus完了を待って、次ティックでガイドを有効化
  useEffect(() => {
    if (open) {
      setFocusReady(false)
      const t = setTimeout(() => setFocusReady(true), 0)
      return () => clearTimeout(t)
    } else {
      setFocusReady(false)
    }
  }, [open])

  // ガイド有効化後に実際の要素へフォーカス
  useEffect(() => {
    if (!open || !focusReady) return
    const target =
      autoFocusField === "remark"
        ? remarkCodeRef.current
        : fundingTypeRef.current // fundingType がデフォルト
    const id = window.setTimeout(() => target?.focus(), 0)
    return () => clearTimeout(id)
  }, [open, focusReady, autoFocusField])

  const displayLineLabel =
    lineLabel?.trim() ||
    `${side === "debit" ? "借方" : "貸方"} 1行目`

  const taxDisplay = useMemo(() => taxCategory, [taxCategory])
  const descId = "remark-desc"

  // 財源の階層名を縦表示用に分解
  const fundingNameLevels = useMemo(
    () => (fundingNamePath ? fundingNamePath.split(" / ") : []),
    [fundingNamePath]
  )

  const handleFundingPick = (picked: FundingPickPayload) => {
    setFundingCode1(picked.code1 ?? "")
    setFundingCode2(picked.code2 ?? "")
    setFundingCode3(picked.code3 ?? "")
    setFundingCode4(picked.code4 ?? "")
    setFundingNamePath(picked.namePath ?? "")
  }

  const clearFundingNamePath = () => setFundingNamePath("")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-describedby={descId}
        className="fixed left-1/2 top-1/2 z-[200] w-[min(750px,95vw)] max-w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-[4px] border border-[#7a9bc4] bg-white p-0 shadow-[0_20px_40px_rgba(0,0,0,0.4)] text-[13px] leading-tight text-[#1a1a1a]"
      >
        {/* タイトル帯 */}
        <div className="border-b border-[#7a9bc4] bg-[#eef2fa] px-3 py-[6px] text-[12px]">
          摘要・関係者入力画面
        </div>

        {/* 本体 */}
        <div className="border-b border-[#7a9bc4] bg-[#eaf2ff]">
          {/* 入力対象明細情報 */}
          <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
            <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
              入力対象明細情報
            </div>
            <div className="px-2 py-2">
              <div id={descId} className="text-[12px] leading-[16px]">
                {displayLineLabel}
              </div>
            </div>
          </div>

          {/* 関係者 */}
          <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
            <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
              関係者
            </div>
            <div className="flex flex-col gap-2 px-2 py-2">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <button className="h-[24px] min-w-[28px] rounded-[2px] border border-[#7a9bc4] bg-white text-[12px] shadow-[inset_0_0_0_1px_#fff]">
                    参
                  </button>
                </div>
                <div className="text-[12px]">登録番号</div>
                <div className="flex items-center gap-1">
                  <span className="select-none text-[12px]">T</span>
                  <Input
                    value={partyRegNo}
                    onChange={(e) => setPartyRegNo(e.target.value)}
                    className="h-[24px] w-[120px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                </div>
              </div>
              <Input
                value={partyName ? `${partyName}` : ""}
                readOnly
                className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px] read-only:bg-[#f3f3f3]"
              />
            </div>
          </div>

          {/* 摘要 */}
          <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
            <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
              摘要
            </div>
            <div className="flex flex-col gap-2 px-2 py-2">
              <div className="flex items-center gap-2">
                <Input
                  ref={remarkCodeRef}
                  value={memoCode}
                  onChange={(e) => setMemoCode(e.target.value)}
                  className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                />
                <button className="h-[24px] min-w-[28px] rounded-[2px] border border-[#7a9bc4] bg-white text-[12px] shadow-[inset_0_0_0_1px_#fff]">
                  参
                </button>
              </div>
              <Input
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
              />
              <Input
                value={memoText2}
                onChange={(e) => setMemoText2(e.target.value)}
                className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
              />
            </div>
          </div>

          {/* 事業（BS科目のときは非表示） */}
          {showProjectBlocks && (
            <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
              <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
                事業
              </div>
              <div className="flex flex-col gap-3 px-2 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={projectCode1}
                    onChange={(e) => setProjectCode1(e.target.value)}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={projectCode2}
                    onChange={(e) => setProjectCode2(e.target.value)}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={projectCode3}
                    onChange={(e) => setProjectCode3(e.target.value)}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={projectCode4}
                    onChange={(e) => setProjectCode4(e.target.value)}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <button className="h-[24px] min-w-[28px] rounded-[2px] border border-[#7a9bc4] bg-white text-[12px] shadow-[inset_0_0_0_1px_#fff]">
                    参
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 財源（BS科目のとき非表示） */}
          {showFundingBlocks && (
            <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
              <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
                財源
              </div>
              <div className="flex flex-col gap-2 px-2 py-2">
                {/* コード行 */}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={fundingCode1}
                    onChange={(e) => {
                      setFundingCode1(e.target.value)
                      clearFundingNamePath()
                    }}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={fundingCode2}
                    onChange={(e) => {
                      setFundingCode2(e.target.value)
                      clearFundingNamePath()
                    }}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={fundingCode3}
                    onChange={(e) => {
                      setFundingCode3(e.target.value)
                      clearFundingNamePath()
                    }}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <span className="text-[12px]">ー</span>
                  <Input
                    value={fundingCode4}
                    onChange={(e) => {
                      setFundingCode4(e.target.value)
                      clearFundingNamePath()
                    }}
                    className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                  />
                  <button
                    className="h-[24px] min-w-[28px] rounded-[2px] border border-[#7a9bc4] bg-white text-[12px] shadow-[inset_0_0_0_1px_#fff]"
                    onClick={() => setFundingModalOpen(true)}
                  >
                    参
                  </button>

                  {/* 保留チェックボックス */}
                  <label className="ml-4 inline-flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      className="h-[14px] w-[14px]"
                      checked={fundingOnHold}
                      onChange={(e) => setFundingOnHold(e.target.checked)}
                    />
                    <span>保留</span>
                  </label>
                </div>

                {/* 財源名（親→子→孫→ひ孫を縦にテキスト表示） */}
                <div className="mt-1 min-h-[36px] text-[12px] leading-[16px]">
                  {fundingNameLevels.map((name, idx) => (
                    <div key={idx}>{name}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 一般・指定（ラジオボタン） */}
          {renderFundingTypeRow && (
            <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
              <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
                一般・指定
              </div>
              <div className="px-2 py-2">
                <div
                  ref={fundingTypeRef}
                  tabIndex={-1}
                  className="inline-flex items-center gap-4"
                >
                  <label className="inline-flex items-center gap-1 text-[12px]">
                    <input
                      type="radio"
                      name="fundingType"
                      value="一般"
                      checked={fundingType === "一般"}
                      onChange={(e) => {
                        const v = e.target.value as "一般" | "指定"
                        setFundingType(v)
                      }}
                    />
                    <span>一般</span>
                  </label>
                  <label className="inline-flex items-center gap-1 text-[12px]">
                    <input
                      type="radio"
                      name="fundingType"
                      value="指定"
                      checked={fundingType === "指定"}
                      onChange={(e) => {
                        const v = e.target.value as "一般" | "指定"
                        setFundingType(v)
                      }}
                    />
                    <span>指定</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 消費税・免除理由 */}
          {showTaxBlocks && (
            <>
              <div className="grid grid-cols-[140px_1fr] border-b border-[#7a9bc4]">
                <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
                  消費税
                </div>
                <div className="flex flex-col gap-2 px-2 py-2">
                  <select
                    className="h-[24px] w-full max-w-[300px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px] outline-none"
                    value={taxCategory}
                    onChange={(e) => setTaxCategory(e.target.value)}
                  >
                    <option value="112:課税仕入10%、課税">
                      112:課税仕入10%、課税
                    </option>
                    <option value="113:課税仕入10%、非課税">
                      113:課税仕入10%、非課税
                    </option>
                  </select>
                  <div className="text-[12px] leading-[16px]">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex gap-1">
                        <span>課税対象額</span>
                        <span></span>
                      </div>
                      <div className="flex gap-1">
                        <span>内税金額</span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr]">
                <div className="border-r border-[#7a9bc4] bg-[#cfe0ff] px-2 py-2 text-[12px] font-medium">
                  適格請求書免除理由
                </div>
                <div className="px-2 py-2">
                  <select
                    className="h-[24px] w-full max-w-[300px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px] outline-none"
                    defaultValue="0:非該当"
                  >
                    <option value="0:非該当">0:非該当</option>
                    <option value="1:免税事業者">1:免税事業者</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end gap-2 bg-[#eef2fa] px-3 py-2">
          <div className="inline-flex">
            <Button
              type="button"
              className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
              onClick={() => {
                onSubmit({
                  remarkCode: memoCode,
                  remarkMain: memoText,
                  remarkSub: memoText2,
                  party: {
                    name: partyName,
                    regNo: partyRegNo,
                  },
                  project: showProjectBlocks
                    ? {
                        code1: projectCode1,
                        code2: projectCode2,
                        code3: projectCode3,
                        code4: projectCode4,
                      }
                    : undefined,
                  funding: showFundingBlocks
                    ? {
                        code1: fundingCode1,
                        code2: fundingCode2,
                        code3: fundingCode3,
                        code4: fundingCode4,
                      }
                    : undefined,
                  fundingOnHold: showFundingBlocks
                    ? fundingOnHold
                    : undefined,
                  fundingType:
                    renderFundingTypeRow ? fundingType : undefined,
                  tax: showTaxBlocks
                    ? {
                        category: taxCategory,
                        display: taxDisplay,
                      }
                    : { category: "", display: "" },
                })

                onClose()
              }}
            >
              ↵ Enter
            </Button>
          </div>

          <Button
            type="button"
            className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[13px] leading-tight text-[#1a1a1a] shadow-[inset_0_0_0_1px_#fff]"
            onClick={onClose}
          >
            F6 戻る
          </Button>
        </div>

        <DialogTitle className="sr-only">摘要・関係者入力</DialogTitle>

        {/* 財源検索モーダル */}
        {showFundingBlocks && (
          <FundingSearchModal
            open={fundingModalOpen}
            onClose={() => setFundingModalOpen(false)}
            onPick={(p) => {
              handleFundingPick(p)
              setFundingModalOpen(false)
            }}
            accountingCode={accountingCode}
            accountingDisplayCode={accountingDisplayCode}
            accountingName={accountingName}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
