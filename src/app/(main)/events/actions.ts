"use server";

import { revalidatePath } from "next/cache";
import { createEvent, updateEvent, deleteEvent } from "@/lib/db/events";
import type { EventType } from "@/types/event";
import { assertRole, getAuthenticatedUser } from "@/lib/auth/roles";

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

async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }
}

export async function updateEventAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Invalid event id");
  }

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const rawType = (formData.get("eventType") ?? "dual") as EventType;
  const allowedTypes: EventType[] = ["dual", "tournament"];
  const eventType = allowedTypes.includes(rawType) ? rawType : "dual";
  const opponentSchool = String(formData.get("opponentSchool") ?? "").trim();

  if (!name || !date) {
    throw new Error("Name and date are required");
  }

  await updateEvent(id, {
    name,
    date,
    eventType,
    opponentSchool: eventType === "dual" ? opponentSchool : null,
  });

  revalidatePath("/events");
}

export async function deleteEventAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!id) {
    throw new Error("Invalid event id");
  }

  await deleteEvent(id);
  revalidatePath("/events");
}
