import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, RotateCcw, Save } from 'lucide-react';
import { saveSiteSetting } from '../../lib/contentApi';
import { DesignTokenProvider } from '../../providers/DesignTokenProvider';
import { GlobalSettingsProvider, useGlobalSettings } from '../../providers/GlobalSettingsProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  DEFAULT_KLIDO_DESIGN_TOKENS,
  type DesignSystemTokens,
} from '../../schemas/styles';

function DesignSystemEditorInner() {
  const { isSuperAdmin } = useAuth();
  const { designTokens } = useGlobalSettings();
  const queryClient = useQueryClient();

  const [tokens, setTokens] = useState<DesignSystemTokens>(designTokens);
  const [notice, setNotice] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    setTokens(designTokens);
  }, [designTokens]);

  const saveMutation = useMutation({
    mutationFn: () => saveSiteSetting('design_system', tokens),
    onSuccess: async () => {
      setErrMsg(null);
      setNotice('Global Design System tokens saved and synced.');
      await queryClient.invalidateQueries({ queryKey: ['cms-global-settings'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save tokens.'),
  });

  const updateColor = (key: keyof DesignSystemTokens['colors'], val: string) =>
    setTokens((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: val },
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Global Design System
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Configure Klido brand colors, typography hierarchy, button geometry, and layout spacing.
          </p>
        </div>

        {isSuperAdmin ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTokens(DEFAULT_KLIDO_DESIGN_TOKENS)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saveMutation.isPending ? 'Saving…' : 'Save Design Tokens'}</span>
            </button>
          </div>
        ) : null}
      </div>

      {!isSuperAdmin ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Only SUPER_ADMIN administrators can modify global design system tokens.</span>
        </div>
      ) : null}

      {notice ? <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs">{notice}</div> : null}
      {errMsg ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errMsg}</div> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* Brand Colors */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111111]">Brand Color Tokens</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ['primary', 'Primary Cobalt'],
                  ['primaryHover', 'Primary Hover'],
                  ['secondary', 'Ink Dark'],
                  ['accent', 'Lime Accent'],
                  ['text', 'Body Ink'],
                  ['mutedText', 'Muted Ink'],
                  ['background', 'Canvas Bg'],
                  ['surface', 'Subtle Surface'],
                  ['border', 'Border Hairline'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-zinc-700">{label}</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isSuperAdmin}
                      value={tokens.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
                    />
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      value={tokens.colors[key]}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Typography & Layout */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111111]">Typography &amp; Layout Scales</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Heading Font</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={tokens.typography.headingFont}
                  onChange={(e) =>
                    setTokens((p) => ({
                      ...p,
                      typography: { ...p.typography, headingFont: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Body Font</label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={tokens.typography.bodyFont}
                  onChange={(e) =>
                    setTokens((p) => ({
                      ...p,
                      typography: { ...p.typography, bodyFont: e.target.value },
                    }))
                  }
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Container Max Width (px)</label>
                <input
                  type="number"
                  disabled={!isSuperAdmin}
                  value={tokens.layout.containerMaxWidthPx}
                  onChange={(e) =>
                    setTokens((p) => ({
                      ...p,
                      layout: { ...p.layout, containerMaxWidthPx: Number(e.target.value) || 1200 },
                    }))
                  }
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Button Radius (px)</label>
                <input
                  type="number"
                  disabled={!isSuperAdmin}
                  value={tokens.buttons.radiusPx}
                  onChange={(e) =>
                    setTokens((p) => ({
                      ...p,
                      buttons: { ...p.buttons, radiusPx: Number(e.target.value) || 8 },
                    }))
                  }
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs tabular-nums"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Live Klido Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-lg border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Live Token Preview
            </p>
            <DesignTokenProvider tokens={tokens} className="overflow-hidden rounded-md border border-zinc-200 p-6">
              <span
                style={{ color: tokens.colors.primary }}
                className="text-[11px] font-bold uppercase tracking-[0.18em]"
              >
                Your Partner In Digital Growth
              </span>
              <h3
                style={{
                  fontFamily: tokens.typography.headingFont,
                  color: tokens.colors.text,
                }}
                className="mt-2 text-2xl font-bold leading-tight"
              >
                Brands people{' '}
                <span
                  style={{
                    textDecorationLine: 'underline',
                    textDecorationColor: tokens.colors.accent,
                    textDecorationThickness: '4px',
                    textUnderlineOffset: '4px',
                  }}
                >
                  remember.
                </span>
              </h3>
              <p
                style={{
                  fontFamily: tokens.typography.bodyFont,
                  color: tokens.colors.mutedText,
                  fontSize: `${tokens.typography.baseSizePx}px`,
                }}
                className="mt-3 text-sm leading-relaxed"
              >
                Live preview reflecting Klido typography, cobalt CTAs, and neutral surfaces.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  style={{
                    backgroundColor: tokens.colors.primary,
                    borderRadius: `${tokens.buttons.radiusPx}px`,
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white"
                >
                  Primary CTA
                </button>
                <div
                  style={{
                    backgroundColor: tokens.colors.surface,
                    borderColor: tokens.colors.border,
                    color: tokens.colors.text,
                    borderRadius: `${tokens.buttons.radiusPx}px`,
                  }}
                  className="border px-4 py-2 text-xs font-medium"
                >
                  Surface Card
                </div>
              </div>
            </DesignTokenProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <GlobalSettingsProvider>
      <DesignSystemEditorInner />
    </GlobalSettingsProvider>
  );
}
