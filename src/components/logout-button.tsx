"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";

import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

function Inner({ className, label }: { className?: string; label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 text-sm font-semibold transition-smooth disabled:opacity-50",
        className,
      )}
    >
      {pending ? (
        <Loader2 aria-hidden className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="size-4" />
      )}
      {label ?? "Sair"}
    </button>
  );
}

export function LogoutButton({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action={logout}>
      <Inner className={className} label={label} />
    </form>
  );
}
