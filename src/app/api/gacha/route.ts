import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { GachaResponse, ApiError } from "@/lib/types/api";

export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("gacha");

  if (error) {
    if (error.message?.includes("insufficient_balance")) {
      return NextResponse.json<ApiError>(
        { error: "Insufficient balance" },
        { status: 400 },
      );
    }
    console.error("gacha rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Failed to draw character" },
      { status: 500 },
    );
  }

  if (!data) {
    console.error("gacha rpc returned null");
    return NextResponse.json<ApiError>(
      { error: "Failed to draw character" },
      { status: 500 },
    );
  }

  const raw = data as Record<string, unknown>;
  if (
    typeof raw.instance_id !== "number" ||
    typeof raw.type_id !== "number" ||
    typeof raw.name !== "string" ||
    typeof raw.rarity !== "string" ||
    typeof raw.level !== "number" ||
    typeof raw.new_balance !== "number" ||
    typeof raw.is_new !== "boolean"
  ) {
    console.error("gacha rpc returned unexpected shape:", data);
    return NextResponse.json<ApiError>(
      { error: "Failed to draw character" },
      { status: 500 },
    );
  }

  return NextResponse.json<GachaResponse>(
    {
      characterInstance: {
        instanceId: raw.instance_id,
        typeId: raw.type_id,
        name: raw.name,
        rarity: raw.rarity,
        level: raw.level,
      },
      newBalance: raw.new_balance,
      isNew: raw.is_new,
    },
    { status: 201 },
  );
}
