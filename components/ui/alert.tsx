import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "rounded-xl border p-4 text-sm leading-relaxed",
  {
    variants: {
      variant: {
        info: "border-info/30 bg-info/10 text-foreground",
        success: "border-success/30 bg-success/10 text-foreground",
        warning: "border-warning/30 bg-warning/10 text-foreground",
        danger: "border-danger/30 bg-danger/10 text-foreground",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  children?: ReactNode;
}

export function Alert({
  className,
  variant,
  title,
  children,
  role = "status",
  ...props
}: AlertProps) {
  return (
    <div
      role={role}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
