import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/app/kpi-card";
import { EmptyState } from "@/components/app/page-header";
import { OccurrenceStatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { OrderFormDialog } from "@/components/app/forms/order-form-dialog";
import { occurrencesQuery, ordersQuery, pickupsQuery, profileQuery } from "@/lib/api/data";
import { computeDashboard } from "@/lib/domain/metrics";
import {
  formatBRL,
  isLate,
  OCCURRENCE_TYPE_LABEL,
  ORDER_FLOW,
  ORDER_STATUS_META,
  OPEN_ORDER_STATUSES,
} from "@/lib/domain/orders";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LogiFlow" },
      { name: "description", content: "Visão geral dos pedidos, coletas, entregas e ocorrências da sua loja." },
      { property: "og:title", content: "Dashboard — LogiFlow" },
      { property: "og:description", content: "Visão geral da operação logística da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(ordersQuery()),
      queryClient.ensureQueryData(pickupsQuery()),
      queryClient.ensureQueryData(occurrencesQuery()),
      queryClient.ensureQueryData(profileQuery()),
    ]),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Dashboard() {
  const { data: orders } = useSuspenseQuery(ordersQuery());
  const { data: pickups } = useSuspenseQuery(pickupsQuery());
  const { data: occurrences } = useSuspenseQuery(occurrencesQuery());
  const { data: profile } = useSuspenseQuery(profileQuery());

  const m = useMemo(() => computeDashboard(orders, occurrences), [orders, occurrences]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingPickups = pickups
    .filter((p) => p.status === "agendada" && p.scheduled_date >= todayStr)
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .slice(0, 4);
  const lateOrders = orders.filter((o) => OPEN_ORDER_STATUSES.includes(o.status) && isLate(o));
  const recent = orders.slice(0, 6);
  const openOcc = occurrences.filter((o) => o.status !== "resolvida").slice(0, 4);
  const firstName = profile.fullName.split(" ")[0];
  const statusMax = Math.max(1, ...ORDER_FLOW.map((s) => m.byStatus.get(s) ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{profile.companyName}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/conferencia">
              <ClipboardCheck /> Conferir pedidos
            </Link>
          </Button>
          <OrderFormDialog
            trigger={
              <Button>
                <Plus /> Novo pedido
              </Button>
            }
          />
        </div>
      </div>

      {lateOrders.length > 0 && (
        <Link
          to="/entregas"
          className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive-soft px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive-soft/70"
        >
          <AlertTriangle className="size-5 shrink-0" />
          <span className="flex-1">
            <strong>{lateOrders.length}</strong> pedido(s) com prazo de entrega vencido precisam de atenção.
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Pedidos hoje" value={m.ordersToday} hint={`${m.totalOrders} no total`} icon={Package} />
        <KpiCard
          label="Aguardando conferência"
          value={m.awaitingConference}
          hint={`${m.readyToShip} prontos para envio`}
          icon={ClipboardCheck}
          tone="warning"
        />
        <KpiCard
          label="Em trânsito"
          value={m.inTransit}
          hint={m.avgDeliveryDays != null ? `Média de ${m.avgDeliveryDays} dia(s) até a entrega` : "Sem entregas concluídas"}
          icon={Truck}
          tone="navy"
        />
        <KpiCard
          label="Entregas no prazo"
          value={m.onTimeRate != null ? `${m.onTimeRate}%` : "—"}
          hint={`${m.delivered} entregue(s) · ${m.late} atrasado(s)`}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base text-navy">Movimento dos últimos 14 dias</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pedidos criados × entregas concluídas</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" /> Pedidos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" /> Entregas
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-64 pl-0 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={m.series} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} width={36} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="pedidos" name="Pedidos" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gPed)" />
                <Area type="monotone" dataKey="entregues" name="Entregas" stroke="var(--color-success)" strokeWidth={2} fill="url(#gEnt)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-navy">Pedidos por etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {ORDER_FLOW.map((s) => {
              const v = m.byStatus.get(s) ?? 0;
              return (
                <div key={s}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-foreground">{ORDER_STATUS_META[s].label}</span>
                    <span className="font-medium text-navy tabular">{v}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={s === "entregue" ? "h-full rounded-full bg-success" : "h-full rounded-full bg-primary"}
                      style={{ width: `${(v / statusMax) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Faturamento registrado</span>
              <span className="font-semibold text-navy tabular">{formatBRL(m.revenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base text-navy">Pedidos recentes</CardTitle>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link to="/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {recent.length === 0 ? (
              <EmptyState
                icon={<Package />}
                title="Nenhum pedido ainda"
                description="Cadastre seu primeiro pedido para começar a acompanhar a operação."
                action={<OrderFormDialog trigger={<Button><Plus /> Novo pedido</Button>} />}
              />
            ) : (
              <ul className="divide-y">
                {recent.map((o) => (
                  <li key={o.id}>
                    <Link
                      to="/pedidos/$id"
                      params={{ id: o.id }}
                      className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-14 text-sm font-semibold text-navy tabular">{o.code}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{o.customer_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[o.city, o.state].filter(Boolean).join(" / ") || "Sem endereço"} ·{" "}
                          {o.order_items.length} item(ns)
                        </p>
                      </div>
                      <span className="hidden text-sm tabular text-muted-foreground sm:block">
                        {formatBRL(Number(o.total_value))}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base text-navy">Próximas coletas</CardTitle>
              <Button asChild variant="link" size="sm" className="px-0">
                <Link to="/coletas">Agenda</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingPickups.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Nenhuma coleta agendada.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingPickups.map((p) => {
                    const count = orders.filter((o) => o.pickup_id === p.id).length;
                    const [y, mo, d] = p.scheduled_date.split("-");
                    return (
                      <li key={p.id} className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <span className="text-sm font-semibold leading-none">{d}</span>
                          <span className="text-[10px] uppercase">{mo}/{(y ?? "").slice(2)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.carrier}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {p.time_window || "Horário a definir"} · {count} pedido(s)
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base text-navy">
                Ocorrências abertas <span className="ml-1 text-muted-foreground tabular">{m.openOccurrences}</span>
              </CardTitle>
              <Button asChild variant="link" size="sm" className="px-0">
                <Link to="/ocorrencias">Ver</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {openOcc.length === 0 ? (
                <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-success" /> Tudo em ordem por aqui.
                </p>
              ) : (
                <ul className="space-y-3">
                  {openOcc.map((o) => (
                    <li key={o.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{OCCURRENCE_TYPE_LABEL[o.type]}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.orders ? `${o.orders.code} · ${o.orders.customer_name}` : "Sem pedido vinculado"}
                        </p>
                      </div>
                      <OccurrenceStatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/conferencia" icon={ClipboardCheck} title="Conferência" text={`${m.awaitingConference} pedido(s) na fila`} />
        <QuickLink to="/coletas" icon={CalendarClock} title="Coletas" text={`${upcomingPickups.length} agendada(s)`} />
        <QuickLink to="/entregas" icon={Truck} title="Entregas" text={`${m.inTransit} em trânsito`} />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: "/conferencia" | "/coletas" | "/entregas";
  icon: typeof Truck;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
