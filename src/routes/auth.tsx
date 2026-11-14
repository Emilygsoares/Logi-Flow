import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/app/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { translateAuthError } from "@/lib/auth-errors";

type Mode = "login" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode } => ({
    mode: search["mode"] === "signup" ? "signup" : "login",
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — LogiFlow" },
      { name: "description", content: "Acesse o LogiFlow ou crie sua conta gratuita para organizar a logística da sua loja." },
      { property: "og:title", content: "Entrar ou criar conta — LogiFlow" },
      { property: "og:description", content: "Acesse o LogiFlow ou crie sua conta para organizar a logística da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "login" } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  useEffect(() => setError(null), [mode]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setError(null);

    if (mode === "signup") {
      const fullName = String(form.get("fullName") ?? "").trim();
      const storeName = String(form.get("storeName") ?? "").trim();
      if (!fullName || !storeName) return setError("Preencha seu nome e o nome da loja.");
      if (password.length < 6) return setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/auth",
          data: { full_name: fullName, store_name: storeName },
        },
      });
      setLoading(false);
      if (error) return setError(translateAuthError(error.message));
      if (data.session) {
        toast.success("Conta criada! Bem-vindo(a) ao LogiFlow.");
        navigate({ to: "/dashboard" });
      } else {
        setSentTo(email);
      }
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(translateAuthError(error.message));
    toast.success("Bem-vindo(a) de volta!");
    navigate({ to: "/dashboard" });
  }

  if (sentTo) {
    return (
      <AuthShell title="Confirme seu e-mail" subtitle="Falta só um passo para começar.">
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-success-soft text-success">
            <MailCheck className="size-5" />
          </div>
          <p className="text-sm text-foreground">
            Enviamos um link de confirmação para <strong>{sentTo}</strong>. Clique nele para ativar sua conta e
            depois faça login.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/auth" search={{ mode: "login" }} onClick={() => setSentTo(null)}>
              Ir para o login
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  const isSignup = mode === "signup";

  return (
    <AuthShell
      title={isSignup ? "Crie sua conta" : "Entrar no LogiFlow"}
      subtitle={isSignup ? "Comece a organizar suas entregas em minutos." : "Acesse o painel da sua loja."}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isSignup && (
          <>
            <Field id="fullName" label="Nome completo" autoComplete="name" placeholder="Maria Silva" />
            <Field id="storeName" label="Nome da loja" autoComplete="organization" placeholder="Ateliê Maria" />
          </>
        )}
        <Field id="email" label="E-mail" type="email" autoComplete="email" placeholder="voce@sualoja.com" />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            {!isSignup && (
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Esqueci minha senha
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "Mínimo de 6 caracteres" : "••••••••"}
            className="h-10"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {isSignup ? "Criar conta" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? "Já tem uma conta? " : "Ainda não tem conta? "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "login" : "signup" }}
          className="font-medium text-primary hover:underline"
        >
          {isSignup ? "Entrar" : "Começar agora"}
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-10"
      />
    </div>
  );
}
