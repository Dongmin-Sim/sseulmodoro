"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ContentNav } from "@/components/layout/content-nav";
import { MAIN_NAV_ITEMS } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getHistory } from "@/lib/api/history";
import { logout } from "@/lib/api/logout";
import { formatFocusDuration, formatRecordTimestamp } from "@/lib/format";
import type { RecordLog, RecordResponse, RecordStat } from "@/lib/types/api";

const HISTORY_PAGE_SIZE = 10;

type LoadStatus = "loading" | "ready" | "error";

function StatBlock({
  label,
  stat,
  accent,
}: {
  label: string;
  stat: RecordStat;
  accent: "primary" | "foreground";
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className={
          accent === "primary"
            ? "text-2xl font-bold leading-none text-primary"
            : "text-2xl font-bold leading-none text-foreground"
        }
      >
        {stat.count}회
      </span>
      <span className="text-sm text-muted-foreground">
        {formatFocusDuration(stat.focusMinutes)}
      </span>
    </div>
  );
}

export function HistoryClient() {
  const router = useRouter();

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [summary, setSummary] = useState<RecordResponse["summary"] | null>(null);
  const [logs, setLogs] = useState<RecordLog[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await getHistory(null, HISTORY_PAGE_SIZE);
      setSummary(data.summary);
      setLogs(data.logs);
      setCursor(data.nextCursor);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleLoadMore = async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    setMoreError(null);
    try {
      const data = await getHistory(cursor, HISTORY_PAGE_SIZE);
      setLogs((prev) => [...prev, ...data.logs]);
      setCursor(data.nextCursor);
    } catch {
      setMoreError("이력을 더 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
    }
  };

  const logoutAction = (
    <div className="flex items-center gap-2">
      {logoutError && (
        <p role="alert" aria-live="assertive" className="text-xs text-destructive">
          {logoutError}
        </p>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label={isLoggingOut ? "로그아웃 처리 중" : "로그아웃"}
      >
        {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );

  const isEmpty = status === "ready" && (summary?.total.count ?? 0) === 0;

  return (
    <main className="relative z-10 flex flex-1 flex-col py-5">
      <PageContainer className="flex flex-col">
        <ContentNav items={MAIN_NAV_ITEMS} action={logoutAction} />

        {status === "loading" && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p role="alert" className="text-sm text-destructive">
              이력을 불러오지 못했습니다.
            </p>
            <Button variant="outline" size="sm" onClick={() => void loadInitial()}>
              다시 시도
            </Button>
          </div>
        )}

        {isEmpty && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-lg font-bold text-foreground">
              아직 기록이 없습니다
            </h1>
            <p className="text-sm text-muted-foreground">
              포모도로를 완료하면 여기에 기록이 쌓여요.
            </p>
            <Button
              className="rounded-[10px] px-6 py-3 text-sm font-bold text-white"
              style={{
                background: "#D4956A",
                boxShadow: "0 6px 16px rgba(212,149,106,0.38)",
                border: "none",
                height: "auto",
              }}
              onClick={() => router.push("/home")}
            >
              집중 시작
            </Button>
          </div>
        )}

        {status === "ready" && !isEmpty && summary && (
          <div className="flex flex-col gap-6">
            {/* 집계 요약 */}
            <Card className="w-full">
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock label="전체" stat={summary.total} accent="primary" />
                  <StatBlock label="오늘" stat={summary.today} accent="foreground" />
                </div>
              </CardContent>
            </Card>

            {/* 완료 기록 로그 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                완료 기록
              </span>
              <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {logs.map((log) => (
                  <li
                    key={log.pomodoroId}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="font-mono text-sm text-foreground">
                      {formatRecordTimestamp(log.completedAt)}
                    </span>
                    <span className="font-mono text-sm font-semibold text-primary">
                      {log.focusMinutes}분
                    </span>
                  </li>
                ))}
              </ul>

              {cursor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 self-center"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "불러오는 중..." : "더보기"}
                </Button>
              )}

              {moreError && (
                <p role="alert" className="text-center text-sm text-destructive">
                  {moreError}
                </p>
              )}
            </div>
          </div>
        )}
      </PageContainer>
    </main>
  );
}
