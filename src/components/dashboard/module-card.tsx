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
  pink: { bg: "bg-pink-50", icon: "text-pink-500", hover: "hover:border-pink-200" },
  blue: { bg: "bg-blue-50", icon: "text-blue-500", hover: "hover:border-blue-200" },
  purple: { bg: "bg-purple-50", icon: "text-purple-500", hover: "hover:border-purple-200" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500", hover: "hover:border-orange-200" },
  green: { bg: "bg-emerald-50", icon: "text-emerald-500", hover: "hover:border-emerald-200" },
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
    <Link href={href}>
      <Card className={cn("hover:shadow-md transition-all duration-200 cursor-pointer h-full", styles.hover)}>
        <CardContent className="p-3 sm:p-5">
          <div className={cn("w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 sm:mb-3", styles.bg)}>
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{name}</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-2">{description}</p>
          {count !== undefined && label && (
            <p className="text-xs text-gray-400 mt-2">
              {count} {label}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
