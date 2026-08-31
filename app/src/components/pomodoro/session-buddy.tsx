"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SessionBuddyProps = {
  slug: string | null;
  name?: string;
  size?: number;
  glow?: string;
  halo?: boolean;
  sparkles?: boolean;
  className?: string;
};

const SPARKLES = [
  { className: "left-[14%] top-[12%] text-gold text-sm", delay: "0s" },
  { className: "right-[16%] top-[20%] text-primary text-xs", delay: ".4s" },
  { className: "right-[22%] bottom-[18%] text-break text-sm", delay: ".8s" },
] as const;

export function SessionBuddy({
  slug,
  name = "친구",
  size = 104,
  glow = "rgba(196,114,92,.22)",
  halo = false,
  sparkles = false,
  className,
}: SessionBuddyProps) {
  const src = slug ? `/characters/${slug}.png` : "/icons/egg-smooth.png";
  const auraSize = Math.round(size * 1.04);
  const haloSize = Math.round(size * 1.7);

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {halo && (
        <div
          className="absolute rounded-full"
          style={{
            width: haloSize,
            height: haloSize,
            background: `radial-gradient(circle, ${glow}, transparent 62%)`,
          }}
        />
      )}
      <div
        className="animate-aura-pulse absolute rounded-full"
        style={{
          width: auraSize,
          height: auraSize,
          background: `radial-gradient(circle, ${glow}, transparent 65%)`,
        }}
      />
      {sparkles &&
        SPARKLES.map((s, i) => (
          <span
            key={i}
            className={cn("animate-sparkle-pulse absolute", s.className)}
            style={{ animationDelay: s.delay }}
          >
            ✦
          </span>
        ))}
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        unoptimized
        priority
        className="pixelated animate-buddy-bob relative"
      />
    </div>
  );
}
