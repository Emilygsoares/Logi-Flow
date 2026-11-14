import { describe, expect, it } from "vitest";
import { canTransition, conferenceProgress, isLate, nextStatuses } from "./orders";
import { computeDashboard } from "./metrics";

const allChecked = [{ quantity: 1, checked: true }, { quantity: 2, checked: true }];
const partial = [{ quantity: 1, checked: true }, { quantity: 2, checked: false }];

describe("order status rules", () => {
  it("only allows 'conferido' after every item is checked", () => {
    expect(canTransition("em_conferencia", "conferido", partial)).toBe(false);
    expect(canTransition("em_conferencia", "conferido", allChecked)).toBe(true);
  });

  it("does not allow skipping the conference from 'pendente' to shipping", () => {
    expect(canTransition("pendente", "em_transito")).toBe(false);
  });

  it("treats delivered orders as final", () => {
    expect(nextStatuses("entregue")).toEqual([]);
  });

  it("reports conference progress", () => {
    expect(conferenceProgress(partial)).toEqual({ total: 2, checked: 1, percent: 50, complete: false });
    expect(conferenceProgress([]).complete).toBe(false);
  });
});

describe("late deliveries", () => {
  const today = new Date(2026, 10, 14);
  it("flags an open order whose deadline has passed", () => {
    expect(isLate({ status: "em_transito", delivery_deadline: "2026-11-13", delivered_at: null }, today)).toBe(true);
  });
  it("does not flag an order due today", () => {
    expect(isLate({ status: "em_transito", delivery_deadline: "2026-11-14", delivered_at: null }, today)).toBe(false);
  });
  it("flags an order delivered after its deadline", () => {
    expect(
      isLate({ status: "entregue", delivery_deadline: "2026-11-10", delivered_at: new Date(2026, 10, 12).toISOString() }, today),
    ).toBe(true);
  });
  it("never flags cancelled orders", () => {
    expect(isLate({ status: "cancelado", delivery_deadline: "2026-11-01", delivered_at: null }, today)).toBe(false);
  });
});

describe("dashboard metrics", () => {
  it("computes on-time rate from delivered orders with a deadline", () => {
    const today = new Date(2026, 10, 14);
    const m = computeDashboard(
      [
        { status: "entregue", created_at: today.toISOString(), delivery_deadline: "2026-11-20", delivered_at: new Date(2026, 10, 13).toISOString(), shipped_at: null, total_value: 100 },
        { status: "entregue", created_at: today.toISOString(), delivery_deadline: "2026-11-10", delivered_at: new Date(2026, 10, 12).toISOString(), shipped_at: null, total_value: 50 },
        { status: "cancelado", created_at: today.toISOString(), delivery_deadline: null, delivered_at: null, shipped_at: null, total_value: 999 },
      ],
      [{ status: "aberta" }, { status: "resolvida" }],
      today,
    );
    expect(m.onTimeRate).toBe(50);
    expect(m.openOccurrences).toBe(1);
    expect(m.revenue).toBe(150);
  });
});
