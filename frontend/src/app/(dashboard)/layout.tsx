import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--app-bg)]">
      <Sidebar />
      <main className="app-main-shell flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
