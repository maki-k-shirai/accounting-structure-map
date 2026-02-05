// app/(screens)/funding-list/page.tsx
"use client"

import { useState } from "react"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ==== ダミーデータ（親会計＋その配下） ====
type AccountingChild = {
  code: string
  name: string
  note?: string
}

type AccountingParent = {
  code: string
  name: string
  children?: AccountingChild[]
}

const DUMMY_ACCOUNTS: AccountingParent[] = [
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
  },
]

// ==== 画面下部のチェックリスト用フラット構造 ====
type FundingRow = {
  key: string
  level: "parent" | "child"
  code: string
  label: string
  checked: boolean
}

function buildFundingRows(accounts: AccountingParent[]): FundingRow[] {
  const rows: FundingRow[] = []

  accounts.forEach((parent) => {
    // 親行
    rows.push({
      key: parent.code,
      level: "parent",
      code: parent.code,
      label: parent.name,
      checked: true,
    })

    // 子行
    parent.children?.forEach((child) => {
      rows.push({
        key: `${parent.code}-${child.code}`,
        level: "child",
        code: child.code,
        label: child.note ? `${child.name} ${child.note}` : child.name,
        checked: true,
      })
    })
  })

  return rows
}

export default function FundingListPage() {
  // 年度指定
  const [era] = useState<"令和">("令和")
  const [year, setYear] = useState("8")

  // 会計選択（検索ボックス的なイメージ・中身は空でOK）
  const [accountSearchText, setAccountSearchText] = useState("")

  // 出力項目
  const [outputDateTime, setOutputDateTime] = useState(false)
  const [outputPageNo, setOutputPageNo] = useState(false)

  // チェックリスト
  const [rows, setRows] = useState<FundingRow[]>(() =>
    buildFundingRows(DUMMY_ACCOUNTS)
  )

  // コード表示
  const [showCode, setShowCode] = useState(false)

  // 全選択/全解除チェックボックスの状態（全て選択されているか）
  const allChecked = rows.length > 0 && rows.every((r) => r.checked)

  // ===== FunctionKeyBar ハンドラ =====
  const handleEnter = () => {
    // TODO: 出力処理
    console.log("財源一覧表出力", { rows, outputDateTime, outputPageNo })
  }

  const handleBack = () => {
    // TODO: 呼び出し元メニューへ戻る
    console.log("Back")
  }

  // ===== チェック操作 =====
  const handleToggleAll = (checked: boolean) => {
    setRows((prev) => prev.map((r) => ({ ...r, checked })))
  }

  const handleToggleRow = (key: string, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, checked } : r))
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#e6f1ff] text-[13px] text-[#1a1a1a]">
      {/* 共通ファンクションキー */}
      <FunctionKeyBar onEnter={handleEnter} onBack={handleBack} />

      {/* コンテンツ本体（左：年度・会計・一覧、右：出力項目） */}
      <div className="flex-1 p-3">
        <div className="flex items-start gap-4">
          {/* 左カラム：年度指定・会計選択・財源一覧 */}
          <div className="flex-1">
            {/* 年度指定 */}
            <div className="mb-1 flex items-center gap-2">
              <div className="h-[12px] w-[12px] bg-black text-transparent leading-none">
                ■
              </div>
              <div className="font-semibold">年度指定</div>
            </div>
            <div className="mb-3 flex items-center gap-2 pl-4">
              <select
                value={era}
                className="h-[24px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
                disabled
              >
                <option value="令和">令和</option>
              </select>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-[24px] w-[40px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
              />
              <span>年度</span>
            </div>

            {/* 会計選択 */}
            <div className="mb-1 flex items-center gap-2">
              <div className="h-[12px] w-[12px] bg-black text-transparent leading-none">
                ■
              </div>
              <div className="font-semibold">会計選択</div>
            </div>
            <div className="mb-3 flex items-center gap-2 pl-4">
              <Input
                value={accountSearchText}
                onChange={(e) => setAccountSearchText(e.target.value)}
                className="h-[24px] w-[260px] rounded-[2px] border border-[#7a9bc4] bg-white px-1 text-[12px]"
              />
              <Button
                variant="outline"
                className="h-[26px] rounded-[2px] border border-[#7a9bc4] bg-white px-3 text-[12px]"
                onClick={() => console.log("ジャンプ（ダミー）")}
              >
                ジャンプ
              </Button>
            </div>

            {/* 全選択/全解除・コード表示（枠の外・一覧の上） */}
            <div className="mb-1 flex items-center justify-between pr-1 text-[12px]">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-[14px] w-[14px]"
                    checked={allChecked}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                  />
                  <span>全選択/全解除</span>
                </label>

                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-[14px] w-[14px]"
                    checked={showCode}
                    onChange={(e) => setShowCode(e.target.checked)}
                  />
                  <span>コード表示</span>
                </label>
              </div>
            </div>

            {/* 財源一覧（親・子すべて表示） */}
            <div className="rounded-[2px] border border-[#7a9bc4] bg-white p-2 h-[560px]">
              <div className="h-full overflow-y-auto">
                {rows.map((row) => (
                  <div key={row.key} className="py-[3px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-[14px] w-[14px]"
                        checked={row.checked}
                        onChange={(e) =>
                          handleToggleRow(row.key, e.target.checked)
                        }
                      />
                      <span
                        className={
                          row.level === "child"
                            ? "ml-6 text-[15px] leading-[22px]"
                            : "text-[15px] font-medium leading-[22px]"
                        }
                      >
                        {showCode ? `${row.code} ` : ""}
                        {row.label}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右カラム：出力項目（年度指定と縦位置を揃えてトップ配置） */}
          <div className="w-[220px]">
            {/* タイトル（枠の外） */}
            <div className="mb-1 flex items-center gap-2">
              <div className="h-[12px] w-[12px] bg-black text-transparent leading-none">
                ■
              </div>
              <div className="text-[13px] font-semibold">出力項目</div>
            </div>

            {/* 中身は枠ありボックス */}
            <div className="rounded-[2px] border border-[#7a9bc4] bg-white p-3 text-[12px]">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-[14px] w-[14px]"
                    checked={outputDateTime}
                    onChange={(e) => setOutputDateTime(e.target.checked)}
                  />
                  <span>出力日時</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-[14px] w-[14px]"
                    checked={outputPageNo}
                    onChange={(e) => setOutputPageNo(e.target.checked)}
                  />
                  <span>ページ番号</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
