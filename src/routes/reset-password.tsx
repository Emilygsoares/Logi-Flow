import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — LogiFlow" },
      { name: "description", content: "Defina uma nova senha para sua conta LogiFlow." },
      { property: "og:title", content: "Nova senha — LogiFlow" },
      { property: "og:description", content: "Defina uma nova senha para sua conta LogiFlow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session || isRecovery) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    setError(null);
    if (password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirm) return setError("As senhas não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(translateAuthError(error.message));
    toast.success("Senha atualizada com sucesso.");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="Criar nova senha" subtitle="Escolha uma senha segura para sua conta.">
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Abra esta página pelo link enviado ao seu e-mail. Se o link expirou, solicite um novo.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" className="h-10" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
