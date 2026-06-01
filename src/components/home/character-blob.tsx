"use client";

import { cn } from "@/lib/utils";

type Rarity = "커먼" | "언커먼" | "레어" | "에픽" | "레전더리";

const RARITY_COLORS: Record<Rarity, string> = {
  커먼: "#9C9590",
  언커먼: "#7BA68E",
  레어: "#D4956A",
  에픽: "#9B7FD4",
  레전더리: "#D4B56A",
};

type CharacterBlobProps = {
  rarity?: string;
  className?: string;
};

export function CharacterBlob({ rarity, className }: CharacterBlobProps) {
  const rarityColor =
    RARITY_COLORS[(rarity as Rarity) ?? "커먼"] ?? RARITY_COLORS["커먼"];

  return (
    <div className={cn("relative", className)}>
      <div
        className="animate-breathe relative"
        style={{
          width: 140,
          height: 140,
          background: "#E8D5C0",
          borderRadius: "50% 44% 54% 46% / 46% 54% 46% 54%",
          boxShadow:
            "0 12px 32px rgba(210,170,130,0.3), 0 4px 12px rgba(210,170,130,0.15)",
        }}
      >
        {/* Eyes */}
        <span
          className="absolute rounded-full bg-foreground"
          style={{ width: 9, height: 9, top: "50%", left: "34%" }}
        />
        <span
          className="absolute rounded-full bg-foreground"
          style={{ width: 9, height: 9, top: "50%", right: "34%" }}
        />
        {/* Blush */}
        <span
          className="absolute rounded-full"
          style={{
            width: 18,
            height: 10,
            background: `${rarityColor}33`,
            top: "58%",
            left: "22%",
          }}
        />
        <span
          className="absolute rounded-full"
          style={{
            width: 18,
            height: 10,
            background: `${rarityColor}33`,
            top: "58%",
            right: "22%",
          }}
        />
      </div>
    </div>
  );
}
