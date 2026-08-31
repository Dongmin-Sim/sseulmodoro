import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** narrow=중앙 정렬 좁은 콘텐츠(타이머·인증·완료 등), wide=대시보드 폭(기본) */
  width?: "wide" | "narrow";
};

// 콘텐츠 컨테이너 — 데스크톱 대시보드 폭(~1120px) / 모바일 단일 컬럼(풀폭 + 패딩).
// 좁은 중앙 콘텐츠가 필요한 화면은 width="narrow" 사용.
export function PageContainer({ children, className, width = "wide" }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "wide" ? "max-w-[1120px]" : "max-w-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
