import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, invalidateAll, updateOrder, type Order } from "@/lib/api/data";

interface ItemDraft {
  key: number;
  product_name: string;
  sku: string;
  quantity: number;
}

const CHANNELS = ["Instagram", "WhatsApp", "Loja virtual", "Marketplace", "Loja física", "Outro"];

export function OrderFormDialog({
  trigger,
  order,
  onCreated,
}: {
  trigger: ReactNode;
  order?: Order;
  onCreated?: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ItemDraft[]>([{ key: 0, product_name: "", sku: "", quantity: 1 }]);
  const isEdit = Boolean(order);

  function reset() {
    setItems([{ key: Date.now(), product_name: "", sku: "", quantity: 1 }]);
    setError(null);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => String(f.get(k) ?? "").trim();
    const num = (k: string) => {
      const v = Number(str(k).replace(",", "."));
      return Number.isFinite(v) && v >= 0 ? v : 0;
    };
    const base = {
      customer_name: str("customer_name"),
      customer_phone: str("customer_phone"),
      customer_email: str("customer_email"),
      address: str("address"),
      city: str("city"),
      state: str("state").toUpperCase().slice(0, 2),
      zip_code: str("zip_code"),
      sales_channel: str("sales_channel"),
      total_value: num("total_value"),
      shipping_cost: num("shipping_cost"),
      carrier: str("carrier"),
      delivery_deadline: str("delivery_deadline") || null,
      notes: str("notes"),
    };
    if (!base.customer_name) return setError("Informe o nome do cliente.");
    const validItems = items
      .filter((i) => i.product_name.trim())
      .map((i) => ({ product_name: i.product_name.trim(), sku: i.sku.trim(), quantity: Math.max(1, i.quantity) }));
    if (!isEdit && validItems.length === 0) return setError("Adicione pelo menos um item ao pedido.");

    setSaving(true);
    setError(null);
    try {
      if (order) {
        await updateOrder(order.id, base);
        toast.success("Pedido atualizado.");
      } else {
        const id = await createOrder({ ...base, items: validItems });
        toast.success("Pedido criado com sucesso.");
        onCreated?.(id);
      }
      await invalidateAll(qc);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o pedido.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar pedido ${order?.code}` : "Novo pedido"}</DialogTitle>
          <DialogDescription>Dados do cliente, entrega e itens do pedido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <Section title="Cliente">
            <F name="customer_name" label="Nome do cliente *" defaultValue={order?.customer_name} className="sm:col-span-2" />
            <F name="customer_phone" label="Telefone / WhatsApp" defaultValue={order?.customer_phone} />
            <F name="customer_email" label="E-mail" type="email" defaultValue={order?.customer_email} />
          </Section>
          <Section title="Entrega">
            <F name="address" label="Endereço" defaultValue={order?.address} className="sm:col-span-2" placeholder="Rua, número, complemento, bairro" />
            <F name="city" label="Cidade" defaultValue={order?.city} />
            <div className="grid grid-cols-2 gap-3">
              <F name="state" label="UF" defaultValue={order?.state} placeholder="SP" />
              <F name="zip_code" label="CEP" defaultValue={order?.zip_code} />
            </div>
            <F name="carrier" label="Transportadora / entregador" defaultValue={order?.carrier} placeholder="Correios, Loggi, próprio..." />
            <F name="delivery_deadline" label="Prazo de entrega" type="date" defaultValue={order?.delivery_deadline ?? ""} />
          </Section>
          <Section title="Venda">
            <div className="space-y-1.5">
              <Label htmlFor="sales_channel">Canal de venda</Label>
              <NativeSelect
                id="sales_channel"
                name="sales_channel"
                defaultValue={order?.sales_channel ?? ""}
              >
                <option value="">Selecione</option>
                {CHANNELS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F name="total_value" label="Valor (R$)" inputMode="decimal" defaultValue={order ? String(order.total_value) : ""} placeholder="0,00" />
              <F name="shipping_cost" label="Frete (R$)" inputMode="decimal" defaultValue={order ? String(order.shipping_cost) : ""} placeholder="0,00" />
            </div>
          </Section>

          {!isEdit && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">Itens *</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="soft"
                  onClick={() => setItems((it) => [...it, { key: Date.now(), product_name: "", sku: "", quantity: 1 }])}
                >
                  <Plus /> Adicionar item
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={item.key} className="grid grid-cols-[1fr_6rem_4.5rem_auto] gap-2">
                    <Input
                      aria-label="Produto"
                      placeholder="Produto"
                      value={item.product_name}
                      onChange={(e) => setItems((it) => it.map((x, i) => (i === idx ? { ...x, product_name: e.target.value } : x)))}
                    />
                    <Input
                      aria-label="SKU"
                      placeholder="SKU"
                      value={item.sku}
                      onChange={(e) => setItems((it) => it.map((x, i) => (i === idx ? { ...x, sku: e.target.value } : x)))}
                    />
                    <Input
                      aria-label="Quantidade"
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setItems((it) => it.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) || 1 } : x)))}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Remover item"
                      disabled={items.length === 1}
                      onClick={() => setItems((it) => it.filter((_, i) => i !== idx))}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" defaultValue={order?.notes} rows={2} />
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
              {isEdit ? "Salvar alterações" : "Criar pedido"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-navy">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function F({
  name,
  label,
  className,
  ...props
}: { name: string; label: string; className?: string } & ComponentProps<typeof Input>) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}
