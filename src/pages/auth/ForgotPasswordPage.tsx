import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../../schemas/auth';
import { sendPasswordResetEmail } from '../../lib/auth';

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(values.email);
      setSubmittedEmail(values.email);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to send password reset email.'
      );
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
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Enter your administrator email and we will send a recovery link.
          </p>

          {submittedEmail ? (
            <div className="mt-6 rounded-md border border-zinc-200 bg-[#FAF9F6] p-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <div className="text-xs leading-relaxed text-zinc-700">
                  If an account exists for <strong className="text-[#111111]">{submittedEmail}</strong>, a
                  password reset email has been dispatched via Supabase Auth.
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
              {errorMessage ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-[#111111]"
                >
                  Work email
                </label>
                <input
                  id="reset-email"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-md bg-[#111111] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
              >
                {isSubmitting ? 'Sending link…' : 'Send recovery link'}
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-zinc-200 pt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-[#111111]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
