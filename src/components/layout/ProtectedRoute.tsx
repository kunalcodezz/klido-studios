import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

interface ProtectedRouteProps {
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ requireSuperAdmin = false }: ProtectedRouteProps) {
  const { loading, isAuthenticated, isActiveStaff, isSuperAdmin, user, profile, error, signOut } =
    useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-[#111111]">Verifying session</p>
          <p className="mt-1 text-xs text-zinc-500">Checking administrator permissions…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isActiveStaff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <h1 className="font-editorial text-xl font-semibold text-[#111111]">
                Administrator access pending
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Signed in as <span className="font-medium text-[#111111]">{user?.email}</span>,
                but an active administrator profile was not found.
              </p>
              {error ? (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                  Ensure migrations 0001–0005 have been applied in Supabase and your profile is
                  marked active.
                </p>
              )}
              <button
                type="button"
                onClick={() => void signOut()}
                className="mt-5 inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <h1 className="font-editorial text-xl font-semibold text-[#111111]">
              Super Admin access required
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Your current role (<span className="font-medium text-[#111111]">{profile?.role}</span>
              ) does not permit managing administrators or system-wide settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
