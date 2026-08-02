import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-6 text-center",
        className
      )}
    >
      <div className="relative mb-4">
        <div
          className="absolute inset-0 scale-[1.7] rounded-full bg-surface-container-high"
          aria-hidden="true"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-pink shadow-card">
          <Icon className="h-7 w-7 text-white" />
        </div>
      </div>
      <p className="text-sm font-semibold text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-on-surface-variant max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
