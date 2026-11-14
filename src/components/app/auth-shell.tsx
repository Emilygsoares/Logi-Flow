import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "./logo";

const points = [
  "Pedidos, conferência e coletas em um só lugar",
  "Acompanhe entregas e identifique atrasos",
  "Registre ocorrências e resolva mais rápido",
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-navy-foreground lg:flex">
        <Link to="/">
          <Logo inverted />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            A operação da sua loja, organizada do pedido à entrega.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sidebar-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-sidebar-foreground/70">© {new Date().getFullYear()} LogiFlow</p>
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-[28rem] rounded-full bg-primary/25 blur-3xl" />
      </aside>
      <main className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
