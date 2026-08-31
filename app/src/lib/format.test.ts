import { describe, it, expect } from "vitest";
import { formatFocusDuration, formatRecordTimestamp } from "./format";

describe("formatFocusDuration", () => {
  it("0분일 때 '0분'", () => {
    expect(formatFocusDuration(0)).toBe("0분");
  });

  it("60분 미만이면 '_분'", () => {
    expect(formatFocusDuration(30)).toBe("30분");
  });

  it("정시(분 0)면 '_시간'만", () => {
    expect(formatFocusDuration(60)).toBe("1시간");
    expect(formatFocusDuration(120)).toBe("2시간");
  });

  it("시간+분이면 '_시간 _분'", () => {
    expect(formatFocusDuration(90)).toBe("1시간 30분");
    expect(formatFocusDuration(125)).toBe("2시간 5분");
  });

  it("음수/소수는 방어적으로 처리", () => {
    expect(formatFocusDuration(-10)).toBe("0분");
    expect(formatFocusDuration(25.9)).toBe("25분");
  });
});

describe("formatRecordTimestamp", () => {
  it("UTC ISO를 KST(+9) 기준으로 표기", () => {
    // 2026-06-02 05:30 UTC → KST 14:30
    expect(formatRecordTimestamp("2026-06-02T05:30:00+00:00")).toBe(
      "2026년 6월 2일 14:30",
    );
  });

  it("UTC 전날이라도 KST 날짜로 넘어감", () => {
    // 2026-06-01 17:00 UTC → KST 2026-06-02 02:00
    expect(formatRecordTimestamp("2026-06-01T17:00:00+00:00")).toBe(
      "2026년 6월 2일 02:00",
    );
  });

  it("자정 경계를 00:00으로 표기 (24:00 보정)", () => {
    // 2026-06-01 15:00 UTC → KST 2026-06-02 00:00
    expect(formatRecordTimestamp("2026-06-01T15:00:00+00:00")).toBe(
      "2026년 6월 2일 00:00",
    );
  });
});
