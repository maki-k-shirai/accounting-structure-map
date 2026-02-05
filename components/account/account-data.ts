// components/account/account-data.ts

// ========================================================
// 1. 型定義
// ========================================================

/** 科目種別コード（大分類） */
export type AccountTypeCode = string
/** 詳細種別コード（中分類 / 科目レベル1 or 収支コード） */
export type AccountDetailTypeCode = string

/** 勘定科目メタ情報（画面には出さない） */
export type AccountMeta = {
  /** 科目種別コード（資産 / 負債 / 純資産 / 収益 / 費用 / 収入 / 支出などの軸） */
  accountTypeCode: AccountTypeCode
  /** 詳細種別コード（流動資産 / 事業収益 / 管理費 / 収支コードなど） */
  accountDetailTypeCode?: AccountDetailTypeCode
  /** 資金フラグなど将来用のメタ */
  isFund?: boolean
  /** PL展開先 */
  expandToPlCodes?: string[]
  /**
   * UI上の「表示タブ」制御（会計分類とは独立）
   * 例：収益/費用（活動科目）に属していても、科目検索モーダルでは「純資産科目」タブに出したいケース
   */
  uiTab?: "netAssetsPl"
}

/** 勘定科目ノード（ツリー構造 or 単票） */
export type AccountNode = {
  code: string
  name1: string
  name2?: string
  meta: AccountMeta
  children?: AccountNode[]
}

/** 画面側で使うカテゴリID（資産 / 負債 / 純資産 / 収益 / 費用 / 収入 / 支出） */
export type AccountCategoryId =
  | "asset"
  | "liability"
  | "netAssets"
  | "revenue"
  | "expense"
  | "activityIncome" 
  | "activityExpense" 

export type AccountCategory = {
  id: AccountCategoryId
  label: string
  nodes: AccountNode[]
}


// ========================================================
// 2. 科目種別マスタ（大分類）
//    ※基本はロジック用。画面に出す必要はない。
// ========================================================

export const ACCOUNT_TYPE_MASTER: Record<AccountTypeCode, { label: string }> = {
  // 資産
  "1100": { label: "流動資産" },
  "1200": { label: "有形固定資産" },
  "1300": { label: "無形固定資産" },
  "1400": { label: "投資その他の資産" },

  // 負債
  "1500": { label: "流動負債" },
  "1600": { label: "固定負債" },

  // 純資産
  "1910": { label: "指定純資産" },
  "1920": { label: "一般純資産" },
  "1990": { label: "基金" },
  "1998": { label: "その他有価証券評価差額金" },

  // 収入（収支科目）
  "2119": { label: "収入(経常・一般)" },
  "2118": { label: "収入(繰入金等)" },
  "2121": { label: "収入(取崩・投資)" },
  "2122": { label: "収入(その他投資)" },
  "2161": { label: "収入(借入金)" },
  "2182": { label: "収入(他会計貸付・借入)" },
  "2192": { label: "収入(前期繰越)" },

  // 支出（収支科目）
  "2219": { label: "支出(経常・一般)" },
  "2218": { label: "支出(繰入金)" },
  "2220": { label: "支出(投資・固定資産等)" },
  "2230": { label: "支出(特定資産)" },
  "2241": { label: "支出(その他投資)" },
  "2261": { label: "支出(借入金返済)" },
  "2269": { label: "支出(その他)" },
  "2282": { label: "支出(他会計貸付・借入)" },

  // 収益
  "3118": { label: "PL収益（繰入金等）" },
  "3119": { label: "PL収益（経常・一般）" },
  "3121": { label: "PL収益（投資・取得・売却）" },
  "3122": { label: "PL収益（その他投資収益）" },
  "3130": { label: "PL収益（受贈益）" },
  "3142": { label: "PL収益（引当金取崩額）" },
  "3179": { label: "PL収益（その他）」" },

  // 費用
  "3218": { label: "PL費用（繰出額）" },
  "3219": { label: "PL費用（経常・一般）" },
  "3232": { label: "PL費用（有価証券売却損）」" },
  "3241": { label: "PL費用（固定資産損失）」" },
  "3242": { label: "PL費用（災害損失）」" },
  "3262": { label: "PL費用（法人税等）」" },
  "3271": { label: "PL費用（雑損失）」" },
  "3272": { label: "PL費用（棚卸資産損失）」" },
  "3279": { label: "PL費用（評価損ほか）」" },
  "3291": { label: "PL費用（振替額）」" },
}

// ========================================================
// 3. 基本科目マスタ（資産・負債・純資産・収益・費用）
// ========================================================

