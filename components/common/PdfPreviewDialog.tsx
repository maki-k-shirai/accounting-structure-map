// components/common/PdfPreviewDialog.tsx
"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type PdfPreviewDialogProps = {
  open: boolean
  onClose: () => void
  src: string
  title?: string
}

function isImageSrc(src: string) {
  const s = src.toLowerCase().split("?")[0].split("#")[0]
  return s.endsWith(".png") || s.endsWith(".jpg") || s.endsWith(".jpeg") || s.endsWith(".webp")
}

export function PdfPreviewDialog({
  open,
  onClose,
  src,
  title = "PDFプレビュー",
}: PdfPreviewDialogProps) {
  const image = isImageSrc(src)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="
          fixed left-1/2 top-1/2 z-[210]
          h-[min(80vh,800px)] w-[min(90vw,1000px)]
          -translate-x-1/2 -translate-y-1/2
          rounded-[4px] border border-[#7a9bc4] bg-white p-0
          shadow-[0_20px_40px_rgba(0,0,0,0.45)]
        "
      >
        {/* タイトル帯 */}
        <div className="flex items-center justify-between border-b border-[#7a9bc4] bg-[#eef2fa] px-3 py-2 text-[12px]">
          <span className="font-medium text-[#1a1a1a]">{title}</span>
        </div>

        {/* 表示エリア */}
        <div className="h-[calc(100%-32px)] w-full bg-[#dfe6f5]">
          {image ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto bg-white rounded-b-[4px]">
              <img
                src={src}
                alt={title}
                className="max-h-full max-w-full"
              />
            </div>
          ) : (
            <iframe
              src={src}
              title={title}
              className="h-full w-full rounded-b-[4px] bg-white"
            />
          )}
        </div>

        <DialogTitle className="sr-only">{title}</DialogTitle>
      </DialogContent>
    </Dialog>
  )
}
