"use server";

import type { MatchLogPayload } from "@/types/match";
import { persistMatchLog } from "@/lib/db/matches";

export async function createMatchLog(payload: MatchLogPayload) {
  await persistMatchLog(payload);
  return { success: true };
}
