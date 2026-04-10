import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { GachaResponse, ApiError } from "@/lib/types/api";

export async function POST() {
  if (!(await getAuthUser())) {
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

  const result = data as {
    instance_id: number;
    type_id: number;
    name: string;
    rarity: string;
    level: number;
    new_balance: number;
    is_new: boolean;
  };

  return NextResponse.json<GachaResponse>(
    {
      characterInstance: {
        instanceId: result.instance_id,
        typeId: result.type_id,
        name: result.name,
        rarity: result.rarity,
        level: result.level,
      },
      newBalance: result.new_balance,
      isNew: result.is_new,
    },
    { status: 201 },
  );
}
