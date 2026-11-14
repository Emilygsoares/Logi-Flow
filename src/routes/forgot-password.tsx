import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — LogiFlow" },
      { name: "description", content: "Receba um link por e-mail para redefinir sua senha do LogiFlow." },
      { property: "og:title", content: "Recuperar senha — LogiFlow" },
      { property: "og:description", content: "Receba um link por e-mail para redefinir sua senha do LogiFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(translateAuthError(error.message));
    setSent(true);
  }

  return (
    <AuthShell title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha.">
      {sent ? (
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-success-soft text-success">
            <MailCheck className="size-5" />
          </div>
          <p className="text-sm">Se o e-mail estiver cadastrado, você receberá o link em instantes.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" className="h-10" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Enviar link
          </Button>
        </form>
      )}
      <Link
        to="/auth"
        search={{ mode: "login" }}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Voltar para o login
      </Link>
    </AuthShell>
  );
}
