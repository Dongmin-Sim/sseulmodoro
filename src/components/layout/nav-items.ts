import type { ContentNavItem } from "@/components/layout/content-nav";

/**
 * 메인 4탭 네비게이션(홈·도감·상점·기록) 단일 출처.
 * 홈을 세션 종료 액션으로 쓰는 home-client는 첫 항목만 교체하고 나머지를 재사용한다.
 */
export const MAIN_NAV_ITEMS: ContentNavItem[] = [
  { label: "홈", href: "/home" },
  { label: "도감", href: "/collection" },
  { label: "상점", href: "/shop" },
  { label: "기록", href: "/history" },
];
