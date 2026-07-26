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
  Menu,
  X,
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
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="WeWallet Home">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ffb6c9' }}>
              <Wallet className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold text-gray-900">WeWallet</span>
          </Link>
          <button
            ref={buttonRef}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-expanded={showMenu}
            aria-haspopup="true"
            aria-label={showMenu ? "Tutup menu" : "Buka menu"}
          >
            {showMenu ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
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
            className="fixed top-14 right-4 z-40 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 lg:hidden"
            role="menu"
            aria-orientatioln="vertical"
            aria-label="Menu navigasi"
          >
            {moreItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setShowMenu(false)}
                role="menuitem"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                  pathname === item.href
                    ? "text-[#d14b7a]"
                    : "text-gray-700 hover:bg-gray-50"
                )}
                style={pathname === item.href ? { backgroundColor: '#fff0f4' } : undefined}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
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
