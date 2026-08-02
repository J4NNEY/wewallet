"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  count?: number;
  label?: string;
  lastActivity?: string;
  color: "pink" | "blue" | "purple" | "orange" | "green";
}

const colorStyles = {
  pink: { bg: "bg-primary-fixed", icon: "text-primary-text" },
  blue: { bg: "bg-tertiary-fixed", icon: "text-tertiary" },
  purple: { bg: "bg-tertiary-fixed", icon: "text-tertiary" },
  orange: { bg: "bg-tertiary-fixed", icon: "text-tertiary" },
  green: { bg: "bg-secondary-container/40", icon: "text-secondary" },
};

export function ModuleCard({
  name,
  description,
  href,
  icon: Icon,
  count,
  label,
  color,
}: ModuleCardProps) {
  const styles = colorStyles[color];

  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all duration-200 group-hover:shadow-lift group-hover:-translate-y-0.5">
        <CardContent className="p-3 sm:p-5">
          <div
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center mb-2 sm:mb-3",
              styles.bg
            )}
          >
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
          <h3 className="font-semibold text-on-surface text-sm sm:text-base">{name}</h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5 line-clamp-2">{description}</p>
          {count !== undefined && label && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 text-[11px] font-semibold text-primary-text">
              {count} {label}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
