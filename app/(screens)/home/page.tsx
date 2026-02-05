// app/(screens)/home/page.tsx
"use client"

export default function HomePage() {
  return (
    <div className="flex h-full w-full items-center justify-center text-[#4a4a4a] text-sm bg-white">
      <div className="text-center leading-relaxed">
        <div className="text-[15px] font-medium text-[#1a1a1a] mb-2">
          業務を選択してください
        </div>
        <div className="text-[12px] text-[#6b6b6b]">
          サイドメニューから処理を選ぶと、ここに画面が表示されます。
        </div>
      </div>
    </div>
  )
}
