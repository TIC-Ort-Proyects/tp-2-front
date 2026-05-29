import { db } from "@/lib/db";
import { profile, link } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link2, ExternalLink } from "lucide-react";
import { FaviconImg } from "@/components/favicon-img";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await db.query.profile.findFirst({ where: eq(profile.slug, slug) });
  if (!p) return {};
  return {
    title: `${p.displayName} — LinkHub`,
    description: p.bio || `Links de ${p.displayName}`,
  };
}

export default async function PublicProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.query.profile.findFirst({ where: eq(profile.slug, slug) });
  if (!p) notFound();

  const links = await db
    .select()
    .from(link)
    .where(eq(link.profileId, p.id))
    .orderBy(asc(link.position));

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        {/* Avatar / header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-600 dark:from-zinc-200 dark:to-zinc-400">
            <span className="text-3xl font-bold text-white dark:text-zinc-900">
              {p.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {p.displayName}
          </h1>
          {p.bio && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{p.bio}</p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-3">
          {links.map((l) => {
            let hostname = "";
            try { hostname = new URL(l.url).hostname; } catch {}

            return (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                <FaviconImg hostname={hostname} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {l.title}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    {hostname}
                  </p>
                </div>
                <ExternalLink className="size-4 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0" />
              </a>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="py-12 text-center text-zinc-400">
            <Link2 className="mx-auto mb-2 size-6" />
            <p className="text-sm">Sin links todavía</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <div className="flex size-4 items-center justify-center rounded bg-zinc-900 dark:bg-white">
              <Link2 className="size-2.5 text-white dark:text-zinc-900" />
            </div>
            LinkHub
          </a>
        </div>
      </div>
    </div>
  );
}