export const BASIC_ACCOUNT_CATEGORIES: AccountCategory[] = [
  // -----------------------
  // 資産
  // -----------------------
  {
    id: "asset",
    label: "資産",
    nodes: [
      // 010000 流動資産
      {
        code: "010000",
        name1: "流動資産",
        meta: { accountTypeCode: "1100", accountDetailTypeCode: "010000" },
        children: [
          //現金預金
          {
            code: "010100",
            name1: "現金預金",
            meta: { accountTypeCode: "1110", accountDetailTypeCode: "010100" },
            children: [
              //小口現金
              {
                code: "010101",
                name1: "小口現金",
                meta: {
                  accountTypeCode: "1111",
                  accountDetailTypeCode: "010101",
                  isFund: true,
                },
              },
              //現金
              {
                code: "010111",
                name1: "現金",
                meta: {
                  accountTypeCode: "1112",
                  accountDetailTypeCode: "010111",
                  isFund: true,
                },
              },
              //普通預金1
              {
                code: "010131",
                name1: "普通預金 三菱UFJ銀行 東京営業部",
                meta: {
                  accountTypeCode: "1114",
                  accountDetailTypeCode: "010131",
                  isFund: true,
                },
                children: [
                  {
                   code: "01013101",
                   name1: "普通預金 三菱UFJ銀行 東京営業部",
                   meta: {
                    accountTypeCode: "1114",
                    accountDetailTypeCode: "010131",
                    isFund: true,
                   }, 
                  },
                ]
              },
              //普通預金2
              {
                code: "010132",
                name1: "普通預金 三井住友銀行 新宿支店",
                meta: {
                  accountTypeCode: "1114",
                  accountDetailTypeCode: "010132",
                  isFund: true,
                },
                children: [
                  {
                   code: "01013201",
                   name1: "普通預金 三井住友銀行 新宿支店",
                   meta: {
                    accountTypeCode: "1114",
                    accountDetailTypeCode: "010132",
                    isFund: true,
                   }, 
                  },
                  {
                   code: "01013215",
                   name1: "普通預金 三井住友銀行 新宿支店",
                   name2: "周年事業積立資産",
                   meta: {
                    accountTypeCode: "1114",
                    accountDetailTypeCode: "010132",
                    isFund: true,
                   }, 
                  },
                ]
              },
              //定期預金
              {
                code: "010162",
                name1: "定期預金 三井住友銀行 新宿支店",
                meta: {
                  accountTypeCode: "1119",
                  accountDetailTypeCode: "010162",
                  isFund: true,
                },
                children: [
                  {
                   code: "01016211",
                   name1: "定期預金 三井住友銀行 新宿支店",
                   name2: "基本財産",
                   meta: {
                    accountTypeCode: "1119",
                    accountDetailTypeCode: "010132",
                    isFund: true,
                   }, 
                  },
                ]
              },
            ],
          },
          //未収金
          {
            code: "010900",
            name1: "未収金",
            meta: { accountTypeCode: "1120", accountDetailTypeCode: "010900" },
          },
          //有価証券
          {
            code: "011100",
            name1: "有価証券",
            meta: { accountTypeCode: "1150", accountDetailTypeCode: "011100" },
          },
          //仮払金
          {
            code: "013500",
            name1: "仮払金",
            meta: { accountTypeCode: "1170", accountDetailTypeCode: "013500" },
          },
          //前払費用
          {
            code: "014100",
            name1: "前払費用",
            meta: { accountTypeCode: "1160", accountDetailTypeCode: "014100" },
          },
          //会計間勘定
          {
            code: "019100",
            name1: "会計区分間貸借勘定",
            meta: { accountTypeCode: "1170", accountDetailTypeCode: "019100" },
          },
        ],
      },

      // 020000 有形固定資産
      {
        code: "020000",
        name1: "有形固定資産",
        meta: { accountTypeCode: "1200", accountDetailTypeCode: "020000" },
        children: [
          //建物
          {
            code: "020300",
            name1: "建物",
            meta: { accountTypeCode: "1200", accountDetailTypeCode: "020300" },
            children: [
              {
                code: "020301",
                name1: "建物",
                meta: {accountTypeCode: "1212",accountDetailTypeCode: "020301"},
              }
            ],
          },
          //建物減価償却累計額
          {
            code: "020400",
            name1: "建物減価償却累計額",
            meta: { accountTypeCode: "1220", accountDetailTypeCode: "020400" },
            children: [
              {
                code: "020401",
                name1: "建物減価償却累計額",
                meta: { accountTypeCode: "1220", accountDetailTypeCode: "020401"}
              },
            ],
          },
          //車両運搬具
          {
            code: "020900",
            name1: "車両運搬具",
            meta: { accountTypeCode: "1212", accountDetailTypeCode: "020900" },
            children: [
              {
                code: "020901",
                name1: "車両運搬具",
                meta: { accountTypeCode: "1212", accountDetailTypeCode: "020901"}
              },
            ],
          },
          //車両運搬具減価償却累計額
          {
            code: "021000",
            name1: "車両運搬具減価償却累計額",
            meta: { accountTypeCode: "1220", accountDetailTypeCode: "021000" },
            children: [
              {
                code: "021001",
                name1: "車両運搬具減価償却累計額",
                meta: { accountTypeCode: "1220", accountDetailTypeCode: "021001"}
              },
            ],
          },
          //什器備品
          {
            code: "021300",
            name1: "什器備品",
            meta: { accountTypeCode: "1212", accountDetailTypeCode: "021300" },
            children: [
              {
                code: "021301",
                name1: "什器備品",
                meta: { accountTypeCode: "1212", accountDetailTypeCode: "021301"}
              },
            ],
          },
          //什器備品減価償却累計額
          {
            code: "021400",
            name1: "什器備品減価償却累計額",
            meta: { accountTypeCode: "1220", accountDetailTypeCode: "021400" },
            children: [
              {
                code: "021401",
                name1: "什器備品減価償却累計額",
                meta: { accountTypeCode: "1220", accountDetailTypeCode: "021401"}
              }
            ]
          },
          //土地
          {
            code: "022100",
            name1: "土地",
            meta: { accountTypeCode: "1211", accountDetailTypeCode: "022100" },
            children: [
              {
                code: "022101",
                name1: "土地",
                meta: { accountTypeCode: "1211", accountDetailTypeCode: "022101"}
              },
            ],
          },
        ],
      },

      // 030000 無形固定資産
      {
        code: "030000",
        name1: "無形固定資産",
        meta: { accountTypeCode: "1300", accountDetailTypeCode: "030000" },
        children: [
          //ソフトウェア
          {
            code: "030300",
            name1: "ソフトウェア",
            meta: { accountTypeCode: "1332", accountDetailTypeCode: "030300" },
            children: [
              {
                code: "030301",
                name1: "ソフトウェア",
                meta: { accountTypeCode: "1332", accountDetailTypeCode: "030301"}
              },
            ],
          },
          //ソフトウェア減価償却累計額
          {
            code: "030400",
            name1: "ソフトウェア減価償却累計額",
            meta: { accountTypeCode: "1360", accountDetailTypeCode: "030400" },
            children: [
              {
                code: "030401",
                name1: "ソフトウェア減価償却累計額",
                meta: { accountTypeCode: "1360", accountDetailTypeCode: "030401"}
              },
            ],
          },
        ],
      },

      // 040000 その他固定資産
      {
        code: "040000",
        name1: "その他固定資産",
        meta: { accountTypeCode: "1300", accountDetailTypeCode: "040000" },
        children: [
          //長期性預金
          {
            code: "040100",
            name1: "長期性預金",
            meta: { accountTypeCode: "1359", accountDetailTypeCode: "040100" },
            children: [
              //定期預金
              {
                code: "040101",
                name1: "定期預金 三井住友銀行 新宿支店",
                meta: { accountTypeCode: "1359", accountDetailTypeCode: "040101"},
                children: [
                  {
                  code: "040111",
                  name1: "定期預金 三井住友銀行 新宿支店",
                  name2: "基本財産",
                  meta: { accountTypeCode: "1359", accountDetailTypeCode: "040101"}
                  }
                ]
              }
            ]
          },
          //投資有価証券
          {
            code: "045100",
            name1: "投資有価証券",
            meta: { accountTypeCode: "1341", accountDetailTypeCode: "045100" },
            children: [
              {
                code: "045101",
                name1: "投資有価証券",
                meta: { accountTypeCode: "1341", accountDetailTypeCode: "045101"},
                children: [
                  {
                    code: "04510111",
                    name1: "投資有価証券",
                    name2: "減価償却引当資産",
                    meta: { accountTypeCode: "1341", accountDetailTypeCode: "045101"}
                  },
                  {
                    code: "04510113",
                    name1: "投資有価証券",
                    name2: "退職給付引当資産",
                    meta: { accountTypeCode: "1341", accountDetailTypeCode: "045101"}
                  },
                ]
              }
            ]
          },
          //敷金
          {
            code: "047800",
            name1: "敷金",
            meta: { accountTypeCode: "1342", accountDetailTypeCode: "047800" },
          },
        ],
      },
    ],
  },

  // -----------------------
  // 負債
  // -----------------------
  {
    id: "liability",
    label: "負債",
    nodes: [
      // 060000 流動負債
      {
        code: "060000",
        name1: "流動負債",
        meta: { accountTypeCode: "1500", accountDetailTypeCode: "060000" },
        children: [
          {
            code: "060100",
            name1: "未払金",
            meta: { accountTypeCode: "1510", accountDetailTypeCode: "060100" },
          },
          {
            code: "062200",
            name1: "未払法人税等",
            meta: { accountTypeCode: "1580", accountDetailTypeCode: "062200" },
          },
          {
            code: "062500",
            name1: "未払消費税等",
            meta: { accountTypeCode: "1510", accountDetailTypeCode: "062500" },
          },
          {
            code: "063100",
            name1: "前受金",
            meta: { accountTypeCode: "1570", accountDetailTypeCode: "063100" },
          },
          {
            code: "064100",
            name1: "預り金",
            meta: { accountTypeCode: "1570", accountDetailTypeCode: "064100" },
          },
          {
            code: "063300",
            name1: "賞与引当金",
            meta: { accountTypeCode: "1530", accountDetailTypeCode: "066300" },
          },
          {
            code: "069100",
            name1: "会計区分間貸借勘定",
            meta: { accountTypeCode: "1570", accountDetailTypeCode: "069100" },
          },
        ],
      },

      // 070000 固定負債
      {
        code: "070000",
        name1: "固定負債",
        meta: { accountTypeCode: "1600", accountDetailTypeCode: "070000" },
        children: [
          {
            code: "070100",
            name1: "長期借入金",
            meta: { accountTypeCode: "1610", accountDetailTypeCode: "070100" },
          },
          {
            code: "073100",
            name1: "退職給付引当金",
            meta: { accountTypeCode: "1620", accountDetailTypeCode: "073100" },
          },
          {
            code: "073200",
            name1: "役員退職慰労引当金",
            meta: { accountTypeCode: "1620", accountDetailTypeCode: "073200" },
          },
          {
            code: "079100",
            name1: "会計区分間貸借勘定",
            meta: { accountTypeCode: "1670", accountDetailTypeCode: "079100" },
          },
        ],
      },
    ],
  },

  // -----------------------
  // 純資産
  // -----------------------
  {
    id: "netAssets",
    label: "純資産",
    nodes: [
      // 100000 指定純資産
      {
        code: "100000",
        name1: "指定純資産",
        meta: { accountTypeCode: "1910", accountDetailTypeCode: "100000" },
        children: [
          {
            code: "100101",
            name1: "国庫補助金",
            meta: { accountTypeCode: "1990", accountDetailTypeCode: "100101" },
          },
          {
            code: "100301",
            name1: "寄付金",
            meta: { accountTypeCode: "1990", accountDetailTypeCode: "100301" },
          },
        ]
      },
      // 105000 一般純資産
      {
        code: "105000",
        name1: "一般純資産",
        meta: { accountTypeCode: "1920", accountDetailTypeCode: "105000" },
      },
      // 108000 その他有価証券評価差額金
      {
        code: "108000",
        name1: "その他有価証券評価差額金",
        meta: { accountTypeCode: "1998", accountDetailTypeCode: "108000" },
        children: [
          {
            code: "108100",
            name1: "その他有価証券評価差額金",
            meta: { accountTypeCode: "1998", accountDetailTypeCode: "108100" },
          },
          {
            code: "109100",
            name1: "（うち指定純資産に係る評価差額金）",
            meta: { accountTypeCode: "1990", accountDetailTypeCode: "109100" },
          },
          {
            code: "109200",
            name1: "（うち一般純資産に係る評価差額金）",
            meta: { accountTypeCode: "1990", accountDetailTypeCode: "109200" },
          },
        ]
      },
    ],
  },

  // -----------------------
  // 収入
  // -----------------------
  {
    id: "activityIncome",
    label: "収入科目",
    nodes: [
  //資産運用収入    
  {
    code: "117000",
    name1: "資産運用収入",
    meta: { accountTypeCode: "2119", accountDetailTypeCode: "110000"},
    children: [
          {
            code: "117100",
            name1: "受取利息収入",
            meta: { accountTypeCode: "2119", accountDetailTypeCode: "117100" },
          },
          {
            code: "117200",
            name1: "受取配当金収入",
            meta: { accountTypeCode: "2119", accountDetailTypeCode: "117200" },
          },
        ]      
  },
  //会費収入
  {
    code: "130000",
    name1: "会費収入",
    meta: { accountTypeCode: "2119", accountDetailTypeCode: "130000"},
    children: [
          {
            code: "130100",
            name1: "正会員会費収入",
            meta: { accountTypeCode: "2119", accountDetailTypeCode: "130100" },
          },
          {
            code: "130200",
            name1: "特別会員会費収入",
            meta: { accountTypeCode: "2119", accountDetailTypeCode: "130200" },
          },
          {
            code: "130300",
            name1: "賛助会員会費収入",
            meta: { accountTypeCode: "2119", accountDetailTypeCode: "130300" },
          },
        ]
  },
  //事業収入
{
  code: "140000",
  name1: "事業収入",
  meta: { accountTypeCode: "2119", accountDetailTypeCode: "140000" },
  children: [
    {
      code: "140100",
      name1: "調査研究事業収入",
      meta: { 
        accountTypeCode: "2119", 
        accountDetailTypeCode: "140100",
        expandToPlCodes: ["540100"],
      }
    },
    {
      code: "145100",
      name1: "広報啓発事業収入",
      meta: { 
        accountTypeCode: "2119", 
        accountDetailTypeCode: "145100",
        expandToPlCodes: ["545100"],
       }
    },
    {
      code: "147100",
      name1: "講座事業収入",
      meta: { 
        accountTypeCode: "2119", 
        accountDetailTypeCode: "147100",
        expandToPlCodes: ["547100"],
       }
    }
  ]
},
//補助金等収入
  {
    code: "210000",
    name1: "補助金等収入",
    meta: { accountTypeCode: "2119", accountDetailTypeCode: "210000" },
  },
  //寄付金収入
  {
    code: "220000",
    name1: "寄付金収入",
    meta: { accountTypeCode: "2119", accountDetailTypeCode: "220000" },
  },
  //雑収入
  {
    code: "230000",
    name1: "雑収入",
    meta: { accountTypeCode: "2119", accountDetailTypeCode: "230000" },
  },
  //他会計からの繰入金収入
  {
    code: "240000",
    name1: "他会計からの繰入金収入",
    meta: { accountTypeCode: "2118", accountDetailTypeCode: "240000" },
  },
  //固定資産売却収入
  {
    code: "270000",
    name1: "固定資産売却収入",
    meta: { accountTypeCode: "2121", accountDetailTypeCode: "270000" },
  },
  {
    code: "277000",
    name1: "有価証券売却収入",
    meta: { accountTypeCode: "2121", accountDetailTypeCode: "277000" },
  },
  {
    code: "280000",
    name1: "使途制約のある資産の取崩収入",
    meta: { accountTypeCode: "2121", accountDetailTypeCode: "280000" },
  },
  {
    code: "287000",
    name1: "その他投資活動収入",
    meta: { accountTypeCode: "2122", accountDetailTypeCode: "287000" },
  },
  {
    code: "289000",
    name1: "他会計貸付金戻り収入",
    meta: { accountTypeCode: "2182", accountDetailTypeCode: "289000" },
  },
  {
    code: "319000",
    name1: "他会計借入金収入",
    meta: { accountTypeCode: "2182", accountDetailTypeCode: "319000" },
  },
  {
    code: "320000",
    name1: "前期繰越収支差額",
    meta: { accountTypeCode: "2192", accountDetailTypeCode: "320000" },
  },
  ]
  },

  // -----------------------
  // 支出
  // -----------------------
  {
  id: "activityExpense",
  label: "支出科目",
  nodes: [
// 事業費支出
{
  code: "330000",
  name1: "事業費支出",
  meta: { accountTypeCode: "2219", accountDetailTypeCode: "330000" },
  children: [
    {
      code: "330100",
      name1: "役員報酬支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330100",
        expandToPlCodes: ["760100"], // 役員報酬
      },
    },
    {
      code: "330300",
      name1: "給料手当支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330300",
        expandToPlCodes: ["760300"], // 給料手当
      },
    },
    {
      code: "330400",
      name1: "臨時雇賃金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330400",
        expandToPlCodes: ["760400"], // 臨時雇賃金
      },
    },
    {
      code: "330700",
      name1: "退職給付支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330700",
        expandToPlCodes: ["760700"], // 退職給付費用
      },
    },
    {
      code: "330800",
      name1: "役員退職慰労金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330800",
        expandToPlCodes: ["760800"], // 役員退職慰労引当金繰入額
      },
    },
    {
      code: "330900",
      name1: "福利厚生費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "330900",
        expandToPlCodes: ["760900"], // 福利厚生費
      },
    },
    {
      code: "331800",
      name1: "会議費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "331800",
        expandToPlCodes: ["761800"], // 会議費
      },
    },
    {
      code: "331900",
      name1: "旅費交通費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "331900",
        expandToPlCodes: ["761900"], // 旅費交通費
      },
    },
    {
      code: "332100",
      name1: "通信運搬費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "332100",
        expandToPlCodes: ["762100"], // 通信運搬費
      },
    },
    {
      code: "332300",
      name1: "消耗什器備品費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "332300",
        expandToPlCodes: ["762300"], // 消耗什器備品費
      },
    },
    {
      code: "332500",
      name1: "消耗品費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "332500",
        expandToPlCodes: ["762500"], // 消耗品費
      },
    },
    {
      code: "332700",
      name1: "修繕費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "332700",
        expandToPlCodes: ["762700"], // 修繕費
      },
    },
    {
      code: "332900",
      name1: "印刷製本費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "332900",
        expandToPlCodes: ["762900"], // 印刷製本費
      },
    },
    {
      code: "333100",
      name1: "燃料費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "333100",
        expandToPlCodes: ["763100"], // 燃料費
      },
    },
    {
      code: "333300",
      name1: "光熱水料費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "333300",
        expandToPlCodes: ["763300"], // 光熱水料費
      },
    },
    {
      code: "333500",
      name1: "賃借料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "333500",
        expandToPlCodes: ["763500"], // 賃借料
      },
    },
    {
      code: "333700",
      name1: "保険料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "333700",
        expandToPlCodes: ["763700"], // 保険料
      },
    },
    {
      code: "333900",
      name1: "諸謝金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "333900",
        expandToPlCodes: ["763900"], // 諸謝金
      },
    },
    {
      code: "334100",
      name1: "租税公課支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "334100",
        expandToPlCodes: ["764100"], // 租税公課
      },
    },
    {
      code: "334300",
      name1: "負担金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "334300",
        expandToPlCodes: ["764300"], // 支払負担金
      },
    },
    {
      code: "334500",
      name1: "助成金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "334500",
        expandToPlCodes: ["764500"], // 支払助成金
      },
    },
    {
      code: "334600",
      name1: "前払金支出",
      meta: {
        accountTypeCode: "2241",
        accountDetailTypeCode: "334600",
        // expandToPlCodes なし（マップ未定）
      },
    },
    {
      code: "334700",
      name1: "寄付金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "334700",
        expandToPlCodes: ["764700"], // 支払寄付金
      },
    },
    {
      code: "334900",
      name1: "委託費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "334900",
        expandToPlCodes: ["764900"], // 委託費
      },
    },
    {
      code: "335100",
      name1: "手数料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "335100",
        expandToPlCodes: ["765100"], // 支払手数料
      },
    },
  ],
},
// 管理費支出
{
  code: "400000",
  name1: "管理費支出",
  meta: { accountTypeCode: "2219", accountDetailTypeCode: "400000" },
  children: [
    {
      code: "400100",
      name1: "役員報酬支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400100",
        expandToPlCodes: ["830100"],
      },
    },
    {
      code: "400300",
      name1: "給料手当支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400300",
        expandToPlCodes: ["830300"],
      },
    },
    {
      code: "400400",
      name1: "臨時雇賃金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400400",
        expandToPlCodes: ["830400"],
      },
    },
    {
      code: "400700",
      name1: "退職給付支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400700",
        expandToPlCodes: ["830700"],
      },
    },
    {
      code: "400800",
      name1: "役員退職慰労金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400800",
        expandToPlCodes: ["830800"],
      },
    },
    {
      code: "400900",
      name1: "福利厚生費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "400900",
        expandToPlCodes: ["830900"],
      },
    },
    {
      code: "401800",
      name1: "会議費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "401800",
        expandToPlCodes: ["831800"],
      },
    },
    {
      code: "401900",
      name1: "旅費交通費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "401900",
        expandToPlCodes: ["831900"],
      },
    },
    {
      code: "402100",
      name1: "通信運搬費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "402100",
        expandToPlCodes: ["832100"],
      },
    },
    {
      code: "402300",
      name1: "消耗什器備品費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "402300",
        expandToPlCodes: ["832300"],
      },
    },
    {
      code: "402500",
      name1: "消耗品費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "402500",
        expandToPlCodes: ["832500"],
      },
    },
    {
      code: "402700",
      name1: "修繕費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "402700",
        expandToPlCodes: ["832700"],
      },
    },
    {
      code: "402900",
      name1: "印刷製本費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "402900",
        expandToPlCodes: ["832900"],
      },
    },
    {
      code: "403100",
      name1: "燃料費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "403100",
        expandToPlCodes: ["833100"],
      },
    },
    {
      code: "403300",
      name1: "光熱水料費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "403300",
        expandToPlCodes: ["833300"],
      },
    },
    {
      code: "403500",
      name1: "賃借料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "403500",
        expandToPlCodes: ["833500"],
      },
    },
    {
      code: "403700",
      name1: "保険料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "403700",
        expandToPlCodes: ["833700"],
      },
    },
    {
      code: "403900",
      name1: "諸謝金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "403900",
        expandToPlCodes: ["833900"],
      },
    },
    {
      code: "404100",
      name1: "租税公課支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "404100",
        expandToPlCodes: ["834100"],
      },
    },
    {
      code: "404300",
      name1: "負担金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "404300",
        expandToPlCodes: ["834300"],
      },
    },
    {
      code: "404500",
      name1: "助成金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "404500",
        expandToPlCodes: ["834500"],
      },
    },
    {
      code: "404700",
      name1: "寄付金支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "404700",
        expandToPlCodes: ["834700"],
      },
    },
    {
      code: "404900",
      name1: "委託費支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "404900",
        expandToPlCodes: ["834900"],
      },
    },
    {
      code: "405100",
      name1: "手数料支出",
      meta: {
        accountTypeCode: "2219",
        accountDetailTypeCode: "405100",
        expandToPlCodes: ["835100"],
      },
    },
  ],
},
  {
    code: "410000",
    name1: "他会計への繰入金支出",
    meta: { accountTypeCode: "2218", accountDetailTypeCode: "410000"},
  },
  {
    code: "415000",
    name1: "その他支出",
    meta: { accountTypeCode: "2269", accountDetailTypeCode: "415000"},
  },
  {
    code: "416000",
    name1: "法人税、住民税及び事業税支出",
    meta: { accountTypeCode: "2219", accountDetailTypeCode: "416000"},
  },
  {
    code: "420000",
    name1: "基本財産取得支出",
    meta: { accountTypeCode: "2220", accountDetailTypeCode: "420000"},
  },
  {
    code: "430000",
    name1: "特定資産取得支出",
    meta: { accountTypeCode: "2230", accountDetailTypeCode: "430000"},
  },
  {
    code: "440000",
    name1: "固定資産取得支出",
    meta: { accountTypeCode: "2220", accountDetailTypeCode: "440000"},
  },
  {
    code: "447000",
    name1: "有価証券取得支出",
    meta: { accountTypeCode: "2220", accountDetailTypeCode: "447000"},
  },
  {
    code: "450000",
    name1: "使途制約のある資産の取得支出",
    meta: { accountTypeCode: "2230", accountDetailTypeCode: "450000"},
  },
  {
    code: "457000",
    name1: "その他投資活動支出",
    meta: { accountTypeCode: "2241", accountDetailTypeCode: "457000"},
  },
  {
    code: "459000",
    name1: "他会計貸付金支出",
    meta: { accountTypeCode: "2282", accountDetailTypeCode: "459000"},
  },
  {
    code: "479000",
    name1: "他会計借入金返済支出",
    meta: { accountTypeCode: "2282", accountDetailTypeCode: "479000"},
  }, 
]
  },

