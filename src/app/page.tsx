import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">쓸모도로</h1>
      <p className="text-muted-foreground">집중하면 캐릭터가 자라요</p>
      <div className="flex gap-4">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          로그인
        </Link>
        <Link href="/signup" className="text-sm font-medium text-primary hover:underline">
          회원가입
        </Link>
      </div>
    </main>
  );
}
