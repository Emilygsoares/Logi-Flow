import { isLate, OPEN_ORDER_STATUSES, type OrderStatus } from "./orders";

export interface MetricOrder {
  status: OrderStatus;
  created_at: string;
  delivery_deadline: string | null;
  delivered_at: string | null;
  shipped_at: string | null;
  total_value: number;
}

export interface MetricOccurrence {
  status: "aberta" | "em_analise" | "resolvida";
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function computeDashboard(
  orders: MetricOrder[],
  occurrences: MetricOccurrence[],
  today: Date = new Date(),
  days = 14,
) {
  const todayKey = dayKey(today);
  const delivered = orders.filter((o) => o.status === "entregue");
  const deliveredOnTime = delivered.filter((o) => !isLate(o, today));
  const withDeadline = delivered.filter((o) => o.delivery_deadline);
  const onTimeRate =
    withDeadline.length === 0
      ? null
      : Math.round((withDeadline.filter((o) => !isLate(o, today)).length / withDeadline.length) * 100);

  const transitDurations = delivered
    .filter((o) => o.shipped_at && o.delivered_at)
    .map((o) => (new Date(o.delivered_at!).getTime() - new Date(o.shipped_at!).getTime()) / 86_400_000);
  const avgDeliveryDays =
    transitDurations.length === 0
      ? null
      : Math.round((transitDurations.reduce((a, b) => a + b, 0) / transitDurations.length) * 10) / 10;

  const series: { date: string; label: string; pedidos: number; entregues: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    series.push({
      date: dayKey(d),
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      pedidos: 0,
      entregues: 0,
    });
  }
  const index = new Map(series.map((s, i) => [s.date, i]));
  for (const o of orders) {
    const i = index.get(dayKey(new Date(o.created_at)));
    if (i !== undefined) series[i].pedidos++;
    if (o.delivered_at) {
      const j = index.get(dayKey(new Date(o.delivered_at)));
      if (j !== undefined) series[j].entregues++;
    }
  }

  const byStatus = new Map<OrderStatus, number>();
  for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

  return {
    totalOrders: orders.length,
    ordersToday: orders.filter((o) => dayKey(new Date(o.created_at)) === todayKey).length,
    awaitingConference: orders.filter((o) => o.status === "pendente" || o.status === "em_conferencia").length,
    readyToShip: orders.filter((o) => o.status === "conferido" || o.status === "coleta_agendada").length,
    inTransit: orders.filter((o) => o.status === "em_transito").length,
    delivered: delivered.length,
    deliveredOnTime: deliveredOnTime.length,
    late: orders.filter((o) => OPEN_ORDER_STATUSES.includes(o.status) && isLate(o, today)).length,
    openOccurrences: occurrences.filter((o) => o.status !== "resolvida").length,
    onTimeRate,
    avgDeliveryDays,
    revenue: orders.filter((o) => o.status !== "cancelado").reduce((a, o) => a + Number(o.total_value), 0),
    series,
    byStatus,
  };
}
