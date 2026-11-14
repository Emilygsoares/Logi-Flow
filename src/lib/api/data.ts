import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { OccurrenceStatus, OccurrenceType, OrderStatus, PickupStatus } from "@/lib/domain/orders";

type Tables = Database["public"]["Tables"];
export type OrderItem = Tables["order_items"]["Row"];
export type Order = Tables["orders"]["Row"] & { order_items: OrderItem[] };
export type Pickup = Tables["pickups"]["Row"];
export type Occurrence = Tables["occurrences"]["Row"] & {
  orders: { id: string; code: string; customer_name: string } | null;
};
export type OrderEvent = Tables["order_events"]["Row"];

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const row = unwrap(
        await supabase
          .from("profiles")
          .select("full_name, company_id, companies(name)")
          .eq("id", auth.user?.id ?? "")
          .maybeSingle(),
      );
      return {
        fullName: row?.full_name ?? "",
        companyName: (row?.companies as { name: string } | null)?.name ?? "",
        companyId: row?.company_id ?? "",
        email: auth.user?.email ?? "",
      };
    },
  });

export const ordersQuery = () =>
  queryOptions({
    queryKey: ["orders"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false }),
      ) as Order[],
  });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["orders", id],
    queryFn: async () => {
      const order = unwrap(
        await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle(),
      ) as Order | null;
      if (!order) return null;
      order.order_items.sort((a, b) => a.created_at.localeCompare(b.created_at));
      const events = unwrap(
        await supabase.from("order_events").select("*").eq("order_id", id).order("created_at"),
      ) as OrderEvent[];
      return { order, events };
    },
  });

export const pickupsQuery = () =>
  queryOptions({
    queryKey: ["pickups"],
    queryFn: async () =>
      unwrap(
        await supabase.from("pickups").select("*").order("scheduled_date", { ascending: false }),
      ) as Pickup[],
  });

export const occurrencesQuery = () =>
  queryOptions({
    queryKey: ["occurrences"],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("occurrences")
          .select("*, orders(id, code, customer_name)")
          .order("created_at", { ascending: false }),
      ) as Occurrence[],
  });

export function invalidateAll(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["orders"] }),
    qc.invalidateQueries({ queryKey: ["pickups"] }),
    qc.invalidateQueries({ queryKey: ["occurrences"] }),
  ]);
}

// ---------- Mutations ----------

export interface NewOrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  sales_channel: string;
  total_value: number;
  shipping_cost: number;
  carrier: string;
  delivery_deadline: string | null;
  notes: string;
  items: { product_name: string; sku: string; quantity: number }[];
}

export async function createOrder(input: NewOrderInput) {
  const { items, ...order } = input;
  const created = unwrap(await supabase.from("orders").insert(order).select("id").single());
  if (items.length) {
    unwrap(
      await supabase.from("order_items").insert(items.map((i) => ({ ...i, order_id: created.id }))),
    );
  }
  return created.id;
}

export async function updateOrder(id: string, patch: Tables["orders"]["Update"]) {
  unwrap(await supabase.from("orders").update(patch).eq("id", id));
}

export async function setOrderStatus(id: string, status: OrderStatus, extra: Tables["orders"]["Update"] = {}) {
  await updateOrder(id, { status, ...extra });
}

export async function deleteOrder(id: string) {
  unwrap(await supabase.from("orders").delete().eq("id", id));
}

export async function setItemChecked(id: string, checked: boolean) {
  unwrap(await supabase.from("order_items").update({ checked }).eq("id", id));
}

export async function setAllItemsChecked(orderId: string, checked: boolean) {
  unwrap(await supabase.from("order_items").update({ checked }).eq("order_id", orderId));
}

export interface NewPickupInput {
  carrier: string;
  scheduled_date: string;
  time_window: string;
  address: string;
  contact: string;
  notes: string;
  orderIds: string[];
}

export async function createPickup({ orderIds, ...pickup }: NewPickupInput) {
  const created = unwrap(await supabase.from("pickups").insert(pickup).select("id").single());
  if (orderIds.length) {
    unwrap(
      await supabase
        .from("orders")
        .update({ pickup_id: created.id, status: "coleta_agendada", carrier: pickup.carrier })
        .in("id", orderIds),
    );
  }
  return created.id;
}

/** Completing a pickup ships its orders; cancelling returns them to "conferido". */
export async function setPickupStatus(id: string, status: PickupStatus) {
  unwrap(await supabase.from("pickups").update({ status }).eq("id", id));
  if (status === "realizada") {
    unwrap(
      await supabase
        .from("orders")
        .update({ status: "em_transito" })
        .eq("pickup_id", id)
        .eq("status", "coleta_agendada"),
    );
  } else if (status === "cancelada") {
    unwrap(
      await supabase
        .from("orders")
        .update({ status: "conferido", pickup_id: null })
        .eq("pickup_id", id)
        .eq("status", "coleta_agendada"),
    );
  }
}

export async function deletePickup(id: string) {
  await setPickupStatus(id, "cancelada");
  unwrap(await supabase.from("pickups").delete().eq("id", id));
}

export interface NewOccurrenceInput {
  order_id: string | null;
  type: OccurrenceType;
  description: string;
}

export async function createOccurrence(input: NewOccurrenceInput) {
  unwrap(await supabase.from("occurrences").insert(input));
}

export async function updateOccurrence(
  id: string,
  patch: { status?: OccurrenceStatus; resolution?: string },
) {
  unwrap(await supabase.from("occurrences").update(patch).eq("id", id));
}

export async function deleteOccurrence(id: string) {
  unwrap(await supabase.from("occurrences").delete().eq("id", id));
}

export async function updateStoreName(companyId: string, name: string) {
  unwrap(await supabase.from("companies").update({ name }).eq("id", companyId));
}

export async function updateFullName(fullName: string) {
  const { data } = await supabase.auth.getUser();
  unwrap(await supabase.from("profiles").update({ full_name: fullName }).eq("id", data.user?.id ?? ""));
}

export async function addOrderItem(orderId: string, item: { product_name: string; sku: string; quantity: number }) {
  unwrap(await supabase.from("order_items").insert({ ...item, order_id: orderId }));
}

export async function removeOrderItem(id: string) {
  unwrap(await supabase.from("order_items").delete().eq("id", id));
}
