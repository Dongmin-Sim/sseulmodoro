import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import type { SetMainCharacterResponse, ApiError } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const instanceId =
    body !== null && typeof body === "object" && "instanceId" in body
      ? (body as Record<string, unknown>).instanceId
      : undefined;

  if (typeof instanceId !== "number" || !Number.isInteger(instanceId)) {
    return NextResponse.json<ApiError>(
      { error: "instanceId is required" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.rpc("set_main_character", {
    p_instance_id: instanceId,
  });

  if (error) {
    if (error.message?.includes("instance_not_found")) {
      return NextResponse.json<ApiError>(
        { error: "Character not found" },
        { status: 404 },
      );
    }
    console.error("set_main_character rpc error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  const result = data as { instance_id: number };

  return NextResponse.json<SetMainCharacterResponse>(
    { instanceId: result.instance_id },
    { status: 200 },
  );
}
