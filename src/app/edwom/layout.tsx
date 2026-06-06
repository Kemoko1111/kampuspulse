import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
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
