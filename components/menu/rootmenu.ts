// components/menu/rootmenu.ts
import type { SideMenuNode } from "./types"

export const rootMenu: SideMenuNode[] = [
  // 1. 予算処理
  {
    id: "1",
    displayName: "1",
    label: "予算処理",
    icon: "folder",
  },

  // 2. 伝票・伝票入力
  {
    id: "2",
    displayName: "2",
    label: "伝票・伝票入力",
    icon: "folder",
    children: [
      {
        id: "2-1",
        displayName: "1",
        label: "収入調定・支出負担行為入力",
        icon: "folder",
        // href はまだなし
      },
      {
        id: "2-2",
        displayName: "2",
        label: "仮伝票入力",
        icon: "folder",
        // href はまだなし
      },
      {
        id: "2-3",
        displayName: "3",
        label: "伝票入力",
        icon: "folder",
        children: [
          {
            id: "2-3-1",
            displayName: "1",
            label: "伝票入力",
            icon: "folder",
            href: "/voucher-entry", // ← ここで業務エリアに voucher-entry を表示
          },
          {
            id: "2-3-2",
            displayName: "2",
            label: "伝票検索",
            icon: "folder",
          },
          {
            id: "2-3-3",
            displayName: "3",
            label: "債権債務消込伝票入力",
            icon: "folder",
          },
          {
            id: "2-3-4",
            displayName: "4",
            label: "伝票データ取込",
            icon: "folder",
          },
          {
            id: "2-3-5",
            displayName: "5",
            label: "伝票明細csv出力",
            icon: "document",
          },
          {
            id: "2-3-6",
            displayName: "6",
            label: "伝票再出力",
            icon: "document",
          },
          {
            id: "2-3-7",
            displayName: "7",
            label: "削除伝票検索",
            icon: "folder",
          },
          {
            id: "2-3-8",
            displayName: "8",
            label: "添付資料検索",
            icon: "document",
          },
        ],
      },
    ],
  },

  // 3. 日次処理
  {
    id: "3",
    displayName: "3",
    label: "日次処理",
    icon: "folder",
    children: [
      {
        id: "3-1",
        displayName: "1",
        label: "収入調定・支出負担行為段階",
        icon: "folder",
      },
      {
        id: "3-2",
        displayName: "2",
        label: "仮伝票段階",
        icon: "folder",
      },
      {
        id: "3-3",
        displayName: "3",
        label: "伝票段階",
        icon: "folder",
        children: [
          {
            id: "3-3-1",
            displayName: "1",
            label: "伝票一覧参照",
            icon: "document",
          },
          {
            id: "3-3-2",
            displayName: "2",
            label: "現預金残高参照",
            icon: "document",
          },
          {
            id: "3-3-3",
            displayName: "3",
            label: "伝票ログ参照",
            icon: "document",
          },
          {
            id: "3-3-4",
            displayName: "4",
            label: "伝票ログ印刷",
            icon: "document",
          },
          {
            id: "3-3-5",
            displayName: "5",
            label: "現預金出納帳",
            icon: "document",
            href: "cashbook",
          },
          {
            id: "3-3-6",
            displayName: "6",
            label: "日計表",
            icon: "document",
          },
          {
            id: "3-3-7",
            displayName: "7",
            label: "仕訳帳",
            icon: "folder",
          },
          {
            id: "3-3-8",
            displayName: "8",
            label: "支払調書",
            icon: "document",
          },
        ]
      },
    ]      
  },

  // 4. 月次処理
  {
    id: "4",
    displayName: "4",
    label: "月次処理",
    icon: "folder",
  },

  // 5. 決算処理
  {
    id: "5",
    displayName: "5",
    label: "決算処理",
    icon: "folder",
    children: [
      {
        id: "5-1",
        displayName: "1",
        label: "注記",
        icon: "folder",
      },
      {
        id: "5-2",
        displayName: "2",
        label: "決算チェック",
        icon: "folder",
      },
      {
        id: "5-3",
        displayName: "3",
        label: "決算帳票",
        icon: "folder",
        children: [
          {
            id: "5-3-1",
            displayName: "1",
            label: "貸借対照表",
            icon: "document",
            children: [
          {
            id: "5-3-1-1",
            displayName: "1",
            label: "貸借対照表",
            icon: "document",
            href: "/balance-sheet",
          },
              {
                id: "5-3-1-2",
                displayName: "2",
                label: "貸借対照表内訳表",
                icon: "document",
              },
              {
                id: "5-3-1-3",
                displayName: "3",
                label: "貸借対照表総括表",
                icon: "document",
              },
              {
                id: "5-3-1-4",
                displayName: "4",
                label: "貸借対照表内訳表(会計別内訳)",
                icon: "document",
              },
            ],
          },
          {
            id: "5-3-2",
            displayName: "2",
            label: "収支計算書",
            icon: "document",
          },
          {
            id: "5-3-3",
            displayName: "3",
            label: "正味計算書",
            icon: "document",
          },
          {
            id: "5-3-4",
            displayName: "4",
            label: "キャッシュフロー計算書(CF)",
            icon: "document",
          },
          {
            id: "5-3-5",
            displayName: "5",
            label: "決算試算表",
            icon: "document",
          },
          {
            id: "5-3-6",
            displayName: "6",
            label: "決算書備考入力",
            icon: "gear",
          },
          {
            id: "5-3-7",
            displayName: "7",
            label: "財産目録",
            icon: "document",
          },
          {
            id: "5-3-8",
            displayName: "8",
            label: "附属明細書",
            icon: "document",
          },
        ],
      },
      {
        id: "5-4",
        displayName: "4",
        label: "消費税帳票",
        icon: "folder",
      },
      {
        id: "5-5",
        displayName: "5",
        label: "経営分析",
        icon: "folder",
      },
      {
        id: "5-6",
        displayName: "6",
        label: "一括按分シミュレーション",
        icon: "folder",
      },
      {
        id: "5-7",
        displayName: "7",
        label: "決算見込",
        icon: "folder",
      },
      {
        id: "5-8",
        displayName: "8",
        label: "定期提出書類作成支援",
        icon: "document",
      },
      {
        id: "5-9",
        displayName: "9",
        label: "令和6年基準(暫定)",
        icon: "folder",
      },
    ],
  },

  // 6. 締切処理
  {
    id: "6",
    displayName: "6",
    label: "締切処理",
    icon: "folder",
  },

  // 7. マスタ保守
  {
    id: "7",
    displayName: "7",
    label: "マスタ保守",
    icon: "folder",
    children: [
      {
        id: "7-1",
        displayName: "1",
        label: "関係者保守",
        icon: "folder",
        children: [
          {
            id: "7-1-1",
            displayName: "1",
            label: "関係者登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-1-2",
            displayName: "2",
            label: "関係者一覧表",
            icon: "gear",
            href: ""
          },
          {
            id: "7-1-3",
            displayName: "3",
            label: "マイナンバー一括入力",
            icon: "gear",
            href: ""
          },
          {
            id: "7-1-4",
            displayName: "4",
            label: "マイナンバー一括削除",
            icon: "gear",
            href: ""
          },
          {
            id: "7-1-5",
            displayName: "5",
            label: "関係者ログ画面",
            icon: "document",
            href: ""
          },                    
        ]
      },
      {
        id: "7-2",
        displayName: "2",
        label: "摘要保守",
        icon: "folder",
        children: [
          {
            id: "7-2-1",
            displayName: "1",
            label: "摘要登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-2-2",
            displayName: "2",
            label: "摘要一括コピー",
            icon: "gear",
            href: ""
          },
          {
            id: "7-2-3",
            displayName: "3",
            label: "摘要一覧表",
            icon: "document",
            href: ""
          },                    
        ]
      },
      {
        id: "7-3",
        displayName: "3",
        label: "事業保守",
        icon: "folder",
        children: [
          {
            id: "7-3-1",
            displayName: "1",
            label: "事業登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-3-2",
            displayName: "2",
            label: "事業一覧表",
            icon: "document",
            href: ""
          },
        ]
      },
      {
        id: "7-4",
        displayName: "4",
        label: "会計保守",
        icon: "folder",
        children: [
          {
            id: "7-4-1",
            displayName: "1",
            label: "会計一覧表",
            icon: "document",
            href: ""
          },
          {
            id: "7-4-2",
            displayName: "2",
            label: "会計名略称登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-4-3",
            displayName: "3",
            label: "会計名略称対象科目登録",
            icon: "gear",
            href: ""
          },
        ]
      },
      {
        id: "7-5",
        displayName: "5",
        label: "科目保守",
        icon: "folder",
        children: [
          {
            id: "7-5-1",
            displayName: "1",
            label: "科目一覧表",
            icon: "document",
            href: ""
          },
          {
            id: "7-5-2",
            displayName: "2",
            label: "同科目ID一覧表",
            icon: "document",
            href: ""
          },
        ]
      },
      {
        id: "7-6",
        displayName: "6",
        label: "使途拘束資産保守",
        icon: "folder",
        children: [
          {
            id: "7-6-1",
            displayName: "1",
            label: "使徒拘束資産登録",
            icon: "gear",
            href: "/restricted-asset-register"
          },                    
        ]        
      },
      {
        id: "7-7",
        displayName: "7",
        label: "財源保守",
        icon: "folder",
        children: [
          {
            id: "7-7-1",
            displayName: "1",
            label: "財源登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-7-2",
            displayName: "2",
            label: "財源一覧表",
            icon: "document",
            href: "/funding-list"
          },
          {
            id: "7-7-3",
            displayName: "3",
            label: "財源別残高登録",
            icon: "gear",
            href: ""
          },                    
        ]
      },
      {
        id: "7-8",
        displayName: "8",
        label: "パターン仕訳一覧表",
        icon: "document",
      },                                                                        
      {
        id: "7-9",
        displayName: "9",
        label: "マスタデータ連動",
        icon: "folder",
        children: [
          {
            id: "7-9-1",
            displayName: "1",
            label: "CSVデータ出力",
            icon: "gear",
            href: ""
          },
          {
            id: "7-9-2",
            displayName: "2",
            label: "他システムデータ連動",
            icon: "gear",
            href: "",
            children: [
          {
            id: "7-9-2-1",
            displayName: "1",
            label: "関係者データ取込",
            icon: "gear",
            href: ""
          },
          {
            id: "7-9-2-2",
            displayName: "2",
            label: "関係者口座データ取込",
            icon: "gear",
            href: ""
          },
          {
            id: "7-9-2-3",
            displayName: "3",
            label: "事業データ取込",
            icon: "gear",
            href: ""
          },                                  
            ]
          },

        ]
      },
      {
        id: "7-10",
        displayName: "10",
        label: "銀行保守",
        icon: "folder",
                children: [
          {
            id: "7-10-1",
            displayName: "1",
            label: "銀行登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-10-2",
            displayName: "2",
            label: "銀行名一括変更",
            icon: "gear",
            href: ""
          },
          {
            id: "7-10-3",
            displayName: "3",
            label: "同行扱い銀行登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-10-4",
            displayName: "4",
            label: "同行扱い銀行支店登録",
            icon: "gear",
            href: ""
          },
          {
            id: "7-10-5",
            displayName: "5",
            label: "銀行一覧表",
            icon: "document",
            href: ""
          },                    
        ]        
      },
      {
        id: "7-11",
        displayName: "11",
        label: "各種メンテナンス",
        icon: "gear",
      },                        
    ],
  },

  // 8. 基本設定
  {
    id: "8",
    displayName: "8",
    label: "基本設定",
    icon: "gear",
    children: [
      {
        id: "8-1",
        displayName: "1",
        label: "操作員設定",
        icon: "folder",
      },
      {
        id: "8-2",
        displayName: "2",
        label: "ユーザー設定",
        icon: "gear",
      },
      {
        id: "8-3",
        displayName: "3",
        label: "伺書伝票設定",
        icon: "folder",
      },
      {
        id: "8-4",
        displayName: "4",
        label: "各種名称・条件設定",
        icon: "folder",
        children: [
          {
            id: "8-4-1",
            displayName: "1",
            label: "現預金名称変更",
            icon: "gear",
            href: "/cash-name-change"
          },
          {
            id: "8-4-2",
            displayName: "2",
            label: "現預金名称一括コピー",
            icon: "gear",
          },
          {
            id: "8-4-3",
            displayName: "3",
            label: "決裁権者登録",
            icon: "gear",
          },
          {
            id: "8-4-4",
            displayName: "4",
            label: "決裁区分条件設定",
            icon: "gear",
          },
          {
            id: "8-4-5",
            displayName: "5",
            label: "決裁区分条件設定コピー・削除",
            icon: "gear",
          },
          {
            id: "8-4-6",
            displayName: "6",
            label: "決裁区分条件設定リスト",
            icon: "document",
          },
        ],
      },
      {
        id: "8-5",
        displayName: "5",
        label: "摘要別勘案商登録",
        icon: "gear",
      },
      {
        id: "8-6",
        displayName: "6",
        label: "債権債務管理設定",
        icon: "folder",
      },
      {
        id: "8-7",
        displayName: "7",
        label: "消費税計算設定",
        icon: "folder",
      },
      {
        id: "8-8",
        displayName: "8",
        label: "按分設定",
        icon: "folder",
      },
      {
        id: "8-9",
        displayName: "9",
        label: "総合データ設定",
        icon: "folder",
      },
      {
        id: "8-10",
        displayName: "10",
        label: "事業所データ連動",
        icon: "folder",
      },
      {
        id: "8-11",
        displayName: "11",
        label: "経営分析設定",
        icon: "folder",
      },
      {
        id: "8-12",
        displayName: "12",
        label: "法人番号登録",
        icon: "gear",
      },
    ],
  },
]
