import { ArrowRight } from 'lucide-react';
import type { z } from 'zod';
import {
  ctaPropsSchema,
  imageBlockPropsSchema,
  statisticsPropsSchema,
  textBlockPropsSchema,
  videoBlockPropsSchema,
} from '../../schemas/blocks';
import { isSafeUrl } from '../../schemas/validation';
import { RichTextRenderer } from '../RichTextRenderer';
import { KlidoResilientMedia } from './InteractiveWidgets';

type TextProps = z.infer<typeof textBlockPropsSchema>;
type ImageProps = z.infer<typeof imageBlockPropsSchema>;
type VideoProps = z.infer<typeof videoBlockPropsSchema>;
type CtaProps = z.infer<typeof ctaPropsSchema>;
type StatsProps = z.infer<typeof statisticsPropsSchema>;

export function TextBlock({ props }: { props: TextProps }) {
  const HeadingTag = props.headingTag;
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
      {props.eyebrow ? (
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#4A5268] uppercase">
          <span className="inline-block h-[3px] w-5 rounded-full bg-[#C2F81A]" />
          <span>{props.eyebrow}</span>
        </div>
      ) : null}
      {props.heading ? (
        <HeadingTag
          className="text-balance text-2xl font-bold tracking-tight text-[#0D1126] sm:text-3xl"
          style={{ fontFamily: 'var(--klido-font-heading)' }}
        >
          {props.heading}
        </HeadingTag>
      ) : null}
      <RichTextRenderer
        doc={props.body}
        className="mt-4 max-w-3xl text-sm text-[#4A5268] sm:text-base"
      />
    </div>
  );
}

export function ImageBlock({ props }: { props: ImageProps }) {
  const aspectMap = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    auto: '',
  };
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      <KlidoResilientMedia
        src={props.src}
        alt={props.alt}
        caption={props.caption}
        aspectClassName={aspectMap[props.aspectRatio]}
      />
    </div>
  );
}

export function VideoBlock({ props }: { props: VideoProps }) {
  const validVideo = Boolean(props.src && isSafeUrl(props.src));
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
      <figure>
        <div className="overflow-hidden rounded-2xl border border-[#E5E9F2] bg-[#0D1126]">
          {validVideo ? (
            <video
              src={props.src}
              poster={props.posterUrl && isSafeUrl(props.posterUrl) ? props.posterUrl : undefined}
              controls={props.controls}
              autoPlay={props.autoplayMutedLoop}
              muted={props.autoplayMutedLoop}
              loop={props.autoplayMutedLoop}
              playsInline
              className="aspect-video w-full object-cover"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-[#F7F9FE] p-8 text-center text-xs font-medium text-[#6B7388]">
              Provide a valid HTTPS or Media Library video asset URL to preview playback.
            </div>
          )}
        </div>
        {props.caption ? (
          <figcaption className="mt-2.5 text-xs text-[#6B7388]">{props.caption}</figcaption>
        ) : null}
      </figure>
    </div>
  );
}

export function CtaBlock({ props }: { props: CtaProps }) {
  return (
    <section className="border-y border-[#E5E9F2] bg-[#F7F9FE] py-12 sm:py-16">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            className="text-2xl font-bold tracking-tight text-[#0D1126]"
            style={{ fontFamily: 'var(--klido-font-heading)' }}
          >
            {props.heading}
          </h2>
          {props.description ? (
            <p className="mt-2 text-sm leading-relaxed text-[#4A5268] sm:text-base">
              {props.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={props.primaryCta.href}
            className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{
              backgroundColor: 'var(--klido-primary, #123FFF)',
              borderRadius: 'var(--klido-btn-radius, 8px)',
            }}
          >
            <span>{props.primaryCta.label}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          {props.secondaryCta ? (
            <a
              href={props.secondaryCta.href}
              className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-lg border border-[#CFD6E6] bg-white px-5 py-2.5 text-sm font-medium text-[#0D1126] hover:bg-zinc-50"
            >
              {props.secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StatisticsBlock({ props }: { props: StatsProps }) {
  if (props.variant === 'principles') {
    return (
      <section className="border-b border-[#E5E9F2] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2
            className="text-2xl font-semibold tracking-tight text-[#0D1126] sm:text-3xl"
            style={{ fontFamily: 'var(--klido-font-heading)' }}
          >
            {props.heading}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {props.items.map((item, idx) => (
              <div
                key={item.index + item.title}
                className={`border-t-2 pt-6 ${
                  idx === 0 ? 'border-[#C2F81A]' : 'border-[#CFD6E6]'
                }`}
              >
                <span className="font-mono text-xs font-medium text-[#123FFF] tabular-nums">
                  {item.index}
                </span>
                <h3
                  className="mt-2 text-lg font-semibold text-[#0D1126]"
                  style={{ fontFamily: 'var(--klido-font-heading)' }}
                >
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#4A5268]">
                  {item.description}
                </p>
                {item.metaList && item.metaList.length > 0 ? (
                  <ul className="mt-4 space-y-1.5 border-t border-[#E5E9F2] pt-3 text-xs text-[#0D1126]">
                    {item.metaList.map((m) => (
                      <li key={m}>— {m}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="how-we-work"
      className="border-b border-[#E5E9F2] bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {props.eyebrow ? (
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#0D1126]">
                <span className="inline-block h-[3px] w-6 rounded-full bg-[#C2F81A]" />
                <span>{props.eyebrow}</span>
              </div>
            ) : null}
            <h2
              className="mt-4 text-3xl font-bold tracking-tight text-[#0D1126]"
              style={{ fontFamily: 'var(--klido-font-heading)' }}
            >
              {props.heading}
            </h2>
            {props.subtitle ? (
              <p className="mt-4 text-base leading-relaxed text-[#4A5268]">{props.subtitle}</p>
            ) : null}
          </div>

          <div className="relative pl-7 sm:pl-9 lg:col-span-8">
            <div
              aria-hidden="true"
              className="absolute bottom-6 left-[9px] top-4 w-[1.5px] bg-[#E5E9F2]"
            />
            <div className="space-y-8">
              {props.items.map((step) => (
                <div key={step.index + step.title} className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -left-7 top-1.5 flex h-5 w-5 -translate-x-[calc(50%-1px)] items-center justify-center rounded-full border border-[#E5E9F2] bg-white sm:-left-9"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-[#C2F81A]" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-12 sm:items-center">
                    <div className="sm:col-span-7">
                      <span className="font-mono text-xs font-semibold text-[#6B7388] tabular-nums">
                        {step.index}
                      </span>
                      <h3
                        className="mt-0.5 text-lg font-bold text-[#0D1126]"
                        style={{ fontFamily: 'var(--klido-font-heading)' }}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-[#4A5268]">
                        {step.description}
                      </p>
                    </div>
                    {step.imageUrl ? (
                      <div className="sm:col-span-5">
                        <KlidoResilientMedia
                          src={step.imageUrl}
                          alt={step.imageAlt || step.title}
                          aspectClassName="aspect-[16/6]"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
