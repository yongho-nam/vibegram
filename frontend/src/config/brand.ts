/** 제품·UI 카피 단일 출처 */
export const BRAND_NAME = "바이브그램";
export const BRAND_UI_LINE = "바이브 코딩 스타일 UI";

export function brandCopyrightYear(year: number = new Date().getFullYear()): string {
  return `© ${year} ${BRAND_NAME} · 학습·데모`;
}
