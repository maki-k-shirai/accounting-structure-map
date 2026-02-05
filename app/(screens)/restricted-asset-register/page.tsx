// app/(screens)/restricted-asset-register/page.tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import {
  AccountsTab,
  type AccountRow,
} from "@/app/(screens)/restricted-asset-register/AccountsTab"
import {
  AmountsTab,
  type AmountRow,
} from "./AmountsTab"

// ===== 定数・型 =====

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

type Era = "令和" | "平成"

const ERA_OPTIONS: Era[] = ["令和", "平成"]

type RegDateId = (typeof REG_DATES)[number]["id"]

type AssetType = "1号" | "2号" | "3号" | "4号" | "5号" | "6号"

type ActiveTab = "basic" | "accounts" | "amounts"

function getRegDisplay(regDateId: RegDateId) {
  const baseyear = regDateId === "r8" ? 8 : 9
  const nextyear = baseyear + 1
  const register = `令和${baseyear}年4月1日`
  const period = `令和${baseyear}年4月1日 ～ 令和${nextyear}年3月31日`
  return { register, period }
}

// ===== 共通ユーティリティ =====

function addRow<T extends { id: number }>(
  rows: T[],
  emptyRowFactory: (id: number) => T,
): T[] {
  const lastId = rows[rows.length - 1]?.id ?? 0
  const newId = lastId + 1
  return [...rows, emptyRowFactory(newId)]
}

function deleteRow<T extends { id: number }>(
  rows: T[],
  selectedId: number | null,
  emptyRowFactory: (id: number) => T,
): { rows: T[]; newSelectedId: number | null } {
  if (rows.length === 0 || selectedId == null) {
    return { rows, newSelectedId: selectedId }
  }

  const filtered = rows.filter((r) => r.id !== selectedId)

  if (filtered.length === 0) {
    const initialRow = emptyRowFactory(1)
    return { rows: [initialRow], newSelectedId: initialRow.id }
  }

  const stillSelected = filtered.some((r) => r.id === selectedId)
  return {
    rows: filtered,
    newSelectedId: stillSelected ? selectedId : filtered[0].id,
  }
}

const createEmptyAccountRow = (id: number): AccountRow => ({
  id,
  accountingCode: "",
  accountingName: "",
  subjectCode: "",
  subjectName: "",
})

const createEmptyAmountRow = (id: number): AmountRow => ({
  id,
  yearLabel: "",
  prevTermEnd: "",
  deposit: "",
  reversal: "",
  valuationDiff: "",
  internalTransfer: "",
})

// 必須マーク（幅を揃える）
const RequiredMark = ({ required = false }: { required?: boolean }) => (
  <span
    className={`mr-1 inline-block w-[10px] text-[14px] ${
      required ? "text-[#d00000]" : ""
    }`}
  >
    {required ? "*" : ""}
  </span>
)

// ===== ページ本体 =====

