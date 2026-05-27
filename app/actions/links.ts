"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profile, link } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("No autenticado");
  return session.user;
}

async function getOrCreateProfile(userId: string, name: string) {
  const existing = await db.query.profile.findFirst({
    where: eq(profile.userId, userId),
  });
  if (existing) return existing;

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);

  const [created] = await db
    .insert(profile)
    .values({ userId, slug, displayName: name })
    .returning();
  return created;
}

export async function getProfileWithLinks() {
  const user = await getUser();
  const p = await getOrCreateProfile(user.id, user.name);
  const links = await db
    .select()
    .from(link)
    .where(eq(link.profileId, p.id))
    .orderBy(asc(link.position));
  return { profile: p, links };
}

export async function updateProfile(formData: FormData) {
  const user = await getUser();
  const slug = (formData.get("slug") as string).toLowerCase().replace(/[^a-z0-9-]/g, "");
  const displayName = formData.get("displayName") as string;
  const bio = (formData.get("bio") as string) || null;

  await db
    .update(profile)
    .set({ slug, displayName, bio })
    .where(eq(profile.userId, user.id));

  revalidatePath("/dashboard");
}

export async function addLink(formData: FormData) {
  const user = await getUser();
  const p = await getOrCreateProfile(user.id, user.name);

  const maxPos = await db
    .select({ position: link.position })
    .from(link)
    .where(eq(link.profileId, p.id))
    .orderBy(asc(link.position));

  const nextPos = maxPos.length > 0 ? maxPos[maxPos.length - 1].position + 1 : 0;

  await db.insert(link).values({
    profileId: p.id,
    title: formData.get("title") as string,
    url: formData.get("url") as string,
    position: nextPos,
  });

  revalidatePath("/dashboard");
}

export async function updateLink(id: string, formData: FormData) {
  const user = await getUser();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  if (!p) throw new Error("No profile");

  await db
    .update(link)
    .set({
      title: formData.get("title") as string,
      url: formData.get("url") as string,
    })
    .where(and(eq(link.id, id), eq(link.profileId, p.id)));

  revalidatePath("/dashboard");
}

export async function deleteLink(id: string) {
  const user = await getUser();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  if (!p) throw new Error("No profile");

  await db.delete(link).where(and(eq(link.id, id), eq(link.profileId, p.id)));
  revalidatePath("/dashboard");
}

export async function reorderLinks(orderedIds: string[]) {
  const user = await getUser();
  const p = await db.query.profile.findFirst({ where: eq(profile.userId, user.id) });
  if (!p) throw new Error("No profile");

  await Promise.all(
    orderedIds.map((id, i) =>
      db
        .update(link)
        .set({ position: i })
        .where(and(eq(link.id, id), eq(link.profileId, p.id)))
    )
  );

  revalidatePath("/dashboard");
}
