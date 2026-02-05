// app/(screens)/voucher-entry/page.tsx
"use client"

import { useState, useMemo, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import { AccountingSelectModal } from "@/components/account/AccountingSelectModal"
import { AccountSearchDialog, type PickedAccount } from "@/components/account/AccountSearchDialog"
import { RemarkEntryModal } from "@/components/voucher/RemarkEntryModal"
import {
  buildActivityToPLMap,
  buildCodeToParentNameMapFor,
  type AccountNode,
} from "@/components/account/account-data"
import { resolveAccountKind, isFundingTargetCode, resolveSecuritiesGainLossTarget, type AccountKind } from "@/components/account/account-kind"

type PLMapped = {
  code: string
  parentName: string
  childName: string
  kind: "PL" | "Other"
}

type Option = { code: string; name: string }

function getDesignatedOptionsForLocal(_plCode: string): Option[] {
  return [
    { code: "100101", name: "国庫補助金" },
    { code: "100104", name: "地方公共団体補助金" },

  ]
}

export default function VoucherEntryPage() {
  const router = useRouter()

  // ===== マスタ系（useMemo） =====
  // 収支→PL 紐付け、PL派生ツリーの親科目名マップ
  const activityToPL = useMemo(() => buildActivityToPLMap(), [])
  const plParentMap = useMemo(() => buildCodeToParentNameMapFor("pl"), [])
  // 純資産科目（net_assets）の親科目名マップ
  const netAssetParentMap = useMemo(
    () => buildCodeToParentNameMapFor("net_assets"),
    []
  )


  // ===== 画面フェーズ & メッセージ =====
  const [phase, setPhase] = useState<
    "header" | "detail" | "transferPreview" | "assignDesignated" | "confirmed"
  >("header")
  const [lastEditablePhase, setLastEditablePhase] =
    useState<"detail" | "header">("detail")

  const [headerMessage, setHeaderMessage] = useState<string>("")
  const [detailMessage, setDetailMessage] = useState<string>("")

  // ===== ヘッダー（伝票情報） =====
  const [era, setEra] = useState("令和")
  const [year, setYear] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [voucherNo, setVoucherNo] = useState("")
  const [inputMode, setInputMode] = useState("振替")
  const [decisionType, setDecisionType] = useState("なし")
  const [category, setCategory] = useState("通常伝票")
  const [fundingType, setFundingType] = useState<"一般" | "指定">("一般")

  // ===== 会計選択（親・子・孫） =====
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const [parentCodeRaw, setParentCodeRaw] = useState("")
  const [childCodeRaw, setChildCodeRaw] = useState("")
  const [grandchildCodeRaw, setGrandchildCodeRaw] = useState("")
  const [parentName, setParentName] = useState("")
  const [childName, setChildName] = useState("")
  const [grandchildName, setGrandchildName] = useState("")

  const currentAccountingCode = grandchildCodeRaw || childCodeRaw || parentCodeRaw
  const currentAccountingName = grandchildName || childName || parentName

  // ===== 明細（借方・貸方：科目＋金額＋補助情報） =====
  // --- 借方 ---
  const [debitCode, setDebitCode] = useState("")
  const [debitParentName, setDebitParentName] = useState("")
  const [debitChildName, setDebitChildName] = useState("")
  const [debitAmount, setDebitAmount] = useState("")
  const [debitRemark, setDebitRemark] = useState("")
  const [debitTaxInfo, setDebitTaxInfo] = useState("")
  const [debitDueDate, setDebitDueDate] = useState("")
  const [debitBudgetRemain, setDebitBudgetRemain] = useState("")

  // --- 貸方 ---
  const [creditCode, setCreditCode] = useState("")
  const [creditParentName, setCreditParentName] = useState("")
  const [creditChildName, setCreditChildName] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditRemark, setCreditRemark] = useState("")
  const [creditTaxInfo, setCreditTaxInfo] = useState("")
  const [creditDueDate, setCreditDueDate] = useState("")
  const [creditBudgetRemain, setCreditBudgetRemain] = useState("")

  // ===== 二次仕訳プレビュー & 指定純資産 =====
  const [previewDebit, setPreviewDebit] = useState<{
    code: string
    parentName: string
    childName: string
    isPL: boolean
  } | null>(null)
  const [previewCredit, setPreviewCredit] = useState<{
    code: string
    parentName: string
    childName: string
    isPL: boolean
  } | null>(null)

  const [debitDesignated, setDebitDesignated] = useState<string>("")
  const [creditDesignated, setCreditDesignated] = useState<string>("")

  // ===== モーダル（科目検索／摘要） =====
  const [debitAccountModalOpen, setDebitAccountModalOpen] = useState(false)
  const [creditAccountModalOpen, setCreditAccountModalOpen] = useState(false)

  const [remarkModalOpen, setRemarkModalOpen] = useState(false)
  const [remarkSide, setRemarkSide] = useState<"debit" | "credit">("debit")

  // ===== ここからイベントハンドラ… =====

function mapIncomeExpenseToPLLocal(
  code: string,
  side: "debit" | "credit"
): PLMapped {
  const kind = resolveAccountKind(code)

  // ★ 特例：その他有価証券評価差額金（評価益／評価損）は
  //    財源（一般/指定）で 109200 / 109100 へ自動分岐して展開する
  const isOtherSecEvalCode =
    code === "740100" || code === "960100"

 if (isOtherSecEvalCode) { 
  // 108100 を基点に、財源で 109100/109200 に分岐
  const adjustedCode = resolveSecuritiesGainLossTarget("108100", fundingType)

  // 純資産側から親名称を取る（なければ保険で PL 側も見る）
  const parentName =
   netAssetParentMap.get(adjustedCode) ??
   plParentMap.get(adjustedCode) ??
   ""

  // 子科目ラベル（account-data に名称が入っていればそれを使ってもOK）
  const childLabel =
   adjustedCode === "109100"
     ? "（うち指定純資産に係る評価差額金）"
     : adjustedCode === "109200"
        ? "(うち一般純資産に係る評価差額金)"
        : "その他有価証券評価差額金"

    return {
      code: adjustedCode,
      parentName,
      childName: childLabel,
      kind: "PL", // ← ここを "PL" にしておくのがポイント
    }
  }

// ① 収支科目（activity） → PL（account-data の sourceCode 紐付け）
if (kind === "IncomeExpense") {
  // Map<string, AccountNode[]> から、先頭の PL ノードを取り出す
  const plNodes = activityToPL.get(code)
  const plNode = plNodes?.[0] // ← ここがポイント

  if (plNode?.code) {
    const parentName = plParentMap.get(plNode.code) ?? ""
    return {
      code: plNode.code,
      parentName,
      childName: plNode.name1,
      kind: "PL",
    }
  }

  // マッピングが見つからなかった場合
  return {
    code,
    parentName: side === "credit" ? "収益（仮）" : "費用（仮）",
    childName: "（紐付未設定：account-data.ts を確認）",
    kind: "PL",
  }
}

// ② PL科目（pl） → そのまま PL として扱う
if (kind === "PL") {
  // ここも activityToPL は配列なので合わせておく（なくても fallback で動く）
  const plNodes = activityToPL.get(code)
  const plNode = plNodes?.[0]

  const parentName =
    plParentMap.get(code) ??
    (/^4/.test(code)
      ? "収益（PL）"
      : /^5/.test(code)
        ? "費用（PL）"
        : side === "credit"
          ? "収益（PL）"
          : "費用（PL）")

  return {
    code,
    parentName,
    childName: plNode?.name1 ?? "（PL科目）",
    kind: "PL",
  }
}

// ③ それ以外（BS 等）はそのまま
return { code, parentName: "", childName: "", kind: "Other" }
}


  // === キー押下（ヘッダー側）
  function handleHeaderKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && phase === "header") {
      tryMoveHeaderToDetail()
    }
  }

  // 戻る（確定帯）
  function handleBackFromConfirmed() {
    setPhase("header")
    setHeaderMessage("")
    setDetailMessage("")
  }

  function clearPreviewState() {
    setPreviewDebit(null)
    setPreviewCredit(null)
    setDebitDesignated("")
    setCreditDesignated("")
  }

  // 明細側のEnter
  function handleDetailKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return
    if (phase === "detail") onEnterAtDetail()
    else if (phase === "transferPreview") onEnterAtTransferPreview()
    else if (phase === "assignDesignated") onEnterAtAssignDesignated()
  }
