// app/(screens)/cash-name-change/page.tsx
"use client"

import { useMemo, useState, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import { AccountingSelectModal } from "@/components/account/AccountingSelectModal"
import {
  AccountSearchDialog,
  type PickedAccount,
} from "@/components/account/AccountSearchDialog"
import { type AccountNode } from "@/components/account/account-data"
import { findAccountNodeByCode } from "@/components/account/account-kind"

// この画面専用：科目コードからノード情報を取得
function findAccountForCashNameChange(
  code: string
): { node: AccountNode } | undefined {
  if (!code) return undefined
  const found = findAccountNodeByCode(code)
  if (!found) return undefined
  return { node: found.node }
}

export default function CashNameChangePage() {
  // ===== 上部：会計・科目 =====
  const [accountingCode, setAccountingCode] = useState("") // 親会計コード
  const [accountingName, setAccountingName] = useState("") // 親会計名
  const [modalOpen, setModalOpen] = useState(false) // 会計選択モーダル

  const [subjectCodeRaw, setSubjectCodeRaw] = useState("") // 科目コード

  // 科目名を name1 / name2 に分割して保持（上部表示用 & 下部初期値用）
  const [subjectName1, setSubjectName1] = useState("") // 科目名1行目
  const [subjectName2, setSubjectName2] = useState("") // 科目名2行目（用途ラベルなど）

  const [subjectParentName, setSubjectParentName] = useState("") // 親科目名（預金種別判定などに利用）
  const [accountDialogOpen, setAccountDialogOpen] = useState(false) // 科目検索ダイアログ

  const [fiscalYear, setFiscalYear] = useState<"R08" | "R09">("R08")

  // ===== 下部：状態 =====
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "transfer">("general")

  // 下部表示用の科目名（2行）
  const [detailSubjectName1, setDetailSubjectName1] = useState("")
  const [detailSubjectName2, setDetailSubjectName2] = useState("")

  const [detailShortName, setDetailShortName] = useState("") // 省略名（下部）
  const [visible, setVisible] = useState<"on" | "off">("on") // 表示/非表示（下部）
  const [bankCode, setBankCode] = useState("") // 銀行コード
  const [branchCode, setBranchCode] = useState("") // 支店コード
  const [bankName, setBankName] = useState("") // 銀行名
  const [branchName, setBranchName] = useState("") // 支店名
  const [accountNo, setAccountNo] = useState("") // 口座番号

  // === コードからノード情報取得 ===
  const accountInfo = useMemo(
    () =>
      subjectCodeRaw ? findAccountForCashNameChange(subjectCodeRaw) : undefined,
    [subjectCodeRaw]
  )

  // === 集計科目（親）判定：children を持っていれば集計科目 ===
  const isAggregateSubject = useMemo(() => {
    return !!(accountInfo?.node.children && accountInfo.node.children.length > 0)
  }, [accountInfo])

  // === 科目の属性判定（名前ベースでざっくり判定） ===
  const nodeName1 = accountInfo?.node.name1 ?? ""
  const nodeName2 = accountInfo?.node.name2 ?? ""
  const hasName2 = !!nodeName2

  // 普通預金・当座預金っぽいか？
  const isBankCategory =
    nodeName1.includes("普通預金") ||
    nodeName1.includes("当座預金") ||
    subjectParentName.includes("普通預金") ||
    subjectParentName.includes("当座預金")

  // 「金融資産タブ」相当（定期預金・投資有価証券など）をざっくり判定
  const isFinancialSubject =
    nodeName1.includes("定期預金") || nodeName1.includes("有価証券")

  // 金融資産の中で預金系か？
  const isDepositInFinancial =
    isFinancialSubject &&
    (nodeName1.includes("定期預金") ||
      subjectParentName.includes("定期預金"))

  // ===== 行ごとの表示フラグ =====
  let showNameRows = false
  let showBankRows = false

  if (isBankCategory) {
    // ＜普通預金・当座預金科目＞
    if (isAggregateSubject) {
      // ・集計科目
      //   → 科目名、省略名、表示
      showNameRows = true
      showBankRows = false
    } else if (!hasName2) {
      // ・集計科目以外（name2なし）
      //   → 科目名、省略名、表示、銀行・支店、口座番号
      showNameRows = true
      showBankRows = true
    } else {
      // ・集計科目以外（name2あり）
      //   → 銀行・支店、口座番号のみ
      showNameRows = false
      showBankRows = true
    }
  } else if (isFinancialSubject) {
    // ＜金融資産っぽい科目（定期預金・有価証券など）＞
    if (isAggregateSubject) {
      // 集計科目 → 何も表示しない（選択不可想定）
      showNameRows = false
      showBankRows = false
    } else if (isDepositInFinancial) {
      // 預金科目（name2あり/なし問わず）→ 銀行・支店、口座番号のみ
      showNameRows = false
      showBankRows = true
    } else {
      // 預金科目以外（投資有価証券など）
      // → この画面では対象外：何も表示しない
      showNameRows = false
      showBankRows = false
    }
  } else {
    // その他タブ（現金・小口現金など）の暫定ルール：
    // → 「科目名」だけ出す
    showNameRows = true
    showBankRows = false
  }

  // ===== 会計選択 =====
  const handleAccountingSelected = (payload: {
    parentCode: string
    parentName: string
    childCode?: string
    childName?: string
    grandchildCode?: string
    grandchildName?: string
  }) => {
    const code = payload.parentCode || ""
    setAccountingCode(code)
    setAccountingName(payload.parentName || "")
    setModalOpen(false)
  }

  // ===== 科目選択（モーダル）：下部は開かず、上部にセットのみ =====
  const handleAccountPicked = (picked: PickedAccount) => {
    const code = picked.code || ""

    const info = findAccountForCashNameChange(code)

    if (info) {
      const nodeName1Local = info.node.name1 ?? ""
      const parentNameLocal = picked.parentName ?? ""
      const hasChildren =
        !!info.node.children && info.node.children.length > 0
      const hasName2Local = !!info.node.name2

      const depositLike =
        nodeName1Local.includes("定期預金") ||
        parentNameLocal.includes("定期預金") ||
        nodeName1Local.includes("普通預金") ||
        nodeName1Local.includes("当座預金")

      // 投資有価証券はこの画面の対象外 → 無言で選択無効
      if (nodeName1Local.includes("投資有価証券")) {
        return
      }

      // 1) 集計科目 → 選択不可（本来は非アクティブ）想定なので何も反応しない
      if (hasChildren) {
        return
      }

      // 2) 預金科目以外（name2なし）→ 選択不可
      if (!depositLike && !hasName2Local) {
        return
      }
      // 3) それ以外（預金 or 預金以外 name2あり）は選択可
    }

    setSubjectCodeRaw(code)

    const n1 = picked.name1 ?? picked.name ?? ""
    const n2 = picked.name2 ?? ""

    setSubjectName1(n1)
    setSubjectName2(n2)

    setSubjectParentName(picked.parentName || "")
    setAccountDialogOpen(false)
  }

  // 科目コード欄 Enter → 下部を開く
  const onSubjectCodeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") openDetail()
  }

  // ===== 下部を開く =====
  const openDetail = () => {
    // 投資有価証券は詳細表示させない（コード直接入力対策）
    if (
      accountInfo &&
      (accountInfo.node.name1 ?? "").includes("投資有価証券")
    ) {
      return
    }

    if (!accountingCode) {
      alert("会計を選択してください")
      return
    }
    if (!subjectCodeRaw) {
      alert("科目コードを入力または選択してください")
      return
    }

    // 上部で選択した name1 / name2 を、それぞれ初期値として下部にセット
    setDetailSubjectName1(subjectName1 || "")
    setDetailSubjectName2(subjectName2 || "")

    setDetailShortName("")
    setDetailOpen(true)
    setActiveTab("general")
  }

  // ===== FunctionKeyBar 連携 =====
  // Enter：下部が開いていれば確定→上部クリア／閉じていれば下部を再表示
  const doEnter = () => {
    if (detailOpen) {
      // 下部を閉じ、上部クリア
      setDetailOpen(false)
      setActiveTab("general")

      setAccountingCode("")
      setAccountingName("")

      setSubjectCodeRaw("")
      setSubjectName1("")
      setSubjectName2("")
      setSubjectParentName("")

      setDetailSubjectName1("")
      setDetailSubjectName2("")

      setVisible("on")
      setBankCode("")
      setBranchCode("")
      setBankName("")
      setBranchName("")
      setAccountNo("")
    } else {
      // 上部のみ表示中 → Enterで下部を開く
      openDetail()
    }
  }

  // F6（戻る）：下部を閉じる（上部保持）
  const doBack = () => {
    if (!detailOpen) return
    setDetailOpen(false)
    setActiveTab("general")
  }

  return (
    <div className="flex flex-col w-full h-full bg-[#e6edf5] text-[13px]">
      <FunctionKeyBar
        onEnter={doEnter}
        onBack={doBack}
        onExit={() => {
          if (detailOpen) {
            setDetailOpen(false)
            setActiveTab("general")
          } else {
            window.history.back()
          }
        }}
      />

      {/* ===== 上部エリア ===== */}
      <div className="flex flex-col w-[720px] mt-4 ml-6 border border-[#7a9bc4] bg-[#d9e4f5]">
        {/* 会計単独選択 */}
        <div className="grid grid-cols-[180px_1fr] border-b border-[#7a9bc4]">
          <div className="flex items-center justify-center bg-[#c3d7f0] border-r border-[#7a9bc4] p-2">
            会計単独選択
          </div>
          <div className="flex flex-row items-center gap-2 p-2 bg-white">
            <Input
              value={accountingCode}
              onChange={(e) => {
                const v = e.target.value
                setAccountingCode(v)
              }}
              className="w-[80px] h-7 text-[13px] bg-white border border-[#7a9bc4]"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-9 border-[#7a9bc4]"
              onClick={() => setModalOpen(true)}
            >
              参
            </Button>
            <div className="flex-1 text-[13px] text-[#1a1a1a] truncate">
              {accountingName || ""}
            </div>
          </div>
        </div>

        {/* 科目選択 */}
        <div className="grid grid-cols-[180px_1fr] border-b border-[#7a9bc4]">
          <div className="flex items-center justify-center bg-[#c3d7f0] border-r border-[#7a9bc4] p-2">
            科目選択
          </div>
          <div className="flex flex-row items-center gap-2 p-2 bg-white">
            <Input
              value={subjectCodeRaw}
              onChange={(e) => {
                const v = e.target.value
                setSubjectCodeRaw(v)
              }}
              onKeyDown={onSubjectCodeKeyDown}
              className="w-[120px] h-7 text-[13px] bg-white border border-[#7a9bc4]"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-9 border-[#7a9bc4]"
              onClick={() => setAccountDialogOpen(true)}
            >
              参
            </Button>

            {/* 科目名（name1 + name2 連結表示） */}
            <div className="flex-1 text-[13px] text-[#1a1a1a] truncate">
              {[subjectName1, subjectName2].filter(Boolean).join(" ")}
            </div>
          </div>
        </div>

        {/* 効力開始年度選択 */}
        <div className="grid grid-cols-[180px_1fr]">
          <div className="flex items-center justify-center bg-[#c3d7f0] border-r border-[#7a9bc4] p-2">
            効力開始年度選択
          </div>
          <div className="flex items-center gap-4 p-2 bg-white text-[13px]">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="year"
                value="R08"
                checked={fiscalYear === "R08"}
                onChange={(e) =>
                  setFiscalYear(e.target.value as "R08" | "R09")
                }
              />
              令和8年度
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="year"
                value="R09"
                checked={fiscalYear === "R09"}
                onChange={(e) =>
                  setFiscalYear(e.target.value as "R08" | "R09")
                }
              />
              令和9年度
            </label>
          </div>
        </div>
      </div>

      {/* ===== 下部：タブ + 詳細フォーム ===== */}
      {detailOpen && (
        <div className="w-[720px] ml-6 mt-3 rounded-md border border-[#b6c8e1] bg-[#eaf3ff]">
          {/* タブヘッダー（一般のみ実装） */}
          <div className="flex border-b border-[#cbd9ee]">
            {[
              { id: "general", label: "一般" },
              { id: "transfer", label: "振込" },
            ].map((t) => (
              <button
                key={t.id}
                className={`px-4 py-2 text-sm ${
                  activeTab === (t.id as "general" | "transfer")
                    ? "bg-white border-t border-x border-[#cbd9ee] -mb-px rounded-t"
                    : "text-[#3b5b8a]"
                }`}
                onClick={() =>
                  setActiveTab(t.id as "general" | "transfer")
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === "general" && (
            <div className="p-2">
              {/* 科目名／省略名／表示 */}
              {showNameRows && (
                <>
                  <DetailRow label="科目名">
                    <div className="flex flex-col gap-1">
                      <Input
                        value={detailSubjectName1}
                        onChange={(e) =>
                          setDetailSubjectName1(e.target.value)
                        }
                        className="h-8 w-[420px] rounded-[2px] bg-white"
                      />
                      <Input
                        value={detailSubjectName2}
                        onChange={(e) =>
                          setDetailSubjectName2(e.target.value)
                        }
                        className="h-8 w-[420px] rounded-[2px] bg-white"
                      />
                    </div>
                  </DetailRow>

                  <DetailRow label="省略名">
                    <Input
                      value={detailShortName}
                      onChange={(e) =>
                        setDetailShortName(e.target.value)
                      }
                      className="h-8 w-[300px] rounded-[2px] bg-white"
                    />
                  </DetailRow>

                  <DetailRow label="表　示">
                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="visible"
                          checked={visible === "on"}
                          onChange={() => setVisible("on")}
                        />
                        表示
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          name="visible"
                          checked={visible === "off"}
                          onChange={() => setVisible("off")}
                        />
                        非表示
                      </label>
                    </div>
                  </DetailRow>
                </>
              )}

              {/* 銀行・支店／口座番号（条件で表示） */}
              {showBankRows && (
                <>
                  <DetailRow label="銀行・支店">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={bankCode}
                          onChange={(e) =>
                            setBankCode(e.target.value.slice(0, 4))
                          }
                          className="h-8 w-[70px] rounded-[2px] text-center bg-white"
                          placeholder="0000"
                        />
                        <span className="px-1">–</span>
                        <Input
                          value={branchCode}
                          onChange={(e) =>
                            setBranchCode(
                              e.target.value.slice(0, 3)
                            )
                          }
                          className="h-8 w-[60px] rounded-[2px] text-center bg-white"
                          placeholder="000"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-[36px]"
                          onClick={() => {
                            // TODO: ダイアログに差し替え
                            setBankCode((v) => v || "0009")
                            setBranchCode((v) => v || "506")
                            setBankName("三井住友")
                            setBranchName("新大阪")
                          }}
                        >
                          参
                        </Button>
                      </div>
                      <div className="min-w-[220px] text-[13px] leading-5">
                        <div>{bankName || "（銀行名）"}</div>
                        <div>{branchName || "（支店名）"}</div>
                      </div>
                    </div>
                  </DetailRow>

                  <DetailRow label="口座番号">
                    <Input
                      value={accountNo}
                      onChange={(e) =>
                        setAccountNo(
                          e.target.value.replace(/[^\d-]/g, "")
                        )
                      }
                      className="h-8 w-[180px] rounded-[2px] bg-white"
                      placeholder="1234567"
                    />
                  </DetailRow>
                </>
              )}
            </div>
          )}

          {activeTab === "transfer" && (
            <div className="p-3 text-[#557199] text-sm">
              （振込タブの画面は未実装）
            </div>
          )}
        </div>
      )}

      {/* ===== 会計選択モーダル ===== */}
      {modalOpen && (
        <AccountingSelectModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          parentOnly={true}
          onSelect={handleAccountingSelected}
        />
      )}

      {/* ===== 科目検索ダイアログ ===== */}
      {accountDialogOpen && (
        <AccountSearchDialog
          open={accountDialogOpen}
          onClose={() => setAccountDialogOpen(false)}
          onPick={handleAccountPicked}
          disabledCodes={[
            "010162",
            "011101",
            "040101",
            "045101",
            "01110101",
            "04510101",
          ]}
        />
      )}
    </div>
  )
}

/* ラベル左・入力右（折返し防止 & 幅180px） */
function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-2 border-b border-[#cbd9ee] p-2 last:border-b-0">
      <div className="min-h-8 select-none rounded-[2px] bg-[#d5e4fa] px-2 py-1 text-sm text-[#1a1a1a] whitespace-nowrap">
        {label}
      </div>
      <div className="px-1">{children}</div>
    </div>
  )
}
