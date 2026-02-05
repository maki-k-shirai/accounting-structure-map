// app/(screens)/cashbook/page.tsx
"use client"

import { useState } from "react"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  AccountSearchDialog,
  type PickedAccount,
} from "@/components/account/AccountSearchDialog"

// 会計マスタを利用
import {
  DUMMY_ACCOUNTS,
  type AccountingParent,
} from "@/components/account/AccountingSelectModal"

export default function CashBookScreen() {
  const [fromAccount, setFromAccount] = useState<PickedAccount | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)

  // ===== 会計ツリー用 state / helper =====

  // 親コードのキー作成
  const makeKey = (parentCode: string) => parentCode

  // 初期状態：親会計をすべてチェック済みにする
const buildInitialCheckedMap = () => {
    const map: Record<string, boolean> = {}
    DUMMY_ACCOUNTS.forEach((p: AccountingParent) => {
      map[makeKey(p.code)] = true
    })
    return map
  }

  const [checkedAccounts, setCheckedAccounts] = useState<Record<string, boolean>>(
    () => buildInitialCheckedMap(),
  )

  // コード表示 ON/OFF
  const [showAccountCode, setShowAccountCode] = useState(false)

  // 全選択状態（1件もない場合は false）
  const allChecked =
    Object.values(checkedAccounts).length > 0 &&
    Object.values(checkedAccounts).every(Boolean)

  const handleToggleAll = () => {
    const nextVal = !allChecked
    setCheckedAccounts((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, nextVal])),
    )
  }

  // 親トグル：親＋配下の子を一括でON/OFF
  const toggleParent = (parent: AccountingParent) => {
    setCheckedAccounts((prev) => {
      const next = { ...prev }
      const parentKey = makeKey(parent.code)
      const newVal = !prev[parentKey]
      next[parentKey] = newVal
      parent.children?.forEach((c) => {
        next[makeKey(parent.code)] = newVal
      })
      return next
    })
  }


  return (
    <div className="flex h-screen flex-col bg-sky-50">
      {/* 共通ファンクションキー */}
      <FunctionKeyBar />

      <main className="flex-1 px-4 pb-4 pt-3">
        <div className="flex h-full gap-4">
          {/* 左側メインエリア */}
          <section className="flex-1 space-y-4">
{/* 帳票選択 */}
<div className="space-y-1">
  <p className="text-sm font-bold">■帳票選択</p>
  <select className="h-8 w-80 border bg-white text-sm">
    <option>現金出納帳</option>
    <option>小口現金出納帳</option>
    <option>銀行帳</option>
    <option>総合現金出納帳</option>
    <option>総合小口現金出納帳</option>
    <option>総合銀行帳</option>
  </select>
</div>


            {/* 日付範囲指定 */}
            <div className="space-y-1">
              <p className="text-sm font-bold">■日付範囲指定</p>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* from */}
                <select className="h-7 w-16 border bg-white text-xs">
                  <option>令和</option>
                </select>
                <Input className="h-7 w-12 text-center text-xs" defaultValue="8" />
                <span>年</span>
                <Input className="h-7 w-10 text-center text-xs" defaultValue="4" />
                <span>月</span>
                <Input className="h-7 w-10 text-center text-xs" defaultValue="1" />
                <span>日</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 p-0"
                >
                  <CalendarIcon className="h-3 w-3" />
                </Button>

                <span className="mx-2 text-xs">〜</span>

                {/* to */}
                <select className="h-7 w-16 border bg-white text-xs">
                  <option>令和</option>
                </select>
                <Input className="h-7 w-12 text-center text-xs" defaultValue="9" />
                <span>年</span>
                <Input className="h-7 w-10 text-center text-xs" defaultValue="3" />
                <span>月</span>
                <Input className="h-7 w-10 text-center text-xs" defaultValue="31" />
                <span>日</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 p-0"
                >
                  <CalendarIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* 会計選択（マスタ準拠ツリー） */}
            <div className="flex h-[430px] flex-col space-y-2">
              <p className="text-sm font-bold">■会計選択</p>

              {/* ジャンプ入力（今はダミー） */}
              <div className="flex items-center gap-2">
                <Input className="h-7 flex-1 text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  className="h-7 px-4 text-xs"
                >
                  ジャンプ
                </Button>
              </div>

              {/* 全選択／コード表示 */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleToggleAll}
                  />
                  <span>全選択／全解除</span>
                </label>
                <label className="ml-auto flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={showAccountCode}
                    onChange={(e) => setShowAccountCode(e.target.checked)}
                  />
                  <span>コード表示</span>
                </label>
              </div>

              {/* 会計ツリー */}
              <div className="mt-1 flex-1 overflow-y-auto border bg-white px-2 py-1 text-sm">
                <ul className="space-y-1">
                  {DUMMY_ACCOUNTS.map((parent) => {
                    const parentKey = makeKey(parent.code)
                    const parentChecked = !!checkedAccounts[parentKey]

                    return (
                      <li key={parentKey} className="space-y-1">
                        {/* 親会計 */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={parentChecked}
                            onChange={() => toggleParent(parent)}
                          />
                          <span className="font-medium">
                            {showAccountCode ? `${parent.code} ` : ""}
                            {parent.name}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

{/* 科目範囲選択 */}
<div className="mt-2 space-y-1">
  <p className="text-sm font-bold">■科目範囲選択</p>
  <div className="mt-1 flex items-center gap-2">
    
    {/* FROM（左側） */}
    <Input
      className="h-8 w-40 text-sm"
      readOnly
      value={fromAccount?.code ?? ""}
    />
    <Button
      type="button"
      variant="outline"
      className="h-8 px-3 text-xs"
      onClick={() => setAccountDialogOpen(true)}
    >
      参
    </Button>

    <span className="mx-2 text-sm">〜</span>

    {/* TO（右側） */}
    <Input
      className="h-8 w-40 text-sm"
      readOnly
      // 右側も後で state を持たせるので今は空欄
    />
    <Button
      type="button"
      variant="outline"
      className="h-8 px-3 text-xs"
      onClick={() => setAccountDialogOpen(true)}
    >
      参
    </Button>
  </div>
</div>


{/* 科目レベル選択 */}
<div className="mt-3 space-y-1">
  <p className="text-sm font-bold">■科目レベル選択</p>
  <div className="mt-1">
    <select className="h-8 w-40 border bg-white text-sm">
      <option>中科目</option>
      <option>小科目</option>
      <option>細目1</option>
      <option>細目2</option>
      <option>細目3</option>
      <option>細目4</option>
    </select>
  </div>
</div>

          </section>

          {/* 右側パネル */}
          <aside className="w-72 space-y-4">
            {/* 条件選択 */}
            <section className="space-y-2">
              <p className="text-sm font-bold">■条件選択</p>
              <div className="ml-3 space-y-1 text-xs">
                <p className="font-semibold">出力条件</p>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>詰口内訳出力</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>0円でも出力</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>選択会計合算</span>
                </label>
              </div>
            </section>

            {/* 出力項目 */}
            <section className="space-y-2">
              <p className="text-sm font-bold">■出力項目</p>
              <div className="ml-3 space-y-1 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>出力日時</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>ページ番号</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" />
                  <span>科目コード</span>
                </label>
              </div>
            </section>

            {/* 出力用紙 */}
            <section className="space-y-2">
              <p className="text-sm font-bold">■出力用紙</p>
              <div className="ml-3 space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span>網掛あり</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="paper-orientation"
                      defaultChecked
                    />
                    <span>A4タテ</span>
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="paper-orientation" />
                    <span>A4ヨコ</span>
                  </label>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* 科目検索モーダル */}
      <AccountSearchDialog
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
        onPick={(picked) => {
          setFromAccount(picked)
          setAccountDialogOpen(false)
        }}
          tabMode="depositOnly"        
          initialCategoryId="deposit" 
          disabledCodes={[]}
      />
    </div>
  )
}
