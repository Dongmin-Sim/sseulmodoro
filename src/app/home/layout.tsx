import { PomodoroSessionProvider } from "@/components/pomodoro/session-context";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PomodoroSessionProvider>{children}</PomodoroSessionProvider>;
}
