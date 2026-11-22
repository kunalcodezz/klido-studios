import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface MilestoneModulePageProps {
  title: string;
  description: string;
  milestoneLabel: string;
}

export default function MilestoneModulePage({
  title,
  description,
  milestoneLabel,
}: MilestoneModulePageProps) {
  const { pageId } = useParams();

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-5">
        <p className="text-xs font-medium text-zinc-500">{milestoneLabel}</p>
        <h1 className="font-editorial mt-1 text-2xl font-semibold tracking-tight text-[#111111]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
        {pageId ? (
          <p className="mt-2 font-mono text-xs text-zinc-500">Page ID: {pageId}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-8">
        <h2 className="text-sm font-semibold text-[#111111]">
          Module route registered &amp; access-protected
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          This route is protected by Supabase Auth and RBAC policies. Its full interactive
          workspace will be implemented in <strong>{milestoneLabel}</strong> using the
          shared CMS Block Registry and Supabase tables provisioned in Milestone 2.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Overview</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
