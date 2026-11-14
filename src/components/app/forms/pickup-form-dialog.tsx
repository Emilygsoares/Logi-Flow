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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPickup, invalidateAll, ordersQuery } from "@/lib/api/data";

const WINDOWS = ["08:00 – 12:00", "12:00 – 18:00", "08:00 – 18:00", "18:00 – 21:00"];

export function PickupFormDialog({ trigger, preselected = [] }: { trigger: ReactNode; preselected?: string[] }) {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery(ordersQuery());
  const ready = orders.filter((o) => o.status === "conferido");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(preselected);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    const input = {
      carrier: str("carrier"),
      scheduled_date: str("scheduled_date"),
      time_window: str("time_window"),
      address: str("address"),
      contact: str("contact"),
      notes: str("notes"),
      orderIds: selected,
    };
    if (!input.carrier) return setError("Informe a transportadora ou entregador.");
    if (!input.scheduled_date) return setError("Informe a data da coleta.");
    setSaving(true);
    setError(null);
    try {
      await createPickup(input);
      await invalidateAll(qc);
      toast.success(
        selected.length ? `Coleta agendada com ${selected.length} pedido(s).` : "Coleta agendada.",
      );
      setOpen(false);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível agendar a coleta.");
    } finally {
      setSaving(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setSelected(preselected);
        setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Agendar coleta</DialogTitle>
          <DialogDescription>Registre a coleta combinada com a transportadora ou entregador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="carrier">Transportadora / entregador *</Label>
              <Input id="carrier" name="carrier" placeholder="Correios, Jadlog, entregador próprio..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_date">Data *</Label>
              <Input id="scheduled_date" name="scheduled_date" type="date" defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time_window">Janela de horário</Label>
              <NativeSelect
                id="time_window"
                name="time_window"
              >
                {WINDOWS.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Local de coleta</Label>
              <Input id="address" name="address" placeholder="Endereço da loja" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact">Contato</Label>
              <Input id="contact" name="contact" placeholder="Nome / telefone" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Pedidos conferidos para esta coleta</p>
            {ready.length === 0 ? (
              <p className="rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                Nenhum pedido conferido aguardando coleta. Você pode agendar mesmo assim.
              </p>
            ) : (
              <div className="max-h-48 divide-y overflow-y-auto rounded-lg border">
                {ready.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50">
                    <Checkbox
                      checked={selected.includes(o.id)}
                      onCheckedChange={(c) =>
                        setSelected((s) => (c ? [...s, o.id] : s.filter((x) => x !== o.id)))
                      }
                    />
                    <span className="font-medium text-navy tabular">{o.code}</span>
                    <span className="flex-1 truncate text-muted-foreground">{o.customer_name}</span>
                    <span className="text-xs text-muted-foreground">{o.city}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={2} />
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
              Agendar coleta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
