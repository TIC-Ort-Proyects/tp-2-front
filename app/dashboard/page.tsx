import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { profile, link } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

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

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const p = await getOrCreateProfile(session.user.id, session.user.name);
  const links = await db
    .select()
    .from(link)
    .where(eq(link.profileId, p.id))
    .orderBy(asc(link.position));

  return (
    <DashboardClient
      profile={p}
      links={links}
      userName={session.user.name}
    />
  );
}
