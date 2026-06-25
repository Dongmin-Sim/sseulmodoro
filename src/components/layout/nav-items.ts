export type NavItem = {
  label: string;
  href: string;
};

/**
 * 메인 4탭 네비게이션(홈·도감·상점·기록) 단일 출처.
 * 공통 상단 헤더(AuthHeader)가 렌더하며, 홈 탭은 /home에서 세션 종료 액션으로 동작한다.
 */
export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "홈", href: "/home" },
  { label: "도감", href: "/collection" },
  { label: "상점", href: "/shop" },
  { label: "기록", href: "/history" },
];