function handleEnterFromBar() {
  if (phase === "header") tryMoveHeaderToDetail()
  else if (phase === "detail") onEnterAtDetail()
  else if (phase === "transferPreview") onEnterAtTransferPreview()
  else if (phase === "assignDesignated") onEnterAtAssignDesignated()
}

  // 戻る(F6)
  function handleBackFromBar() {
    if (phase === "transferPreview" || phase === "confirmed") {
      clearPreviewState()
      setDetailMessage("")
      setPhase(lastEditablePhase)
      return
    }
    setPhase("header")
    setHeaderMessage("")
    setDetailMessage("")
  }

  // 終了(F4)
  function handleExitFromBar() {
    router.push("/home")
  }

  // ヘッダー→明細へ（必須チェック & 伝票番号の自動セット）
  function tryMoveHeaderToDetail() {
    const dateOk = era.trim() !== "" && year.trim() !== "" && month.trim() !== "" && day.trim() !== ""
    const accountingOk = parentCodeRaw.trim() !== ""
    if (!dateOk || !accountingOk) {
      setHeaderMessage("日付・会計を選択してください")
      return
    }
    if (voucherNo.trim() === "") setVoucherNo("1")
    setHeaderMessage("")
    setPhase("detail")
    setLastEditablePhase("detail")
  }

  // 必須チェック（明細）
  function validateDetailRequired(): string | null {
    if (!debitCode || !creditCode) return "科目を入力（または参照選択）してください。"
    if (!debitAmount || !creditAmount) return "金額を入力してください。"
    return null
  }

