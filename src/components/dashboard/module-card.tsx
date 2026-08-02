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
  pink: { bg: "bg-[#fff0f4]", icon: "text-[#e85d8a]" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-500" },
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
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          {count !== undefined && label && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fff7fa] px-2 py-0.5 text-[11px] font-medium text-[#d14b7a]">
              {count} {label}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
