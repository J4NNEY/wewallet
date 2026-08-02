import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, label, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3",
        className
      )}
    >
      <div>
        {label && (
          <p className="text-xs font-bold uppercase tracking-widest text-primary-text">{label}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{title}</h1>
        {description && (
          <p className="text-sm text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
