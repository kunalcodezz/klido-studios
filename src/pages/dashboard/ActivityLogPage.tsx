import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../../lib/dashboardApi';

export default function ActivityLogPage() {
  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => fetchAuditLogs(50),
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
          Activity Log
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Append-only audit trail of publishing, revision restores, and role changes.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Unable to load audit logs.'}
          </div>
        ) : (logs ?? []).length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#111111]">No activity recorded yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Administrative changes will appear here chronologically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(logs ?? []).map((log) => (
                  <tr key={log.id}>
                    <td className="px-5 py-3.5 font-medium text-[#111111]">{log.action}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">{log.entity_type}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-700">
                      {log.actor_email || 'System'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {log.actor_role ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-zinc-500 tabular-nums">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
