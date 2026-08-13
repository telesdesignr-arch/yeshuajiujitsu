import * as React from "react";

import { cn, initials } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Badge                                                                       */
/* -------------------------------------------------------------------------- */

const badgeTones = {
  neutral: "bg-ink-100 text-ink-700 border-line",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  dark: "bg-ink text-white border-ink",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */

export function Avatar({
  name,
  src,
  size = 44,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-800 select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden={!!src}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Foto de ${name}`}
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Barra de progresso                                                          */
/* -------------------------------------------------------------------------- */

export function Progress({
  value,
  max = 100,
  label,
  tone = "brand",
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: "brand" | "dark" | "success";
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bar =
    tone === "brand" ? "bg-brand-600" : tone === "dark" ? "bg-ink" : "bg-success";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-pill bg-ink-100", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-pill transition-smooth", bar)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Estado vazio                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-ink-100/60 px-6 py-10 text-center">
      {Icon && <Icon className="mb-3 size-7 text-ink-300" />}
      <p className="font-display text-base font-bold tracking-wide uppercase">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Numero grande de destaque                                                   */
/* -------------------------------------------------------------------------- */

export function Stat({
  label,
  value,
  suffix,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  hint?: string;
  tone?: "default" | "brand" | "dark";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={cn(
        "rounded-card border p-4",
        tone === "dark"
          ? "border-ink bg-ink text-white"
          : tone === "brand"
            ? "border-brand-200 bg-brand-50"
            : "border-line bg-white",
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            className={cn(
              "size-3.5",
              tone === "dark" ? "text-brand-300" : "text-ink-500",
            )}
          />
        )}
        <p
          className={cn(
            "text-xs font-semibold tracking-wide uppercase",
            tone === "dark" ? "text-white/70" : "text-ink-500",
          )}
        >
          {label}
        </p>
      </div>
      <p className="tabular mt-1.5 font-display text-3xl leading-none font-bold">
        {value}
        {suffix && (
          <span
            className={cn(
              "ml-1 text-lg font-semibold",
              tone === "dark" ? "text-white/60" : "text-ink-500",
            )}
          >
            {suffix}
          </span>
        )}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "dark" ? "text-white/60" : "text-ink-500",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
