"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addLink, updateProfile, deleteLink, updateLink } from "@/app/actions/links";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import {
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  GripVertical,
  Pencil,
  LogOut,
} from "lucide-react";

type Profile = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
};

type Link = {
  id: string;
  title: string;
  url: string;
  position: number;
};

export function DashboardClient({
  profile,
  links,
  userName,
}: {
  profile: Profile;
  links: Link[];
  userName: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const addFormRef = useRef<HTMLFormElement>(null);

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddLink = (formData: FormData) => {
    startTransition(async () => {
      await addLink(formData);
      addFormRef.current?.reset();
      router.refresh();
    });
  };

  const handleDeleteLink = (id: string) => {
    startTransition(async () => {
      await deleteLink(id);
      router.refresh();
    });
  };

  const handleUpdateLink = (id: string, formData: FormData) => {
    startTransition(async () => {
      await updateLink(id, formData);
      setEditingLink(null);
      router.refresh();
    });
  };

  const handleUpdateProfile = (formData: FormData) => {
    startTransition(async () => {
      await updateProfile(formData);
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80 dark:border-zinc-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-white">
              <Link2 className="size-4 text-white dark:text-zinc-900" />
            </div>
            <span className="font-semibold tracking-tight">LinkHub</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await authClient.signOut();
                router.push("/");
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6">
        {/* Share link */}
        <Card className="border-0 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white dark:from-zinc-800 dark:to-zinc-700">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex-1 truncate rounded-lg bg-white/10 px-3 py-2 text-sm font-mono">
              {publicUrl}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="shrink-0 bg-white/20 text-white hover:bg-white/30 border-0"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              asChild
              className="shrink-0 bg-white/20 text-white hover:bg-white/30 border-0"
            >
              <a href={`/${profile.slug}`} target="_blank">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Profile settings */}
        <Card className="border-0 shadow-sm dark:bg-zinc-900">
          <CardContent className="pt-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Perfil
            </h2>
            <form action={handleUpdateProfile} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input id="displayName" name="displayName" defaultValue={profile.displayName} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slug">URL slug</Label>
                  <Input id="slug" name="slug" defaultValue={profile.slug} required pattern="[a-z0-9-]+" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" rows={2} defaultValue={profile.bio ?? ""} placeholder="Contá algo sobre vos..." />
              </div>
              <Button type="submit" size="sm" className="self-end" disabled={isPending}>
                Guardar
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add link */}
        <Card className="border-0 shadow-sm dark:bg-zinc-900">
          <CardContent className="pt-5">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Agregar link
            </h2>
            <form ref={addFormRef} action={handleAddLink} className="flex gap-2">
              <Input name="title" required placeholder="Título" className="flex-1" />
              <Input name="url" required placeholder="https://..." type="url" className="flex-1" />
              <Button type="submit" size="icon" disabled={isPending}>
                <Plus className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links list */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-1">
            Mis links ({links.length})
          </h2>
          {links.length === 0 ? (
            <Card className="border-0 shadow-sm dark:bg-zinc-900">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Link2 className="mx-auto mb-3 size-8 opacity-30" />
                <p>Todavía no agregaste ningún link</p>
              </CardContent>
            </Card>
          ) : (
            links.map((l) => (
              <Card key={l.id} className="border-0 shadow-sm dark:bg-zinc-900 transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-3 py-3">
                  <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(l.url).hostname}&sz=32`}
                    alt=""
                    className="size-5 rounded shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {editingLink === l.id ? (
                    <form
                      action={(fd) => handleUpdateLink(l.id, fd)}
                      className="flex flex-1 items-center gap-2"
                    >
                      <Input name="title" defaultValue={l.title} className="h-7 text-sm" required />
                      <Input name="url" defaultValue={l.url} type="url" className="h-7 text-sm" required />
                      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                        OK
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingLink(null)}>
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="size-7 shrink-0" onClick={() => setEditingLink(l.id)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteLink(l.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
