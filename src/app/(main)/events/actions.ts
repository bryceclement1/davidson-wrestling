"use server";

import { revalidatePath } from "next/cache";
import { createEvent } from "@/lib/db/events";
import type { EventType } from "@/types/event";

export async function createEventAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const rawType = (formData.get("eventType") ?? "dual") as EventType;
  const allowedTypes: EventType[] = ["dual", "tournament"];
  const eventType = allowedTypes.includes(rawType) ? rawType : "dual";
  const opponentSchool = String(formData.get("opponentSchool") ?? "").trim();

  if (!name || !date) {
    throw new Error("Name and date are required");
  }

  await createEvent({
    name,
    date,
    eventType,
    opponentSchool: eventType === "dual" ? opponentSchool || undefined : undefined,
  });

  revalidatePath("/events");
}