// 明細で Enter
function onEnterAtDetail() {
  const err = validateDetailRequired()
  if (err) {
    setDetailMessage(err)
    return
  }
  setDetailMessage("")

  const debitKind = resolveAccountKind(debitCode)
  const creditKind = resolveAccountKind(creditCode)

  // ★ 借方：収支 or PL の場合は mapIncomeExpenseToPLLocal に通す
  const d: PLMapped =
    debitKind === "IncomeExpense" || debitKind === "PL"
      ? mapIncomeExpenseToPLLocal(debitCode, "debit")
      : {
          code: debitCode,
          parentName: debitParentName,
          childName: debitChildName,
          kind: "Other",
        }

  // ★ 貸方も同様
  const c: PLMapped =
    creditKind === "IncomeExpense" || creditKind === "PL"
      ? mapIncomeExpenseToPLLocal(creditCode, "credit")
      : {
          code: creditCode,
          parentName: creditParentName,
          childName: creditChildName,
          kind: "Other",
        }

  // ★ プレビュー表示用 state にセット
  setPreviewDebit({
    code: d.code,
    parentName: d.parentName,
    childName: d.childName,
    isPL: d.kind === "PL",
  })
  setPreviewCredit({
    code: c.code,
    parentName: c.parentName,
    childName: c.childName,
    isPL: c.kind === "PL",
  })

  setPhase("transferPreview")
  setLastEditablePhase("detail")
}


  // プレビューで Enter
  function onEnterAtTransferPreview() {
    if (fundingType === "指定") {
      setDetailMessage("")
      setPhase("assignDesignated")
      return
    }
    setDetailMessage("")
    setPhase("confirmed")
  }

  // 指定選択で Enter
  function onEnterAtAssignDesignated() {
    const needDebit = previewDebit?.isPL
    const needCredit = previewCredit?.isPL
    if ((needDebit && !debitDesignated) || (needCredit && !creditDesignated)) {
      setDetailMessage("指定純資産科目を選択してください。")
      return
    }
    setDetailMessage("")
    setPhase("confirmed")
  }

// 編集可否
const headerDisabled = phase !== "header"
const detailDisabled = phase !== "detail"
const previewLocked =
  phase === "transferPreview" ||
  phase === "assignDesignated" ||
  phase === "confirmed"