// -----------------------
// 収益（活動科目：収益）
// -----------------------
{
  id: "revenue",
  label: "収益",
  nodes: [
    {
      code: "517000",
      name1: "資産運用益",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "517000" },
    },
    {
      code: "520000",
      name1: "受取入会金",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "520000" },
    },
    {
      code: "530000",
      name1: "受取会費",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "530000" },
    },
{
  code: "540000",
  name1: "事業収益",
  meta: { accountTypeCode: "3119", accountDetailTypeCode: "540000" },
  children: [
    {
      code: "540100",
      name1: "調査研究事業収益",
      meta: {
        accountTypeCode: "3119",
        accountDetailTypeCode: "540100",
      },
    },
    {
      code: "545100",
      name1: "広報啓発事業収益",
      meta: {
        accountTypeCode: "3119",
        accountDetailTypeCode: "545100",
      },
    },
    {
      code: "547100",
      name1: "講座事業収益",
      meta: {
        accountTypeCode: "3119",
        accountDetailTypeCode: "547100",
      },
    },
  ],
},
    {
      code: "610000",
      name1: "受取補助金等",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "610000" },
    },
    {
      code: "620000",
      name1: "受取負担金",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "620000" },
    },
    {
      code: "630000",
      name1: "受取寄付金",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "630000" },
    },
    {
      code: "635000",
      name1: "引当金取崩額",
      meta: { accountTypeCode: "3142", accountDetailTypeCode: "635000" },
    },
    {
      code: "638000",
      name1: "為替差益",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "638000" },
    },
    {
      code: "640000",
      name1: "雑収益",
      meta: { accountTypeCode: "3119", accountDetailTypeCode: "640000" },
    },
    {
      code: "670000",
      name1: "固定資産売却益",
      meta: { accountTypeCode: "3121", accountDetailTypeCode: "670000" },
    },
    {
      code: "680000",
      name1: "投資有価証券売却益",
      meta: { accountTypeCode: "3121", accountDetailTypeCode: "680000" },
    },
    {
      code: "699000",
      name1: "投資有価証券受贈益",
      meta: { accountTypeCode: "3130", accountDetailTypeCode: "699000" },
    },
    {
      code: "700000",
      name1: "他会計からの繰入額",
      meta: { accountTypeCode: "3118", accountDetailTypeCode: "700000" },
    },
    {
      code: "715000",
      name1: "引当金取崩額",
      meta: { accountTypeCode: "3142", accountDetailTypeCode: "715000" },
    },
    {
      code: "720000",
      name1: "その他収益",
      meta: { accountTypeCode: "3122", accountDetailTypeCode: "720000" },
    },
    {
      code: "740100",
      name1: "その他有価証券評価差額金",
      name2: "（評価益）",
      meta: {
        accountTypeCode: "3179",
        accountDetailTypeCode: "740000",
        // 会計分類は収益だが、科目検索UIでは「純資産科目」タブに表示したい
        uiTab: "netAssetsPl",
      },
    },
  ],
},

