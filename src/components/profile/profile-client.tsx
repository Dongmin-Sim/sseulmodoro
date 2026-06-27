"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { logout } from "@/lib/api/logout";
import { updateNickname, NicknameTakenError } from "@/lib/api/profile";

const NICKNAME_PATTERN = /^[0-9A-Za-z가-힣]{2,12}$/;

type ProfileClientProps = {
  nickname: string | null;
  email: string;
  balance: number;
  friendCount: number;
  pomodoroTotal: number;
  level: number;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? "var(--primary)" : "#E7DBCD" }}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  );
}

export function ProfileClient({
  nickname: initialNickname,
  email,
  balance,
  friendCount,
  pomodoroTotal,
  level,
}: ProfileClientProps) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);

  // 설정 (localStorage / 브라우저 권한)
  const [notify, setNotify] = useState(false);
  const [sound, setSound] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window) setNotify(Notification.permission === "granted");
    setSound(localStorage.getItem("sm-sound") !== "off");
    setDark(localStorage.getItem("sm-theme") === "dark");
  }, []);

  const handleNotify = async (next: boolean) => {
    if (next && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotify(perm === "granted");
    } else {
      setNotify(false);
    }
  };

  const handleSound = (next: boolean) => {
    setSound(next);
    localStorage.setItem("sm-sound", next ? "on" : "off");
  };

  const handleDark = (next: boolean) => {
    setDark(next);
    localStorage.setItem("sm-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  // 닉네임 편집
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(initialNickname ?? "");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = () => {
    setDraft(nickname ?? "");
    setEditError(null);
    setEditOpen(true);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!NICKNAME_PATTERN.test(trimmed)) {
      setEditError("한글·영문·숫자 2~12자로 입력해주세요.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await updateNickname(trimmed);
      setNickname(res.nickname);
      setEditOpen(false);
      router.refresh();
    } catch (e) {
      setEditError(
        e instanceof NicknameTakenError
          ? "이미 사용 중인 닉네임이에요."
          : "변경에 실패했어요. 다시 시도해주세요.",
      );
    } finally {
      setSaving(false);
    }
  };

  // 로그아웃
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLogoutError("로그아웃에 실패했습니다.");
      setLoggingOut(false);
    }
  };

  const avatarChar = nickname?.trim()?.[0] ?? "?";
  const displayName = nickname?.trim() || "이름을 정해주세요";

  return (
    <main className="relative z-10 flex flex-1 flex-col bg-grid py-6">
      <div className="mx-auto w-full max-w-[1000px] px-4">
        <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          {/* 프로필 카드 */}
          <section className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-md)]">
            <div className="relative mx-auto h-28 w-28">
              <div
                className="flex h-28 w-28 items-center justify-center rounded-[28px] text-5xl font-extrabold text-primary-foreground shadow-[0_10px_24px_rgba(196,114,92,.3)]"
                style={{ background: "var(--primary-gradient)" }}
              >
                {avatarChar}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-card shadow-[var(--shadow-md)]">
                <Image src="/characters/owl.png" alt="" width={32} height={32} unoptimized className="pixelated" />
              </div>
            </div>
            <p className="mt-5 text-[22px] font-extrabold text-foreground">{displayName}</p>
            <p className="font-mono mt-1.5 text-[13px] text-muted-foreground">{email}</p>
            <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-border-warm bg-gold/10 px-3.5 py-1.5">
              <Image src="/icons/fire.png" alt="" width={16} height={16} unoptimized className="pixelated" />
              <span className="text-[13px] font-bold text-gold-deep">집중 레벨 {level}</span>
            </div>
            <button
              type="button"
              onClick={openEdit}
              className="mt-6 h-12 w-full rounded-[13px] border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
            >
              프로필 편집
            </button>
          </section>

          {/* 통계 + 설정 + 로그아웃 */}
          <div className="flex flex-col gap-5">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
              <p className="font-pixel mb-4 text-[10px] tracking-[1.5px] text-muted-foreground">전체 통계</p>
              <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
                <ProfileStat value={pomodoroTotal.toLocaleString()} label="총 포모도로" color="var(--focus)" />
                <ProfileStat value={friendCount.toLocaleString()} label="모은 친구" color="var(--break)" />
                <ProfileStat value={balance.toLocaleString()} label="보유 포인트" color="var(--gold)" />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card px-6 shadow-[var(--shadow)]">
              <SettingRow icon="/icons/bell.png" label="집중 종료 알림">
                <Toggle checked={notify} onChange={handleNotify} />
              </SettingRow>
              <SettingRow icon="/icons/speaker.png" label="완료 효과음">
                <Toggle checked={sound} onChange={handleSound} />
              </SettingRow>
              <SettingRow icon="/icons/moon.png" label="다크 모드" last>
                <Toggle checked={dark} onChange={handleDark} />
              </SettingRow>
            </section>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="h-12 w-full rounded-[13px] border border-border bg-card text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-2 disabled:opacity-50"
            >
              {loggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
            {logoutError && <p role="alert" className="text-center text-xs text-destructive">{logoutError}</p>}
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent showCloseButton className="max-w-sm rounded-3xl p-7 ring-0">
          <DialogTitle className="text-xl font-extrabold text-foreground">닉네임 변경</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-text-secondary">
            한글·영문·숫자 2~12자로 정해주세요.
          </DialogDescription>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="닉네임"
            maxLength={12}
            aria-label="닉네임"
            className="mt-4 h-12 rounded-[13px]"
          />
          {editError && <p role="alert" className="mt-2 text-xs text-destructive">{editError}</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-5 h-12 w-full rounded-[14px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01] disabled:opacity-60"
            style={{ background: "var(--primary-gradient)" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ProfileStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-semibold leading-none" style={{ color }}>{value}</p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  last,
  children,
}: {
  icon: string;
  label: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between py-[18px] ${last ? "" : "border-b border-border"}`}>
      <span className="flex items-center gap-3">
        <Image src={icon} alt="" width={20} height={20} unoptimized className="pixelated" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
      {children}
    </div>
  );
}
