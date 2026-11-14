import { Badge } from "@/components/ui/badge";
import {
  OCCURRENCE_STATUS_META,
  ORDER_STATUS_META,
  PICKUP_STATUS_META,
  type OccurrenceStatus,
  type OrderStatus,
  type PickupStatus,
} from "@/lib/domain/orders";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_STATUS_META[status];
  return <Badge variant={m.tone}>{m.label}</Badge>;
}

export function PickupStatusBadge({ status }: { status: PickupStatus }) {
  const m = PICKUP_STATUS_META[status];
  return <Badge variant={m.tone}>{m.label}</Badge>;
}

export function OccurrenceStatusBadge({ status }: { status: OccurrenceStatus }) {
  const m = OCCURRENCE_STATUS_META[status];
  return <Badge variant={m.tone}>{m.label}</Badge>;
}
