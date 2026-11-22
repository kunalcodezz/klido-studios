import { ArrowRight, ArrowUpRight, Check, Instagram, Layers, Star } from 'lucide-react';
import type { z } from 'zod';
import {
  brandsPropsSchema,
  portfolioGridPropsSchema,
  servicesGridPropsSchema,
  testimonialsPropsSchema,
} from '../../schemas/blocks';
import { useCMSData } from '../../providers/CMSDataProvider';

type ServicesProps = z.infer<typeof servicesGridPropsSchema>;
type PortfolioProps = z.infer<typeof portfolioGridPropsSchema>;
type BrandsProps = z.infer<typeof brandsPropsSchema>;
type TestimonialsProps = z.infer<typeof testimonialsPropsSchema>;

export function ServicesGridBlock({ props }: { props: ServicesProps }) {
  const { services } = useCMSData();

  if (props.mode === 'practice-areas') {
    const areas = services.filter((s) => s.service_kind === 'practice_area');
    return (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl">
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5268]">
                <span className="inline-block h-[3px] w-5 rounded-full bg-[#C2F81A]" />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}
            <h2
              className="mt-2.5 text-2xl font-bold tracking-tight text-[#0D1126] sm:text-3xl"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.heading}
            </h2>
          </div>

          <div className="divide-y divide-[#E5E9F2] border-y border-[#E5E9F2]">
            {areas.map((area, idx) => (
              <article key={area.id} className="py-10">
                <div className="grid gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    <span className="font-mono text-sm font-medium text-[#123FFF] tabular-nums">
                      0{idx + 1}.
                    </span>
                    <h3
                      className="mt-2 text-2xl font-semibold tracking-tight text-[#0D1126]"
                      style={{ fontFamily: 'var(--klido-font-heading)' }}
                    >
                      {area.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#4A5268]">
                      {area.description}
                    </p>
                    {area.cadence ? (
                      <p className="mt-4 text-xs font-medium text-[#6B7388]">
                        Cadence · {area.cadence}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
                    <div className="rounded-xl border border-[#E5E9F2] bg-[#F7F9FE] p-5">
                      <h4 className="text-sm font-semibold text-[#0D1126]">Core Deliverables</h4>
                      <ul className="mt-3.5 space-y-2.5 text-sm text-[#4A5268]">
                        {area.deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#123FFF]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between rounded-xl border border-[#E5E9F2] bg-white p-5">
                      <div>
                        <h4 className="text-sm font-semibold text-[#0D1126]">
                          Primary Stack &amp; Tooling
                        </h4>
                        <ul className="mt-3.5 space-y-2 text-sm text-[#4A5268]">
                          {area.tooling.map((tool) => (
                            <li
                              key={tool}
                              className="border-b border-[#E5E9F2] pb-2 last:border-b-0 last:pb-0"
                            >
                              {tool}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-5 pt-3">
                        <a
                          href={area.cta_url || '/contact'}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123FFF] hover:text-[#0D31CC]"
                        >
                          <span>{area.cta_label || 'Discuss scope'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const plans = services.filter((s) => s.service_kind === 'plan');

  return (
    <section id="pricing" className="border-b border-[#E5E9F2] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {props.eyebrow ? (
            <div className="inline-flex items-center gap-2.5 text-sm font-medium text-[#4A5268]">
              <span className="inline-block h-[3px] w-6 rounded-full bg-[#C2F81A]" />
              <span>{props.eyebrow}</span>
            </div>
          ) : null}
          <h2
            className="mt-3 text-3xl font-bold tracking-tight text-[#0D1126] sm:text-4xl"
            style={{ fontFamily: 'var(--klido-font-heading)' }}
          >
            {props.heading}
          </h2>
          {props.subtitle ? (
            <p className="mt-3 text-base leading-relaxed text-[#4A5268]">{props.subtitle}</p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const featured = plan.is_featured;
            return (
              <article
                key={plan.id}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                  featured
                    ? 'border-[#123FFF]/40 bg-gradient-to-br from-[#0A1437] via-[#132B78] to-[#123FFF] text-white shadow-[0_24px_60px_-18px_rgba(18,63,255,0.35)] lg:col-span-2'
                    : 'border-[#E5E9F2] bg-white text-[#0D1126] shadow-[0_12px_32px_-16px_rgba(13,17,38,0.08)]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C2F81A]">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>Most Popular</span>
                        </span>
                      ) : null}
                      <h3
                        className={`mt-1 text-xl font-bold ${
                          featured ? 'text-white' : 'text-[#0D1126]'
                        }`}
                        style={{ fontFamily: 'var(--klido-font-heading)' }}
                      >
                        {plan.title}
                      </h3>
                      <p
                        className={`mt-1 text-xs leading-relaxed ${
                          featured ? 'text-white/80' : 'text-[#4A5268]'
                        }`}
                      >
                        {plan.subtitle}
                      </p>
                    </div>
                    {plan.discount_label ? (
                      <span
                        className={`shrink-0 text-xs font-semibold ${
                          featured ? 'text-[#C2F81A]' : 'text-[#123FFF]'
                        }`}
                      >
                        {plan.discount_label}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{plan.price_display}</span>
                    <span className={`text-xs ${featured ? 'text-white/75' : 'text-[#6B7388]'}`}>
                      {plan.billing_period}
                    </span>
                    {plan.original_price_display ? (
                      <span
                        className={`ml-2 text-xs line-through tabular-nums ${
                          featured ? 'text-white/50' : 'text-[#8C95A8]'
                        }`}
                      >
                        {plan.original_price_display}
                      </span>
                    ) : null}
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-current/10 pt-5 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            featured ? 'text-[#C2F81A]' : 'text-[#123FFF]'
                          }`}
                        />
                        <span className={featured ? 'text-white/90' : 'text-[#4A5268]'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  <a
                    href={plan.cta_url || '#start-project'}
                    className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      featured
                        ? 'bg-[#C2F81A] text-[#0D1126] hover:bg-[#d2ff45]'
                        : 'bg-[#123FFF] text-white hover:bg-[#0D31CC]'
                    }`}
                  >
                    <span>{plan.cta_label || `Choose ${plan.title}`}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        {props.highlights.length > 0 ? (
          <div className="mt-10 grid gap-4 border-t border-[#E5E9F2] pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {props.highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#123FFF]" />
                <div>
                  <p className="text-sm font-semibold text-[#0D1126]">{item.title}</p>
                  <p className="text-xs text-[#6B7388]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PortfolioGridBlock({ props }: { props: PortfolioProps }) {
  const { projects, mediaMap } = useCMSData();
  const visible = props.featuredOnly ? projects.filter((p) => p.is_featured) : projects;

  return (
    <section className="border-b border-[#E5E9F2] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {props.eyebrow ? (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5268]">
              <span className="inline-block h-[3px] w-5 rounded-full bg-[#C2F81A]" />
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
            <p className="mt-3 text-base text-[#4A5268]">{props.subtitle}</p>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E5E9F2] bg-[#F7F9FE] p-8 text-center text-sm text-[#4A5268]">
            No portfolio projects published yet. Add projects in Klido Studio → Portfolio.
          </div>
        ) : (
          <div
            className={`mt-10 grid gap-6 ${
              props.columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
            }`}
          >
            {visible.map((project) => {
              const cover = project.cover_asset_id ? mediaMap[project.cover_asset_id] : null;
              return (
                <article
                  key={project.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E9F2] bg-white p-5"
                >
                  <div>
                    <div className="mb-4 aspect-video overflow-hidden rounded-xl border border-[#E5E9F2] bg-[#F7F9FE]">
                      {cover?.public_url ? (
                        <img
                          src={cover.public_url}
                          alt={cover.alt_text || project.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#6B7388]">
                          <Layers className="mr-2 h-4 w-4" />
                          <span>{project.category}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#123FFF]">
                      {project.category}
                      {project.client_name ? ` · ${project.client_name}` : ''}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-[#0D1126]">{project.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4A5268]">
                      {project.summary || project.description}
                    </p>
                  </div>
                  {project.metrics && project.metrics.length > 0 ? (
                    <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E5E9F2] pt-4">
                      {project.metrics.slice(0, 2).map((m) => (
                        <div key={m.label}>
                          <dt className="text-[11px] text-[#6B7388]">{m.label}</dt>
                          <dd className="font-mono text-sm font-semibold text-[#0D1126] tabular-nums">
                            {m.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function BrandsBlock({ props }: { props: BrandsProps }) {
  const { brands, mediaMap } = useCMSData();

  return (
    <section
      id="work"
      className="border-b border-[#E5E9F2] bg-gradient-to-b from-[#FFFFFF] via-[#F9FAFE] to-[#F5F7FC] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {props.eyebrow ? (
            <div className="inline-flex items-center gap-2.5 text-sm font-medium text-[#4A5268]">
              <span className="inline-block h-[3px] w-6 rounded-full bg-[#C2F81A]" />
              <span>{props.eyebrow}</span>
            </div>
          ) : null}
          <h2
            className="mt-3 text-balance text-3xl font-bold tracking-[-0.025em] text-[#0D1126] sm:text-4xl"
            style={{ fontFamily: 'var(--klido-font-heading)' }}
          >
            {props.headingPrefix}{' '}
            <span className="relative inline-block text-[#123FFF]">
              <span>{props.headingAccent}</span>
              <svg
                className="pointer-events-none absolute -bottom-1.5 left-0 w-full"
                viewBox="0 0 180 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8.5C52 3.5 124 2.5 178 6.5"
                  stroke="#C2F81A"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>
          {props.subtitle ? (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4A5268]">
              {props.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {brands.map((brand) => {
            const logo = brand.logo_asset_id ? mediaMap[brand.logo_asset_id] : null;
            const wide = props.layoutMode === 'klido-asymmetric' && brand.layout_variant === 'wide';

            return (
              <article
                key={brand.id}
                className={`flex flex-col justify-between rounded-2xl border border-[#E5E9F2] bg-white p-5 shadow-[0_18px_45px_-20px_rgba(13,17,38,0.08)] ${
                  wide ? 'md:col-span-2' : ''
                }`}
              >
                <div className={wide ? 'grid gap-6 lg:grid-cols-12 lg:items-center' : ''}>
                  <div className={wide ? 'lg:col-span-4' : ''}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E9F2] bg-[#F7F9FE] text-sm font-bold text-[#0D1126]">
                          {logo?.public_url ? (
                            <img
                              src={logo.public_url}
                              alt={brand.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            brand.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold tracking-tight text-[#0D1126]">
                            {brand.name}
                          </h3>
                          <p className="text-xs font-medium text-[#6B7388]">
                            {brand.scopes.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    className={`mt-4 text-sm leading-relaxed text-[#4A5268] ${
                      wide ? 'lg:col-span-5 lg:mt-0' : ''
                    }`}
                  >
                    {brand.description}
                  </p>

                  {brand.instagram_url || brand.website_url ? (
                    <div className={wide ? 'lg:col-span-3 lg:text-right' : 'mt-5'}>
                      <a
                        href={brand.instagram_url || brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[#0D1126] bg-white px-4 py-2 text-xs font-semibold text-[#0D1126] transition-colors hover:bg-[#0D1126] hover:text-white"
                      >
                        {brand.instagram_url ? <Instagram className="h-3.5 w-3.5" /> : null}
                        <span>{brand.instagram_url ? 'View on Instagram' : 'Visit Website'}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsBlock({ props }: { props: TestimonialsProps }) {
  const { testimonials } = useCMSData();
  const visible = props.featuredOnly
    ? testimonials.filter((t) => t.is_featured)
    : testimonials;

  return (
    <section className="border-b border-[#E5E9F2] bg-[#F7F9FE] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {props.eyebrow ? (
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#4A5268]">
            <span className="inline-block h-[3px] w-5 rounded-full bg-[#C2F81A]" />
            <span>{props.eyebrow}</span>
          </div>
        ) : null}
        <h2
          className="mt-3 text-3xl font-bold tracking-tight text-[#0D1126]"
          style={{ fontFamily: 'var(--klido-font-heading)' }}
        >
          {props.heading}
        </h2>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#E5E9F2] bg-white p-8 text-center text-sm text-[#4A5268]">
            No testimonials published yet. Manage client quotes in Klido Studio → Testimonials.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <blockquote
                key={item.id}
                className="flex flex-col justify-between rounded-2xl border border-[#E5E9F2] bg-white p-6"
              >
                <p className="text-sm leading-relaxed text-[#0D1126]">“{item.quote}”</p>
                <footer className="mt-5 border-t border-[#E5E9F2] pt-4 text-xs">
                  <p className="font-semibold text-[#0D1126]">{item.author_name}</p>
                  <p className="text-[#6B7388]">
                    {[item.author_designation, item.company_name].filter(Boolean).join(' · ')}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
