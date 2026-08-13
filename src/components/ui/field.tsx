import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-[10px] border border-line bg-white px-3 text-[16px] text-ink placeholder:text-ink-300 transition-smooth focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500";

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn("block text-sm font-semibold text-ink", className)} {...props}>
      {children}
      {required && (
        <span aria-hidden className="ml-0.5 text-danger">
          *
        </span>
      )}
    </label>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(controlBase, "min-h-24 py-2.5 leading-normal", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(controlBase, "h-11 cursor-pointer appearance-none pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b6259' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
      }}
      {...props}
    />
  );
}

/**
 * Junta rotulo, campo, texto de ajuda e mensagem de erro com o espacamento e
 * a acessibilidade corretos (o erro aparece logo abaixo do campo).
 */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-ink-500">{hint}</p>}
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-danger">
          <AlertCircle aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Aviso de erro geral do formulario (topo). */
export function FormAlert({
  children,
  tone = "danger",
}: {
  children: React.ReactNode;
  tone?: "danger" | "success";
}) {
  if (!children) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-[10px] border px-3 py-2.5 text-sm font-medium",
        tone === "danger"
          ? "border-danger/25 bg-danger/8 text-danger"
          : "border-success/25 bg-success/8 text-success",
      )}
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
