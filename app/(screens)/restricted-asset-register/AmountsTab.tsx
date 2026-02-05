// app/(screens)/restricted-asset-register/AmountsTab.tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type AmountRow = {
  id: number
  yearLabel: string
  prevTermEnd: string
  deposit: string
  reversal: string
  valuationDiff: string
  internalTransfer: string
}

export type AmountsTabProps = {
  rows: AmountRow[]
  selectedRowId: number | null
  onSelectRow: (id: number) => void
  onAddRow: () => void
  onDeleteRow: () => void
  onChangeRow: (rowId: number, updater: (prev: AmountRow) => AmountRow) => void
}

const YEAR_CHOICES = ["令和8年度"] as const

export function AmountsTab({
  rows,
  selectedRowId,
  onSelectRow,
  onAddRow,
  onDeleteRow,
  onChangeRow,
}: AmountsTabProps) {
  // 「年度参照」の簡易ポップアップを、どの行に対して開いているか
  const [yearPickerRowId, setYearPickerRowId] = React.useState<number | null>(
    null,
  )

  const handlePickYear = (rowId: number, year: string) => {
    onChangeRow(rowId, (prev) => ({ ...prev, yearLabel: year }))
    setYearPickerRowId(null)
  }

  return (
    <div className="p-3 text-[13px]">
      {/* 追加・削除 */}
      <div className="mb-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-[26px] rounded-[2px] border-[#7a9bc4] px-6 py-0"
          onClick={onAddRow}
        >
          追加
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-[26px] rounded-[2px] border-[#7a9bc4] px-6 py-0"
          onClick={onDeleteRow}
        >
          削除
        </Button>
        <span className="text-[12px]">
          ※金額情報は履歴管理の対象外となります。
        </span>
      </div>

      {/* === テーブル枠 === */}
      <div className="border border-[#7a9bc4]">
        {/* ヘッダ行 */}
        <div className="grid grid-cols-[60px_140px_70px_1fr_1fr_1fr_1fr_1fr] border-b border-[#7a9bc4] bg-[#d6e3f3] text-center text-[14px] font-bold">
          <div className="h-[34px] border-r border-[#7a9bc4]" />
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            年度
          </div>
          <div className="h-[34px] border-r border-[#7a9bc4]" />
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            前期末
          </div>
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            積立
          </div>
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            取崩
          </div>
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            評価差額
          </div>
          <div className="flex h-[34px] items-center justify-center">
            内訳間振替
          </div>
        </div>

        {/* 明細行 */}
        <div className="max-h-[220px] overflow-y-auto bg-white">
          {rows.map((row, index) => {
            const isSelected = row.id === selectedRowId
            const isYearPickerOpen = yearPickerRowId === row.id

            return (
              <div
                key={row.id}
                className={`relative grid cursor-pointer grid-cols-[60px_140px_70px_1fr_1fr_1fr_1fr_1fr] border-b border-[#cccccc] bg-white hover:bg-[#f5f8ff] ${
                  isSelected ? "bg-[#edf3ff]" : ""
                }`}
                onClick={() => onSelectRow(row.id)}
              >
                {/* No */}
                <div className="flex min-h-[36px] items-center justify-center border-r border-[#cccccc]">
                  {index + 1}
                </div>

                {/* 年度 */}
                <div className="flex min-h-[36px] items-center border-r border-[#cccccc] px-2">
                  <Input
                    value={row.yearLabel}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        yearLabel: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-[13px]"
                  />
                </div>

                {/* 年度参照ボタン */}
                <div className="flex min-h-[36px] items-center justify-center border-r border-[#cccccc]">
                  <button
                    type="button"
                    className="h-[24px] rounded-[3px] border border-[#7a9bc4] bg-[#f5f8ff] px-3 text-[12px] text-[#0044cc] hover:bg-[#e3edff]"
                    onClick={(e) => {
                      e.stopPropagation()
                      setYearPickerRowId(
                        isYearPickerOpen ? null : row.id,
                      )
                    }}
                  >
                    参
                  </button>
                </div>

                {/* 前期末 */}
                <div className="flex min-h-[36px] items-center border-r border-[#cccccc] px-2">
                  <Input
                    value={row.prevTermEnd}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        prevTermEnd: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-right tabular-nums"
                  />
                </div>

                {/* 積立 */}
                <div className="flex min-h-[36px] items-center border-r border-[#cccccc] px-2">
                  <Input
                    value={row.deposit}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        deposit: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-right tabular-nums"
                  />
                </div>

                {/* 取崩 */}
                <div className="flex min-h-[36px] items-center border-r border-[#cccccc] px-2">
                  <Input
                    value={row.reversal}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        reversal: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-right tabular-nums"
                  />
                </div>

                {/* 評価差額 */}
                <div className="flex min-h-[36px] items-center border-r border-[#cccccc] px-2">
                  <Input
                    value={row.valuationDiff}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        valuationDiff: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-right tabular-nums"
                  />
                </div>

                {/* 内訳間振替 */}
                <div className="flex min-h-[36px] items-center px-2">
                  <Input
                    value={row.internalTransfer}
                    onChange={(e) =>
                      onChangeRow(row.id, (prev) => ({
                        ...prev,
                        internalTransfer: e.target.value,
                      }))
                    }
                    className="h-[26px] w-full rounded-[2px] border border-transparent bg-transparent px-1 text-right tabular-nums"
                  />
                </div>

                {/* 行ごとの簡易「年度選択」ポップアップ */}
                {isYearPickerOpen && (
                  <div className="absolute left-[100px] top-[34px] z-10 w-[160px] rounded-[4px] border border-[#7a9bc4] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
                    {YEAR_CHOICES.map((year) => (
                      <button
                        key={year}
                        type="button"
                        className="flex w-full items-center px-3 py-1.5 text-left text-[13px] hover:bg-[#eef4ff]"
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePickYear(row.id, year)
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
