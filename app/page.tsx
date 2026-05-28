"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Link2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const name = form.get("name") as string;

    if (isSignUp) {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });
      if (error) {
        setError(error.message ?? "Error al registrarse");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });
      if (error) {
        setError(error.message ?? "Email o contraseña incorrectos");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-sm border-0 shadow-xl dark:bg-zinc-900">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white">
            <Link2 className="size-6 text-white dark:text-zinc-900" />
          </div>
          <CardTitle className="text-2xl tracking-tight">LinkHub</CardTitle>
          <CardDescription>
            {isSignUp ? "Creá tu cuenta" : "Todos tus links en un solo lugar"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" required placeholder="Tu nombre" />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" disabled={loading || sessionLoading} className="mt-1 w-full">
              {loading ? "Cargando..." : isSignUp ? "Crear cuenta" : "Entrar"}
            </Button>

            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "¿Ya tenés cuenta? Iniciá sesión" : "¿No tenés cuenta? Registrate"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
