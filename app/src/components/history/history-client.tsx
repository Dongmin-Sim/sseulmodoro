"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getHistory } from "@/lib/api/history";
import { getHeatmap } from "@/lib/api/heatmap";
import { formatFocusDuration, formatRecordTimestamp } from "@/lib/format";
import { InlineError } from "@/components/feedback/inline-error";
import { EmptyState } from "@/components/feedback/empty-state";
import { useToast } from "@/components/feedback/toast";
import type { HeatmapResponse, RecordLog, RecordResponse } from "@/lib/types/api";

const HISTORY_PAGE_SIZE = 10;

type LoadStatus = "loading" | "ready" | "error";

const HEAT = ["var(--border)", "#F2DCCD", "#E3B393", "#D4956A", "#C4725C"] as const;

function heatColor(count: number): string {
  if (count <= 0) return HEAT[0];
  if (count === 1) return HEAT[1];
  if (count === 2) return HEAT[2];
  if (count <= 4) return HEAT[3];
  return HEAT[4];
}

export function HistoryClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<LoadStatus>("loading");
  const [summary, setSummary] = useState<RecordResponse["summary"] | null>(null);
  const [logs, setLogs] = useState<RecordLog[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapResponse>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setStatus("loading");
    try {
      const [history, heat] = await Promise.all([
        getHistory(null, HISTORY_PAGE_SIZE),
        getHeatmap().catch(() => [] as HeatmapResponse),
      ]);
      setSummary(history.summary);
      setLogs(history.logs);
      setCursor(history.nextCursor);
      setHeatmap(heat);
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
    try {
      const data = await getHistory(cursor, HISTORY_PAGE_SIZE);
      setLogs((prev) => [...prev, ...data.logs]);
      setCursor(data.nextCursor);
    } catch {
      toast({
        title: "기록을 더 불러오지 못했어요",
        description: "잠시 후 다시 시도해 주세요.",
        action: { label: "다시 시도", onClick: () => void handleLoadMore() },
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const isEmpty = status === "ready" && (summary?.total.count ?? 0) === 0;

  return (
    <main className="relative z-10 flex flex-1 flex-col bg-grid py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4">
        <div className="mb-7">
          <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">RECORDS</p>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-foreground">나의 집중 기록</h1>
        </div>

        {status === "loading" && (
          <p className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}

        {status === "error" && (
          <div className="mx-auto w-full max-w-md py-12">
            <InlineError title="기록을 불러오지 못했어요" onRetry={() => void loadInitial()} />
          </div>
        )}

        {isEmpty && (
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5 py-12">
            <EmptyState title="아직 기록이 없어요" description="포모도로를 완료하면 여기에 기록이 쌓여요." />
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="h-12 rounded-[14px] px-7 text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)]"
              style={{ background: "var(--primary-gradient)" }}
            >
              집중 시작
            </button>
          </div>
        )}

        {status === "ready" && !isEmpty && summary && (
          <div className="grid gap-5 lg:grid-cols-[.95fr_1.05fr] lg:items-start">
            {/* 요약 + 히트맵 */}
            <div className="flex flex-col gap-5">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <p className="font-pixel text-[9px] tracking-[1.5px] text-muted-foreground">전체</p>
                    <p className="font-mono mt-2 text-3xl font-semibold leading-none text-focus">
                      {summary.total.count}
                      <span className="text-[15px] text-muted-foreground">회</span>
                    </p>
                    <p className="font-mono mt-2 text-xs text-muted-foreground">
                      {formatFocusDuration(summary.total.focusMinutes)} 집중
                    </p>
                  </div>
                  <div className="border-l border-border pl-5">
                    <p className="font-pixel text-[9px] tracking-[1.5px] text-muted-foreground">오늘</p>
                    <p className="font-mono mt-2 text-3xl font-semibold leading-none text-foreground">
                      {summary.today.count}
                      <span className="text-[15px] text-muted-foreground">회</span>
                    </p>
                    <p className="font-mono mt-2 text-xs text-muted-foreground">
                      {formatFocusDuration(summary.today.focusMinutes)} 집중
                    </p>
                  </div>
                </div>
              </section>

              {heatmap.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-pixel text-[10px] tracking-[1.5px] text-muted-foreground">최근 12주 집중</p>
                    <span className="font-mono flex items-center gap-1 text-[10px] text-muted-foreground">
                      적음
                      {HEAT.map((c) => (
                        <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
                      ))}
                      많음
                    </span>
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 auto-cols-fr gap-[5px]" style={{ height: 132 }}>
                    {heatmap.map((d) => (
                      <div
                        key={d.date}
                        className="rounded-[3px]"
                        style={{ background: heatColor(d.count) }}
                        title={`${d.date} · ${d.count}회`}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* 완료 기록 */}
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <p className="font-pixel mb-2 text-[10px] tracking-[1.5px] text-muted-foreground">완료 기록</p>
              <ul className="flex flex-col">
                {logs.map((log) => (
                  <li
                    key={log.pomodoroId}
                    className="flex items-center justify-between border-b border-border py-3.5 last:border-b-0"
                  >
                    <span className="flex items-center gap-2.5">
                      <Image src="/icons/tomato.png" alt="" width={17} height={17} unoptimized className="pixelated" />
                      <span className="font-mono text-[13px] text-foreground">
                        {formatRecordTimestamp(log.completedAt)}
                      </span>
                    </span>
                    <span className="font-mono text-[13px] font-semibold text-focus">{log.focusMinutes}분</span>
                  </li>
                ))}
              </ul>

              {cursor && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="mt-4 w-full rounded-xl border border-border bg-card py-3 text-[13px] font-semibold text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  {isLoadingMore ? "불러오는 중..." : "더 보기"}
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