// バッジ表示
const isFundingTarget = (code?: string) =>
  isFundingTargetCode(code || "")

const showDebitBadge =
  (phase === "detail" && isFundingTarget(debitCode)) ||
  (["transferPreview", "assignDesignated", "confirmed"].includes(phase) &&
    !!previewDebit?.isPL)

const showCreditBadge =
  (phase === "detail" && isFundingTarget(creditCode)) ||
  (["transferPreview", "assignDesignated", "confirmed"].includes(phase) &&
    !!previewCredit?.isPL)


  // RemarkEntryModal 用の種別判定
  const resolveAccountKindForSide = (side: "debit" | "credit"): AccountKind => {
    const code = side === "debit" ? debitCode : creditCode

    const group = resolveAccountKind(code)
    return resolveAccountKind(code)
  }

  // 指定純資産セレクタ
function renderDesignatedSelector(side: "debit" | "credit") {
  if (phase === "assignDesignated" || phase === "confirmed") {
    const pv = side === "debit" ? previewDebit : previewCredit
    if (!pv?.isPL || fundingType !== "指定") return null

    const opts = getDesignatedOptionsForLocal(pv.code)
    const value = side === "debit" ? debitDesignated : creditDesignated
    const onChange = (v: string) => {
      if (side === "debit") setDebitDesignated(v)
      else setCreditDesignated(v)
    }

    return (
      <div className="mt-2 inline-block">
        <div className="text-[12px] text-[#1a1a1a] mb-1">
          指定純資産科目
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={phase === "confirmed"}
          className="h-[24px] w-[240px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[12px] leading-tight"
        >
          <option value="">選択してください</option>
          {opts.map((o) => (
            <option key={o.code} value={o.code}>
              {o.code} {o.name}
            </option>
          ))}
        </select>
      </div>
    )
  }
}

  // 二次仕訳の表示
