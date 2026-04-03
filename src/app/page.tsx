import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">쓸모도로</h1>
        <p className="text-sm text-muted-foreground">
          집중하면 캐릭터가 자란다
        </p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
