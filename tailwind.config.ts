// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        headerLight: "#eef4fa",   // ヘッダー1〜2段目の薄い青グレー
        headerDark:  "#00547a",   // ヘッダー3段目の濃い青
        primary:     "#003c75",   // 深い業務青
        textMain:    "#1e2a35",   // 通常テキスト
        textSub:     "#6b7b8f",   // 補助テキスト
        borderLine:  "#b0c4d4",   // 罫線・枠線
        surfaceHover:"#e8eef7",   // hover時の淡い青
        appBg:       "#e5eef7",   // 右側ワークスペースの背景
        menuBg:      "#dbe8f4",   // 左メニューの背景
      },
      boxShadow: {
        "card-sm":
          "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.6) inset",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
}

export default config