// -----------------------
// 費用（活動科目：費用）
// -----------------------
{
  id: "expense",
  label: "費用",
  nodes: [
//事業費    
{
  code: "760000",
  name1: "事業費",
  meta: { accountTypeCode: "3219", accountDetailTypeCode: "760000" },
  children: [
    { code: "760100", name1: "役員報酬", meta: { accountTypeCode: "3219", accountDetailTypeCode: "760100" } },
    { code: "760300", name1: "給料手当", meta: { accountTypeCode: "3219", accountDetailTypeCode: "760300" } },
    { code: "760400", name1: "臨時雇賃金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "760400" } },
    { code: "760500", name1: "賞与引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "760500" } },
    { code: "760700", name1: "退職給付費用", meta: { accountTypeCode: "3219", accountDetailTypeCode: "760700" } },
    { code: "760800", name1: "役員退職慰労引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "760800" } },
    { code: "760900", name1: "福利厚生費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "760900" } },
    { code: "761800", name1: "会議費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "761800" } },
    { code: "761900", name1: "旅費交通費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "761900" } },
    { code: "762100", name1: "通信運搬費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "762100" } },

    // ---- 減価償却費系 ----
    { code: "762200", name1: "減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762200" } },
    { code: "762203", name1: "建物減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762203" } },
    { code: "762205", name1: "建物付属設備減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762205" } },
    { code: "762207", name1: "構築物減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762207" } },
    { code: "762209", name1: "車両運搬具減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762209" } },
    { code: "762211", name1: "機械及び装置減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762211" } },
    { code: "762213", name1: "什器備品減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "762213" } },
    { code: "762285", name1: "ソフトウェア償却費", meta: { accountTypeCode: "3252", accountDetailTypeCode: "762285" } },

    // ---- その他 ----
    { code: "762300", name1: "消耗什器備品費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "762300" } },
    { code: "762500", name1: "消耗品費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "762500" } },
    { code: "762700", name1: "修繕費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "762700" } },
    { code: "762800", name1: "修繕引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "762800" } },
    { code: "762900", name1: "印刷製本費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "762900" } },
    { code: "763100", name1: "燃料費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "763100" } },
    { code: "763300", name1: "光熱水料費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "763300" } },
    { code: "763500", name1: "賃借料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "763500" } },
    { code: "763700", name1: "保険料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "763700" } },
    { code: "763900", name1: "諸謝金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "763900" } },
    { code: "764100", name1: "租税公課", meta: { accountTypeCode: "3219", accountDetailTypeCode: "764100" } },
    { code: "764300", name1: "支払負担金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "764300" } },
    { code: "764500", name1: "支払助成金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "764500" } },
    { code: "764700", name1: "支払寄付金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "764700" } },
    { code: "764900", name1: "委託費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "764900" } },
    { code: "765100", name1: "支払手数料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "765100" } },
  ],
},
//管理費
{
  code: "830000",
  name1: "管理費",
  meta: { accountTypeCode: "3219", accountDetailTypeCode: "830000" },
  children: [
    { code: "830100", name1: "役員報酬", meta: { accountTypeCode: "3219", accountDetailTypeCode: "830100" } },
    { code: "830300", name1: "給料手当", meta: { accountTypeCode: "3219", accountDetailTypeCode: "830300" } },
    { code: "830400", name1: "臨時雇賃金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "830400" } },
    { code: "830500", name1: "賞与引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "830500" } },
    { code: "830700", name1: "退職給付費用", meta: { accountTypeCode: "3219", accountDetailTypeCode: "830700" } },
    { code: "830800", name1: "役員退職慰労引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "830800" } },
    { code: "830900", name1: "福利厚生費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "830900" } },
    { code: "831800", name1: "会議費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "831800" } },
    { code: "831900", name1: "旅費交通費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "831900" } },
    { code: "832100", name1: "通信運搬費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "832100" } },

    // ---- 減価償却費系 ----
    { code: "832200", name1: "減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832200" } },
    { code: "832203", name1: "建物減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832203" } },
    { code: "832205", name1: "建物付属設備減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832205" } },
    { code: "832207", name1: "構築物減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832207" } },
    { code: "832209", name1: "車両運搬具減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832209" } },
    { code: "832211", name1: "機械及び装置減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832211" } },
    { code: "832213", name1: "什器備品減価償却費", meta: { accountTypeCode: "3251", accountDetailTypeCode: "832213" } },
    { code: "832285", name1: "ソフトウェア償却費", meta: { accountTypeCode: "3252", accountDetailTypeCode: "832285" } },

    // ---- その他 ----
    { code: "832300", name1: "消耗什器備品費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "832300" } },
    { code: "832500", name1: "消耗品費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "832500" } },
    { code: "832700", name1: "修繕費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "832700" } },
    { code: "832800", name1: "修繕引当金繰入額", meta: { accountTypeCode: "3262", accountDetailTypeCode: "832800" } },
    { code: "832900", name1: "印刷製本費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "832900" } },
    { code: "833100", name1: "燃料費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "833100" } },
    { code: "833300", name1: "光熱水料費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "833300" } },
    { code: "833500", name1: "賃借料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "833500" } },
    { code: "833700", name1: "保険料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "833700" } },
    { code: "833900", name1: "諸謝金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "833900" } },
    { code: "834100", name1: "租税公課", meta: { accountTypeCode: "3219", accountDetailTypeCode: "834100" } },
    { code: "834300", name1: "支払負担金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "834300" } },
    { code: "834500", name1: "支払助成金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "834500" } },
    { code: "834700", name1: "支払寄付金", meta: { accountTypeCode: "3219", accountDetailTypeCode: "834700" } },
    { code: "834900", name1: "委託費", meta: { accountTypeCode: "3219", accountDetailTypeCode: "834900" } },
    { code: "835100", name1: "支払手数料", meta: { accountTypeCode: "3219", accountDetailTypeCode: "835100" } },
  ],
},
//法人税、住民税及び事業税
    {
      code: "869000",
      name1: "法人税、住民税及び事業税",
      meta: { accountTypeCode: "3262", accountDetailTypeCode: "869000" },
    },
    {
      code: "869600",
      name1: "法人税等調整額",
      meta: { accountTypeCode: "3262", accountDetailTypeCode: "869600" },
    },
    {
      code: "880000",
      name1: "固定資産売却損",
      meta: { accountTypeCode: "3179", accountDetailTypeCode: "880000" },
    },
    {
      code: "886000",
      name1: "投資有価証券売却損",
      meta: { accountTypeCode: "3232", accountDetailTypeCode: "886000" },
    },
    {
      code: "888000",
      name1: "子会社株式売却損",
      meta: { accountTypeCode: "3232", accountDetailTypeCode: "888000" },
    },
    {
      code: "889000",
      name1: "関連会社株式売却損",
      meta: { accountTypeCode: "3232", accountDetailTypeCode: "889000" },
    },
    {
      code: "890000",
      name1: "固定資産除却損",
      meta: { accountTypeCode: "3241", accountDetailTypeCode: "890000" },
    },
    {
      code: "895000",
      name1: "投資有価証券評価損",
      meta: { accountTypeCode: "3279", accountDetailTypeCode: "895000" },
    },
    {
      code: "899000",
      name1: "災害損失",
      meta: { accountTypeCode: "3242", accountDetailTypeCode: "899000" },
    },
    {
      code: "900000",
      name1: "他会計への繰出額",
      meta: { accountTypeCode: "3218", accountDetailTypeCode: "900000" },
    },
    {
      code: "915000",
      name1: "引当金繰入額",
      meta: { accountTypeCode: "3262", accountDetailTypeCode: "915000" },
    },
    {
      code: "920000",
      name1: "棚卸資産減耗損",
      meta: { accountTypeCode: "3272", accountDetailTypeCode: "920000" },
    },
    {
      code: "925000",
      name1: "棚卸資産評価損",
      meta: { accountTypeCode: "3272", accountDetailTypeCode: "925000" },
    },
    {
      code: "927000",
      name1: "雑損失",
      meta: { accountTypeCode: "3271", accountDetailTypeCode: "927000" },
    },
    {
      code: "930000",
      name1: "固定資産減損損失",
      meta: { accountTypeCode: "3241", accountDetailTypeCode: "930000" },
    },
    {
      code: "938000",
      name1: "過年度修正損",
      meta: { accountTypeCode: "3219", accountDetailTypeCode: "938000" },
    },
    {
      code: "959000",
      name1: "指定純資産から一般純資産への振替額",
      meta: {
        accountTypeCode: "3291",
        accountDetailTypeCode: "959000",
        // 会計分類は費用だが、科目検索UIでは「純資産科目」タブに表示したい
        uiTab: "netAssetsPl",
      },
    },
    {
      code: "960100",
      name1: "その他有価証券評価差額金",
      name2: "（評価損）",
      meta: {
        accountTypeCode: "3279",
        accountDetailTypeCode: "960000",
        // 会計分類は費用だが、科目検索UIでは「純資産科目」タブに表示したい
        uiTab: "netAssetsPl",
      },
    },
  ],
},
]

// ========================================================
// 5. ヘルパー
// ========================================================

export function getAccountFullName(node: AccountNode): string {
  return node.name2 ? `${node.name1} ${node.name2}` : node.name1
}

//収支科目 → PL科目 マップ
// 収支科目コード → PL科目ノード配列
export function buildActivityToPLMap(): Map<string, AccountNode[]> {
  const activityToPlMap = new Map<string, AccountNode[]>()

  // 1) PL側（収益 + 費用）の「code → AccountNode」辞書を作る
  const plCodeToNode = new Map<string, AccountNode>()

  const plCategories = BASIC_ACCOUNT_CATEGORIES.filter(
    (c) => c.id === "revenue" || c.id === "expense"
  )

  const collectPlNodes = (node: AccountNode) => {
    plCodeToNode.set(node.code, node)
    node.children?.forEach(collectPlNodes)
  }

  for (const cat of plCategories) {
    for (const root of cat.nodes) {
      collectPlNodes(root)
    }
  }

  // 2) 収支側（activityIncome / activityExpense）を走査して expandToPlCodes を読む
  const activityCategories = BASIC_ACCOUNT_CATEGORIES.filter(
    (c) => c.id === "activityIncome" || c.id === "activityExpense"
  )

  const attachMap = (node: AccountNode) => {
    const codes = node.meta.expandToPlCodes
    if (codes && codes.length > 0) {
      const plNodes: AccountNode[] = []

      for (const code of codes) {
        const pl = plCodeToNode.get(code)
        if (pl) plNodes.push(pl)
      }

      if (plNodes.length > 0) {
        activityToPlMap.set(node.code, plNodes)
      }
    }

    node.children?.forEach(attachMap)
  }

  for (const cat of activityCategories) {
    for (const root of cat.nodes) {
      attachMap(root)
    }
  }

  return activityToPlMap
}

/**
 * 指定した種別ごとに「code → 親科目名」のマップを作る
 * - kind: "pl"         → 活動計算書（収益・費用）
 * - kind: "net_assets" → 正味財産の部（将来用）
 */
export function buildCodeToParentNameMapFor(
  kind: "pl" | "net_assets"
): Map<string, string> {
  const map = new Map<string, string>()

  // 子ノードをたどって「code → 親科目名」をマッピングする共通関数
  const walk = (node: AccountNode, parentName?: string) => {
    if (node.children?.length) {
      for (const child of node.children) {
        if (child.code && parentName) {
          map.set(child.code, parentName)
        }
        // 次の階層へ：自分自身の name1 を「親」として渡す
        walk(child, child.name1)
      }
    }
  }

  // === PL（収益 + 費用）用 ===
  if (kind === "pl") {
    const targetCategories = BASIC_ACCOUNT_CATEGORIES.filter(
      (c) => c.id === "revenue" || c.id === "expense"
    )

    for (const cat of targetCategories) {
      for (const root of cat.nodes) {
        walk(root, root.name1)
      }
    }

    return map
  }

  // === 正味財産（net_assets）用 ===
  // 今の簡易マスタでは 109100 / 109200 等の詳細科目をまだ持っていないので、
  // いったん空マップを返す。将来マスタ追加時にここで map.set(...) すればOK。
  if (kind === "net_assets") {
    return map
  }

  return map
}
