import Link from "next/link";
import Image from "next/image";
import { BirdCard } from "@/components/character/bird-card";

const FLOCK = [
  { slug: "glaucousgull", rarity: "common" },
  { slug: "dove", rarity: "common" },
  { slug: "mandarin", rarity: "common" },
  { slug: "crane", rarity: "rare" },
  { slug: "reedwarbler", rarity: "rare" },
  { slug: "godwit", rarity: "epic" },
  { slug: "dunlin", rarity: "epic" },
  { slug: "gaeri", rarity: "legendary" },
  { slug: "mongolplover", rarity: "legendary" },
  { slug: "maemsae", rarity: "mythic" },
] as const;

const WHY = [
  { icon: "/icons/tomato.png", tint: "focus", title: "집중력 향상", desc: "짧은 몰입 단위로 주의가 흩어지기 전에 한 가지 일에 집중해요." },
  { icon: "/icons/coffee.png", tint: "break", title: "번아웃 방지", desc: "규칙적인 휴식이 끼어 있어 오래 일해도 쉽게 지치지 않아요." },
  { icon: "/icons/tree.png", tint: "break", title: "미루기 극복", desc: "“딱 25분만”이라는 작은 시작이 미루기의 장벽을 낮춰줘요." },
  { icon: "/icons/star.png", tint: "gold", title: "성취감 누적", desc: "완료한 사이클이 눈에 보이게 쌓여 매일의 동기가 이어져요." },
] as const;

function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded"
      style={{
        width: size,
        height: size,
        background: "#C4725C",
        boxShadow: "inset 0 -5px 0 rgba(0,0,0,.12), 3px -7px 0 -2px #7BA68E",
      }}
    />
  );
}

