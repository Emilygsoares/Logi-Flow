import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { OrderStatusBadge } from "@/components/app/status-badge";
import { NativeSelect } from "@/components/app/native-select";
import { OrderFormDialog } from "@/components/app/forms/order-form-dialog";
import { ordersQuery } from "@/lib/api/data";
import { formatBRL, isLate, ORDER_STATUS_META, ORDER_STATUSES, type OrderStatus } from "@/lib/domain/orders";

export const Route = createFileRoute("/_authenticated/pedidos/")({
  head: () => ({
    meta: [
      { title: "Pedidos — LogiFlow" },
      { name: "description", content: "Cadastre e acompanhe todos os pedidos da sua loja." },
      { property: "og:title", content: "Pedidos — LogiFlow" },
      { property: "og:description", content: "Cadastre e acompanhe todos os pedidos da sua loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(ordersQuery()),
  component: OrdersPage,
});

function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function OrdersPage() {
  const { data: orders } = useSuspenseQuery(ordersQuery());
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "todos">("todos");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (status === "todos" || o.status === status) &&
        (!term ||
          [o.code, o.customer_name, o.city, o.tracking_code, o.customer_phone].some((v) =>
            v.toLowerCase().includes(term),
          )),
    );
  }, [orders, q, status]);

  const newOrderButton = (
    <OrderFormDialog
      trigger={
        <Button>
          <Plus /> Novo pedido
        </Button>
      }
      onCreated={(id) => navigate({ to: "/pedidos/$id", params: { id } })}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Pedidos" description={`${orders.length} pedido(s) cadastrado(s)`} actions={newOrderButton} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, cliente, cidade ou rastreio"
            className="bg-card pl-9"
          />
        </div>
        <NativeSelect
          aria-label="Filtrar por status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "todos")}
          className="bg-card sm:w-52"
        >
          <option value="todos">Todos os status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={orders.length === 0 ? "Nenhum pedido cadastrado" : "Nenhum pedido encontrado"}
            description={
              orders.length === 0
                ? "Cadastre seu primeiro pedido para começar."
                : "Ajuste a busca ou o filtro de status."
            }
            action={orders.length === 0 ? newOrderButton : undefined}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-6">Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => navigate({ to: "/pedidos/$id", params: { id: o.id } })}
                    >
                      <TableCell className="pl-6 font-semibold text-navy tabular">
                        <Link to="/pedidos/$id" params={{ id: o.id }} onClick={(e) => e.stopPropagation()}>
                          {o.code}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{o.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{o.sales_channel || "—"}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[o.city, o.state].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell className={isLate(o) ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {formatDate(o.delivery_deadline)}
                      </TableCell>
                      <TableCell className="text-right tabular">{formatBRL(Number(o.total_value))}</TableCell>
                      <TableCell className="pr-6">
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ul className="divide-y md:hidden">
              {filtered.map((o) => (
                <li key={o.id}>
                  <Link to="/pedidos/$id" params={{ id: o.id }} className="block px-4 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-navy tabular">{o.code}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 text-sm font-medium">{o.customer_name}</p>
                    <p className="mt-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>{[o.city, o.state].filter(Boolean).join(" / ") || "—"}</span>
                      <span className={isLate(o) ? "text-destructive" : ""}>
                        Prazo {formatDate(o.delivery_deadline)}
                      </span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
