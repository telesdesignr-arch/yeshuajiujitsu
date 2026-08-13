import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-white shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pt-4 pb-2 sm:px-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "font-display text-lg font-bold tracking-wide uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-500", className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", className)} {...props} />;
}

/**
 * Cartao que abre e fecha. Usa <details> nativo: funciona sem JavaScript,
 * e acessivel por teclado e nao precisa de estado no React.
 */
export function Collapsible({
  title,
  description,
  icon: Icon,
  defaultOpen,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-card border border-line bg-white shadow-card"
    >
      <summary className="flex min-h-[56px] cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        {Icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
            <Icon className="size-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-bold tracking-wide uppercase">
            {title}
          </span>
          {description && (
            <span className="block text-xs text-ink-500">{description}</span>
          )}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5 shrink-0 text-ink-500 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-line px-4 py-4 sm:px-5">{children}</div>
    </details>
  );
}

/** Cabecalho de secao usado dentro das paginas (fora de cartoes). */
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl font-bold tracking-wide uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}
