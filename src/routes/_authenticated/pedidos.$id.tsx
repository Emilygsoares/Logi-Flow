import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  Loader2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OccurrenceStatusBadge, OrderStatusBadge } from "@/components/app/status-badge";
import { ConferenceChecklist } from "@/components/app/conference-checklist";
import { OrderFormDialog } from "@/components/app/forms/order-form-dialog";
import { PickupFormDialog } from "@/components/app/forms/pickup-form-dialog";
import { OccurrenceFormDialog } from "@/components/app/forms/occurrence-form-dialog";
import {
  addOrderItem,
  deleteOrder,
  invalidateAll,
  occurrencesQuery,
  orderQuery,
  pickupsQuery,
  removeOrderItem,
  setOrderStatus,
  updateOrder,
} from "@/lib/api/data";
import {
  formatBRL,
  isLate,
  nextStatuses,
  OCCURRENCE_TYPE_LABEL,
  ORDER_FLOW,
  ORDER_STATUS_META,
  type OrderStatus,
} from "@/lib/domain/orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do pedido — LogiFlow" },
      { name: "description", content: "Conferência, entrega e histórico do pedido." },
      { property: "og:title", content: "Detalhes do pedido — LogiFlow" },
      { property: "og:description", content: "Conferência, entrega e histórico do pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context: { queryClient }, params }) => {
    const data = await queryClient.ensureQueryData(orderQuery(params.id));
    if (!data) throw notFound();
  },
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-medium">Pedido não encontrado.</p>
      <Button asChild variant="link">
        <Link to="/pedidos">Voltar para pedidos</Link>
      </Button>
    </div>
  ),
  component: OrderDetail,
});

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  em_conferencia: "Iniciar conferência",
  pendente: "Voltar para pendente",
  conferido: "Marcar como conferido",
  em_transito: "Marcar como enviado",
  entregue: "Confirmar entrega",
  cancelado: "Cancelar pedido",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(orderQuery(id));
  const { data: occurrences = [] } = useQuery(occurrencesQuery());
  const { data: pickups = [] } = useQuery(pickupsQuery());
  const [busy, setBusy] = useState<string | null>(null);

  if (!data) return null;
  const { order, events } = data;
  const late = isLate(order);
  const actions = nextStatuses(order.status, order.order_items).filter(
    (s) => s !== "conferido" || order.status !== "em_conferencia",
  );
  const orderOcc = occurrences.filter((o) => o.order_id === order.id);
  const pickup = pickups.find((p) => p.id === order.pickup_id);
  const flowIndex = ORDER_FLOW.indexOf(order.status);

  async function changeStatus(to: OrderStatus) {
    setBusy(to);
    try {
      await setOrderStatus(order.id, to, to === "conferido" && order.status === "coleta_agendada" ? { pickup_id: null } : {});
      await invalidateAll(qc);
      toast.success(`Status atualizado para "${ORDER_STATUS_META[to].label}".`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    try {
      await deleteOrder(order.id);
      await invalidateAll(qc);
      toast.success("Pedido excluído.");
      navigate({ to: "/pedidos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Pedidos
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-navy tabular">Pedido {order.code}</h1>
            <OrderStatusBadge status={order.status} />
            {late && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3.5" /> Atrasado
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Criado em {formatDateTime(order.created_at)}
            {order.sales_channel && ` · via ${order.sales_channel}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((s) =>
            s === "coleta_agendada" ? (
              <PickupFormDialog
                key={s}
                preselected={[order.id]}
                trigger={
                  <Button variant="soft">
                    <CalendarClock /> Agendar coleta
                  </Button>
                }
              />
            ) : (
              <Button
                key={s}
                variant={s === "cancelado" ? "ghost" : s === "entregue" ? "success" : s === "pendente" ? "outline" : "default"}
                className={s === "cancelado" ? "text-destructive hover:bg-destructive-soft hover:text-destructive" : ""}
                disabled={busy !== null}
                onClick={() => changeStatus(s)}
              >
                {busy === s && <Loader2 className="animate-spin" />}
                {order.status === "coleta_agendada" && s === "conferido"
                  ? "Remover da coleta"
                  : order.status === "cancelado" && s === "pendente"
                    ? "Reabrir pedido"
                    : ACTION_LABEL[s]}
              </Button>
            ),
          )}
          <OrderFormDialog
            order={order}
            trigger={
              <Button variant="outline" size="icon" aria-label="Editar pedido">
                <Pencil />
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Excluir pedido">
                <Trash2 />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir pedido {order.code}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Os itens, o histórico e as ocorrências deste pedido também serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {order.status !== "cancelado" && (
        <Card>
          <CardContent className="overflow-x-auto py-5">
            <ol className="flex min-w-[560px] items-center">
              {ORDER_FLOW.map((s, i) => {
                const done = i < flowIndex || order.status === "entregue";
                const current = i === flowIndex && order.status !== "entregue";
                return (
                  <li key={s} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                          done && "border-success bg-success text-success-foreground",
                          current && "border-primary bg-primary-soft text-primary",
                          !done && !current && "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </div>
                      <span className={cn("whitespace-nowrap text-[11px]", current ? "font-semibold text-primary" : "text-muted-foreground")}>
                        {ORDER_STATUS_META[s].label}
                      </span>
                    </div>
                    {i < ORDER_FLOW.length - 1 && (
                      <div className={cn("mx-2 mb-5 h-0.5 flex-1", i < flowIndex || order.status === "entregue" ? "bg-success" : "bg-border")} />
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy">Itens e conferência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ConferenceChecklist order={order} />
              {(order.status === "pendente" || order.status === "em_conferencia") && <AddItemForm orderId={order.id} />}
              {(order.status === "pendente" || order.status === "em_conferencia") && order.order_items.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Remover itens</summary>
                  <ul className="mt-2 space-y-1">
                    {order.order_items.map((it) => (
                      <li key={it.id} className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50">
                        <span>{it.product_name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            await removeOrderItem(it.id);
                            await invalidateAll(qc);
                          }}
                        >
                          <Trash2 /> Remover
                        </Button>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy">Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Info icon={<MapPin />} label="Endereço">
                  {order.address || "—"}
                  <br />
                  {[order.city, order.state].filter(Boolean).join(" / ")} {order.zip_code && `· CEP ${order.zip_code}`}
                </Info>
                <Info icon={<Truck />} label="Transportadora">
                  {order.carrier || "Não definida"}
                </Info>
                <Info icon={<CalendarClock />} label="Prazo de entrega">
                  <span className={late ? "font-medium text-destructive" : ""}>
                    {order.delivery_deadline ? order.delivery_deadline.split("-").reverse().join("/") : "Sem prazo"}
                  </span>
                </Info>
                <Info icon={<CalendarClock />} label="Coleta">
                  {pickup ? `${pickup.carrier} · ${pickup.scheduled_date.split("-").reverse().join("/")}` : "Não agendada"}
                </Info>
              </div>
              <TrackingForm orderId={order.id} initial={order.tracking_code} />
              <div className="grid gap-2 border-t pt-4 text-sm sm:grid-cols-3">
                <Stat label="Valor do pedido" value={formatBRL(Number(order.total_value))} />
                <Stat label="Frete" value={formatBRL(Number(order.shipping_cost))} />
                <Stat label="Entregue em" value={order.delivered_at ? formatDateTime(order.delivered_at) : "—"} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <User className="size-4 text-muted-foreground" /> {order.customer_name}
              </p>
              {order.customer_phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4" /> {order.customer_phone}
                </p>
              )}
              {order.customer_email && <p className="text-muted-foreground">{order.customer_email}</p>}
              {order.notes && <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">{order.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base text-navy">Ocorrências</CardTitle>
              <OccurrenceFormDialog
                orderId={order.id}
                trigger={
                  <Button size="sm" variant="soft">
                    <Plus /> Registrar
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              {orderOcc.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ocorrência para este pedido.</p>
              ) : (
                <ul className="space-y-3">
                  {orderOcc.map((o) => (
                    <li key={o.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{OCCURRENCE_TYPE_LABEL[o.type]}</span>
                        <OccurrenceStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{o.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-navy">Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {[...events].reverse().map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[25px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <p className="text-sm font-medium">{ORDER_STATUS_META[ev.status].label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(ev.created_at)}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular">{value}</p>
    </div>
  );
}

function TrackingForm({ orderId, initial }: { orderId: string; initial: string }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateOrder(orderId, { tracking_code: value.trim() });
      await invalidateAll(qc);
      toast.success("Código de rastreio salvo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        aria-label="Código de rastreio"
        placeholder="Código de rastreio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" variant="outline" disabled={saving || value === initial}>
        {saving && <Loader2 className="animate-spin" />} Salvar
      </Button>
    </form>
  );
}

function AddItemForm({ orderId }: { orderId: string }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const f = new FormData(formEl);
    const product_name = String(f.get("product_name") ?? "").trim();
    if (!product_name) return;
    setSaving(true);
    try {
      await addOrderItem(orderId, {
        product_name,
        sku: String(f.get("sku") ?? "").trim(),
        quantity: Math.max(1, Number(f.get("quantity")) || 1),
      });
      await invalidateAll(qc);
      formEl.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao adicionar item.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-[1fr_6rem_4.5rem_auto] gap-2">
      <Input name="product_name" placeholder="Adicionar produto" aria-label="Produto" />
      <Input name="sku" placeholder="SKU" aria-label="SKU" />
      <Input name="quantity" type="number" min={1} defaultValue={1} aria-label="Quantidade" />
      <Button type="submit" variant="soft" size="icon" disabled={saving} aria-label="Adicionar item">
        {saving ? <Loader2 className="animate-spin" /> : <Plus />}
      </Button>
    </form>
  );
}
