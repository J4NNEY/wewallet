"use client";

import { Sidebar } from "@/components/layout/sidebar";
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
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8 pl-16 sm:pl-6 lg:pl-8 max-w-7xl mx-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </AuthCheck>
    </ErrorBoundary>
  );
}
