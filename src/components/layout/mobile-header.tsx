"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Wallet,
  Bell,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const moreItems = [
  { name: "Reminder", href: "/reminders", icon: Bell },
  { name: "Profil", href: "/profile", icon: User },
  { name: "Pengaturan", href: "/settings", icon: Settings },
];

export function MobileHeader() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Close menu on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMenu(false);
        buttonRef.current?.focus();
      }
    };

    if (showMenu) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/40 lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="WeWallet Home">
            <div className="w-9 h-9 rounded-xl bg-gradient-pink flex items-center justify-center shadow-card">
              <Wallet className="h-4.5 w-4.5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-primary-text">WeWallet</span>
          </Link>
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors py-1.5 pl-1.5 pr-3"
            aria-expanded={showMenu}
            aria-haspopup="true"
            aria-label={showMenu ? "Tutup menu" : "Buka menu"}
          >
            <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <span className="hidden sm:block text-sm font-semibold text-on-surface">Menu</span>
          </button>
        </div>
      </header>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-30 lg:hidden"
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />
          <div
            ref={menuRef}
            className="fixed top-16 right-4 z-40 w-48 bg-surface-container-lowest rounded-xl shadow-lift border border-outline-variant/60 py-1 lg:hidden"
            role="menu"
            aria-orientation="vertical"
            aria-label="Menu navigasi"
          >
            {moreItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setShowMenu(false)}
                role="menuitem"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary-text"
                    : "text-on-surface hover:bg-surface-container-low"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
            <div className="border-t border-outline-variant/60 my-1" />
            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-error hover:bg-error-container/40 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Keluar
            </button>
          </div>
        </>
      )}
    </>
  );
}
