// components/account/account-kind.ts
import {
  BASIC_ACCOUNT_CATEGORIES,
  type AccountNode,
  type AccountCategoryId,
} from "./account-data"

export type AccountKind = "BS" | "PL" | "IncomeExpense" | "Other"

//AccountCategoryId → AccountKind のマッピング
export function resolveAccountKindFromCategoryId(
  categoryId: AccountCategoryId
): AccountKind {
  switch (categoryId) {
    case "asset":
    case "liability":
    case "netAssets":
      return "BS"

    case "revenue":
    case "expense":
      return "PL"

    case "activityIncome":
    case "activityExpense":
      return "IncomeExpense"

    default:
      return "Other"
  }
}

// コードから AccountNode を検索する（カテゴリID付き）
export function findAccountNodeByCode(
  code?: string
): { node: AccountNode; categoryId: AccountCategoryId } | undefined {
  if (!code) return undefined

  const walk = (nodes: AccountNode[], target: string): AccountNode | undefined => {
    for (const node of nodes) {
      if (node.code === target) return node
      if (node.children?.length) {
        const found = walk(node.children, target)
        if (found) return found
      }
    }
    return undefined
  }

  for (const category of BASIC_ACCOUNT_CATEGORIES) {
    const found = walk(category.nodes, code)
    if (found) {
      return { node: found, categoryId: category.id }
    }
  }

  return undefined
}

//科目コードから科目種別(AccountKind)を判定するメイン関数
export function resolveAccountKind(code?: string): AccountKind {
  if (!code) return "Other"

  const found = findAccountNodeByCode(code)
  if (!found) return "Other"

  return resolveAccountKindFromCategoryId(found.categoryId)
}

//財源バッジの対象か？
export function isFundingTargetKind(kind: AccountKind): boolean {
  return kind === "PL" || kind === "IncomeExpense"
}

//科目コードベースで財源バッジ対象かどうか判定したい場合用のヘルパー
export function isFundingTargetCode(code?: string): boolean {
  return isFundingTargetKind(resolveAccountKind(code))
}

//その他有価証券評価差額金の展開科目を決める
export function resolveSecuritiesGainLossTarget(
  baseCode: string,
  fundingType?: "指定" | "一般"
): string {
  if (baseCode === "108100") {
    if (fundingType === "指定") return "109100"
    if (fundingType === "一般") return "109200"
  }
  return baseCode
}
