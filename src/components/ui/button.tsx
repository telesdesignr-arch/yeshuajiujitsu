import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap transition-smooth select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-brand-600 text-white shadow-card hover:bg-brand-700",
        dark: "bg-ink text-white hover:bg-ink-800",
        outline: "border border-line bg-white text-ink hover:bg-ink-100",
        ghost: "text-ink-500 hover:bg-ink-100 hover:text-ink",
        danger: "bg-danger text-white hover:brightness-95",
        success: "bg-success text-white hover:brightness-95",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-[15px]",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, block, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    />
  );
}

export type ButtonLinkProps = React.ComponentProps<typeof Link> &
  VariantProps<typeof buttonStyles>;

export function ButtonLink({
  className,
  variant,
  size,
  block,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    />
  );
}

export { buttonStyles };
