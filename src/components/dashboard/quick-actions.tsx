"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, StickyNote, DollarSign, Bell, Calculator } from "lucide-react";

interface QuickAction {
  name: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    name: "Catatan",
    href: "/notes",
    icon: <StickyNote className="h-4 w-4" />,
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
  {
    name: "Transaksi",
    href: "/finance",
    icon: <DollarSign className="h-4 w-4" />,
    color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
  },
  {
    name: "Reminder",
    href: "/reminders",
    icon: <Bell className="h-4 w-4" />,
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    name: "Kalkulator",
    href: "/calculator",
    icon: <Calculator className="h-4 w-4" />,
    color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Pintasan</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 h-auto py-3 ${action.color}`}
              >
                {action.icon}
                <span className="text-sm font-medium">{action.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
