import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";

/** Single app shell — use only in route layouts, never inside page components. */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
