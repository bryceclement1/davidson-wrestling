"use server";

import { revalidatePath } from "next/cache";
import { assertRole, getAuthenticatedUser } from "@/lib/auth/roles";
import { createWrestler, updateWrestler, deleteWrestler } from "@/lib/db/wrestlers";

export async function addWrestlerAction(formData: FormData) {
  const user = await getAuthenticatedUser();

  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }

  const name = String(formData.get("name") ?? "").trim();
  const classYear = String(formData.get("classYear") ?? "").trim();
  const primaryWeightClass = String(formData.get("primaryWeightClass") ?? "").trim();

  if (!name) {
    throw new Error("Name is required");
  }

  await createWrestler({
    name,
    classYear: classYear || undefined,
    primaryWeightClass: primaryWeightClass || undefined,
  });

  revalidatePath("/wrestlers");
}

export async function updateWrestlerAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Invalid wrestler id");

  const name = String(formData.get("name") ?? "").trim();
  const classYear = String(formData.get("classYear") ?? "").trim();
  const primaryWeightClass = String(formData.get("primaryWeightClass") ?? "").trim();

  if (!name) throw new Error("Name is required");

  await updateWrestler(id, {
    name,
    classYear: classYear || null,
    primaryWeightClass: primaryWeightClass || null,
  });

  revalidatePath("/wrestlers");
}

export async function deleteWrestlerAction(formData: FormData) {
  const user = await getAuthenticatedUser();
  if (!assertRole(user, "admin")) {
    throw new Error("Unauthorized");
  }

  const id = Number(formData.get("id"));
  if (!id) throw new Error("Invalid wrestler id");

  await deleteWrestler(id);
  revalidatePath("/wrestlers");
}
