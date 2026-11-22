import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../../schemas/auth';
import { signInWithEmailPassword } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function LoginPage() {
  const { isAuthenticated, isActiveStaff, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  const fromPath =
    (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (!loading && isAuthenticated && isActiveStaff) {
    return <Navigate to={fromPath} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      await signInWithEmailPassword(values.email, values.password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#FAF9F6] px-4 py-12 text-[#111111]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#111111] text-xs font-semibold text-white">
            K
          </span>
          <span className="font-editorial text-xl font-semibold tracking-tight text-[#111111]">
            Klido Studio
          </span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-8">
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Sign in to workspace
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Manage Klido pages, content collections, media, and published revisions.
          </p>

          {!isSupabaseConfigured ? (
            <div className="mt-5 flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Supabase environment variables (<code>VITE_SUPABASE_URL</code>,{' '}
                <code>VITE_SUPABASE_ANON_KEY</code>) are not configured.
              </span>
            </div>
          ) : null}

          {authError ? (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{authError}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#111111]"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="name@klido.in"
                className="mt-1.5 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-zinc-400 focus:border-[#111111] focus:outline-none"
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#111111]"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-zinc-600 hover:text-[#111111] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="Enter your password"
                className="mt-1.5 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-[#111111] placeholder:text-zinc-400 focus:border-[#111111] focus:outline-none"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isSupabaseConfigured}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Klido Studio · Protected administrative environment
        </p>
      </div>
    </div>
  );
}
