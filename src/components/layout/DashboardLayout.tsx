import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { fetchDashboardOverview } from '../../lib/dashboardApi';

export function DashboardLayout() {
  const { data } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
    staleTime: 30_000,
  });

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] text-[#111111]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          publishedPagesCount={data ? data.publishedPages : null}
          totalPagesCount={data ? data.totalPages : null}
          schemaReady={data ? data.schemaReady : true}
        />
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
