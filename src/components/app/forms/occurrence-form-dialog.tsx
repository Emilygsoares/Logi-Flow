import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/app/native-select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOccurrence, invalidateAll, ordersQuery } from "@/lib/api/data";
import { OCCURRENCE_TYPE_LABEL, type OccurrenceType } from "@/lib/domain/orders";


export function OccurrenceFormDialog({ trigger, orderId }: { trigger: ReactNode; orderId?: string }) {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery(ordersQuery());
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const description = String(f.get("description") ?? "").trim();
    if (!description) return setError("Descreva o que aconteceu.");
    setSaving(true);
    setError(null);
    try {
      await createOccurrence({
        order_id: String(f.get("order_id") ?? "") || null,
        type: String(f.get("type")) as OccurrenceType,
        description,
      });
      await invalidateAll(qc);
      toast.success("Ocorrência registrada.");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar ocorrência</DialogTitle>
          <DialogDescription>Anote problemas na expedição ou na entrega para acompanhar a resolução.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="order_id">Pedido</Label>
            <NativeSelect id="order_id" name="order_id" defaultValue={orderId ?? ""}>
              <option value="">Sem pedido vinculado</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} — {o.customer_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <NativeSelect id="type" name="type" defaultValue="atraso">
              {Object.entries(OCCURRENCE_TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea id="description" name="description" rows={3} placeholder="O que aconteceu?" />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
