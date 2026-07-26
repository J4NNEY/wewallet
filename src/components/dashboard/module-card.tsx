"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, LucideIcon } from "lucide-react";
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
  pink: {
    bg: "bg-pink-50",
    icon: "text-pink-500",
    hover: "hover:border-pink-200",
    badge: "bg-pink-50 text-pink-600",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    hover: "hover:border-blue-200",
    badge: "bg-blue-50 text-blue-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    hover: "hover:border-purple-200",
    badge: "bg-purple-50 text-purple-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
    hover: "hover:border-orange-200",
    badge: "bg-orange-50 text-orange-600",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    hover: "hover:border-emerald-200",
    badge: "bg-emerald-50 text-emerald-600",
  },
};

export function ModuleCard({
  name,
  description,
  href,
  icon: Icon,
  count,
  label,
  lastActivity,
  color,
}: ModuleCardProps) {
  const styles = colorStyles[color];

  return (
    <Link href={href}>
      <Card className={cn("hover:shadow-md transition-all duration-200 cursor-pointer h-full group", styles.hover)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", styles.bg)}>
              <Icon className={cn("h-5 w-5", styles.icon)} />
            </div>
            {count !== undefined && label && (
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", styles.badge)}>
                {count} {label}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-3">{description}</p>
          {lastActivity && (
            <p className="text-xs text-gray-400 mb-3 truncate">
              {lastActivity}
            </p>
          )}
          <div className="flex items-center text-sm font-medium text-gray-400 group-hover:text-pink-500 transition-colors">
            Buka
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
