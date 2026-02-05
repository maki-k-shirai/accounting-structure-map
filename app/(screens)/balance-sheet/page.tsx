"use client"

import { useEffect, useState } from "react"
import { FunctionKeyBar } from "@/components/common/FunctionKeyBar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { PdfPreviewDialog } from "@/components/common/PdfPreviewDialog"

export default function BalanceSheetPage() {
  const [showEnterGuide, setShowEnterGuide] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)

  useEffect(() => {
    const handler = () => setShowEnterGuide(true)
    window.addEventListener("accounting:menu-tour-enter", handler as EventListener)
    return () =>
      window.removeEventListener("accounting:menu-tour-enter", handler as EventListener)
  }, [])

  return (
    <div className="flex h-full flex-col text-[13px] leading-tight text-[#1a1a1a]">
      <FunctionKeyBar
        showEnterClickBadge={showEnterGuide}
        onEnter={() => {
          setPdfOpen(true)
          setShowEnterGuide(false)
          window.dispatchEvent(new CustomEvent("accounting:menu-tour-clear"))
        }}
      />

      <div className="flex flex-1 gap-4 bg-[#eaf4ff] p-4">
        {/* 左カラム */}
        <div className="flex w-[520px] flex-col gap-4">
          <section className="space-y-2">
            <div className="font-semibold">■帳票選択</div>
            <select className="h-[28px] w-full max-w-[280px] rounded-[2px] border border-[#9fb2cc] bg-white px-2 text-[12px]">
              <option>貸借対照表</option>
              <option>貸借対照表内訳表</option>
              <option>貸借対照表総括表</option>
              <option>貸借対照表内訳表(会計別内訳)</option>
            </select>
          </section>

          <section className="space-y-2">
            <div className="font-semibold">■年月指定</div>
            <div className="flex items-center gap-2 text-[12px]">
              <select className="h-[28px] w-[60px] rounded-[2px] border border-[#9fb2cc] bg-white px-1">
                <option>令和</option>
                <option>平成</option>
                <option>昭和</option>
              </select>
              <Input className="h-[28px] w-[40px] text-center" defaultValue="7" />
              <span>年</span>
              <Input className="h-[28px] w-[40px] text-center" defaultValue="4" />
              <span>月</span>
              <button className="ml-1 flex h-[28px] w-[28px] items-center justify-center rounded-[2px] border border-[#9fb2cc] bg-white">
                <CalendarIcon className="h-[16px] w-[16px] text-[#4a5a7a]" />
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <div className="font-semibold">■会計選択</div>
            <div className="flex items-center gap-4 text-[12px]">
              <label className="flex items-center gap-2">
                <input type="radio" name="accounting" defaultChecked />
                <span>法人全体</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="accounting" />
                <span>親会計</span>
              </label>
            </div>
          </section>

          <div className="mt-auto">
            <div className="font-semibold">■科目レベル選択</div>
            <select className="mt-2 h-[28px] w-[160px] rounded-[2px] border border-[#9fb2cc] bg-white px-2 text-[12px]">
              <option>大科目</option>
              <option>中科目</option>
              <option>小科目</option>
            </select>
          </div>
        </div>

        {/* 右カラム */}
        <div className="ml-auto flex w-[320px] flex-col gap-4">
          <section className="space-y-2">
            <div className="font-semibold">■条件選択</div>
            <div className="space-y-3">
              <div className="rounded-[2px] border border-[#c4d0e0] bg-[#eaf4ff] p-3 text-[12px]">
                <div className="font-medium">前年度金額の表示方法</div>
                <div className="mt-2 space-y-1">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="prev" defaultChecked />
                    <span>会計年度末残</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="prev" />
                    <span>前年度月末残</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="prev" />
                    <span>0円で表示</span>
                  </label>
                </div>
              </div>

              <div className="rounded-[2px] border border-[#c4d0e0] bg-[#eaf4ff] p-3 text-[12px]">
                <div className="font-medium">出力条件</div>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" />
                  <span>0円でも出力</span>
                </label>
              </div>

              <div className="rounded-[2px] border border-[#c4d0e0] bg-[#eaf4ff] p-3 text-[12px]">
                <div className="font-medium">表示形式</div>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" />
                  <span>千円単位</span>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="font-semibold">■出力項目</div>
            <div className="rounded-[2px] border border-[#c4d0e0] bg-[#eaf4ff] p-3 text-[12px] space-y-1">
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>出力日時</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>ページ番号</span>
              </label>
            </div>
          </section>

          <section className="space-y-2">
            <div className="font-semibold">■出力用紙</div>
            <div className="rounded-[2px] border border-[#c4d0e0] bg-[#eaf4ff] p-3 text-[12px] grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="paper" defaultChecked />
                <span>A4タテ</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="paper" />
                <span>A3タテ</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="paper" />
                <span>A4ヨコ</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="paper" />
                <span>A3ヨコ</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <PdfPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        src="/pdf/bs.pdf"
        title="貸借対照表"
      />
    </div>
  )
}
