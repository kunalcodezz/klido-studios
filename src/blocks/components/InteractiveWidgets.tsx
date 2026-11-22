import { useEffect, useRef, useState } from 'react';
import { BarChart2, Layers, Target } from 'lucide-react';
import { isSafeUrl } from '../../schemas/validation';

export interface CampaignStage {
  id: string;
  kicker: string;
  title: string;
  subtext?: string;
  summary: string;
}

const DEFAULT_STAGES: CampaignStage[] = [
  {
    id: 'starting-point',
    kicker: 'Starting point',
    title: 'What makes the offer worth choosing?',
    subtext: 'Product truth, audience tension, commercial objective',
    summary: 'Product truth, audience tension, and commercial objective framed before media spend.',
  },
  {
    id: 'the-argument',
    kicker: 'The argument',
    title: 'A message built around what matters',
    summary: 'Landing page and ad creative share the exact commercial promise.',
  },
  {
    id: 'in-market',
    kicker: 'In market',
    title: 'Useful signals, read in context',
    summary: 'Verified conversion telemetry guides weekly budget and creative decisions.',
  },
];

export function CampaignMapWidget({
  title = 'Campaign system',
  stages,
}: {
  title?: string;
  stages?: CampaignStage[];
}) {
  const activeStages = stages && stages.length >= 3 ? stages : DEFAULT_STAGES;
  const [activeId, setActiveId] = useState(activeStages[0].id);
  const activeDetail = activeStages.find((s) => s.id === activeId) ?? activeStages[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E9F2] bg-[#FAFBFD] shadow-[0_18px_45px_-20px_rgba(13,17,38,0.08)]">
      <div className="flex items-center justify-between border-b border-[#E5E9F2] bg-white px-5 py-3">
        <span className="text-xs font-semibold text-[#0D1126]">{title}</span>
        <span className="font-mono text-[11px] text-[#6B7388] tabular-nums">
          01 → 02 → 03
        </span>
      </div>

      <div className="relative p-5 sm:p-6">
        <svg
          aria-hidden="true"
          viewBox="0 0 520 320"
          fill="none"
          className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
        >
          <path
            d="M 180 78 C 280 82, 310 120, 325 148"
            stroke="#C2F81A"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          <path
            d="M 385 225 C 445 232, 460 262, 465 282"
            stroke="#123FFF"
            strokeWidth="2.2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 flex flex-col gap-4">
          {activeStages.slice(0, 3).map((stage, idx) => {
            const isSelected = stage.id === activeDetail.id;
            const widthClass =
              idx === 0
                ? 'sm:w-[68%]'
                : idx === 1
                  ? 'sm:ml-auto sm:mr-[12%] sm:w-[58%]'
                  : 'sm:ml-auto sm:w-[54%]';

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveId(stage.id)}
                className={`w-full overflow-hidden rounded-xl border bg-white text-left transition-all duration-150 ${widthClass} ${
                  isSelected
                    ? 'border-[#123FFF]/40 shadow-[0_12px_28px_-10px_rgba(18,63,255,0.14)]'
                    : 'border-[#E5E9F2] shadow-[0_6px_18px_-8px_rgba(13,17,38,0.06)] hover:border-[#CFD6E6]'
                }`}
              >
                {idx === 0 ? <div className="h-[3px] w-full bg-[#C2F81A]" /> : null}
                <div className="p-4">
                  {idx === 1 ? (
                    <Target className="mb-1.5 h-4 w-4 text-[#123FFF]" aria-hidden="true" />
                  ) : idx === 2 ? (
                    <BarChart2 className="mb-1.5 h-4 w-4 text-[#96C700]" aria-hidden="true" />
                  ) : null}
                  <p className="text-xs font-medium text-[#6B7388]">{stage.kicker}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-[#0D1126]">
                    {stage.title}
                  </p>
                  {stage.subtext ? (
                    <p className="mt-1 text-xs leading-relaxed text-[#4A5268]">
                      {stage.subtext}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#E5E9F2] bg-white/90 px-5 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex shrink-0 items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium text-[#0D1126]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#123FFF]" />
            <span>Direction</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-[#0D1126]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#C2F81A]" />
            <span>Evidence</span>
          </span>
        </div>
        <p className="text-[#4A5268] sm:text-right">{activeDetail.summary}</p>
      </div>
    </div>
  );
}

const CONTINENT_POINTS: [number, number][] = [
  [55, -120], [50, -100], [45, -90], [40, -105], [35, -118], [30, -100],
  [45, -75], [40, -75], [10, -75], [0, -60], [-15, -45], [-23, -46],
  [-35, -58], [52, 0], [48, 2], [40, -4], [41, 12], [52, 13], [60, 25],
  [30, 31], [15, 39], [0, 42], [-25, 31], [-34, 18], [5, 2], [15, -17],
  [55, 75], [50, 90], [40, 116], [35, 105], [22, 114], [13, 80],
  [19, 73], [28, 77], [35, 52], [35, 139], [-25, 150], [-35, 145], [-32, 116],
];

const HUB_MARKERS: [number, number, string, boolean][] = [
  [18.52, 73.85, 'Klido HQ', true],
  [51.5, -0.12, 'London', false],
  [40.71, -74.0, 'New York', false],
  [1.35, 103.82, 'Singapore', false],
  [25.2, 55.27, 'Dubai', false],
];

export function InteractiveGlobeWidget({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let rotation = 1.1;
    const tilt = 0.28;
    let isDragging = false;
    let lastX = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      rotation += (e.clientX - lastX) * 0.006;
      lastX = e.clientX;
    };
    const onUp = () => {
      isDragging = false;
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    const project = (latDeg: number, lonDeg: number, r: number) => {
      const lat = (latDeg * Math.PI) / 180;
      const lon = (lonDeg * Math.PI) / 180 + rotation;
      const x = r * Math.cos(lat) * Math.sin(lon);
      const y0 = r * Math.sin(lat);
      const z0 = r * Math.cos(lat) * Math.cos(lon);
      const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt);
      const z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt);
      return { x, y, z };
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(w, h) * 0.42;

      ctx.clearRect(0, 0, w, h);

      // Outer subtle ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#F7F9FE';
      ctx.fill();
      ctx.lineWidth = Math.max(1, w * 0.003);
      ctx.strokeStyle = '#E5E9F2';
      ctx.stroke();

      if (!isDragging) {
        rotation += 0.003;
      }

      for (const [lat, lon] of CONTINENT_POINTS) {
        const pt = project(lat, lon, r * 0.94);
        if (pt.z > -r * 0.1) {
          const alpha = Math.max(0.18, (pt.z + r) / (2 * r));
          ctx.beginPath();
          ctx.arc(cx + pt.x, cy - pt.y, Math.max(1.5, w * 0.006), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(13, 17, 38, ${alpha * 0.55})`;
          ctx.fill();
        }
      }

      for (const [lat, lon, _label, primary] of HUB_MARKERS) {
        const pt = project(lat, lon, r * 0.95);
        if (pt.z > 0) {
          ctx.beginPath();
          ctx.arc(
            cx + pt.x,
            cy - pt.y,
            primary ? Math.max(4, w * 0.015) : Math.max(2.5, w * 0.009),
            0,
            Math.PI * 2
          );
          ctx.fillStyle = primary ? '#C2F81A' : '#123FFF';
          ctx.fill();
          if (primary) {
            ctx.lineWidth = Math.max(1.5, w * 0.005);
            ctx.strokeStyle = '#123FFF';
            ctx.stroke();
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive 3D globe showing Klido global client hubs"
      className={`cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}

export function KlidoResilientMedia({
  src,
  alt,
  caption,
  aspectClassName = 'aspect-video',
  className = '',
}: {
  src?: string;
  alt: string;
  caption?: string;
  aspectClassName?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const validSrc = Boolean(src && isSafeUrl(src) && !failed);

  return (
    <figure className="w-full">
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#E5E9F2] bg-[#F7F9FE] ${aspectClassName} ${className}`}
      >
        {validSrc ? (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2.5 bg-[#F7F9FE] p-6 text-center">
            <Layers className="h-6 w-6 text-[#6B7388]" aria-hidden="true" />
            <p className="max-w-xs text-xs font-medium leading-relaxed text-[#4A5268]">{alt}</p>
          </div>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-2.5 text-xs text-[#6B7388]">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
