import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FinancialDetailField = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  wide?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
};

export const FinancialDetailSection = ({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("rounded-2xl border border-border bg-card/55", className)}>
    {title || description ? (
      <header className="border-b border-border px-4 py-3.5 sm:px-5">
        {title ? <h3 className="font-medium text-foreground">{title}</h3> : null}
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </header>
    ) : null}
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

export const FinancialDetailGrid = ({ fields }: { fields: FinancialDetailField[] }) => (
  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
    {fields.map((field) => (
      <div
        key={field.id}
        className={cn("min-w-0", field.wide && "sm:col-span-2 lg:col-span-3")}
      >
        <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
        <div
          className={cn(
            "mt-1 break-words text-sm leading-5 text-foreground",
            field.tone === "success" && "text-primary",
            field.tone === "warning" && "text-amber-200",
            field.tone === "danger" && "text-destructive",
          )}
        >
          {field.value ?? "-/-"}
        </div>
      </div>
    ))}
  </div>
);
