// components/menu/types.ts
export type MenuIconType = "folder" | "gear" | "document" | "home" | "lock" | "back" | "none"

export type SideMenuNode = {
  id: string          // 内部ID（例: "2-3-1"）
  displayName?: string // 表示用番号（例: "1"）
  label: string
  href?: string
  icon?: MenuIconType
  children?: SideMenuNode[]
}
