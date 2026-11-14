import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type PickupStatus = Database["public"]["Enums"]["pickup_status"];
export type OccurrenceType = Database["public"]["Enums"]["occurrence_type"];
export type OccurrenceStatus = Database["public"]["Enums"]["occurrence_status"];

export type BadgeTone = "info" | "success" | "warning" | "danger" | "neutral" | "navy";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  pendente: { label: "Pendente", tone: "neutral" },
  em_conferencia: { label: "Em conferência", tone: "warning" },
  conferido: { label: "Conferido", tone: "info" },
  coleta_agendada: { label: "Coleta agendada", tone: "navy" },
  em_transito: { label: "Em trânsito", tone: "info" },
  entregue: { label: "Entregue", tone: "success" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_META) as OrderStatus[];

/** Main happy-path flow, used for progress display. */
export const ORDER_FLOW: OrderStatus[] = [
  "pendente",
  "em_conferencia",
  "conferido",
  "coleta_agendada",
  "em_transito",
  "entregue",
];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pendente: ["em_conferencia", "cancelado"],
  em_conferencia: ["conferido", "pendente", "cancelado"],
  conferido: ["coleta_agendada", "em_transito", "em_conferencia", "cancelado"],
  coleta_agendada: ["em_transito", "conferido", "cancelado"],
  em_transito: ["entregue", "cancelado"],
  entregue: [],
  cancelado: ["pendente"],
};

export interface ConferenceItem {
  quantity: number;
  checked: boolean;
}

export function conferenceProgress(items: ConferenceItem[]) {
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  return {
    total,
    checked,
    percent: total === 0 ? 0 : Math.round((checked / total) * 100),
    complete: total > 0 && checked === total,
  };
}

/** Statuses an order may move to next. "conferido" requires every item checked. */
export function nextStatuses(from: OrderStatus, items: ConferenceItem[] = []): OrderStatus[] {
  const complete = conferenceProgress(items).complete;
  return TRANSITIONS[from].filter((to) => to !== "conferido" || from !== "em_conferencia" || complete);
}

export function canTransition(from: OrderStatus, to: OrderStatus, items: ConferenceItem[] = []) {
  return nextStatuses(from, items).includes(to);
}

export const OPEN_ORDER_STATUSES: OrderStatus[] = [
  "pendente",
  "em_conferencia",
  "conferido",
  "coleta_agendada",
  "em_transito",
];

function toDateOnly(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseDeadline(deadline: string) {
  const [y, m, d] = deadline.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Late = deadline passed and still open, or delivered after the deadline day. */
export function isLate(
  order: { status: OrderStatus; delivery_deadline: string | null; delivered_at: string | null },
  today: Date = new Date(),
) {
  if (!order.delivery_deadline || order.status === "cancelado") return false;
  const deadline = parseDeadline(order.delivery_deadline);
  if (order.status === "entregue") {
    return order.delivered_at ? toDateOnly(order.delivered_at) > deadline : false;
  }
  return toDateOnly(today) > deadline;
}

export const PICKUP_STATUS_META: Record<PickupStatus, { label: string; tone: BadgeTone }> = {
  agendada: { label: "Agendada", tone: "info" },
  realizada: { label: "Realizada", tone: "success" },
  cancelada: { label: "Cancelada", tone: "danger" },
};

export const OCCURRENCE_TYPE_LABEL: Record<OccurrenceType, string> = {
  atraso: "Atraso na entrega",
  avaria: "Produto avariado",
  extravio: "Extravio",
  endereco_incorreto: "Endereço incorreto",
  destinatario_ausente: "Destinatário ausente",
  divergencia: "Divergência na conferência",
  outro: "Outro",
};

export const OCCURRENCE_STATUS_META: Record<OccurrenceStatus, { label: string; tone: BadgeTone }> = {
  aberta: { label: "Aberta", tone: "danger" },
  em_analise: { label: "Em análise", tone: "warning" },
  resolvida: { label: "Resolvida", tone: "success" },
};

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
