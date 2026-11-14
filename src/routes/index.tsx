import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/app/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LogiFlow — Gestão logística simples para pequenos lojistas" },
      {
        name: "description",
        content:
          "Saia das planilhas e do WhatsApp: organize pedidos, conferência, coletas, entregas e ocorrências da sua loja em um só painel.",
      },
      { property: "og:title", content: "LogiFlow — Gestão logística simples para pequenos lojistas" },
      {
        property: "og:description",
        content: "Pedidos, conferência, coletas, entregas e ocorrências da sua loja em um só painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const benefits = [
  { icon: Package, title: "Pedidos centralizados", text: "Cadastre pedidos de Instagram, WhatsApp e loja virtual em um só lugar." },
  { icon: ClipboardCheck, title: "Conferência sem erro", text: "Confira item por item antes de despachar e evite trocas e reclamações." },
  { icon: CalendarClock, title: "Coletas agendadas", text: "Agende coletas com transportadoras ou entregadores e vincule os pedidos." },
  { icon: Truck, title: "Entregas acompanhadas", text: "Veja o que está em trânsito, o que foi entregue e o que está atrasado." },
  { icon: AlertTriangle, title: "Ocorrências registradas", text: "Registre avarias, extravios e atrasos e acompanhe até a resolução." },
  { icon: BarChart3, title: "Indicadores claros", text: "Taxa de entrega no prazo, volume diário e gargalos da sua operação." },
];

const steps = [
  { n: "1", title: "Cadastre o pedido", text: "Cliente, endereço, itens e prazo de entrega." },
  { n: "2", title: "Confira e agende", text: "Marque os itens conferidos e agende a coleta." },
  { n: "3", title: "Acompanhe a entrega", text: "Atualize o status e registre ocorrências." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth" search={{ mode: "login" }}>
                Entrar
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Começar agora
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <Badge variant="info" className="mb-5">
              Para MEIs, microempresas e lojas virtuais
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-navy md:text-5xl">
              Suas entregas organizadas, do pedido à porta do cliente.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Troque planilhas e mensagens soltas por um painel simples para controlar pedidos, conferência,
              coletas, entregas e ocorrências.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Começar agora <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth" search={{ mode: "login" }}>
                  Já tenho conta
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Configuração em minutos", "Sem instalar nada", "Funciona no celular"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <PreviewCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-navy">Tudo o que a sua expedição precisa</h2>
          <p className="mt-3 text-muted-foreground">
            Ferramentas pensadas para quem vende produtos físicos e cuida da logística no dia a dia.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border bg-card p-6 shadow-card">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <b.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-navy">{b.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-semibold tracking-tight text-navy">Como funciona</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-navy-foreground">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-navy px-8 py-14 text-navy-foreground md:px-14">
          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight">Pronto para organizar sua logística?</h2>
            <p className="mt-3 text-sidebar-foreground">
              Crie sua conta, cadastre sua loja e comece a acompanhar seus pedidos hoje mesmo.
            </p>
            <Button asChild size="lg" variant="hero" className="mt-8">
              <Link to="/auth" search={{ mode: "signup" }}>
                Começar agora <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/30 blur-3xl" />
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} LogiFlow. Gestão logística para pequenos negócios.</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard() {
  const rows = [
    { code: "#0128", name: "Ana Costa", status: "Em trânsito", tone: "info" as const },
    { code: "#0127", name: "Bruno Lima", status: "Conferido", tone: "info" as const },
    { code: "#0126", name: "Carla Dias", status: "Entregue", tone: "success" as const },
    { code: "#0125", name: "Diego Rocha", status: "Atrasado", tone: "danger" as const },
  ];
  const bars = [40, 62, 48, 75, 58, 88, 70];
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-elevated" aria-hidden="true">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Pedidos hoje", v: "24" },
          { l: "Em trânsito", v: "11" },
          { l: "No prazo", v: "96%" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg bg-background p-3">
            <p className="text-[11px] text-muted-foreground">{k.l}</p>
            <p className="mt-1 text-xl font-semibold text-navy tabular">{k.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-background p-4">
        <p className="text-xs font-medium text-muted-foreground">Pedidos na semana</p>
        <div className="mt-3 flex h-24 items-end gap-2">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-primary/80" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y rounded-lg border">
        {rows.map((r) => (
          <div key={r.code} className="flex items-center justify-between px-3 py-2.5 text-sm">
            <span className="font-medium text-navy tabular">{r.code}</span>
            <span className="flex-1 px-3 text-muted-foreground">{r.name}</span>
            <Badge variant={r.tone}>{r.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
