"use client";

// 루트 레이아웃 자체가 깨졌을 때의 최후 안전망 — globals.css/폰트에 기대지 않고 인라인 스타일.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F2",
          color: "#2D2A26",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>잠시 문제가 생겼어요</h1>
        <p style={{ fontSize: 15, color: "#6F665E", margin: "0 0 24px", lineHeight: 1.6 }}>
          일시적인 오류가 발생했어요.
          <br />
          다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            height: 50,
            padding: "0 28px",
            border: "none",
            borderRadius: 14,
            background: "linear-gradient(135deg,#D4956A,#C97F58)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