function PreviewAccountLabel({
  code,
  parentName,
  childName,
}: {
  code?: string
  parentName?: string
  childName?: string
}) {
  // 親があるとき → 上段: 親 / 下段: 子
  // 親がないとき → 上段は出さず / 下段に main を表示
  const hasParent = !!parentName
  const mainName = hasParent
    ? childName || parentName || ""
    : childName || parentName || ""

  const subName = hasParent ? parentName : ""

  return (
    <div className="flex flex-col">
      <div className="text-[14px] text-[#444] tabular-nums">
        {code ?? ""}
      </div>
      {subName && (
        <div className="text-[15px]">
          {subName}
        </div>
      )}
      <div className="text-[16px] font-medium">
        {mainName}
      </div>
    </div>
  )
}

  
  
  
  return (
    <div className="flex flex-col text-[14px] leading-tight text-[#1a1a1a]">
      <FunctionKeyBar 
        onEnter={handleEnterFromBar} 
        onBack={handleBackFromBar} 
        onExit={handleExitFromBar}
      />

      {/* 確定帯 */}
      {phase === "confirmed" && (
        <div className="mt-2 flex items-center justify-between rounded-[4px] border border-[#4a8f4a] bg-[#e6ffe6] px-3 py-2 text-[13px]">
          <div className="font-semibold text-[#1a4a1a]">伝票を確定しました。</div>
          <Button className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[13px]" onClick={handleBackFromConfirmed}>
            戻る
          </Button>
        </div>
      )}

      {/* メッセージ */}
      {headerMessage && phase === "header" && (
        <div className="mt-2 rounded-[4px] border border-[#c7a000] bg-[#fff9d6] px-3 py-2 text-[13px] text-[#4a3b00]">
          {headerMessage}
        </div>
      )}
      {detailMessage && (phase === "detail" || phase === "transferPreview") && (
        <div className="mt-2 rounded-[4px] border border-[#c7a000] bg-[#fff9d6] px-3 py-2 text-[13px] text-[#4a3b00]">
          {detailMessage}
        </div>
      )}

      {/* ===== 伝票ヘッダーエリア ===== */}
      <div
        className={["mt-2 rounded-[4px] border border-[#7a9bc4] bg-[#d4e4ff]", headerDisabled ? "opacity-60 pointer-events-none" : ""].join(" ")}
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.6) inset, 0 1px 1px rgba(0,0,0,0.05)" }}
        onKeyDown={handleHeaderKeyDown}
      >
        {/* 上段ヘッダー */}
        <div className="px-3 py-3">
          <div className="grid grid-cols-[400px_auto_auto_auto_auto] gap-x-4 gap-y-2">
            {/* 伝票日付 */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1">
                <div className="text-[#1a1a1a] leading-tight">伝票日付</div>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  disabled={headerDisabled}
                  className="h-[28px] min-w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px] leading-tight"
                >
                  <option value="">　</option>
                  <option>令和</option>
                  <option>平成</option>
                  <option>昭和</option>
                </select>
                <Input value={year} onChange={(e) => setYear(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]" />
                <div className="text-[14px]">年</div>
                <Input value={month} onChange={(e) => setMonth(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[32px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]" />
                <div className="text-[14px]">月</div>
                <Input value={day} onChange={(e) => setDay(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[32px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]" />
                <div className="text-[14px]">日</div>
                <button className="ml-1 flex h-[28px] w-[28px] items-center justify-center rounded-[2px] border border-[#7a9bc4] bg-white">
                  <Calendar className="h-[16px] w-[16px] text-[#4a5a7a]" />
                </button>
              </div>
              <div className="h-[28px]" />
            </div>

            {/* 伝票番号 */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[#1a1a1a] leading-tight">伝票番号</div>
                <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[14px]" />
              </div>
              <div className="h-[28px]" />
            </div>

            {/* 入力 */}
            <div className="flex flex-col gap-2 min-w-[140px]">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-[#1a1a1a] leading-tight">入力</div>
                <select value={inputMode} onChange={(e) => setInputMode(e.target.value)} disabled={headerDisabled} className="h-[28px] min-w-[72px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[14px]">
                  <option value="">　</option>
                  <option>振替</option>
                  <option>入金</option>
                  <option>出金</option>
                </select>
              </div>
              <div className="h-[28px]" />
            </div>

            {/* 決裁区分/分類 */}
            <div className="flex flex-col gap-2 min-w-[220px]">
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-[64px]">決裁区分</div>
                <select value={decisionType} onChange={(e) => setDecisionType(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[14px]">
                  <option value="">　</option>
                  <option>なし</option>
                  <option>　</option>
                </select>
                <button className="flex h-[28px] w-[32px] items-center justify-center rounded-[2px] border border-[#7a9bc4] bg-white text-[12px]">参</button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="w-[64px]">分類</div>
                <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={headerDisabled} className="h-[28px] w-[112px] rounded-[2px] border border-[#7a9bc4] bg-white px-2 text-[14px]">
                  <option value="">　</option>
                  <option>通常伝票</option>
                  <option>決算伝票</option>
                </select>
              </div>
            </div>

            {/* Ctrl + F1/F2 */}
            <div className="flex flex-row items-start gap-2 min-w-[240px]">
              <div className="flex h-[60px] items-center justify-center px-3 text-[13px] font-semibold text-[#0066cc] select-none">
                Ctrl +
              </div>
              <div className="flex flex-col gap-2">
                <button className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-left text-[13px] hover:bg-[#eef4ff]" disabled={headerDisabled}>
                  F1 設定
                </button>
                <button className="h-[28px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-left text-[13px] hover:bg-[#eef4ff]" disabled={headerDisabled}>
                  F2 過去履歴
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 下段: 会計ブロック */}
        <div className="px-3 py-3">
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-start gap-1 w-[48px]">
              <div className="leading-[28px]">会計</div>
              <button
                className="flex h-[28px] w-[32px] items-center justify-center rounded-[2px] border border-[#7a9bc4] bg-white text-[12px]"
                disabled={headerDisabled}
                onClick={() => { if (!headerDisabled) setAccountModalOpen(true) }}
              >
                参
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {/* 親 */}
              <div className="flex h-[28px] items-center">
                <Input value={parentCodeRaw} readOnly className="h-[28px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px] read-only:bg-[#f3f3f3]" />
                <div className="ml-2 text-[13px] whitespace-nowrap">{parentName}</div>
              </div>
              {/* 子 */}
              <div className="flex h-[28px] items-center">
                <Input value={childCodeRaw} readOnly className="h-[28px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px] read-only:bg-[#f3f3f3]" />
                <div className="ml-2 text-[13px] whitespace-nowrap">{childName}</div>
              </div>
              {/* 孫 */}
              <div className="flex h-[28px] items-center">
                <Input value={grandchildCodeRaw} readOnly className="h-[28px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[13px] read-only:bg-[#f3f3f3]" />
                <div className="ml-2 text-[13px] whitespace-nowrap">{grandchildName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 明細エリア ===== */}
      <div
        className={["mt-3 flex flex-col rounded-[4px] border border-[#7a9bc4] bg-white text-[12px]", phase === "header" ? "opacity-60 pointer-events-none" : ""].join(" ")}
        onKeyDown={handleDetailKeyDown}
      >
        {/* ヘッダー行 */}
        <div className="grid w-full grid-cols-[40px_1fr_1fr] border-b border-[#7a9bc4] bg-[#6d8fc9] text-white" style={{ fontSize: "14px", fontWeight: 600 }}>
          <div className="border-r border-[#7a9bc4] px-2 py-2 flex items-center">No</div>
          <div className="border-r border-[#7a9bc4] px-2 py-2">
            <div className="flex items-baseline justify-between">
              <span>借方 / 科目</span>
              <span className="text-[12px] font-normal opacity-90">金額</span>
            </div>
          </div>
          <div className="px-2 py-2">
            <div className="flex items-baseline justify-between">
              <span>貸方 / 科目</span>
              <span className="text-[12px] font-normal opacity-90">金額</span>
            </div>
          </div>
        </div>

        {/* 1行目 上段 */}
        <div className="grid grid-cols-[40px_1fr_1fr] bg-[#eaf3ff]">
          {/* No */}
          <div className="flex flex-col items-center justify-between border-r border-[#7a9bc4] bg-[#f2f6fb] text-[13px] text-[#333]">
            <div className="flex-1 flex items:end justify-center font-medium pb-[2px]">1</div>
            <div className="h-[24px]" />
          </div>

          {/* 借方 上段 */}
          <div className="border-r border-[#7a9bc4] px-2 py-2 relative">
{showDebitBadge && (
  <div className="absolute right-2 top-2">
    <span
      className="
        inline-flex items-center justify-center
        rounded-full border border-[#7a9bc4] bg-white
        px-2 py-[1px]
        text-[10px] leading-none
        whitespace-nowrap
      "
      aria-label="funding-type-badge"
    >
      {fundingType}
    </span>
  </div>
)}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
<div className="flex items-start gap-1">
  {!previewLocked ? (
    <>
      <Input
        value={debitCode}
        onChange={(e) => setDebitCode(e.target.value)}
        disabled={detailDisabled}
        className="h-[24px] w-[180px] rounded-[2px] border border-[#7a9bc4] bg-white px-1"
        placeholder="コード"
      />
      <div className="flex-shrink-0">
        <button
          className="flex h-[24px] w-[28px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[#7a9bc4] bg-white text-[12px]"
          title="参"
          disabled={detailDisabled}
          onClick={() => {
            if (detailDisabled) return
            setDebitAccountModalOpen(true)
          }}
        >
          参
        </button>
      </div>
    </>
  ) : (
    <>
   <PreviewAccountLabel
     code={previewDebit?.code}
     parentName={previewDebit?.parentName}
     childName={previewDebit?.childName}
   />
 </>
)}
</div>

                {!previewLocked && (
                  <>
                    <div className="mt-1 px-[2px] text-[14px] leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {debitParentName}
                    </div>
                    <div className="px-[2px] text-[15px] font-medium leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {debitChildName}
                    </div>
                  </>
                )}

                {renderDesignatedSelector("debit")}
              </div>

              <div className="w-[120px] flex items-end self-end">
                <Input
                  value={debitAmount}
                  onChange={(e) => setDebitAmount(e.target.value)}
                  disabled={previewLocked || detailDisabled}
                  className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 貸方 上段 */}
          <div className="px-2 py-2 relative">
            {showCreditBadge && (
              <span className="absolute right-2 top-2 inline-block rounded-full border border-[#7a9bc4] bg-white px-2 py-[1px] text-[10px] leading-none" aria-label="funding-type-badge">
                {fundingType}
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1">
                  {!previewLocked ? (
                    <>
                      <Input
                        value={creditCode}
                        onChange={(e) => setCreditCode(e.target.value)}
                        disabled={detailDisabled}
                        className="h-[24px] w-[180px] rounded-[2px] border border-[#7a9bc4] bg-white px-1"
                        placeholder="コード"
                      />
                      <button
                        className="flex h-[24px] w-[28px] flex-shrink-0 items-center justify-center rounded-[2px] border border-[#7a9bc4] bg-white text-[12px]"
                        title="参"
                        disabled={detailDisabled}
                        onClick={() => { if (!detailDisabled) setCreditAccountModalOpen(true) }}
                      >
                        参
                      </button>
                    </>
                  ) : (
<PreviewAccountLabel
    code={previewCredit?.code}
    parentName={previewCredit?.parentName}
    childName={previewCredit?.childName}
  />
                  )}
                </div>

                {!previewLocked && (
                  <>
                    <div className="mt-1 px-[2px] text-[14px] leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {creditParentName}
                    </div>
                    <div className="px-[2px] text-[15px] font-medium leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {creditChildName}
                    </div>
                  </>
                )}

                {renderDesignatedSelector("credit")}
              </div>

              <div className="w-[120px] flex items-end self-end">
                <Input
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  disabled={previewLocked || detailDisabled}
                  className="h-[24px] w-full rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 1行目 下段（摘要など） */}
        <div className="grid grid-cols-[40px_1fr_1fr] border-b border-[#7a9bc4] bg-[#ffffff]">
          {/* No列 / 削 */}
          <div className="flex flex-col items-center justify-end border-r border-[#7a9bc4] bg-[#f2f6fb] text-[13px] text-[#333] py-2">
            <button className="text-[11px] px-2 py-[2px] border border-[#7a9bc4] rounded-sm bg-[#e9edf5]" disabled={previewLocked || detailDisabled}>
              削
            </button>
          </div>

          {/* 借方 摘要ブロック（クリックでモーダル） */}
          <div className="border-r border-[#7a9bc4]">
            <button
              type="button"
              disabled={previewLocked || detailDisabled}
              onClick={() => {
                if (detailDisabled) return
                setRemarkSide("debit")
                setRemarkModalOpen(true)
              }}
              className={["border border-[#7a9bc4] bg-[#eef5ff] w-full text-left",
                "text-[12px] leading-[16px] p-0",
                previewLocked || detailDisabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-[#fffde8]",
              ].join(" ")}
            >
              <div className="grid grid-cols-2">
                <div className="grid grid-rows-[20px_20px_20px] border-r border-[#7a9bc4]">
                  <div className="grid grid-cols-[24px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">関</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis" />
                  </div>
                  <div className="grid grid-cols-[24px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">摘</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                      {debitRemark || <span className="text-[#888]"></span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-[24px_1fr]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">事</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis" />
                  </div>
                </div>

                <div className="grid grid-rows-[20px_20px_20px]">
                  <div className="grid grid-cols-[40px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">税</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{debitTaxInfo}</div>
                  </div>
                  <div className="grid grid-cols-[40px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">予定日</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{debitDueDate}</div>
                  </div>
                  <div className="grid grid-cols-[40px_1fr]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">予算残</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{debitBudgetRemain}</div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* 貸方 摘要ブロック */}
          <div>
            <button
              type="button"
              disabled={previewLocked || detailDisabled}
              onClick={() => { if (!detailDisabled) { setRemarkSide("credit"); setRemarkModalOpen(true) } }}
              className={["border border-[#7a9bc4] bg-[#eef5ff] w-full text-left", "text-[12px] leading-[16px] p-0", previewLocked || detailDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#fffde8]"].join(" ")}
            >
              <div className="grid grid-cols-2">
                <div className="grid grid-rows-[20px_20px_20px] border-r border-[#7a9bc4]">
                  <div className="grid grid-cols-[24px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">関</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis" />
                  </div>
                  <div className="grid grid-cols-[24px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">摘</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                      {creditRemark || <span className="text-[#888]"></span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-[24px_1fr]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">事</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis" />
                  </div>
                </div>

                <div className="grid grid-rows-[20px_20px_20px]">
                  <div className="grid grid-cols-[40px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">税</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{creditTaxInfo}</div>
                  </div>
                  <div className="grid grid-cols-[40px_1fr] border-b border-[#7a9bc4]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">予定日</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{creditDueDate}</div>
                  </div>
                  <div className="grid grid-cols-[40px_1fr]">
                    <div className="bg-[#e0e0e0] border-r border-[#7a9bc4] text-center">予算残</div>
                    <div className="px-1 flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{creditBudgetRemain}</div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="px-2 py-4 text-[11px] leading-tight text-[#6b6b6b] bg-white border-t border-[#7a9bc4]">
          （この下に明細2行目以降が続く想定）
        </div>
      </div>

      {/* ===== 会計選択モーダル ===== */}
      <AccountingSelectModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSelect={({ parentCode, parentName, childCode, childName, grandchildCode, grandchildName, }) => {
          if (phase === "header") {
            setParentCodeRaw(parentCode || "")
            setChildCodeRaw(childCode || "")
            setGrandchildCodeRaw(grandchildCode || "")
            setParentName(parentName || "")
            setChildName(childName || "")
            setGrandchildName(grandchildName || "")
          }
          setAccountModalOpen(false)
        }}
      />

{/* ===== 借方 科目検索モーダル ===== */}
<AccountSearchDialog
  open={debitAccountModalOpen}
  onClose={() => setDebitAccountModalOpen(false)}
  title="科目検索"
  onPick={(row: PickedAccount) => {
    setDebitCode(row.code || "")

    // ★ 表示名のレイアウト調整
    if (row.childName) {
      // 親あり・子あり → 上段: 親 / 下段: 子
      setDebitParentName(row.parentName || "")
      setDebitChildName(row.childName)
    } else {
      // 親なし or 事実上1階層 → 上段は空 / 下段に表示
      setDebitParentName("")
      setDebitChildName(row.parentName || row.name || "")
    }

    setDebitAccountModalOpen(false)
  }}
/>

{/* ===== 貸方 科目検索モーダル ===== */}
<AccountSearchDialog
  open={creditAccountModalOpen}
  onClose={() => setCreditAccountModalOpen(false)}
  title="科目検索"
  onPick={(row: PickedAccount) => {
    setCreditCode(row.code || "")

    // ★ 表示名のレイアウト調整（借方と同じロジック）
    if (row.childName) {
      setCreditParentName(row.parentName || "")
      setCreditChildName(row.childName)
    } else {
      setCreditParentName("")
      setCreditChildName(row.parentName || row.name || "")
    }

    setCreditAccountModalOpen(false)
  }}
/>

      {/* ===== 摘要入力モーダル ===== */}
<RemarkEntryModal
  open={remarkModalOpen}
  onClose={() => {
    setRemarkModalOpen(false)
  }}
  side={remarkSide}
  initialRemark={remarkSide === "debit" ? debitRemark : creditRemark}
  lineLabel={remarkSide === "debit" ? "借方 1行目" : "貸方 1行目"}
  accountKind={resolveAccountKindForSide(remarkSide)}
  initialFundingType={fundingType}
  autoFocusField="fundingType"
  onSubmit={(p) => {
    if (remarkSide === "debit") {
      setDebitRemark(p.remarkMain)
      setDebitTaxInfo(p.tax.display)
    } else {
      setCreditRemark(p.remarkMain)
      setCreditTaxInfo(p.tax.display)
    }

    const ft = (p.fundingType ?? (p as any).funding) as
      | "一般"
      | "指定"
      | undefined
    if (ft === "一般" || ft === "指定") {
      setFundingType(ft)
    }

    setRemarkModalOpen(false)
  }}
  accountingCode={currentAccountingCode}
  accountingDisplayCode={currentAccountingCode}
  accountingName={currentAccountingName}
/>

    </div>
  )
}