export default function RestrictedAssetRegisterPage() {
  const [processMode, setProcessMode] = React.useState<ProcessMode>("create")
  const [regDateId, setRegDateId] = React.useState<RegDateId>("r8")

  // 使途拘束資産区分（1〜6号）
  const [assetType, setAssetType] = React.useState<AssetType>("1号")

  // 使途拘束資産コード（親階層のみ）
  const [assetCode1, setAssetCode1] = React.useState("")
  const [assetCode2] = React.useState("")
  const [assetCode3] = React.useState("")
  const [assetCode4] = React.useState("")

  // 登録作業エリア表示フラグ
  const [showDetailArea, setShowDetailArea] = React.useState(false)

  // タブ（基本情報 / 対応科目 / 金額情報）
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("basic")

  // 詳細エリア：共通
  const [restrictedAssetName, setRestrictedAssetName] = React.useState("")

  // 1号・2号用フィールド
  const [location, setLocation] = React.useState("")
  const [sizeStructure, setSizeStructure] = React.useState("")
  const [usageStatus, setUsageStatus] = React.useState("")
  const [isEssentialAsset, setIsEssentialAsset] = React.useState(false)
  const [acquisitionTiming, setAcquisitionTiming] =
    React.useState<"before" | "after">("before")

  // 3号用フィールド
  const [implementEra, setImplementEra] = React.useState<Era>("令和")
  const [implementYear, setImplementYear] = React.useState("")
  const [assetExpenseKind, setAssetExpenseKind] =
    React.useState<"asset" | "expense">("asset")
  const [activityContent, setActivityContent] = React.useState("")
  const [planStartEra, setPlanStartEra] = React.useState<Era>("令和")
  const [planStartYear, setPlanStartYear] = React.useState("")
  const [planStartMonth, setPlanStartMonth] = React.useState("")
  const [planStartDay, setPlanStartDay] = React.useState("")
  const [planEndEra, setPlanEndEra] = React.useState<Era>("令和")
  const [planEndYear, setPlanEndYear] = React.useState("")
  const [planEndMonth, setPlanEndMonth] = React.useState("")
  const [planEndDay, setPlanEndDay] = React.useState("")
  const [requiredAmount, setRequiredAmount] = React.useState("")
  const [amountCalcMethod, setAmountCalcMethod] = React.useState("")
  const [note, setNote] = React.useState("")

  // 対応科目タブ用
const [accountRows, setAccountRows] = React.useState<AccountRow[]>([
  { id: 1, accountingCode: "", accountingName: "", subjectCode: "", subjectName: "" },
  { id: 2, accountingCode: "", accountingName: "", subjectCode: "", subjectName: "" },
  { id: 3, accountingCode: "", accountingName: "", subjectCode: "", subjectName: "" },
  { id: 4, accountingCode: "", accountingName: "", subjectCode: "", subjectName: "" },
  { id: 5, accountingCode: "", accountingName: "", subjectCode: "", subjectName: "" },
])
const [selectedRowId, setSelectedRowId] = React.useState<number | null>(1)

const handleChangeAccountRow = (
  rowId: number,
  updater: (prev: AccountRow) => AccountRow,
) => {
  setAccountRows((prev: AccountRow[]) =>
    prev.map((row: AccountRow) => (row.id === rowId ? updater(row) : row)),
  )
}

  // 金額情報タブ用
const [amountRows, setAmountRows] = React.useState<AmountRow[]>([
  { id: 1, yearLabel: "", prevTermEnd: "", deposit: "", reversal: "", valuationDiff: "", internalTransfer: "" },
  { id: 2, yearLabel: "", prevTermEnd: "", deposit: "", reversal: "", valuationDiff: "", internalTransfer: "" },
  { id: 3, yearLabel: "", prevTermEnd: "", deposit: "", reversal: "", valuationDiff: "", internalTransfer: "" },
  { id: 4, yearLabel: "", prevTermEnd: "", deposit: "", reversal: "", valuationDiff: "", internalTransfer: "" },
  { id: 5, yearLabel: "", prevTermEnd: "", deposit: "", reversal: "", valuationDiff: "", internalTransfer: "" },
])

const handleChangeAmountRow = (
  rowId: number,
  updater: (prev: AmountRow) => AmountRow
) => {
  setAmountRows((prev: AmountRow[]) =>
    prev.map((row: AmountRow) => (row.id === rowId ? updater(row) : row)),
  )
}

  const [selectedAmountRowId, setSelectedAmountRowId] =
    React.useState<number | null>(1)

  const { register: registerLabel, period: periodLabel } =
    getRegDisplay(regDateId)

  const { isType1or2, isType3, isType4or5 } = React.useMemo(
    () => ({
      isType1or2: assetType === "1号" || assetType === "2号",
      isType3: assetType === "3号",
      isType4or5: assetType === "4号" || assetType === "5号",
    }),
    [assetType],
  )

  // 3号以外のときは金額情報タブを使わないので、activeTab が amounts なら basic に戻す
  React.useEffect(() => {
    if (!isType3 && activeTab === "amounts") {
      setActiveTab("basic")
    }
  }, [isType3, activeTab])

  // ===== Enterキー：1〜5号のときに詳細エリアを表示 =====
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      if (assetType !== "6号") {
        e.preventDefault()
        e.stopPropagation()
        setShowDetailArea(true)
      }
    }

    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [assetType])

  // ===== Enter / 戻る ロジック（FunctionKeyBar 用） =====
  const handleDecide = () => {
    if (!showDetailArea) {
      if (assetType !== "6号") {
        setShowDetailArea(true)
      }
      return
    }

    console.log("決定:", {
      processMode,
      regDateId,
      assetType,
      assetCode: [assetCode1, assetCode2, assetCode3, assetCode4],
      restrictedAssetName,
      location,
      sizeStructure,
      usageStatus,
      isEssentialAsset,
      acquisitionTiming,
      implementEra,
      implementYear,
      assetExpenseKind,
      activityContent,
      planStartEra,
      planStartYear,
      planStartMonth,
      planStartDay,
      planEndEra,
      planEndYear,
      planEndMonth,
      planEndDay,
      requiredAmount,
      amountCalcMethod,
      note,
      accountRows,
      amountRows,
    })
  }

  const handleBack = () => {
    if (showDetailArea) {
      setShowDetailArea(false)
    } else {
      console.log("戻る")
    }
  }

  // ===== 対応科目タブ：行追加・削除 =====
  const handleAddRow = () => {
    setAccountRows((prev: AccountRow[]) => addRow(prev, createEmptyAccountRow))
  }

  const handleDeleteRow = () => {
    setAccountRows((prev: AccountRow[]) => {
      const { rows, newSelectedId } = deleteRow(
        prev,
        selectedRowId,
        createEmptyAccountRow,
      )
      setSelectedRowId(newSelectedId)
      return rows
    })
  }

  // ===== 金額情報タブ：行追加・削除 =====
  const handleAddAmountRow = () => {
    setAmountRows((prev: AmountRow[]) => addRow(prev, createEmptyAmountRow))
  }

  const handleDeleteAmountRow = () => {
    setAmountRows((prev: AmountRow[]) => {
      const { rows, newSelectedId } = deleteRow(
        prev,
        selectedAmountRowId,
        createEmptyAmountRow,
      )
      setSelectedAmountRowId(newSelectedId)
      return rows
    })
  }

  return (
    <main className="flex h-full w-full flex-col bg-[#f2f7ff]">
      {/* 共通ファンクションキー */}
      <FunctionKeyBar onEnter={handleDecide} onBack={handleBack} />

      {/* 本文エリア */}
      <div className="flex-1 space-y-2 overflow-auto p-3 text-[14px] text-[#1a1a1a]">
        {/* ===== 処理モード ===== */}
        <div className="grid grid-cols-[160px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
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
        <div className="grid grid-cols-[160px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
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

        {/* ===== 使途拘束資産区分 ===== */}
        <div className="grid grid-cols-[160px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
          <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
            使途拘束資産区分
          </div>
          <div className="flex items-center bg-[#eaf3ff] px-3 py-1.5">
            <select
              className="h-[26px] w-[280px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
            >
              <option value="1号">1: 公益目的保有財産</option>
              <option value="2号">2: 法人活動保有財産</option>
              <option value="3号">3: 公益充実資金</option>
              <option value="4号">4: 資産取得資金</option>
              <option value="5号">5: 特定費用準備資金</option>
              <option value="6号">6: 指定寄附資金</option>
            </select>
          </div>
        </div>

        {/* ===== 使途拘束資産コード ===== */}
        <div className="grid grid-cols-[160px_1fr] border border-[#7a9bc4] bg-[#c8ddff]">
          <div className="flex items-center border-r border-[#7a9bc4] px-3 py-2 font-bold">
            使途拘束資産コード
          </div>
          <div className="flex items-center gap-2 bg-[#eaf3ff] px-3 py-1.5">
            <Input
              value={assetCode1}
              onChange={(e) => setAssetCode1(e.target.value)}
              data-asset-code="true"
              className="h-[24px] w-[90px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
            />
            {/* 子〜ひ孫は使わないので hidden */}
            <Input value={assetCode2} disabled className="hidden" />
            <Input value={assetCode3} disabled className="hidden" />
            <Input value={assetCode4} disabled className="hidden" />

            {/* 参ボタン */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-9 border-[#7a9bc4]"
            >
              参
            </Button>
          </div>
        </div>

        {/* ===== 詳細エリア（1〜5号で表示） ===== */}
        {showDetailArea && (isType1or2 || isType3 || isType4or5) && (
          <div className="border border-[#7a9bc4] bg-white">
            {/* 上部：登録年月日・有効期間 */}
            <div className="flex items-center gap-32 border-b border-[#7a9bc4] px-3 py-2 text-[14px]">
              <div>登録年月日： {registerLabel}</div>
              <div>有効期間： {periodLabel}</div>
            </div>

            {/* 内側コンテンツ（タブ＋枠付き本体） */}
            <div className="px-3 pb-3 pt-2">
              {/* タブ行 */}
              <div className="flex border-b border-[#7a9bc4] text-[14px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className={`px-10 py-1 bg-white border-t border-l border-[#7a9bc4] ${
                    activeTab === "basic"
                      ? "border-b-0 font-bold"
                      : "border-b text-[#888]"
                  }`}
                >
                  基本情報
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("accounts")}
                  className={`px-10 py-1 bg-white border-t border-l border-r border-[#7a9bc4] ${
                    activeTab === "accounts"
                      ? "border-b-0 font-bold"
                      : "border-b text-[#888]"
                  }`}
                >
                  対応科目
                </button>

                {isType3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("amounts")}
                    className={`px-10 py-1 bg-white border-t border-l border-r border-[#7a9bc4] ${
                      activeTab === "amounts"
                        ? "border-b-0 font-bold"
                        : "border-b text-[#888]"
                    }`}
                  >
                    金額情報
                  </button>
                )}
              </div>

              {/* タブ内の枠 */}
              <div className="border border-t-0 border-[#7a9bc4] bg-[#eaf3ff]">
                {/* ===== 基本情報タブ ===== */}
                {activeTab === "basic" && (
                  <>
                    {/* 1号・2号 */}
                    {isType1or2 && (
                      <div className="grid grid-cols-[160px_1fr] text-[14px]">
                        {/* 行1：使途拘束資産名 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          使途拘束資産名
                        </div>
                        <div className="flex items-center border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <RequiredMark required />
                          <Input
                            value={restrictedAssetName}
                            onChange={(e) =>
                              setRestrictedAssetName(e.target.value)
                            }
                            className="h-[24px] flex-1 rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                          />
                        </div>

                        {/* 行2：場所 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          場所
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>

                        {/* 行3：面積、構造、物量等 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          面積、構造、物量等
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={sizeStructure}
                            onChange={(e) => setSizeStructure(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>

                        {/* 行4：財産の使用状況 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          財産の使用状況
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={usageStatus}
                            onChange={(e) => setUsageStatus(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>

                        {/* 行5：不可欠特定財産 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          不可欠特定財産
                        </div>
                        <div className="flex items-center border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-[14px] w-[14px]"
                              checked={isEssentialAsset}
                              onChange={(e) =>
                                setIsEssentialAsset(e.target.checked)
                              }
                            />
                            <span>不可欠特定財産に該当する</span>
                          </label>
                        </div>

                        {/* 行6：取得時期 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          取得時期
                        </div>
                        <div className="flex items-center border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <label className="mr-6 inline-flex items-center gap-1">
                            <input
                              type="radio"
                              className="h-[14px] w-[14px]"
                              checked={acquisitionTiming === "before"}
                              onChange={() => setAcquisitionTiming("before")}
                            />
                            <span>認定前</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              className="h-[14px] w-[14px]"
                              checked={acquisitionTiming === "after"}
                              onChange={() => setAcquisitionTiming("after")}
                            />
                            <span>認定後</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 3号：公益充実資金 */}
                    {isType3 && (
                      <div className="grid grid-cols-[160px_1fr] text-[14px]">
                        {/* 行1：使途拘束資産名 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          使途拘束資産名
                        </div>
                        <div className="flex items-center border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <RequiredMark required />
                          <Input
                            value={restrictedAssetName}
                            onChange={(e) =>
                              setRestrictedAssetName(e.target.value)
                            }
                            className="h-[24px] flex-1 rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                          />
                        </div>

                        {/* 行2：実施時期（年度） */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          実施時期（年度）
                        </div>
                        <div className="flex items-center gap-2 border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <select
                             className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                             value={implementEra}
                             onChange={(e) => setImplementEra(e.target.value as Era)}
                          >
                             {ERA_OPTIONS.map((era) => (
                               <option key={era} value={era}>
                                 {era}
                               </option>
                            ))}
                          </select>
                          <Input
                            value={implementYear}
                            onChange={(e) => setImplementYear(e.target.value)}
                            className="h-[24px] w-[60px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>年度</span>
                        </div>

                        {/* 行3：資産・費用区分 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          資産・費用区分
                        </div>
                        <div className="flex items-center gap-6 border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              className="h-[14px] w-[14px]"
                              checked={assetExpenseKind === "asset"}
                              onChange={() => setAssetExpenseKind("asset")}
                            />
                            <span>資産</span>
                          </label>
                          <label className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              className="h-[14px] w-[14px]"
                              checked={assetExpenseKind === "expense"}
                              onChange={() => setAssetExpenseKind("expense")}
                            />
                            <span>費用</span>
                          </label>
                        </div>

                        {/* 行4：活動内容 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          活動内容
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={activityContent}
                            onChange={(e) =>
                              setActivityContent(e.target.value)
                            }
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>

                        {/* 行5：計画期間 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          計画期間
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <span>開始</span>
                          <select
                            className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                            value={planStartEra}
                            onChange={(e) => setPlanStartEra(e.target.value as Era)}
                          >
                            {ERA_OPTIONS.map((era) => (
                              <option key={era} value={era}>
                                {era}
                              </option>
                           ))}
                          </select>
                          <Input
                            value={planStartYear}
                            onChange={(e) => setPlanStartYear(e.target.value)}
                            className="h-[24px] w-[50px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>年</span>
                          <Input
                            value={planStartMonth}
                            onChange={(e) => setPlanStartMonth(e.target.value)}
                            className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>月</span>
                          <Input
                            value={planStartDay}
                            onChange={(e) => setPlanStartDay(e.target.value)}
                            className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>日</span>

                          <span className="mx-2">終了</span>
                          <select
                            className="h-[24px] w-[80px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                            value={planEndEra}
                            onChange={(e) => setPlanEndEra(e.target.value as Era)}
                          >
                           {ERA_OPTIONS.map((era) => (
                             <option key={era} value={era}>
                               {era}
                             </option>
                           ))}
                          </select>
                          <Input
                            value={planEndYear}
                            onChange={(e) => setPlanEndYear(e.target.value)}
                            className="h-[24px] w-[50px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>年</span>
                          <Input
                            value={planEndMonth}
                            onChange={(e) => setPlanEndMonth(e.target.value)}
                            className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>月</span>
                          <Input
                            value={planEndDay}
                            onChange={(e) => setPlanEndDay(e.target.value)}
                            className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                          <span>日</span>
                        </div>

                        {/* 行6：所要額 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          所要額
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <Input
                            value={requiredAmount}
                            onChange={(e) => setRequiredAmount(e.target.value)}
                            className="h-[24px] w-[260px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-right text-[14px]"
                          />
                        </div>

                        {/* 行7：所要額の算定方法 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          所要額の算定方法
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={amountCalcMethod}
                            onChange={(e) =>
                              setAmountCalcMethod(e.target.value)
                            }
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>

                        {/* 行8：備考 */}
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          備考
                        </div>
                        <div className="border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-[2px] border border-[#7a9bc4] bg-white px-1 py-1 text-[14px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4号・5号：使途拘束資産名のみ */}
                    {isType4or5 && (
                      <div className="grid grid-cols-[160px_1fr] text-[14px]">
                        <div className="flex items-center border-r border-b border-[#7a9bc4] bg-[#d6e3f3] px-3 py-2 font-bold">
                          使途拘束資産名
                        </div>
                        <div className="flex items-center border-b border-[#7a9bc4] bg-white px-3 py-1.5">
                          <RequiredMark required />
                          <Input
                            value={restrictedAssetName}
                            onChange={(e) =>
                              setRestrictedAssetName(e.target.value)
                            }
                            className="h-[24px] flex-1 rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[14px]"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ===== 対応科目タブ ===== */}
                {activeTab === "accounts" && (
                  <AccountsTab
                    rows={accountRows}
                    selectedRowId={selectedRowId}
                    onSelectRow={setSelectedRowId}
                    onAddRow={handleAddRow}
                    onDeleteRow={handleDeleteRow}
                    onChangeRow={handleChangeAccountRow}
                  />
                )}

                {/* ===== 金額情報タブ（3号のみ） ===== */}
                {activeTab === "amounts" && isType3 && (
                  <AmountsTab
                    rows={amountRows}
                    selectedRowId={selectedAmountRowId}
                    onSelectRow={setSelectedAmountRowId}
                    onAddRow={handleAddAmountRow}
                    onDeleteRow={handleDeleteAmountRow}
                    onChangeRow={handleChangeAmountRow}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