export default function LandingPage() {
  return (
    <main className="relative z-10 flex flex-col bg-grid">
      {/* nav */}
      <header className="flex h-[68px] items-center px-5 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-pixel text-base">쓸모도로</span>
        </Link>
        <nav className="ml-auto flex items-center gap-5 sm:gap-7">
          <a href="#how" className="hidden text-sm font-medium text-text-secondary hover:text-foreground sm:block">기능</a>
          <a href="#why" className="hidden text-sm font-medium text-text-secondary hover:text-foreground sm:block">사용법</a>
          <a href="#flock" className="hidden text-sm font-medium text-text-secondary hover:text-foreground sm:block">친구들</a>
          <Link href="/login" className="text-sm font-semibold text-foreground">로그인</Link>
          <Link
            href="/signup"
            className="flex h-11 items-center rounded-xl bg-foreground px-5 text-sm font-bold text-background"
          >
            무료로 시작
          </Link>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-10">
        {/* hero */}
        <section className="grid items-center gap-8 py-12 lg:grid-cols-[1.04fr_.96fr] lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-focus/25 bg-focus/10 px-4 py-2">
              <Image src="/icons/tomato.png" alt="" width={16} height={16} unoptimized className="pixelated" />
              <span className="text-[13px] font-semibold text-focus">집중을 즐겁게, 포모도로 타이머</span>
            </div>
            <h1 className="text-[clamp(2.4rem,6vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-foreground">
              집중할수록
              <br />
              친구가 늘어나요
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-text-secondary">
              25분 집중 한 판을 끝낼 때마다 포인트가 쌓이고, 알을 뽑아 귀여운 픽셀 새를 모아요. 작은 보상이 매일의 집중을 이어가게 합니다.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="flex h-14 items-center gap-2 rounded-[14px] px-7 text-base font-bold text-primary-foreground shadow-[0_8px_20px_rgba(212,149,106,.4)] transition-transform hover:scale-[1.01]"
                style={{ background: "var(--primary-gradient)" }}
              >
                <span className="text-xs">▶</span> 지금 집중 시작
              </Link>
              <a
                href="#why"
                className="flex h-14 items-center rounded-[14px] border border-border bg-card px-6 text-[15px] font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                사용법 보기
              </a>
            </div>
            <div className="mt-9 flex items-center gap-7">
              <Stat value="10종" label="모을 수 있는 친구" color="var(--focus)" />
              <div className="h-9 w-px bg-border" />
              <Stat value="5등급" label="레어리티 수집" color="var(--break)" />
              <div className="h-9 w-px bg-border" />
              <Stat value="무료" label="지금 바로 시작" color="var(--gold)" />
            </div>
          </div>

          <div className="relative flex h-80 items-center justify-center lg:h-[420px]">
            <div
              className="absolute h-80 w-80 rounded-full lg:h-96 lg:w-96"
              style={{ background: "radial-gradient(circle, rgba(224,177,94,.22), rgba(224,177,94,0) 62%)" }}
            />
            <span className="animate-sparkle-pulse absolute left-16 top-16 text-lg text-gold">✦</span>
            <span className="animate-sparkle-pulse absolute right-20 top-24 text-xs text-primary" style={{ animationDelay: ".4s" }}>✦</span>
            <span className="animate-sparkle-pulse absolute bottom-24 right-24 text-sm text-break" style={{ animationDelay: ".8s" }}>✦</span>
            <Image
              src="/characters/owl-grad.png"
              alt="포모"
              width={220}
              height={220}
              unoptimized
              priority
              className="pixelated animate-buddy-bob"
            />
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-20 py-12">
          <SectionHead eyebrow="HOW IT WORKS" title="집중하고, 모으고, 키워요" />
          <div className="grid gap-5 md:grid-cols-3">
            <HowCard step="STEP 01" icon="/icons/tomato.png" tint="focus" title="25분 집중" desc="타이머를 켜고 딴짓 없이 한 판 몰입해요. 포모가 곁에서 함께 집중해요." />
            <HowCard step="STEP 02" icon="/icons/star.png" tint="gold" title="포인트 적립" desc="집중을 마치면 포인트가 쌓여요. 모은 포인트로 알을 뽑을 수 있어요." />
            <HowCard step="STEP 03" icon="/icons/gift.png" tint="break" title="친구 수집" desc="새로운 픽셀 새를 도감에 채우고, 집중 파트너로 함께해요." />
          </div>
        </section>

        {/* why pomodoro */}
        <section id="why" className="scroll-mt-20 py-12">
          <SectionHead
            eyebrow="WHY POMODORO"
            title="왜 25분 집중일까요?"
            sub="포모도로는 25분 집중과 짧은 휴식을 반복하는 시간 관리 기법이에요. 단순하지만, 집중을 지속 가능하게 만드는 힘이 있어요."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow)]">
                <TintIcon icon={w.icon} tint={w.tint} size={50} />
                <h3 className="mt-4 text-base font-extrabold text-foreground">{w.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{w.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* meet the flock — 무한 마퀴 */}
      <section id="flock" className="scroll-mt-20 py-12">
        <SectionHead eyebrow="MEET THE FLOCK" title="함께 집중할 친구들" />
        <div
          className="overflow-hidden py-2"
          style={{ maskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)" }}
        >
          <div className="animate-marquee flex w-max">
            {[...FLOCK, ...FLOCK].map((b, i) => (
              <div key={`${b.slug}-${i}`} className="mr-4 w-[116px] shrink-0">
                <BirdCard slug={b.slug} rarity={b.rarity} name="" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-10">
        {/* final CTA */}
        <section className="py-12">
          <div
            className="relative overflow-hidden rounded-[28px] px-8 py-14 text-center shadow-[0_20px_50px_rgba(196,114,92,.3)]"
            style={{ background: "linear-gradient(135deg,#D4956A,#C4725C)" }}
          >
            <span className="animate-sparkle-pulse absolute left-16 top-12 text-base text-white/60">✦</span>
            <span className="animate-sparkle-pulse absolute bottom-14 right-20 text-xs text-white/50" style={{ animationDelay: ".5s" }}>✦</span>
            <Image src="/characters/owl-grad.png" alt="포모" width={84} height={84} unoptimized className="pixelated animate-buddy-bob mx-auto mb-3.5" />
            <h2 className="text-[clamp(1.6rem,5vw,2.1rem)] font-extrabold tracking-tight text-white">오늘의 첫 집중, 시작해볼까요?</h2>
            <p className="mt-3 text-base text-white/85">가입하면 첫 알 1개와 200포인트를 드려요.</p>
            <Link
              href="/signup"
              className="mt-7 inline-flex h-14 items-center rounded-[14px] bg-white px-9 text-base font-bold text-focus shadow-[0_10px_24px_rgba(0,0,0,.16)] transition-transform hover:scale-[1.02]"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </div>

      {/* footer */}
      <footer className="border-t border-border px-5 py-7 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark size={16} />
            <span className="font-pixel text-[13px]">쓸모도로</span>
          </div>
          <span className="text-xs text-muted-foreground">© 2026 쓸모도로 · 집중을 즐겁게</span>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-semibold leading-none" style={{ color }}>{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 text-center">
      <p className="font-pixel text-[11px] tracking-[1.5px] text-primary">{eyebrow}</p>
      <h2 className="mt-2.5 text-[clamp(1.5rem,4vw,2rem)] font-extrabold tracking-tight text-foreground">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-text-secondary">{sub}</p>}
    </div>
  );
}

const TINT_BG: Record<string, string> = {
  focus: "border-focus/25 bg-focus/10",
  break: "border-break/25 bg-break/10",
  gold: "border-border-warm bg-gold/10",
};

function TintIcon({ icon, tint, size }: { icon: string; tint: string; size: number }) {
  return (
    <div className={`flex items-center justify-center rounded-2xl border ${TINT_BG[tint]}`} style={{ width: size, height: size }}>
      <Image src={icon} alt="" width={Math.round(size * 0.52)} height={Math.round(size * 0.52)} unoptimized className="pixelated" />
    </div>
  );
}

function HowCard({ step, icon, tint, title, desc }: { step: string; icon: string; tint: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-md)]">
      <TintIcon icon={icon} tint={tint} size={60} />
      <p className="font-pixel mt-4 text-[10px] text-primary">{step}</p>
      <h3 className="mt-2 text-lg font-extrabold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{desc}</p>
    </div>
  );
}
