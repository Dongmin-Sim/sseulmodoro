"use client";

/**
 * 포모도로 완료 알림 유틸.
 * - OS 알림(Notification) 강화: 유지·중복방지·아이콘
 * - 페이지 내 소리(Web Audio 비프)
 * - 탭 제목 깜박임(document.title) — 백그라운드 탭에서 주의 환기
 *
 * 모두 클라이언트 전용. setTimeout 완료 트리거(백그라운드 포함)에서 호출된다.
 */

const NOTIFICATION_TAG = "pomodoro";
const NOTIFICATION_ICON = "/characters/sparrow.png";

// 완료 사운드 파일(placeholder). 이 경로에 파일을 두면 비프 대신 자동 재생되고,
// 없으면(404 등) 코드 합성 비프로 폴백한다. 나중에 음원만 추가하면 됨.
const SOUND_FILE = "/sounds/complete.mp3";

// ── 소리 ───────────────────────────────────────────────────────────
// 우선순위: 사운드 파일(있으면) → 없으면 Web Audio 합성 비프.
// 자동재생 정책상, 사용자 제스처(시작 버튼)에서 unlockAudio()로 먼저 깨워둬야
// 이후 setTimeout(백그라운드 포함)에서 재생할 수 있다.

type AudioContextCtor = typeof AudioContext;

let audioCtx: AudioContext | null = null;
let soundFile: HTMLAudioElement | null = null;
let soundFileReady = false; // 파일이 로드 가능하면 true → 파일 우선 재생

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { webkitAudioContext?: AudioContextCtor };
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

/** 사용자 제스처에서 호출 — 오디오 컨텍스트와 사운드 파일을 모두 unlock */
export function unlockAudio() {
  // Web Audio (비프 폴백용)
  try {
    if (!audioCtx) {
      const Ctor = getAudioContextCtor();
      if (Ctor) audioCtx = new Ctor();
    }
    if (audioCtx?.state === "suspended") void audioCtx.resume();
  } catch {
    // 오디오 미지원 환경은 조용히 무시
  }

  // 사운드 파일 프로브 + unlock (제스처 동안 무음 재생으로 깨움)
  try {
    if (!soundFile && typeof Audio !== "undefined") {
      soundFile = new Audio(SOUND_FILE);
      soundFile.preload = "auto";
      soundFile.addEventListener(
        "canplaythrough",
        () => {
          soundFileReady = true;
        },
        { once: true },
      );
      soundFile.addEventListener(
        "error",
        () => {
          soundFileReady = false; // 파일 없으면 비프로 폴백
        },
        { once: true },
      );
      // 제스처 동안 무음으로 한 번 재생해 백그라운드 재생을 unlock
      soundFile.muted = true;
      void soundFile
        .play()
        .then(() => {
          soundFile?.pause();
          if (soundFile) {
            soundFile.currentTime = 0;
            soundFile.muted = false;
          }
        })
        .catch(() => {
          // 파일이 없거나 재생 불가 → 비프 폴백
        });
    }
  } catch {
    // 무시
  }
}

/** 완료 시 사운드 재생 — 파일이 준비됐으면 파일, 아니면 비프 */
function playCompletionSound() {
  // 프로필 설정의 "완료 효과음" off면 재생 생략
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("sm-sound") === "off") {
      return;
    }
  } catch {
    // localStorage 접근 불가 환경은 기본(재생) 유지
  }
  if (soundFileReady && soundFile) {
    try {
      soundFile.currentTime = 0;
      void soundFile.play();
      return;
    } catch {
      // 실패 시 비프로 폴백
    }
  }
  playBeep();
}

/** 코드 합성 비프(기본값) — "딩-동" 두 음 */
function playBeep() {
  try {
    if (!audioCtx) return; // unlock 안 됐으면 스킵
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const ctx = audioCtx;
    const now = ctx.currentTime;
    const tones = [880, 1320];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      const end = start + 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(end);
    });
  } catch {
    // 무시
  }
}

// ── OS 알림 (Notification) ─────────────────────────────────────────

export function sendNotification(
  title: string,
  body: string,
  tag: string = NOTIFICATION_TAG,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const show = () => {
    try {
      new Notification(title, {
        body,
        // tag가 다르면 별도 알림으로 쌓이고, 같으면 교체된다.
        tag,
        requireInteraction: true, // 클릭/닫기 전까지 유지
        icon: NOTIFICATION_ICON,
      });
    } catch {
      // 무시
    }
  };

  if (Notification.permission === "granted") {
    show();
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") show();
    });
  }
}

// ── 백그라운드 주의 환기: 탭 제목 깜박임 + 소리 반복 ──────────────
// 탭이 백그라운드인 동안 제목을 깜박이고 소리를 5초마다 반복한다.
// 사용자가 탭으로 복귀(visibilitychange)하면 전부 멈추고, 안 돌아와도 2분에 캡.

const SOUND_REPEAT_MS = 5000; // 5초마다
const SOUND_CAP_MS = 120000; // 최대 2분

let flashInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;
let soundInterval: ReturnType<typeof setInterval> | null = null;
let soundCapTimeout: ReturnType<typeof setTimeout> | null = null;
let visibilityHandler: (() => void) | null = null;

function startBackgroundAlert(message: string) {
  if (typeof document === "undefined") return;
  stopBackgroundAlert(); // 기존 알림 정리

  // 제목 깜박임
  originalTitle = document.title;
  let on = false;
  flashInterval = setInterval(() => {
    document.title = on ? (originalTitle ?? "") : message;
    on = !on;
  }, 1000);

  // 소리 반복 — 즉시 1회 후 5초 간격, 2분 후 소리만 자동 정지
  playCompletionSound();
  soundInterval = setInterval(playCompletionSound, SOUND_REPEAT_MS);
  soundCapTimeout = setTimeout(() => {
    if (soundInterval) {
      clearInterval(soundInterval);
      soundInterval = null;
    }
  }, SOUND_CAP_MS);

  // 탭 복귀 시 전부 정지
  visibilityHandler = () => {
    if (!document.hidden) stopBackgroundAlert();
  };
  document.addEventListener("visibilitychange", visibilityHandler);
}

/** 깜박임·소리 반복 전부 정지 + 제목 원복 (복귀/언마운트/새 시작 시 호출) */
export function stopBackgroundAlert() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  if (soundInterval) {
    clearInterval(soundInterval);
    soundInterval = null;
  }
  if (soundCapTimeout) {
    clearTimeout(soundCapTimeout);
    soundCapTimeout = null;
  }
  if (typeof document !== "undefined") {
    if (visibilityHandler) {
      document.removeEventListener("visibilitychange", visibilityHandler);
      visibilityHandler = null;
    }
    if (originalTitle !== null) {
      document.title = originalTitle;
      originalTitle = null;
    }
  }
}

// ── 통합 진입점 ────────────────────────────────────────────────────

/**
 * 완료 알림 일괄 처리:
 * - OS 알림 (tag로 라운드 구분)
 * - 백그라운드면 제목 깜박임 + 소리 5초 반복(복귀 시 정지, 2분 캡)
 * - 포그라운드면 소리 1회만
 */
export function notifyComplete(title: string, body: string, tag?: string) {
  sendNotification(title, body, tag);
  if (typeof document !== "undefined" && document.hidden) {
    startBackgroundAlert(`🍅 ${title}`);
  } else {
    playCompletionSound();
  }
}
