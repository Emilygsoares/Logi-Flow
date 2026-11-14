import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-destructive-soft text-destructive",
  navy: "bg-navy text-navy-foreground",
} as const;

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="size-[18px]" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-navy tabular">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
