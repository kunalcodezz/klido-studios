import { ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import type { z } from 'zod';
import { heroPropsSchema, seniorStudioPropsSchema } from '../../schemas/blocks';
import { RichTextRenderer } from '../RichTextRenderer';
import { CampaignMapWidget, KlidoResilientMedia } from './InteractiveWidgets';

type HeroProps = z.infer<typeof heroPropsSchema>;
type SeniorStudioProps = z.infer<typeof seniorStudioPropsSchema>;

export function HeroBlock({ props }: { props: HeroProps }) {
  const isSplitImage = props.variant === 'split-image';
  const isEditorial = props.variant === 'editorial';

  return (
    <section
      className={`border-b border-[#E5E9F2] py-12 sm:py-16 lg:py-20 ${
        isEditorial || isSplitImage ? 'bg-[#F7F9FE]' : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div
          className={`grid gap-10 lg:items-center lg:gap-12 ${
            isEditorial ? 'max-w-3xl' : 'lg:grid-cols-12'
          }`}
        >
          <div className={isEditorial ? '' : 'lg:col-span-6'}>
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2.5 text-xs font-semibold tracking-wider text-[#4A5268] uppercase">
                <span
                  className="inline-block h-[3px] w-6 rounded-full"
                  style={{ backgroundColor: 'var(--klido-accent, #C2F81A)' }}
                  aria-hidden="true"
                />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}

            <h1
              className="mt-4 text-balance text-3xl font-bold leading-[1.08] tracking-[-0.03em] text-[#0D1126] sm:text-4xl lg:text-[3.25rem]"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.headlinePrefix}{' '}
              {props.headlineAccent ? (
                <span
                  className="relative inline-block"
                  style={{ color: 'var(--klido-primary, #123FFF)' }}
                >
                  <span>{props.headlineAccent}</span>
                  {props.showLimeUnderline ? (
                    <svg
                      className="pointer-events-none absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 240 12"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 8.5C68 3.5 162 2.5 238 6.5"
                        stroke="#C2F81A"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : null}
                </span>
              ) : null}
            </h1>

            <RichTextRenderer
              doc={props.description}
              className="mt-6 max-w-xl text-base text-[#4A5268] sm:text-lg"
            />

            {(props.primaryCta || props.secondaryCta) && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {props.primaryCta ? (
                  <a
                    href={props.primaryCta.href}
                    className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 whitespace-nowrap px-6 py-3 text-sm font-semibold text-white transition-colors duration-150"
                    style={{
                      backgroundColor: 'var(--klido-primary, #123FFF)',
                      borderRadius: 'var(--klido-btn-radius, 8px)',
                    }}
                  >
                    <span>{props.primaryCta.label}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                ) : null}
                {props.secondaryCta ? (
                  <a
                    href={props.secondaryCta.href}
                    className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#CFD6E6] bg-white px-5 py-2.5 text-sm font-medium text-[#0D1126] transition-colors hover:bg-[#F7F9FE]"
                  >
                    <span>{props.secondaryCta.label}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                ) : null}
              </div>
            )}
          </div>

          {!isEditorial ? (
            <div className="lg:col-span-6">
              {isSplitImage ? (
                <KlidoResilientMedia
                  src={props.imageUrl}
                  alt={props.imageAlt || props.headlinePrefix}
                  aspectClassName="aspect-[4/3]"
                />
              ) : (
                <CampaignMapWidget
                  title={props.campaignMapTitle}
                  stages={props.campaignMapStages}
                />
              )}
            </div>
          ) : null}
        </div>

        {isEditorial && props.imageUrl !== undefined && props.imageAlt ? (
          <div className="mt-10">
            <KlidoResilientMedia
              src={props.imageUrl}
              alt={props.imageAlt}
              aspectClassName="aspect-video"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SeniorStudioBlock({ props }: { props: SeniorStudioProps }) {
  return (
    <section className="border-b border-[#E5E9F2] bg-gradient-to-b from-[#FFFFFF] via-[#FAFBFD] to-[#F5F7FC] py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="lg:col-span-6">
            <KlidoResilientMedia
              src={props.imageUrl}
              alt={props.imageAlt}
              aspectClassName="aspect-square"
            />
          </div>
          <div className="lg:col-span-6">
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2.5 text-sm font-medium text-[#4A5268]">
                <span className="inline-block h-[3px] w-6 rounded-full bg-[#C2F81A]" />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}

            <h2
              className="mt-4 text-balance text-3xl font-bold leading-[1.1] tracking-[-0.025em] text-[#0D1126] sm:text-4xl"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.headlinePrefix}{' '}
              {props.headlineAccent ? (
                <span className="relative inline-block text-[#123FFF]">
                  <span>{props.headlineAccent}</span>
                  <svg
                    className="pointer-events-none absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 260 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8.5C74 3.5 178 2.5 258 6.5"
                      stroke="#C2F81A"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              ) : null}
            </h2>

            <RichTextRenderer
              doc={props.description}
              className="mt-6 max-w-xl text-base text-[#4A5268]"
            />

            {props.points.length > 0 ? (
              <ul className="mt-8 divide-y divide-[#E5E9F2] border-y border-[#E5E9F2]">
                {props.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-3.5 py-3.5 text-sm font-medium text-[#0D1126]"
                  >
                    <Check className="h-4 w-4 shrink-0 text-[#9AD900]" strokeWidth={3} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
