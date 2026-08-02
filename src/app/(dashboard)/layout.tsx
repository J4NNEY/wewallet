"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import AuthCheck from "@/components/auth/auth-check";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthCheck>
        {/* Desktop: sidebar layout */}
        <div className="hidden lg:flex h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-7xl mx-auto">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Mobile: bottom nav layout */}
        <div className="lg:hidden min-h-screen pb-20">
          <MobileHeader />
          <main className="p-4">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <BottomNav />
        </div>
      </AuthCheck>
    </ErrorBoundary>
  );
}
