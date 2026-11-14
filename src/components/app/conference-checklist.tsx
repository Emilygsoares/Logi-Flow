import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { invalidateAll, setAllItemsChecked, setItemChecked, setOrderStatus, type Order } from "@/lib/api/data";
import { conferenceProgress } from "@/lib/domain/orders";
import { cn } from "@/lib/utils";

/** Item-by-item check. Starting a check moves the order to "em_conferencia"; finishing marks it "conferido". */
export function ConferenceChecklist({ order, compact = false }: { order: Order; compact?: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const progress = conferenceProgress(order.order_items);
  const editable = order.status === "pendente" || order.status === "em_conferencia";

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
      await invalidateAll(qc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setBusy(null);
    }
  }

  const ensureStarted = async () => {
    if (order.status === "pendente") await setOrderStatus(order.id, "em_conferencia");
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Progress value={progress.percent} className="h-2 flex-1" />
        <span className="text-xs font-medium text-muted-foreground tabular">
          {progress.checked}/{progress.total}
        </span>
      </div>
      <ul className={cn("divide-y rounded-lg border", compact && "text-sm")}>
        {order.order_items.length === 0 && (
          <li className="px-3 py-3 text-sm text-muted-foreground">Este pedido não tem itens cadastrados.</li>
        )}
        {order.order_items.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                "flex items-center gap-3 px-3 py-2.5",
                editable ? "cursor-pointer hover:bg-muted/40" : "cursor-default",
              )}
            >
              {busy === item.id ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <Checkbox
                  checked={item.checked}
                  disabled={!editable || busy !== null}
                  onCheckedChange={(c) =>
                    run(item.id, async () => {
                      await ensureStarted();
                      await setItemChecked(item.id, Boolean(c));
                    })
                  }
                />
              )}
              <span className={cn("flex-1", item.checked && "text-muted-foreground line-through")}>
                {item.product_name}
                {item.sku && <span className="ml-2 text-xs text-muted-foreground">SKU {item.sku}</span>}
              </span>
              <span className="text-sm font-medium tabular">× {item.quantity}</span>
            </label>
          </li>
        ))}
      </ul>
      {editable && order.order_items.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {!progress.complete && (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy !== null}
              onClick={() =>
                run("all", async () => {
                  await ensureStarted();
                  await setAllItemsChecked(order.id, true);
                })
              }
            >
              <CheckCheck /> Marcar todos
            </Button>
          )}
          <Button
            size="sm"
            variant="success"
            disabled={!progress.complete || busy !== null}
            onClick={() =>
              run("finish", async () => {
                await ensureStarted();
                await setOrderStatus(order.id, "conferido");
                toast.success(`Pedido ${order.code} conferido.`);
              })
            }
          >
            {busy === "finish" && <Loader2 className="animate-spin" />}
            Concluir conferência
          </Button>
        </div>
      )}
    </div>
  );
}
