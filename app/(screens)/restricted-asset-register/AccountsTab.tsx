// app/(screens)/restricted-asset-register/AccountsTab.tsx
"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AccountingSelectModal } from "@/components/account/AccountingSelectModal"
import {
  AccountSearchDialog,
  type PickedAccount,
} from "@/components/account/AccountSearchDialog"

export type AccountRow = {
  id: number
  accountingCode: string
  accountingName: string
  subjectCode: string
  subjectName: string
}

export type AccountsTabProps = {
  rows: AccountRow[]
  selectedRowId: number | null
  onSelectRow: (id: number) => void
  onAddRow: () => void
  onDeleteRow: () => void
  onChangeRow: (rowId: number, updater: (prev: AccountRow) => AccountRow) => void
}

export function AccountsTab({
  rows,
  selectedRowId,
  onSelectRow,
  onAddRow,
  onDeleteRow,
  onChangeRow,
}: AccountsTabProps) {
  const [accountingModalOpen, setAccountingModalOpen] = React.useState(false)
  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false)
  const [activeRowIdForModal, setActiveRowIdForModal] =
    React.useState<number | null>(null)

  const openAccountingModal = (rowId: number) => {
    setActiveRowIdForModal(rowId)
    setAccountingModalOpen(true)
  }

  const openSubjectModal = (rowId: number) => {
    setActiveRowIdForModal(rowId)
    setSubjectModalOpen(true)
  }

  const handleSelectAccounting = (payload: {
    parentCode: string
    parentName: string
    childCode: string
    childName: string
    grandchildCode: string
    grandchildName: string
  }) => {
    if (activeRowIdForModal == null) return

    const { parentCode, parentName } = payload
    onChangeRow(activeRowIdForModal, (prev) => ({
      ...prev,
      accountingCode: parentCode,
      accountingName: parentName,
    }))
    setAccountingModalOpen(false)
  }

  const handlePickSubject = (picked: PickedAccount) => {
    if (activeRowIdForModal == null) return

    onChangeRow(activeRowIdForModal, (prev) => ({
      ...prev,
      subjectCode: picked.code,
      subjectName: picked.name,
    }))
    setSubjectModalOpen(false)
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
          ※対応科目は履歴管理の対象外となります。
        </span>
      </div>

      {/* === テーブル枠 === */}
      <div className="border border-[#7a9bc4]">
        {/* === タイトル行（会計名・科目名に統合） === */}
        <div className="grid grid-cols-[60px_minmax(260px,1.2fr)_70px_minmax(300px,1.6fr)_70px] border-b border-[#7a9bc4] bg-[#d6e3f3] text-center text-[14px] font-bold">
          <div className="h-[34px] border-r border-[#7a9bc4]" />
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            会計名
          </div>
          <div className="h-[34px] border-r border-[#7a9bc4]" />
          <div className="flex h-[34px] items-center justify-center border-r border-[#7a9bc4]">
            科目名
          </div>
          <div className="h-[34px]" />
        </div>

        {/* === 明細行 === */}
        <div className="max-h-[220px] overflow-y-auto bg-white">
          {rows.map((row, index) => {
            const isSelectedRow = row.id === selectedRowId

            return (
              <div
                key={row.id}
                className={`grid cursor-pointer grid-cols-[60px_minmax(260px,1.2fr)_70px_minmax(300px,1.6fr)_70px] border-b border-[#cccccc] bg-white hover:bg-[#f5f8ff] ${
                  isSelectedRow ? "bg-[#edf3ff]" : ""
                }`}
                onClick={() => onSelectRow(row.id)}
              >
                {/* No */}
                <div className="flex min-h-[36px] items-center justify-center border-r border-[#cccccc]">
                  {index + 1}
                </div>

                {/* 会計（コード・名称） */}
                <div className="flex min-h-[36px] items-center gap-1 border-r border-[#cccccc] px-2">
                  <Input
                    value={row.accountingCode}
                    readOnly
                    className="h-[26px] w-[80px] rounded-[2px] border border-transparent bg-transparent px-1 text-[13px]"
                  />
                  <Input
                    value={row.accountingName}
                    readOnly
                    className="h-[26px] flex-1 rounded-[2px] border border-transparent bg-transparent px-1 text-[13px]"
                  />
                </div>

                {/* 会計参照 */}
                <div className="flex min-h-[36px] items-center justify-center border-r border-[#cccccc]">
                  <button
                    type="button"
                    className="h-[24px] rounded-[3px] border border-[#7a9bc4] bg-[#f5f8ff] px-3 text-[12px] text-[#0044cc] hover:bg-[#e3edff]"
                    onClick={(e) => {
                      e.stopPropagation()
                      openAccountingModal(row.id)
                    }}
                  >
                    参
                  </button>
                </div>

                {/* 科目（コード・名称） */}
                <div className="flex min-h-[36px] items-center gap-1 border-r border-[#cccccc] px-2">
                  <Input
                    value={row.subjectCode}
                    readOnly
                    className="h-[26px] w-[100px] rounded-[2px] border border-transparent bg-transparent px-1 text-[13px]"
                  />
                  <Input
                    value={row.subjectName}
                    readOnly
                    className="h-[26px] flex-1 rounded-[2px] border border-transparent bg-transparent px-1 text-[13px]"
                  />
                </div>

                {/* 科目参照 */}
                <div className="flex min-h-[36px] items-center justify-center">
                  <button
                    type="button"
                    className="h-[24px] rounded-[3px] border border-[#7a9bc4] bg-[#f5f8ff] px-3 text-[12px] text-[#0044cc] hover:bg-[#e3edff]"
                    onClick={(e) => {
                      e.stopPropagation()
                      openSubjectModal(row.id)
                    }}
                  >
                    参
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 会計選択（親会計のみ） */}
      <AccountingSelectModal
        open={accountingModalOpen}
        onClose={() => setAccountingModalOpen(false)}
        onSelect={handleSelectAccounting}
        parentOnly
      />

      {/* 科目選択 */}
      <AccountSearchDialog
        open={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onPick={handlePickSubject}
        title="科目検索"
      />
    </div>
  )
}
