import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { fetchAdminProfiles } from '../../lib/dashboardApi';
import { updateUserRole } from '../../lib/auth';
import { useAuth } from '../../providers/AuthProvider';
import type { AppRole } from '../../types/database';

export default function UsersPage() {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: profiles, isLoading, isError, error } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: fetchAdminProfiles,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      targetUserId,
      role,
      isActive,
    }: {
      targetUserId: string;
      role: AppRole;
      isActive: boolean;
    }) => updateUserRole(targetUserId, role, isActive),
    onSuccess: async (updated) => {
      setFeedback(`Updated ${updated.email} to ${updated.role} (${updated.is_active ? 'active' : 'inactive'}).`);
      await queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    },
    onError: (err) => {
      setFeedback(err instanceof Error ? err.message : 'Role update failed.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-5">
        <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
          Team &amp; Roles
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Role-based access control enforced by Supabase RLS and database security functions.
        </p>
      </div>

      {feedback ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-700">
          {feedback}
        </div>
      ) : null}

      {!isSuperAdmin ? (
        <div className="flex items-start gap-2.5 rounded-md border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
          <span>Only SUPER_ADMIN accounts can modify roles or deactivate team members.</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Unable to load profiles.'}
          </div>
        ) : (profiles ?? []).length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">No profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(profiles ?? []).map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <tr key={member.id}>
                      <td className="px-5 py-3.5 font-medium text-[#111111]">
                        {member.full_name || 'Unnamed'}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-zinc-500">(You)</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-600">{member.email}</td>
                      <td className="px-5 py-3.5">
                        {isSuperAdmin ? (
                          <select
                            aria-label={`Role for ${member.email}`}
                            value={member.role}
                            disabled={roleMutation.isPending}
                            onChange={(e) =>
                              roleMutation.mutate({
                                targetUserId: member.id,
                                role: e.target.value as AppRole,
                                isActive: member.is_active,
                              })
                            }
                            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-[#111111]"
                          >
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-[#111111]">{member.role}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isSuperAdmin ? (
                          <button
                            type="button"
                            disabled={roleMutation.isPending}
                            onClick={() =>
                              roleMutation.mutate({
                                targetUserId: member.id,
                                role: member.role,
                                isActive: !member.is_active,
                              })
                            }
                            className="text-xs font-medium text-[#111111] underline-offset-2 hover:underline"
                          >
                            {member.is_active ? 'Active' : 'Inactive'}
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-600">
                            {member.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-zinc-500 tabular-nums">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
