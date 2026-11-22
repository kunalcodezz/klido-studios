import { useState } from 'react';
import {
  ArrowUpRight,
  ChevronDown,
  Instagram,
  Lock,
  Mail,
  MessageSquare,
  Minus,
  Phone,
  Plus,
} from 'lucide-react';
import type { z } from 'zod';
import {
  auditMatrixPropsSchema,
  contactPropsSchema,
  faqPropsSchema,
  footerPropsSchema,
} from '../../schemas/blocks';
import { useGlobalSettings } from '../../providers/GlobalSettingsProvider';
import { InteractiveGlobeWidget } from './InteractiveWidgets';

type FaqProps = z.infer<typeof faqPropsSchema>;
type ContactProps = z.infer<typeof contactPropsSchema>;
type AuditMatrixProps = z.infer<typeof auditMatrixPropsSchema>;
type FooterProps = z.infer<typeof footerPropsSchema>;

export function FaqBlock({ props }: { props: FaqProps }) {
  const [openId, setOpenId] = useState<string | null>(props.items[0]?.id ?? null);

  return (
    <section id="faq" className="border-b border-[#E5E9F2] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2.5 text-sm font-medium text-[#0D1126]">
                <span className="inline-block h-[3px] w-6 rounded-full bg-[#C2F81A]" />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-[#0D1126]"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.heading}
            </h2>
            {props.subtitle ? (
              <p className="mt-3 text-sm leading-relaxed text-[#4A5268]">{props.subtitle}</p>
            ) : null}

            <div className="mt-8 rounded-2xl border border-[#E5E9F2] bg-[#F7F9FE] p-6">
              <MessageSquare className="h-5 w-5 text-[#123FFF]" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-[#0D1126]">
                {props.supportTitle}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#4A5268]">
                {props.supportText}
              </p>
              <a
                href={props.supportCtaUrl}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#123FFF] hover:text-[#0D31CC]"
              >
                <span>{props.supportCtaLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="divide-y divide-[#E5E9F2] border-y border-[#E5E9F2] lg:col-span-7">
            {props.items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-[#0D1126]">
                      {item.question}
                    </span>
                    {isOpen ? (
                      <Minus className="h-4 w-4 shrink-0 text-[#123FFF]" />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-[#6B7388]" />
                    )}
                  </button>
                  {isOpen ? (
                    <p className="pb-5 pr-8 text-sm leading-relaxed text-[#4A5268]">
                      {item.answer}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactBlock({ props }: { props: ContactProps }) {
  return (
    <section
      id="start-project"
      className="border-b border-[#E5E9F2] bg-white py-16 text-[#0D1126] sm:py-20"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2.5 text-sm font-medium text-[#0D1126]">
                <span className="inline-block h-[3px] w-6 rounded-full bg-[#D6FF00]" />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}
            <h2
              className="mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-[#0D1126] sm:text-4xl"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.heading}
            </h2>
            {props.subtitle ? (
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4A5268] sm:text-base">
                {props.subtitle}
              </p>
            ) : null}

            <div className="mt-7 space-y-3.5">
              <a
                href={`mailto:${props.email}`}
                className="flex items-center gap-3 text-sm font-medium text-[#0D1126] hover:text-[#123FFF]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#123FFF]">
                  <Mail className="h-4 w-4" />
                </span>
                <span>{props.email}</span>
              </a>
              <a
                href={`tel:${props.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-3 text-sm font-medium text-[#0D1126] hover:text-[#123FFF]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#123FFF]">
                  <Phone className="h-4 w-4" />
                </span>
                <span>{props.phone}</span>
              </a>
              {props.instagramUrl ? (
                <a
                  href={props.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm font-medium text-[#0D1126] hover:text-[#123FFF]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#123FFF]">
                    <Instagram className="h-4 w-4" />
                  </span>
                  <span>{props.instagramHandle}</span>
                </a>
              ) : null}
            </div>

            {props.showGlobe ? (
              <div className="mx-auto mt-8 aspect-square max-w-[280px] lg:mx-0">
                <InteractiveGlobeWidget className="h-full w-full" />
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[#E5E9F2] bg-white p-6 shadow-[0_24px_60px_-18px_rgba(13,17,38,0.08)] sm:p-9 lg:col-span-7">
            <h3
              className="text-2xl font-bold tracking-tight text-[#0D1126]"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.formHeading}
            </h3>
            <p className="mt-1.5 text-sm text-[#4A5268]">{props.formSubtitle}</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#0D1126]">Full Name</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-xl border border-[#E5E9F2] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#0D1126]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0D1126]">Company / Brand</label>
                <input
                  type="text"
                  readOnly
                  placeholder="Brand name"
                  className="mt-1.5 w-full rounded-xl border border-[#E5E9F2] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#0D1126]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0D1126]">Work Email</label>
                <input
                  type="email"
                  readOnly
                  placeholder="you@company.com"
                  className="mt-1.5 w-full rounded-xl border border-[#E5E9F2] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#0D1126]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0D1126]">
                  Project Details
                </label>
                <textarea
                  rows={4}
                  readOnly
                  placeholder="Tell us about your project, goals, and timeline..."
                  className="mt-1.5 w-full rounded-xl border border-[#E5E9F2] bg-[#FAFBFD] px-3.5 py-2.5 text-sm text-[#0D1126]"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 text-xs text-[#6B7388]">
                <Lock className="h-3.5 w-3.5" />
                <span>Protected by EmailJS two-way dispatch &amp; anti-spam rules</span>
              </span>
              <span className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#2457FF] px-6 py-2.5 text-sm font-semibold text-white">
                <span>{props.submitLabel}</span>
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AuditMatrixBlock({ props }: { props: AuditMatrixProps }) {
  const [activeId, setActiveId] = useState(props.domains[0]?.id ?? '');
  const activeDomain =
    props.domains.find((d) => d.id === activeId) ?? props.domains[0] ?? null;
  const [expandedId, setExpandedId] = useState(activeDomain?.checks[0]?.id ?? '');

  return (
    <section className="border-b border-[#E5E9F2] bg-[#F7F9FE] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {props.eyebrow ? (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5268]">
              <span className="inline-block h-[3px] w-5 rounded-full bg-[#C2F81A]" />
              <span>{props.eyebrow}</span>
            </div>
          ) : null}
          <h2
            className="mt-2.5 text-2xl font-semibold tracking-tight text-[#0D1126] sm:text-3xl"
            style={{ fontFamily: 'var(--klido-font-heading)' }}
          >
            {props.heading}
          </h2>
          {props.subtitle ? (
            <p className="mt-2.5 text-sm text-[#4A5268] sm:text-base">{props.subtitle}</p>
          ) : null}
        </div>

        {activeDomain ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#E5E9F2] bg-white">
            <div className="flex flex-wrap gap-1.5 border-b border-[#E5E9F2] px-5 py-3">
              {props.domains.map((domain) => (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => {
                    setActiveId(domain.id);
                    setExpandedId(domain.checks[0]?.id ?? '');
                  }}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    domain.id === activeDomain.id
                      ? 'bg-[#EEF2FF] text-[#123FFF]'
                      : 'text-[#4A5268] hover:bg-[#F7F9FE] hover:text-[#0D1126]'
                  }`}
                >
                  {domain.label}
                </button>
              ))}
            </div>
            <div className="p-6 sm:p-8">
              <p className="max-w-3xl text-sm leading-relaxed text-[#4A5268]">
                {activeDomain.summary}
              </p>
              <div className="mt-6 divide-y divide-[#E5E9F2] border-y border-[#E5E9F2]">
                {activeDomain.checks.map((check) => {
                  const open = expandedId === check.id;
                  return (
                    <div key={check.id}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? '' : check.id)}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="text-sm font-semibold text-[#0D1126]">
                          {check.title}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#6B7388] transition-transform ${
                            open ? 'rotate-180 text-[#123FFF]' : ''
                          }`}
                        />
                      </button>
                      {open ? (
                        <div className="pb-4 pr-6 text-sm text-[#4A5268]">
                          <p>{check.detail}</p>
                          <p className="mt-2 text-xs font-medium text-[#0D1126]">
                            Artifact: <span className="font-normal text-[#4A5268]">{check.artifact}</span>
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {props.boundaries.length > 0 ? (
          <div className="mt-12 overflow-x-auto rounded-2xl border border-[#E5E9F2] bg-white">
            <table className="w-full min-w-[540px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E9F2] bg-[#F7F9FE] text-xs font-semibold text-[#6B7388]">
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5 text-[#0D1126]">Klido Standard</th>
                  <th className="px-5 py-3.5">What We Avoid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9F2]">
                {props.boundaries.map((row) => (
                  <tr key={row.aspect}>
                    <td className="px-5 py-4 font-semibold text-[#0D1126]">{row.aspect}</td>
                    <td className="px-5 py-4 text-[#0D1126]">{row.klidoStandard}</td>
                    <td className="px-5 py-4 text-[#6B7388]">{row.industryHabit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function FooterBlock({ props }: { props: FooterProps }) {
  const { footerConfig, navigationItems } = useGlobalSettings();
  const practiceLinks = navigationItems.filter((n) => n.location === 'footer_practice');
  const engageLinks = navigationItems.filter((n) => n.location === 'footer_engage');

  return (
    <footer className="border-t border-[#E5E9F2] bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            {props.showBranding ? (
              <span className="inline-flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#123FFF] text-sm font-bold text-white">
                  k
                </span>
                <span className="text-xl font-bold tracking-tight text-[#0D1126]">klido</span>
              </span>
            ) : null}
            <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-[#4A5268]">
              {props.overrideDescription || footerConfig.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="text-sm font-semibold text-[#0D1126]">Practice</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[#4A5268]">
                {practiceLinks.map((item) => (
                  <li key={item.id}>
                    <a href={item.href} className="hover:text-[#0D1126]">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0D1126]">Engage</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[#4A5268]">
                {engageLinks.map((item) => (
                  <li key={item.id}>
                    <a href={item.href} className="hover:text-[#0D1126]">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-sm font-semibold text-[#0D1126]">Contact</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-[#4A5268]">
                <li>
                  <a href={`mailto:${footerConfig.email}`} className="hover:text-[#0D1126]">
                    {footerConfig.email}
                  </a>
                </li>
                <li>{footerConfig.hours}</li>
                <li>{footerConfig.location}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#E5E9F2] pt-6 text-xs text-[#6B7388] sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {footerConfig.copyrightText}
          </p>
          <p>{footerConfig.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
